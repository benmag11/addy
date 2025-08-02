-- Health Check Queries for Exam Content Database

-- 1. Check for orphaned questions without topics
SELECT COUNT(*) as orphaned_questions
FROM questions q
WHERE NOT EXISTS (
  SELECT 1 FROM question_topics qt 
  WHERE qt.question_id = q.id
);

-- 2. Check for broken image URLs (requires external validation)
SELECT id, question_image_url
FROM questions
WHERE question_image_url NOT LIKE '%/exam-content/%';

-- 3. Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. Check questions per subject
SELECT 
  s.name as subject_name,
  s.level,
  COUNT(q.id) as question_count
FROM subjects s
LEFT JOIN questions q ON s.id = q.subject_id
GROUP BY s.id, s.name, s.level
ORDER BY s.name, s.level;

-- 5. Check topics per subject
SELECT 
  s.name as subject_name,
  s.level,
  COUNT(t.id) as topic_count
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id
GROUP BY s.id, s.name, s.level
ORDER BY s.name, s.level;

-- 6. Check year distribution of questions
SELECT 
  year,
  COUNT(*) as question_count
FROM questions
GROUP BY year
ORDER BY year DESC
LIMIT 10;

-- 7. Check for duplicate questions
SELECT 
  subject_id,
  year,
  paper_number,
  question_number,
  COUNT(*) as duplicate_count
FROM questions
GROUP BY subject_id, year, paper_number, question_number
HAVING COUNT(*) > 1;

-- 8. Check storage bucket status
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'exam-content';

-- 9. Check RLS status on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;