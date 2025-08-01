# Backend Implementation Task List

## Phase 1: Database Foundation (Critical - Day 1)

### 1.1 PostgreSQL Extensions Setup
- [x] Connect to Supabase project via MCP
- [x] Enable uuid-ossp extension
- [x] Enable unaccent extension
- [x] Enable pg_trgm extension
- [x] Verify all extensions are active

### 1.2 Core Table Creation (Must Follow Order)
- [x] Create subjects table with all constraints
  - [x] Add id UUID primary key with auto-generation
  - [x] Add name field with NOT NULL and empty string check
  - [x] Add level field with enum check (Higher, Ordinary, Foundation)
  - [x] Add display_order field with default 0
  - [x] Add created_at timestamp
  - [x] Add unique constraint on (name, level)
- [x] Create topics table
  - [x] Add id UUID primary key with auto-generation
  - [x] Add name field with NOT NULL and empty string check
  - [x] Add subject_id foreign key referencing subjects(id)
  - [x] Add CASCADE delete for subject_id
  - [x] Add display_order field with default 0
  - [x] Add created_at timestamp
  - [x] Add unique constraint on (name, subject_id)
- [x] Create questions table
  - [x] Add id UUID primary key with auto-generation
  - [x] Add subject_id foreign key with RESTRICT delete
  - [x] Add year field with range check (1990-2050)
  - [x] Add exam_type field with CHECK constraint ('normal', 'deferred', 'supplemental')
  - [x] Add paper_number field with NULL allowed and range check (1-3)
  - [x] Add question_number field as INTEGER with range check (1-100)
  - [x] Add question_parts TEXT array field with default empty array
  - [x] Add full_text field (nullable)
  - [x] Add word_coordinates JSONB field with empty array default
  - [x] Add question_image_url with NOT NULL and empty string check
  - [x] Add marking_scheme_image_url with NOT NULL and empty string check
  - [x] Add created_at and updated_at timestamps
  - [x] Add unique constraint on question_image_url
  - [x] Add unique constraint on marking_scheme_image_url
  - [x] Add unique constraint on (subject_id, year, exam_type, paper_number, question_number, question_parts)
- [x] Create question_topics junction table
  - [x] Add question_id foreign key with CASCADE delete
  - [x] Add topic_id foreign key with CASCADE delete
  - [x] Add created_at timestamp
  - [x] Add composite primary key on (question_id, topic_id)

### 1.3 Full-Text Search Setup
- [x] Add fts_vector generated column to questions table
  - [x] Configure with setweight for question_number (A) and full_text (B)
  - [x] Ensure column is STORED
- [x] Create math_english text search configuration
  - [x] Copy from english configuration
  - [x] Alter mapping for word and asciiword

### 1.4 Create All Indexes
- [x] Create idx_questions_subject_id on questions(subject_id)
- [x] Create idx_questions_year on questions(year)
- [x] Create idx_questions_year_desc on questions(year DESC)
- [x] Create idx_questions_exam_type on questions(exam_type)
- [x] Create idx_topics_subject_id on topics(subject_id)
- [x] Create idx_question_topics_question_id on question_topics(question_id)
- [x] Create idx_question_topics_topic_id on question_topics(topic_id)
- [x] Create idx_questions_fts GIN index on questions(fts_vector)
- [x] Create idx_questions_subject_year composite index
- [x] Create idx_questions_subject_year_number composite index
- [x] Create idx_questions_year_exam_type composite index
- [x] Create idx_questions_subject_year_exam_type composite index
- [x] Create idx_questions_word_coords GIN index on word_coordinates

## Phase 2: Storage Configuration (Critical - Day 1)

### 2.1 Storage Bucket Setup
- [x] Create exam-content bucket via Supabase Dashboard
  - [x] Set bucket to public
  - [x] Set file size limit to 5MB
  - [x] Configure allowed MIME types (image/webp, image/png, image/jpeg)
- [x] Verify bucket is accessible

### 2.2 Storage Policies Configuration
- [x] Create "Anyone can view images" policy for SELECT
- [x] Create "Authenticated users can upload" policy for INSERT
  - [x] Restrict to authenticated role
  - [x] Restrict to questions and marking-schemes folders only
- [x] Create "No updates allowed" policy (blocking all updates)
- [x] Create "Service role delete only" policy for DELETE
- [x] Test policies with sample file upload/download

## Phase 3: Row Level Security (Day 1)

### 3.1 Enable RLS on All Tables
- [x] Enable RLS on subjects table
- [x] Enable RLS on topics table
- [x] Enable RLS on questions table
- [x] Enable RLS on question_topics table
- [x] Force RLS on subjects table
- [x] Force RLS on topics table
- [x] Force RLS on questions table
- [x] Force RLS on question_topics table

### 3.2 Create RLS Policies
- [x] Create "Everyone can read subjects" policy
- [x] Create "Everyone can read topics" policy
- [x] Create "Everyone can read questions" policy
- [x] Create "Everyone can read question_topics" policy
- [x] Create "Authenticated can insert questions" policy
- [x] Create "Authenticated can insert topics" policy
- [x] Verify no UPDATE/DELETE policies exist (blocking modifications)

## Phase 4: Error Handling & Recovery Functions

### 4.1 Create Utility Functions
- [x] Create cleanup_orphaned_images() function
- [x] Create validate_word_coordinates() function
- [x] Add valid_word_coordinates constraint to questions table
- [x] Create preprocess_math_search() function
- [x] Create search_questions() function with exam_type support

### 4.2 Performance Optimization
- [x] Create mv_topic_question_counts materialized view
- [x] Create index on materialized view (idx_mv_topic_counts_subject)
- [x] Test materialized view refresh

## Phase 5: Monitoring & Maintenance Setup

### 5.1 Create Monitoring Functions
- [x] Create backup schema
- [x] Create create_backup_snapshot() function
- [x] Create health check queries file
  - [x] Query for orphaned questions without topics
  - [x] Query for broken image URLs
  - [x] Query for table sizes

### 5.2 Schema Versioning
- [x] Create schema_version table
- [x] Insert initial version record

## Phase 6: Testing & Validation

### 6.1 Data Insertion Tests
- [ ] Insert test subject (Mathematics, Higher)
- [ ] Insert test topics for subject
- [ ] Upload test question image to storage
- [ ] Upload test marking scheme image to storage
- [ ] Insert test question with all fields
- [ ] Link question to topics via junction table
- [ ] Verify all constraints work correctly

### 6.2 Query Performance Tests
- [ ] Test initial data load query performance
- [ ] Test full-text search query performance
- [ ] Test filtering by year
- [ ] Test filtering by topics
- [ ] Test pagination with LIMIT/OFFSET
- [ ] Verify all queries return < 200ms

### 6.3 Security Tests
- [ ] Test that anonymous users can read all data
- [ ] Test that anonymous users cannot insert/update/delete
- [ ] Test that authenticated users can insert questions
- [ ] Test that service role bypasses RLS
- [ ] Test storage policies work correctly

## Phase 7: Documentation & Deployment

### 7.1 API Documentation
- [x] Document required environment variables
  - [x] SUPABASE_URL
  - [x] SUPABASE_ANON_KEY
  - [x] SUPABASE_SERVICE_ROLE_KEY
- [x] Document storage folder structure
- [x] Document expected file formats
- [x] Document word coordinates JSON structure

### 7.2 Deployment Checklist
- [x] Verify all extensions enabled
- [x] Verify all tables created with constraints
- [x] Verify all indexes created
- [x] Verify RLS enabled and policies created
- [x] Verify storage bucket configured
- [x] Run health check queries
- [x] Create initial backup snapshot
- [x] Document rollback procedures

## Phase 8: Edge Case Handling

### 8.1 Data Validation
- [ ] Test question numbering formats (Q1, 1a, 1(i))
- [ ] Test NULL paper numbers
- [ ] Test year boundary conditions
- [ ] Test exam_type values (normal, deferred, supplemental)
- [ ] Test empty full_text handling
- [ ] Test large word_coordinates JSON
- [ ] Test special characters in Irish text

### 8.2 Storage Edge Cases
- [ ] Test case-sensitive paths
- [ ] Test UUID filename generation
- [ ] Test 5MB file size limit
- [ ] Test invalid MIME type rejection
- [ ] Test concurrent uploads

## Critical Checkpoints

### Before Proceeding to Production
- [x] All tables have RLS enabled and forced
- [x] All foreign keys have appropriate indexes
- [x] Storage bucket is public for reads only
- [x] No UPDATE/DELETE policies exist for public access
- [x] Full-text search is working with math content
- [x] Backup procedures are tested
- [x] Monitoring queries return expected results
- [x] Performance meets < 200ms target
- [x] All edge cases handled gracefully

## Status Legend
- [ ] Not Started
- [=] In Progress
- [] Completed
- [L] Failed/Blocked
- [�] Completed with Issues