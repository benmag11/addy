# Database Rollback Procedures

## Overview
This document outlines procedures for rolling back database changes in case of issues.

## Backup Strategy

### Automatic Backups
- Supabase automatically creates daily backups
- Backups are retained for 7 days (Free tier) or 30 days (Pro tier)
- Access via Supabase Dashboard > Database > Backups

### Manual Backup Snapshots
The system includes a `create_backup_snapshot()` function that creates timestamped copies of all tables in the `backup` schema.

```sql
-- Create a manual snapshot
SELECT create_backup_snapshot();
```

This creates tables like:
- `backup.questions_20240801_1430`
- `backup.topics_20240801_1430`
- `backup.subjects_20240801_1430`
- `backup.question_topics_20240801_1430`

## Rollback Procedures

### 1. Full Table Rollback

If you need to rollback an entire table to a previous state:

```sql
-- Example: Rollback questions table
BEGIN;
-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Clear current data
TRUNCATE questions CASCADE;

-- Restore from backup
INSERT INTO questions SELECT * FROM backup.questions_20240801_1430;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
COMMIT;
```

### 2. Partial Data Rollback

For selective rollback of specific records:

```sql
-- Example: Restore specific questions from a certain year
INSERT INTO questions 
SELECT * FROM backup.questions_20240801_1430 
WHERE year = 2024
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  year = EXCLUDED.year,
  exam_type = EXCLUDED.exam_type,
  paper_number = EXCLUDED.paper_number,
  question_number = EXCLUDED.question_number,
  question_parts = EXCLUDED.question_parts,
  full_text = EXCLUDED.full_text,
  word_coordinates = EXCLUDED.word_coordinates,
  question_image_url = EXCLUDED.question_image_url,
  marking_scheme_image_url = EXCLUDED.marking_scheme_image_url;
```

### 3. Schema Rollback

If schema changes need to be reverted:

```sql
-- Check current schema version
SELECT * FROM schema_version ORDER BY version DESC LIMIT 1;

-- Revert to previous migration
-- This requires having the reverse migration SQL ready
-- Example: Drop a recently added column
ALTER TABLE questions DROP COLUMN IF EXISTS new_column;

-- Update schema version
UPDATE schema_version SET version = version - 1 WHERE version = 2;
```

#### Specific Rollback: Question Number Structure

To rollback the question number INTEGER change:

```sql
BEGIN;
-- Drop new constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_question_number;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_question_parts;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_question_parts_format;

-- Drop indexes
DROP INDEX IF EXISTS idx_questions_number;
DROP INDEX IF EXISTS idx_questions_parts;
DROP INDEX IF EXISTS idx_questions_subject_year_number;

-- Drop question_parts column
ALTER TABLE questions DROP COLUMN IF EXISTS question_parts;

-- Revert question_number to TEXT
ALTER TABLE questions 
ALTER COLUMN question_number TYPE TEXT;

-- Restore original constraint
ALTER TABLE questions 
ADD CONSTRAINT questions_question_number_check 
CHECK (question_number != '');

-- Restore original unique constraint
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS unique_question_identity;

ALTER TABLE questions 
ADD CONSTRAINT unique_question_identity 
UNIQUE(subject_id, year, paper_number, question_number);

COMMIT;
```

#### Specific Rollback: Exam Type Support

To rollback the exam_type field addition:

```sql
BEGIN;
-- Drop search function that uses exam_type
DROP FUNCTION IF EXISTS search_questions(text, uuid, text[]);

-- Drop indexes related to exam_type
DROP INDEX IF EXISTS idx_questions_exam_type;
DROP INDEX IF EXISTS idx_questions_year_exam_type;
DROP INDEX IF EXISTS idx_questions_subject_year_exam_type;

-- Restore original unique constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS unique_question_identity;
ALTER TABLE questions 
ADD CONSTRAINT unique_question_identity 
UNIQUE(subject_id, year, paper_number, question_number, question_parts);

-- Remove exam_type column
ALTER TABLE questions DROP COLUMN IF EXISTS exam_type;

-- Recreate original search function (without exam_type)
CREATE OR REPLACE FUNCTION search_questions(search_term text, p_subject_id uuid DEFAULT NULL)
RETURNS TABLE(
    id uuid,
    question_number integer,
    question_parts text[],
    year integer,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question_number,
        q.question_parts,
        q.year,
        ts_rank(
            to_tsvector('english', 
                CONCAT('Q', q.question_number::text, ' ', 
                       COALESCE(array_to_string(q.question_parts, ' '), ''), ' ',
                       COALESCE(q.full_text, ''))
            ),
            plainto_tsquery('english', search_term)
        ) as rank
    FROM questions q
    WHERE 
        (p_subject_id IS NULL OR q.subject_id = p_subject_id)
        AND to_tsvector('english', 
                CONCAT('Q', q.question_number::text, ' ', 
                       COALESCE(array_to_string(q.question_parts, ' '), ''), ' ',
                       COALESCE(q.full_text, ''))
            ) @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;
```

### 4. Storage Rollback

Storage files cannot be rolled back automatically. To restore:

1. Keep original source files in a separate backup location
2. Re-upload files if needed using the original naming convention
3. Update database URLs if file paths change

## Emergency Procedures

### Complete Database Reset

**WARNING: This will delete ALL data!**

```sql
-- Drop all tables in correct order (reverse of creation)
DROP TABLE IF EXISTS question_topics CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS schema_version CASCADE;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS mv_topic_question_counts;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_orphaned_images();
DROP FUNCTION IF EXISTS validate_word_coordinates(jsonb);
DROP FUNCTION IF EXISTS validate_question_parts_format(text[]);
DROP FUNCTION IF EXISTS preprocess_math_search(text);
DROP FUNCTION IF EXISTS search_questions(text, uuid);
DROP FUNCTION IF EXISTS create_backup_snapshot();

-- Re-run all migrations from scratch
```

### Point-in-Time Recovery (Pro tier only)

For Supabase Pro users:
1. Go to Dashboard > Database > Backups
2. Select "Point in Time Recovery"
3. Choose the exact timestamp to restore to
4. Click "Restore"

## Prevention Strategies

1. **Always test migrations** in a development branch first
2. **Create manual snapshots** before major changes:
   ```sql
   SELECT create_backup_snapshot();
   ```
3. **Monitor health checks** regularly
4. **Keep schema version table** updated
5. **Document all migrations** with both up and down scripts

## Recovery Verification

After any rollback:

1. Run health check queries
2. Verify data integrity
3. Test application functionality
4. Check that all constraints are valid
5. Ensure RLS policies are intact

```sql
-- Quick verification
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM topics;
SELECT COUNT(*) FROM subjects;
SELECT COUNT(*) FROM question_topics;

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace;

-- Verify RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```