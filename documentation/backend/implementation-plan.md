# Ultra-Comprehensive Backend Implementation Plan (Supabase Only)

## Phase 1: Database Foundation (Critical - Day 1)

### 1.1 PostgreSQL Extensions Setup
```sql
-- CRITICAL: Must be done BEFORE creating tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search fallback
```

**Potential Issues:**
- Extension creation might fail if not using Supabase Pro (some extensions require it)
- Order matters - extensions must be created before tables that use them

### 1.2 Core Table Creation (Exact Order Matters)

```sql
-- 1. Subjects table (MUST be first - others depend on it)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (name != ''),
  level TEXT NOT NULL CHECK (level IN ('Higher', 'Ordinary', 'Foundation')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_subject_level UNIQUE(name, level)
);

-- 2. Topics table (depends on subjects)
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (name != ''),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_topic_per_subject UNIQUE(name, subject_id)
);

-- 3. Questions table (the core entity)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2050),
  exam_type TEXT DEFAULT 'normal' NOT NULL CHECK (exam_type IN ('normal', 'deferred', 'supplemental')),
  paper_number INTEGER CHECK (paper_number IS NULL OR paper_number BETWEEN 1 AND 3),
  question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 100),
  question_parts TEXT[] DEFAULT '{}' NOT NULL,
  full_text TEXT,
  word_coordinates JSONB DEFAULT '[]'::jsonb,
  question_image_url TEXT NOT NULL CHECK (question_image_url != ''),
  marking_scheme_image_url TEXT NOT NULL CHECK (marking_scheme_image_url != ''),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_question_image UNIQUE(question_image_url),
  CONSTRAINT unique_marking_scheme UNIQUE(marking_scheme_image_url),
  CONSTRAINT unique_question_identity UNIQUE(subject_id, year, exam_type, paper_number, question_number, question_parts)
);

-- 4. Question-Topics junction table
CREATE TABLE question_topics (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT pk_question_topics PRIMARY KEY (question_id, topic_id)
);
```

**Critical Edge Cases & Issues:**
1. **Orphaned records**: Using `ON DELETE RESTRICT` for questions prevents accidental subject deletion
2. **Duplicate URLs**: UNIQUE constraints prevent same image being used twice
3. **Empty strings**: CHECK constraints prevent empty required fields
4. **Invalid years**: Year range prevents typos (e.g., 202 instead of 2024)
5. **Paper number NULL**: Some exams might not have paper numbers
6. **Question structure**: INTEGER for main number (1-100), TEXT array for parts ['a', 'b'] or ['i', 'ii']
7. **Exam type**: Defaults to 'normal', supports 'deferred' and 'supplemental' exams

### 1.3 Full-Text Search Setup

```sql
-- For now, full-text search will be handled via search functions rather than generated columns
-- Create custom text search configuration for math content
CREATE TEXT SEARCH CONFIGURATION math_english (COPY = english);
ALTER TEXT SEARCH CONFIGURATION math_english
  ALTER MAPPING FOR word, asciiword WITH simple, english_stem;

-- Create search function with exam_type support
CREATE OR REPLACE FUNCTION search_questions(
  search_term text, 
  p_subject_id uuid DEFAULT NULL,
  p_exam_types text[] DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    question_number integer,
    question_parts text[],
    year integer,
    exam_type text,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question_number,
        q.question_parts,
        q.year,
        q.exam_type,
        ts_rank(
            to_tsvector('english', 
                CONCAT('Q', q.question_number::text, ' ', 
                       COALESCE(array_to_string(q.question_parts, ' '), ''), ' ',
                       q.exam_type, ' ',
                       COALESCE(q.full_text, '')
                )
            ),
            plainto_tsquery('english', search_term)
        ) as rank
    FROM questions q
    WHERE 
        (p_subject_id IS NULL OR q.subject_id = p_subject_id)
        AND (p_exam_types IS NULL OR q.exam_type = ANY(p_exam_types))
        AND to_tsvector('english', 
                CONCAT('Q', q.question_number::text, ' ', 
                       COALESCE(array_to_string(q.question_parts, ' '), ''), ' ',
                       q.exam_type, ' ',
                       COALESCE(q.full_text, '')
                )
            ) @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;
```

**Note:**
- Using search functions avoids issues with generated column immutability
- Custom search configs might not persist across Supabase migrations

### 1.4 Comprehensive Indexing Strategy

```sql
-- Primary lookup indexes
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_year_desc ON questions(year DESC);
CREATE INDEX idx_topics_subject_id ON topics(subject_id);

-- Junction table indexes (BOTH directions needed)
CREATE INDEX idx_question_topics_question_id ON question_topics(question_id);
CREATE INDEX idx_question_topics_topic_id ON question_topics(topic_id);

-- Question number and parts indexes
CREATE INDEX idx_questions_number ON questions(question_number);
CREATE INDEX idx_questions_parts ON questions USING GIN(question_parts);

-- Exam type indexes
CREATE INDEX idx_questions_exam_type ON questions(exam_type);
CREATE INDEX idx_questions_year_exam_type ON questions(year DESC, exam_type);

-- Composite indexes for common query patterns
CREATE INDEX idx_questions_subject_year ON questions(subject_id, year DESC);
CREATE INDEX idx_questions_subject_year_number ON questions(subject_id, year DESC, question_number ASC);
CREATE INDEX idx_questions_subject_year_exam_type ON questions(subject_id, year DESC, exam_type);

-- JSONB index for word coordinates (if searching within)
CREATE INDEX idx_questions_word_coords ON questions USING GIN(word_coordinates);
```

**Missing Index Pitfalls:**
- Without DESC index on year, "most recent first" queries are slow
- Missing junction table indexes cause N+1 query problems
- Composite indexes must match query WHERE clause order

## Phase 2: Storage Configuration (Critical - Day 1)

### 2.1 Bucket Creation with Proper Settings

```sql
-- Create bucket via Supabase Dashboard or SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-content', 
  'exam-content', 
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/webp', 'image/png', 'image/jpeg']::text[]
);
```

**Storage Structure Requirements:**
```
exam-content/
├── questions/
│   └── {subject_name}/
│       └── {year}/
│           └── {exam_type}/
│               └── {level}/
│                   └── {question_id}.webp
└── marking-schemes/
    └── {subject_name}/
        └── {year}/
            └── {exam_type}/
                └── {level}/
                    └── {question_id}.webp
```

**Critical Storage Issues:**
1. **File naming**: Must use question UUID, not question number (avoids duplicates)
2. **Path case sensitivity**: Supabase Storage is case-sensitive
3. **Special characters**: Avoid spaces, use hyphens or underscores
4. **File size**: Math questions with diagrams can be large
5. **CORS issues**: Bucket must be public for frontend access

### 2.2 Storage Policies (Security Critical)

```sql
-- Public read for all users
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'exam-content');

-- Authenticated upload only (more secure than service_role only)
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exam-content' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN ('questions', 'marking-schemes')
  );

-- Prevent updates to existing files
CREATE POLICY "No updates allowed" ON storage.objects
  FOR UPDATE USING (false);

-- Only service role can delete
CREATE POLICY "Service role delete only" ON storage.objects
  FOR DELETE USING (bucket_id = 'exam-content' AND auth.role() = 'service_role');
```

**Security Vulnerabilities to Prevent:**
- Path traversal attacks (../../etc/passwd)
- Overwriting existing files
- Uploading non-image files
- Bucket enumeration

## Phase 3: Row Level Security (Day 1)

### 3.1 Enable RLS on ALL Tables

```sql
-- CRITICAL: Do this immediately after table creation
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners
ALTER TABLE subjects FORCE ROW LEVEL SECURITY;
ALTER TABLE topics FORCE ROW LEVEL SECURITY;
ALTER TABLE questions FORCE ROW LEVEL SECURITY;
ALTER TABLE question_topics FORCE ROW LEVEL SECURITY;
```

### 3.2 Read-Only Public Access Policies

```sql
-- Simple read policies
CREATE POLICY "Everyone can read subjects" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read question_topics" ON question_topics
  FOR SELECT USING (true);

-- Authenticated write policies (for data ingestion)
CREATE POLICY "Authenticated can insert questions" ON questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert topics" ON topics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- NO UPDATE/DELETE policies = changes blocked
```

**RLS Gotchas:**
1. **Service role bypass**: Service role ignores RLS - be careful!
2. **Missing FORCE**: Without FORCE, table owner bypasses RLS
3. **Policy order**: Policies are OR'd together, not AND'd
4. **Performance**: Complex policies can slow queries

## Phase 4: Data Structure Requirements

### 4.1 Expected File Formats

**Question Images:**
- Format: WebP (MUST be WebP for consistency)
- Resolution: 1200px width minimum
- Naming: `{uuid}.webp` (NOT question numbers)
- Quality: 85-90% compression

**Marking Scheme Images:**
- Same requirements as questions
- Must have 1:1 relationship with questions

### 4.2 Word Coordinates JSON Structure

```json
{
  "words": [
    {
      "text": "Find",
      "x": 50,
      "y": 100,
      "width": 40,
      "height": 20,
      "confidence": 0.98
    },
    {
      "text": "the",
      "x": 95,
      "y": 100,
      "width": 30,
      "height": 20,
      "confidence": 0.99
    }
  ],
  "page_width": 1200,
  "page_height": 1600
}
```

**Coordinate System Requirements:**
- Origin: Top-left (0,0)
- Units: Pixels
- Must include page dimensions for scaling

## Phase 5: API Access Patterns

### 5.1 Initial Data Load Query

```sql
-- Optimized query for initial page load
SELECT 
  q.*,
  s.name as subject_name,
  s.level as subject_level,
  COALESCE(
    json_agg(
      json_build_object('id', t.id, 'name', t.name) 
      ORDER BY t.name
    ) FILTER (WHERE t.id IS NOT NULL), 
    '[]'::json
  ) as topics
FROM questions q
JOIN subjects s ON q.subject_id = s.id
LEFT JOIN question_topics qt ON q.id = qt.question_id
LEFT JOIN topics t ON qt.topic_id = t.id
WHERE 
  q.subject_id = $1
  AND ($2::text[] IS NULL OR q.exam_type = ANY($2))
GROUP BY q.id, s.id
ORDER BY q.year DESC, q.exam_type, q.question_number ASC
LIMIT 25 OFFSET 0;
```

### 5.2 Search Query Pattern

```sql
-- Full-text search using the search function
SELECT 
  q.*,
  s.question_number,
  s.question_parts,
  s.year,
  s.exam_type,
  s.rank
FROM search_questions($1, $2, $3) s
JOIN questions q ON q.id = s.id
WHERE 
  ($4::int[] IS NULL OR q.year = ANY($4))
  AND ($5::uuid[] IS NULL OR EXISTS (
    SELECT 1 FROM question_topics qt 
    WHERE qt.question_id = q.id 
    AND qt.topic_id = ANY($5)
  ))
ORDER BY s.rank DESC
LIMIT 25 OFFSET $6;
```

## Phase 6: Critical Error Scenarios

### 6.1 Database Integrity Issues

**Scenario 1: Orphaned Images**
- Question deleted but images remain in storage
- Solution: Implement cleanup function

```sql
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS void AS $$
BEGIN
  -- Log images that exist in storage but not in DB
  -- (Requires external script to actually delete)
END;
$$ LANGUAGE plpgsql;
```

**Scenario 2: Duplicate Topic Assignments**
- Same topic assigned twice to a question
- Solution: Primary key prevents this

**Scenario 3: Missing Marking Schemes**
- Question exists but marking scheme URL is broken
- Solution: Validation before insert

### 6.2 Performance Degradation

**Issue: Slow Topic Filtering**
```sql
-- Create materialized view for faster topic counts
CREATE MATERIALIZED VIEW mv_topic_question_counts AS
SELECT 
  t.id as topic_id,
  t.subject_id,
  COUNT(DISTINCT qt.question_id) as question_count,
  MAX(q.year) as latest_year,
  AVG(q.question_number) as avg_question_number,
  COUNT(DISTINCT q.question_number) as unique_question_numbers
FROM topics t
LEFT JOIN question_topics qt ON t.id = qt.topic_id
LEFT JOIN questions q ON qt.question_id = q.id
GROUP BY t.id, t.subject_id;

CREATE INDEX idx_mv_topic_counts_subject ON mv_topic_question_counts(subject_id);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_topic_question_counts;
```

### 6.3 Search Issues

**Problem: Math symbols not searchable**
- "x²" stored as "x2" in OCR
- Solution: Search preprocessing

```sql
CREATE OR REPLACE FUNCTION preprocess_math_search(query text)
RETURNS text AS $$
BEGIN
  -- Replace common math notation
  query := REPLACE(query, 'squared', '2');
  query := REPLACE(query, 'cubed', '3');
  query := REPLACE(query, 'sqrt', '√');
  RETURN query;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

## Phase 7: Monitoring & Maintenance

### 7.1 Health Check Queries

```sql
-- Check for questions without topics
SELECT COUNT(*) as orphaned_questions
FROM questions q
WHERE NOT EXISTS (
  SELECT 1 FROM question_topics qt 
  WHERE qt.question_id = q.id
);

-- Check for broken image URLs (requires external validation)
SELECT id, question_image_url
FROM questions
WHERE question_image_url NOT LIKE '%/exam-content/%';

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 7.2 Backup Strategy

```sql
-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup;

-- Periodic snapshot function
CREATE OR REPLACE FUNCTION create_backup_snapshot()
RETURNS void AS $$
DECLARE
  backup_suffix text := to_char(NOW(), 'YYYYMMDD_HH24MI');
BEGIN
  EXECUTE format('CREATE TABLE backup.questions_%s AS TABLE questions', backup_suffix);
  EXECUTE format('CREATE TABLE backup.topics_%s AS TABLE topics', backup_suffix);
  -- etc for other tables
END;
$$ LANGUAGE plpgsql;
```

## Phase 8: Disaster Recovery

### 8.1 Data Loss Scenarios

**Lost Storage Files:**
- Keep original PDFs as backup
- Store image URLs with checksums

**Corrupted Word Coordinates:**
```sql
-- Validation function
CREATE OR REPLACE FUNCTION validate_word_coordinates(coords jsonb)
RETURNS boolean AS $$
BEGIN
  RETURN coords ? 'words' 
    AND jsonb_typeof(coords->'words') = 'array'
    AND coords ? 'page_width'
    AND coords ? 'page_height';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE questions 
ADD CONSTRAINT valid_word_coordinates 
CHECK (word_coordinates IS NULL OR validate_word_coordinates(word_coordinates));
```

### 8.2 Migration Rollback Plan

```sql
-- Before any migration
CREATE TABLE migration_backup_20240801 AS TABLE questions;

-- Rollback if needed
TRUNCATE questions CASCADE;
INSERT INTO questions SELECT * FROM migration_backup_20240801;
```

## Phase 9: Edge Cases & Gotchas

### 9.1 Data Edge Cases
1. **Question structure**: Main number (1-100) with parts array ['a', 'b'] or ['i', 'ii', 'iii']
2. **Year edge cases**: Deferred exams, supplemental exams, mock papers
3. **Exam types**: Normal, deferred, and supplemental papers in same year
4. **Missing papers**: Some years might not have Paper 2
5. **Special characters**: Irish language with fadas (á, é, í, ó, ú)
6. **Multi-page questions**: Single question across multiple images

### 9.2 Query Edge Cases
1. **Empty search results**: Show helpful message
2. **Too many results**: Force pagination
3. **Timeout on complex queries**: Add statement timeout
4. **SQL injection**: Use parameterized queries only

### 9.3 Storage Edge Cases
1. **Filename collisions**: UUID prevents this
2. **Case sensitivity**: mathematics vs Mathematics
3. **Network failures during upload**: Implement retry
4. **Storage quota exceeded**: Monitor usage

## Phase 10: Future-Proofing

### 10.1 Schema Versioning
```sql
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES (1, 'Initial schema with questions, topics, subjects');
```

### 10.2 Extensibility Considerations
- JSONB columns for future metadata
- Avoid hard-coding subject names
- Plan for formula rendering later
- Consider multi-language support

## Critical Success Factors

1. **Data Integrity**: Every question MUST have both images
2. **Performance**: Sub-200ms query response time
3. **Reliability**: 99.9% uptime for read operations
4. **Scalability**: Handle 10,000+ questions efficiently
5. **Security**: Prevent any data modification from frontend

## Implementation Checklist

- [ ] Enable all PostgreSQL extensions
- [ ] Create tables in correct order
- [ ] Add all CHECK constraints
- [ ] Create all indexes
- [ ] Enable RLS on all tables
- [ ] Create all RLS policies
- [ ] Set up storage bucket
- [ ] Configure storage policies
- [ ] Test with sample data
- [ ] Verify query performance
- [ ] Document API keys usage
- [ ] Set up monitoring queries
- [ ] Create backup procedures
- [ ] Test disaster recovery

This backend is designed to be bulletproof, handling all edge cases while maintaining absolute simplicity in its core design.