# Exam Content System Backend Architecture - CS Student Guide

## Introduction: What Are We Building?

Imagine you're building a website where students can search through thousands of past exam questions. Each question is an image file (like a photo of an exam paper), and students need to find specific questions by typing things like "quadratic equations" or "2023 Higher Mathematics".

This guide explains how we built the backend (the behind-the-scenes system) that makes this possible.

## What is a Backend?

Think of a restaurant:
- **Frontend** = The dining room, menu, waiters (what customers see and interact with)
- **Backend** = The kitchen, food storage, recipe database (what makes everything work)

Our backend needs to:
1. Store thousands of question images
2. Store information about each question (subject, year, topics)
3. Let users search through questions quickly
4. Serve the right images to the frontend

## Why Supabase? (Understanding Backend-as-a-Service)

### Traditional Approach (What We Avoided)
If we built everything from scratch, we'd need:
```
Our Computer
├── PostgreSQL Database Server
├── File Storage Server  
├── Authentication System
├── API Server
├── Backup System
└── Security Configuration
```

This would take months to set up and maintain.

### Supabase Approach (What We Actually Did)
Supabase provides all of this as a service:
```
Supabase Cloud
├── PostgreSQL Database (managed)
├── File Storage (managed)
├── Authentication (built-in)
├── API (auto-generated)
├── Backups (automatic)
└── Security (configured)
```

**Analogy**: Instead of building your own house, you rent a fully-furnished apartment.

## Architecture Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vue/etc)                 │
│                                                             │
│  [Search Bar] [Question Display] [Filter Options]          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Requests
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                         │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   DATABASE      │    │  FILE STORAGE   │                │
│  │                 │    │                 │                │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │                │
│  │ │  subjects   │ │    │ │ questions/  │ │                │
│  │ │  topics     │ │    │ │ marking-    │ │                │
│  │ │  questions  │ │    │ │ schemes/    │ │                │
│  │ │ question_   │ │    │ │             │ │                │
│  │ │  topics     │ │    │ │ .webp files │ │                │
│  │ └─────────────┘ │    │ └─────────────┘ │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 SECURITY LAYER                          ││
│  │         (Row Level Security + Storage Policies)         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Part 1: Database Design (The Information Storage)

### What is a Database?

A database is like an Excel spreadsheet, but much more powerful:
- Can handle millions of rows
- Can link different tables together
- Can search through data very quickly
- Multiple people can use it simultaneously

### Our Database Tables

Think of each table as a separate spreadsheet:

#### Table 1: `subjects`
```
| id (UUID)      | name         | level      | display_order | created_at |
|----------------|--------------|------------|---------------|------------|
| abc-123-def    | Mathematics  | Higher     | 1             | 2024-01-01 |
| ghi-456-jkl    | Mathematics  | Ordinary   | 2             | 2024-01-01 |
| mno-789-pqr    | Physics      | Higher     | 3             | 2024-01-01 |
```

**Why we need this table**: We need to know what subjects exist and at what levels. This is our "master list" of subjects.

#### Table 2: `topics`
```
| id (UUID)      | name              | subject_id | display_order | created_at |
|----------------|-------------------|------------|---------------|------------|
| top-111-222    | Algebra           | abc-123-def| 1             | 2024-01-01 |
| top-333-444    | Geometry          | abc-123-def| 2             | 2024-01-01 |
| top-555-666    | Mechanics         | mno-789-pqr| 1             | 2024-01-01 |
```

**Why we need this table**: Students want to search by specific topics like "Algebra", not just broad subjects like "Mathematics".

**Connection**: `subject_id` links to the `subjects` table - each topic belongs to exactly one subject.

#### Table 3: `questions` (The Main Table)
```
| id (UUID)      | subject_id | year | exam_type | paper_number | question_number | question_parts | full_text        | question_image_url      | marking_scheme_image_url |
|----------------|------------|------|-----------|--------------|-----------------|----------------|------------------|-------------------------|--------------------------|
| q-aaa-bbb      | abc-123-def| 2023 | normal    | 1            | 7               | ['a', 'b']     | Find the roots...| /storage/q-aaa-bbb.webp | /storage/ms-aaa-bbb.webp |
| q-ccc-ddd      | abc-123-def| 2023 | normal    | 1            | 8               | []             | Solve for x...   | /storage/q-ccc-ddd.webp | /storage/ms-ccc-ddd.webp |
| q-eee-fff      | abc-123-def| 2023 | deferred  | 1            | 7               | ['a', 'b', 'c']| Calculate...     | /storage/q-eee-fff.webp | /storage/ms-eee-fff.webp |
```

**Why we need this table**: This is the heart of our system - each row represents one exam question.

**Key Fields Explained**:
- `id`: Unique identifier for each question
- `subject_id`: Links to subjects table (which subject this question is from)
- `year`: What year the exam was from
- `exam_type`: Type of exam ('normal', 'deferred', or 'supplemental')
- `paper_number`: Some exams have multiple papers (Paper 1, Paper 2)
- `question_number`: The main question number as an integer (1-100)
- `question_parts`: Array of sub-parts like ['a', 'b'] or ['i', 'ii', 'iii']
- `full_text`: The actual text of the question (extracted from the image)
- `question_image_url`: Where to find the image of the question
- `marking_scheme_image_url`: Where to find the answer key image

#### Table 4: `question_topics` (The Connection Table)
```
| question_id | topic_id    | created_at |
|-------------|-------------|------------|
| q-aaa-bbb   | top-111-222 | 2024-01-01 |
| q-aaa-bbb   | top-333-444 | 2024-01-01 |
| q-ccc-ddd   | top-111-222 | 2024-01-01 |
```

**Why we need this table**: One question might cover multiple topics. For example, a question might involve both Algebra AND Geometry.

**This is called a "Many-to-Many" relationship**:
- One question can have many topics
- One topic can appear in many questions

### Database Relationships Diagram

```
┌─────────────┐         ┌─────────────┐
│  subjects   │◄────────┤   topics    │
│             │    1:M  │             │
│ id (PK)     │         │ id (PK)     │
│ name        │         │ name        │
│ level       │         │ subject_id  │
└─────────────┘         └─────────────┘
       ▲                        ▲
       │                        │
       │ 1:M                    │ M:M
       │                        │
┌─────────────┐         ┌─────────────┐
│ questions   │◄────────┤question_    │
│             │         │topics       │
│ id (PK)     │         │             │
│ subject_id  │         │question_id  │
│ year        │         │topic_id     │
│ paper_num   │         └─────────────┘
│ question_num│
│ full_text   │
│ image_urls  │
└─────────────┘

Legend:
PK = Primary Key
1:M = One-to-Many relationship
M:M = Many-to-Many relationship
```

## Part 2: File Storage System

### Why Separate File Storage?

**Bad Approach**: Store images directly in the database
- Database becomes huge and slow
- Expensive storage costs
- Difficult to serve images to web browsers

**Good Approach**: Store images separately, keep references in database
- Database stays fast and small
- Cheaper file storage
- Optimized for serving images to browsers

### Storage Structure

Our files are organized like a folder system on your computer:

```
exam-content/                          ← Storage Bucket
├── questions/                         ← Question Images
│   ├── mathematics/                   ← Subject Folder
│   │   ├── 2023/                     ← Year Folder
│   │   │   ├── normal/               ← Exam Type Folder
│   │   │   │   ├── higher/           ← Level Folder
│   │   │   │   │   ├── q-aaa-bbb.webp ← Individual Question
│   │   │   │   │   ├── q-ccc-ddd.webp
│   │   │   │   │   └── q-eee-fff.webp
│   │   │   │   └── ordinary/
│   │   │   │       ├── q-ggg-hhh.webp
│   │   │   │       └── q-iii-jjj.webp
│   │   │   └── deferred/             ← Deferred Exam Folder
│   │   │       └── higher/
│   │   │           ├── q-kkk-lll.webp
│   │   │           └── q-mmm-nnn.webp
│   │   └── 2024/
│   │       └── normal/
│   │           └── higher/
│   │               └── q-ppp-qqq.webp
│   └── physics/
│       └── 2023/
│           └── normal/
│               └── higher/
│                   └── q-rrr-sss.webp
└── marking-schemes/                    ← Answer Key Images
    ├── mathematics/
    │   ├── 2023/
    │   │   ├── normal/
    │   │   │   ├── higher/
    │   │   │   │   ├── ms-aaa-bbb.webp ← Matching Answer Keys
    │   │   │   │   ├── ms-ccc-ddd.webp
    │   │   │   │   └── ms-eee-fff.webp
    │   │   │   └── ordinary/
    │   │   │       ├── ms-ggg-hhh.webp
    │   │   │       └── ms-iii-jjj.webp
    │   │   └── deferred/
    │   │       └── higher/
    │   │           ├── ms-kkk-lll.webp
    │   │           └── ms-mmm-nnn.webp
    │   └── 2024/
    │       └── normal/
    │           └── higher/
    │               └── ms-ppp-qqq.webp
    └── physics/
        └── 2023/
            └── normal/
                └── higher/
                    └── ms-rrr-sss.webp
```

### Why This Structure?

1. **Organized**: Easy to find files manually if needed
2. **Scalable**: Can handle millions of files without getting messy
3. **No Conflicts**: Two files can't have the same path
4. **Logical**: Mirrors how humans think about exam organization
5. **Exam Types**: Separates normal, deferred, and supplemental exams

### File Naming Strategy

Each file uses a **UUID** (Universally Unique IDentifier):
- Example: `q-aaa-bbb-ccc-ddd-eee.webp`
- Guaranteed to be unique worldwide
- Prevents naming conflicts
- Same UUID used in database `id` field

## Part 3: Search System (The Smart Part)

### Basic Search Concept

When a user types "quadratic equation", here's what happens:

```
User Input: "quadratic equation"
           ↓
    [Search Processing]
           ↓
   Database Query with Full-Text Search
           ↓
    [Results Ranking]
           ↓
   Return Matching Questions
```

### Full-Text Search Implementation

#### Step 1: Text Extraction
When questions are added to the system:
1. OCR (Optical Character Recognition) reads text from the image
2. Text is stored in the `full_text` column
3. Word positions are stored in `word_coordinates` for highlighting

#### Step 2: Search Processing
Since question numbers are now integers, we use a search function:
```sql
-- Search includes question number with 'Q' prefix and exam type for user convenience
search_text = 'Q' + question_number + ' ' + question_parts + ' ' + exam_type + ' ' + full_text
```

This allows searching for "Q7" to find question 7, or "deferred" to find deferred exams.

#### Step 3: Search Query Processing
When user searches for "quadratic equation":
```sql
-- Simplified version of what happens
SELECT * FROM questions 
WHERE fts_vector @@ to_tsquery('english', 'quadratic & equation')
ORDER BY ts_rank(fts_vector, to_tsquery('english', 'quadratic & equation')) DESC;
```

### Search Flow Diagram

```
┌─────────────────┐
│ User types:     │
│ "quadratic"     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Frontend sends  │
│ search request  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Supabase API    │
│ processes query │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Database uses   │
│ full-text search│
│ index (GIN)     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Results ranked  │
│ by relevance    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ JSON response   │
│ sent to frontend│
└─────────────────┘
```

## Part 4: Security Model (Who Can Do What)

### Row Level Security (RLS)

This is like having different keycards for different floors of a building:

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                      │
│                                                         │
│  Anonymous Users (Students)                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ✅ READ all questions                                │ │
│  │ ✅ READ all subjects/topics                          │ │
│  │ ✅ VIEW all images                                   │ │
│  │ ❌ Cannot add/edit/delete anything                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Authenticated Users (Teachers/Admins)                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ✅ Everything anonymous users can do                 │ │
│  │ ✅ ADD new questions                                 │ │
│  │ ✅ UPLOAD new images                                 │ │
│  │ ❌ Still cannot edit/delete existing content        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Service Role (System Admin)                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ✅ Can do everything                                 │ │
│  │ ✅ Direct database access                            │ │
│  │ ✅ Can delete files/records                          │ │
│  │ ⚠️  Only used for maintenance                        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Why This Security Model?

1. **Students don't need accounts** - Reduces friction for main users
2. **Content is protected** - Prevents accidental deletion
3. **Quality control** - Only authorized users can add content
4. **Audit trail** - All additions are logged

### Security Implementation

Each table has policies like this:
```sql
-- Anyone can read questions
CREATE POLICY "Everyone can read questions" ON questions
  FOR SELECT USING (true);

-- Only authenticated users can add questions  
CREATE POLICY "Authenticated can insert questions" ON questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No one can update or delete (no policies = no access)
```

## Part 5: Performance Optimization

### Why Performance Matters

With 10,000+ questions, searches need to be fast (under 200ms). Without optimization:
- Search might take 10+ seconds
- Users would leave the site
- Database would crash under load

### Database Indexes (The Speed Boosters)

Think of indexes like the index in the back of a textbook:

**Without Index** (Slow):
```
To find all Mathematics questions:
1. Check row 1: Is this Mathematics? No.
2. Check row 2: Is this Mathematics? No.
3. Check row 3: Is this Mathematics? Yes! Add to results.
4. Check row 4: Is this Mathematics? No.
... continue for all 10,000 rows
```

**With Index** (Fast):
```
Mathematics Index points to rows: [3, 7, 12, 45, 67, ...]
Jump directly to these rows and return results.
```

### Our Indexes

```sql
-- Primary lookups
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_number ON questions(question_number);
CREATE INDEX idx_questions_exam_type ON questions(exam_type);

-- Array search for question parts
CREATE INDEX idx_questions_parts ON questions USING GIN(question_parts);

-- Common combinations
CREATE INDEX idx_questions_subject_year ON questions(subject_id, year DESC);
CREATE INDEX idx_questions_subject_year_number ON questions(subject_id, year DESC, question_number ASC);
CREATE INDEX idx_questions_year_exam_type ON questions(year DESC, exam_type);
```

### Performance Optimization Diagram

```
Query: "Find Mathematics questions from 2023"
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              QUERY PLANNER                          │
│                                                     │
│ 1. Check available indexes                          │
│ 2. Choose fastest execution plan                    │
│ 3. Use idx_questions_subject_year                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              INDEX LOOKUP                           │
│                                                     │
│ Mathematics + 2023 → [Row 45, Row 67, Row 123]     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│            RETURN RESULTS                           │
│                                                     │
│ Total time: ~50ms (instead of 5000ms)              │
└─────────────────────────────────────────────────────┘
```

## Part 6: Data Flow - How Everything Connects

### Complete User Journey

Let's trace what happens when a student searches for "algebra 2023 deferred":

#### Step 1: Frontend Request
```javascript
// Frontend code (simplified)
const response = await supabase
  .rpc('search_questions', {
    search_term: 'algebra',
    p_subject_id: subjectId,
    p_exam_types: ['deferred']
  })
```

#### Step 2: Supabase Processing
```
┌─────────────────┐
│ 1. Authenticate │ ← Check if user has permission
│    Request      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 2. Parse Query  │ ← Convert to SQL
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 3. Apply RLS    │ ← Check row-level security
│    Policies     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 4. Execute SQL  │ ← Run optimized query with indexes
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 5. Format JSON  │ ← Convert results to JSON
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 6. Return Data  │ ← Send back to frontend
└─────────────────┘
```

#### Step 3: Generated SQL (Behind the Scenes)
```sql
SELECT 
  q.*,
  s.name as subject_name,
  s.level as subject_level,
  array_agg(t.name) as topic_names
FROM questions q
JOIN subjects s ON q.subject_id = s.id
LEFT JOIN question_topics qt ON q.id = qt.question_id  
LEFT JOIN topics t ON qt.topic_id = t.id
WHERE 
  to_tsvector('english', CONCAT('Q', q.question_number::text, ' ', 
    COALESCE(array_to_string(q.question_parts, ' '), ''), ' ',
    q.exam_type, ' ', COALESCE(q.full_text, ''))
  ) @@ to_tsquery('english', 'algebra')
  AND q.year = 2023
  AND q.exam_type = 'deferred'
GROUP BY q.id, s.id
ORDER BY ts_rank(...) DESC
LIMIT 10;
```

#### Step 4: Image Loading
```javascript
// For each question, frontend loads images
const questionImageUrl = supabase.storage
  .from('exam-content')
  .getPublicUrl(`questions/mathematics/2023/deferred/higher/${question.id}.webp`);

const markingSchemeUrl = supabase.storage
  .from('exam-content')  
  .getPublicUrl(`marking-schemes/mathematics/2023/deferred/higher/${question.id}.webp`);
```

### Complete System Flow Diagram

```
┌─────────────┐    HTTP Request    ┌─────────────────┐
│  FRONTEND   │ ─────────────────→ │   SUPABASE      │
│             │                    │   API GATEWAY   │
│ • Search UI │ ←───────────────── │                 │
│ • Results   │    JSON Response   │ • Auth Check    │
│ • Images    │                    │ • Rate Limiting │
└─────────────┘                    └─────────┬───────┘
                                             │
                                             ▼
                                   ┌─────────────────┐
                                   │   ROW LEVEL     │
                                   │   SECURITY      │
                                   │                 │
                                   │ • Check Policies│
                                   │ • Apply Filters │
                                   └─────────┬───────┘
                                             │
                                             ▼
┌─────────────┐                   ┌─────────────────┐
│   FILE      │                   │   DATABASE      │
│  STORAGE    │                   │                 │
│             │                   │ ┌─────────────┐ │
│ • questions/│ ←─────────────────┤ │Index Lookup │ │
│ • marking-  │   Image URLs      │ │             │ │
│   schemes/  │                   │ │Full-Text    │ │
│             │                   │ │Search       │ │
│ ┌─────────┐ │                   │ │             │ │
│ │ .webp   │ │                   │ │Join Tables  │ │
│ │ files   │ │                   │ └─────────────┘ │
│ └─────────┘ │                   └─────────────────┘
└─────────────┘
```

## Part 7: Monitoring and Maintenance

### Health Monitoring

Just like a car needs regular check-ups, our system needs monitoring:

#### Database Health Checks
```sql
-- Check for orphaned questions (questions without topics)
SELECT COUNT(*) FROM questions q
WHERE NOT EXISTS (
  SELECT 1 FROM question_topics qt WHERE qt.question_id = q.id
);

-- Monitor table sizes  
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';

-- Check query performance
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

#### Automated Alerts
The system can alert administrators when:
- Query response times exceed 200ms
- Storage usage approaches limits
- Backup procedures fail
- Data integrity issues are detected

### Backup Strategy

Multiple layers of protection:

```
┌─────────────────────────────────────────────────────────┐
│                    BACKUP LAYERS                        │
│                                                         │
│  Layer 1: Supabase Automatic Backups                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ • Daily full database snapshots                     │ │
│  │ • 7-day retention (free) / 30-day (pro)            │ │
│  │ • Point-in-time recovery available                  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Layer 2: Manual Snapshots                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ • create_backup_snapshot() function                 │ │
│  │ • Creates timestamped table copies                  │ │
│  │ • Run before major changes                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Layer 3: Source File Backups                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ • Keep original PDF/image files                     │ │
│  │ • Separate storage location                         │ │
│  │ • Can recreate entire system if needed              │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Part 8: Common Issues and Solutions

### Problem 1: Slow Search Results

**Symptoms**: Searches taking > 2 seconds
**Diagnosis**: 
```sql
EXPLAIN ANALYZE SELECT * FROM questions 
WHERE fts_vector @@ to_tsquery('english', 'algebra');
```
**Solutions**:
- Check if GIN index exists on `fts_vector`
- Update table statistics: `ANALYZE questions;`
- Consider upgrading Supabase plan for more resources

### Problem 2: Images Not Loading

**Symptoms**: Questions appear but images show 404 errors
**Diagnosis**:
```sql
-- Check for broken URLs
SELECT id, question_image_url FROM questions 
WHERE question_image_url NOT LIKE '%exam-content%';
```
**Solutions**:
- Verify storage bucket is public
- Check file naming matches database URLs
- Ensure CORS is configured correctly

### Problem 3: Duplicate Questions

**Symptoms**: Same question appears multiple times in search
**Diagnosis**:
```sql
-- Find duplicates
SELECT subject_id, year, paper_number, question_number, COUNT(*)
FROM questions 
GROUP BY subject_id, year, paper_number, question_number
HAVING COUNT(*) > 1;
```
**Solutions**:
- Use the unique constraint (already implemented)
- Clean up existing duplicates manually
- Improve data import validation

## Part 9: Development Workflow

### How to Make Changes Safely

#### 1. Development Environment
```
Production Database  →  Development Branch  →  Local Testing
     (Live data)         (Safe copy)           (Your changes)
```

#### 2. Migration Process
```sql
-- Create migration file: 001_add_new_feature.sql
ALTER TABLE questions ADD COLUMN difficulty_level INTEGER;
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);

-- Test migration
BEGIN;
  -- Run migration
  -- Test with sample data
  -- Verify everything works
ROLLBACK; -- or COMMIT if satisfied
```

#### 3. Deployment Checklist
- [ ] Test migration on development branch
- [ ] Create backup snapshot
- [ ] Run migration on production
- [ ] Verify health checks pass
- [ ] Monitor performance metrics

### Adding New Features

Example: Adding question difficulty ratings

#### Step 1: Database Changes
```sql
-- Migration: add_difficulty_ratings.sql
ALTER TABLE questions ADD COLUMN difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_rating);
```

#### Step 2: API Changes
```javascript
// Frontend can now filter by difficulty
const hardQuestions = await supabase
  .from('questions')
  .select('*')
  .gte('difficulty_rating', 4);
```

#### Step 3: Security Updates
```sql
-- Update RLS policies if needed
CREATE POLICY "Users can filter by difficulty" ON questions
  FOR SELECT USING (difficulty_rating IS NOT NULL OR auth.role() = 'authenticated');
```
