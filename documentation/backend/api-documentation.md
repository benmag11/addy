# Exam Content API Documentation

## Environment Variables

```env
# Required for frontend/backend integration
SUPABASE_URL=https://ayzduhnlqbzlhrumyzue.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5emR1aG5scWJ6bGhydW15enVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNTE0NDYsImV4cCI6MjA2OTYyNzQ0Nn0.7YdSJWr1gO-b2KO7B3u2QMz4jvuO1kV0mBZe15wdrGc

# Only needed for data ingestion/admin operations
SUPABASE_SERVICE_ROLE_KEY=<not-included-for-security>
```

## Storage Folder Structure

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

### Example Paths
- Normal exam: `/exam-content/questions/mathematics/2024/normal/higher/550e8400-e29b-41d4-a716-446655440000.webp`
- Deferred exam: `/exam-content/questions/mathematics/2024/deferred/higher/660f9500-f39c-52e5-b827-557766551111.webp`
- Marking Scheme: `/exam-content/marking-schemes/mathematics/2024/normal/higher/550e8400-e29b-41d4-a716-446655440000.webp`

## Expected File Formats

### Image Requirements
- **Format**: WebP (required for consistency and performance)
- **Resolution**: Minimum 1200px width
- **File Size**: Maximum 5MB per file
- **Compression**: 85-90% quality recommended
- **Naming**: Use question UUID as filename (e.g., `550e8400-e29b-41d4-a716-446655440000.webp`)

### Allowed MIME Types
- `image/webp`
- `image/png`
- `image/jpeg`

## Word Coordinates JSON Structure

The `word_coordinates` field in the questions table expects a JSONB object with the following structure:

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

### Coordinate System
- **Origin**: Top-left corner (0,0)
- **Units**: Pixels
- **Required Fields**:
  - `words`: Array of word objects
  - `page_width`: Total width of the page in pixels
  - `page_height`: Total height of the page in pixels

### Word Object Fields
- `text`: The word or text content
- `x`: X-coordinate of top-left corner
- `y`: Y-coordinate of top-left corner
- `width`: Width of the word bounding box
- `height`: Height of the word bounding box
- `confidence`: OCR confidence score (0-1)

## Database Schema

### Tables
1. **subjects**: Educational subjects with levels
2. **topics**: Topics within each subject
3. **questions**: Exam questions with metadata
4. **question_topics**: Many-to-many relationship between questions and topics

### Question Structure
The questions table uses a structured approach for question numbering and exam types:
- `question_number`: INTEGER (1-100) - The main question number
- `question_parts`: TEXT[] - Array of sub-parts like ['a', 'b'] or ['i', 'ii', 'iii']
- `exam_type`: TEXT - Type of exam ('normal', 'deferred', 'supplemental')

Example data:
```json
{
  "question_number": 7,
  "question_parts": ["a", "b"],
  "year": 2024,
  "paper_number": 1,
  "exam_type": "normal"
}
```

This represents "Question 7 parts (a) and (b)" from Paper 1 of 2024 normal exam.

### Key Constraints
- Questions require both `question_image_url` and `marking_scheme_image_url`
- Question numbers are INTEGER values between 1-100
- Question parts are stored as TEXT array (e.g., ['a', 'b'] or ['i', 'ii', 'iii'])
- Years are restricted to 1990-2050
- Paper numbers can be NULL or 1-3
- Exam type must be one of: 'normal', 'deferred', 'supplemental' (defaults to 'normal')
- All text fields prevent empty strings

## Security Model

### Row Level Security (RLS)
- All tables have RLS enabled and forced
- Anonymous users can READ all data
- Only authenticated users can INSERT data
- No UPDATE or DELETE operations allowed via API

### Storage Security
- Public read access for all images
- Authenticated users can upload to `questions/` and `marking-schemes/` folders
- No file updates allowed (immutable storage)
- Only service role can delete files

## API Usage Examples

### Initialize Supabase Client

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
```

### Query Questions

```javascript
// Get questions for a subject
const { data, error } = await supabase
  .from('questions')
  .select(`
    *,
    subjects!inner(name, level),
    question_topics!left(
      topics!inner(id, name)
    )
  `)
  .eq('subject_id', subjectId)
  .order('year', { ascending: false })
  .order('exam_type')
  .order('question_number')
  .limit(25)

// Get only deferred papers
const { data: deferredData } = await supabase
  .from('questions')
  .select('*')
  .eq('exam_type', 'deferred')
  .eq('year', 2024)

// Get normal and deferred papers
const { data: mixedData } = await supabase
  .from('questions')
  .select('*')
  .in('exam_type', ['normal', 'deferred'])
  .eq('subject_id', subjectId)

// Filter by question number range
const { data: rangeData } = await supabase
  .from('questions')
  .select('*')
  .gte('question_number', 5)
  .lte('question_number', 10)

// Filter by question parts
const { data: partsData } = await supabase
  .from('questions')
  .select('*')
  .contains('question_parts', ['a', 'b'])
```

### Full-Text Search

```javascript
// Search questions by content
const { data, error } = await supabase
  .rpc('search_questions', {
    search_term: 'quadratic equation',
    p_subject_id: subjectId,
    p_exam_types: ['normal', 'deferred']
  })

// Search for deferred exams specifically
const { data: deferredSearch } = await supabase
  .rpc('search_questions', {
    search_term: '2024 deferred',
    p_subject_id: subjectId
  })
```

### Get Storage URLs

```javascript
// Get public URL for a question image
const { data } = supabase
  .storage
  .from('exam-content')
  .getPublicUrl('questions/mathematics/2024/normal/higher/question-id.webp')

// Direct URL format:
// https://ayzduhnlqbzlhrumyzue.supabase.co/storage/v1/object/public/exam-content/questions/mathematics/2024/normal/higher/question-id.webp
```

## Frontend Title Generation

Since question titles are generated on the frontend, use this utility function:

```javascript
function generateQuestionTitle(question) {
  const parts = question.question_parts?.length 
    ? ` (${question.question_parts.join(', ')})` 
    : '';
  
  const examTypeLabel = question.exam_type !== 'normal' 
    ? ` ${question.exam_type.charAt(0).toUpperCase() + question.exam_type.slice(1)}` 
    : '';
  
  if (question.paper_number) {
    return `${question.year}${examTypeLabel} Paper ${question.paper_number} Q${question.question_number}${parts}`;
  } else {
    return `${question.year}${examTypeLabel} Q${question.question_number}${parts}`;
  }
}

// Example outputs:
// "2024 Paper 1 Q7 (a, b)" - normal exam
// "2024 Deferred Paper 1 Q7 (a, b)" - deferred exam
// "2023 Supplemental Q3 (i, ii, iii)" - supplemental exam
// "2024 Paper 2 Q5" - normal exam
```

## Performance Considerations

- All foreign keys have indexes
- Full-text search uses GIN indexes
- Composite indexes optimize common query patterns
- Materialized view `mv_topic_question_counts` provides fast topic statistics
- Question number filtering uses numeric indexes for fast range queries
- Exam type filtering uses dedicated indexes for performance
- Target query response time: < 200ms

## Monitoring

Use the provided health check queries in `health_check_queries.sql` to monitor:
- Orphaned questions without topics
- Table sizes and growth
- Question distribution by year
- Duplicate detection
- RLS policy status