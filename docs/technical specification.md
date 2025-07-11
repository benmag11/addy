# Project "addy" - A Comprehensive Technical Blueprint for an Interactive Exam Study Platform

### **Part I: The Data Foundation - From PDF to Actionable Content**

The successful launch of the "addy" platform hinges on a robust and scalable data processing pipeline. The primary challenge lies in transforming a large corpus of static PDF documents—exam papers and marking schemes—into a dynamic, structured, and searchable database of individual questions. This section details a comprehensive strategy to achieve this, moving from raw files to a collection of categorized, text-searchable, and display-ready content assets.

## Section 1: The End-to-End Data Processing Pipeline: A Strategic Overview

The core of this project requires a multi-faceted data ingestion strategy. A purely manual approach is not scalable, a purely AI-driven approach for categorization is prone to error and high cost, and a simple web-scraping approach cannot access the content within the proprietary PDF files. Therefore, the optimal solution is a hybrid, semi-automated pipeline that leverages the strengths of several technologies in a coordinated workflow.

This pipeline consists of three primary stages, orchestrated by a central Python script:

1. **Metadata Scraping:** A web scraper will systematically crawl studyclix.ie to build a definitive "map." This map will link each specific exam question (e.g., "2022 Maths Higher Paper 1 Question 4") to its officially designated topics (e.g., "Algebra - Quadratics," "Functions"). Since the project has the legal right to use this information, this step provides a ground truth for categorization, eliminating the need for complex and potentially inaccurate AI-based topic classification.
2. **Programmatic PDF Parsing & Extraction:** This is the engine of the pipeline. A Python script, using the powerful PyMuPDF library, will use the map from the previous step as an instruction set. For each entry in the map, the script will locate the corresponding PDF, find the precise coordinates of the specified question and its associated marking scheme, and render these specific regions into high-resolution images. This "smart screenshot" process is fully automated and provides the isolated question views required by the application's design.
3. **Specialized Optical Character Recognition (OCR):** To power the platform's keyword search functionality, the text from each extracted question and marking scheme image must be digitized. Critically, for subjects like Mathematics, Physics, and Chemistry, standard OCR tools fail spectacularly when encountering complex equations and symbols. This pipeline incorporates a specialized OCR service (such as Mathpix or Mistral OCR) designed to accurately interpret scientific and mathematical notation, ensuring the search index is reliable and comprehensive.

The entire workflow is designed to be executed as a single, orchestrated process. A master Python script will first run the scraper to generate the topic map. It will then iterate through this map, calling the PDF parsing functions to generate the images and the OCR functions to extract the text. The final output of this pipeline will be a structured dataset containing the question metadata, the URLs to the hosted question and marking scheme images, and the full OCR'd text, ready for ingestion into the Supabase database. This hybrid approach provides the accuracy of verified metadata with the automation of programmatic content extraction.

## Section 2: The "Smart Screenshot" Engine: Programmatic Content Extraction

The central challenge of isolating individual questions from monolithic PDF files can be solved elegantly without manual intervention. By leveraging the PyMuPDF Python library (also known as fitz), it is possible to create a "smart screenshot" engine that programmatically identifies, crops, and saves each question and its corresponding marking scheme as a separate image file.1 This method provides precision and scalability far beyond manual screen capture.

### Core Technology: PyMuPDF

PyMuPDF is selected for this task due to its exceptional performance and its ability to access low-level information within a PDF, including the precise coordinates of text and images on a page.3 This capability is the key to automating the extraction process. The library can be installed via pip:

pip install PyMuPDF.

### The "Smart Screenshot" Logic

The process relies on finding a unique "anchor" text for each question and then defining a bounding box around it to capture the full content.

1. **Identify a Unique Anchor:** The script will use the structured information from the web scraper (e.g., "2024 Paper 2 Question 2") to formulate a unique search string that identifies the start of a question, such as "Question 2 (a)". This anchor must be unique within the document to ensure the correct starting point is found.
2. **Find Coordinates:** Using PyMuPDF's page.search_for() method, the script will locate all occurrences of the anchor text on a given page. This method returns a list of Rect objects, where each Rect contains the (x0, y0, x1, y1) coordinates of the found text's bounding box.2
3. **Define the Capture Area:** A simple text search provides the starting point, but the full question may span multiple lines and include diagrams. The script must programmatically define the full capture area. A robust heuristic for this is to start with the anchor's bounding box and expand it downwards until the anchor for the *next* question part (e.g., "Question 2 (b)" or "Question 3") is detected. The bottom of the capture area is set just above the top of the next question's anchor. The width of the capture area can typically be set to the full page width to include any wide diagrams or text.
4. **Render the Image:** Once the final capture_area Rect is defined, the page.get_pixmap(clip=capture_area) method is called. This function renders only the portion of the page within the specified clipping rectangle into a Pixmap object, which is an in-memory representation of an image.6 This
    
    Pixmap can then be saved directly to a file, typically as a high-resolution PNG to preserve quality.
    

### Handling Marking Schemes

The exact same logic is applied to the corresponding marking scheme PDFs. These documents are often highly structured, frequently using tables to lay out the solution steps and mark allocation. PyMuPDF's page.find_tables() method is particularly useful here. It can automatically detect the boundaries of tables on a page, allowing the script to extract the entire marking scheme for a specific question part with high fidelity.8 The script will search for the same anchor text (e.g., "Question 2 (a)") within the marking scheme PDF and extract the relevant table or text block.

### Annotated Python Script for Extraction

The following Python script provides a functional template for this process. It defines functions to find a question's bounding box and extract it as an image.

Python

import fitz # PyMuPDF

import os

def find_question_bounds(page, start_anchor, end_anchor=None):

"""Finds the vertical bounds of a question on a page."""

start_rects = page.search_for(start_anchor)

if not start_rects:

return None

# The top of our capture area is the top of the start anchor

top_y = start_rects.y0

bottom_y = page.rect.height # Default to page bottom if no end anchor

if end_anchor:

end_rects = page.search_for(end_anchor)

if end_rects:

# The bottom of our capture area is the top of the end anchor

bottom_y = end_rects.y0

# Define the full capture area rectangle

capture_rect = fitz.Rect(0, top_y, page.rect.width, bottom_y)

return capture_rect

def extract_question_as_image(pdf_path, page_num, start_anchor, end_anchor, output_path):

"""

Extracts a specific question from a PDF page and saves it as a PNG image.

"""

try:

doc = fitz.open(pdf_path)

page = doc.load_page(page_num - 1) # page numbers are 0-indexed

# Find the bounding box for the question

clip_rect = find_question_bounds(page, start_anchor, end_anchor)

if clip_rect:

# Render the clipped area with high resolution (e.g., 300 DPI)

zoom_matrix = fitz.Matrix(300/72, 300/72)

pix = page.get_pixmap(matrix=zoom_matrix, clip=clip_rect)

# Ensure output directory exists

os.makedirs(os.path.dirname(output_path), exist_ok=True)

pix.save(output_path)

print(f"Successfully extracted to {output_path}")

else:

print(f"Could not find anchor '{start_anchor}' on page {page_num} of {pdf_path}")

doc.close()

except Exception as e:

print(f"An error occurred: {e}")

# --- Example Usage ---

# This would be driven by the data from the web scraper.

if __name__ == '__main__':

# --- Data that would come from your scraper/metadata map ---

exam_pdf_path = 'path/to/your/LC_Maths_Higher_2022_Paper1.pdf'

scheme_pdf_path = 'path/to/your/LC_Maths_Higher_2022_Paper1_MS.pdf'

# --- For Question 1(a) ---

q1a_page = 3

q1a_start_anchor = "Question 1" # Assuming this is the start

q1a_end_anchor = "Question 2" # The next question acts as the end boundary

q1a_output_question = 'output/images/maths_h_2022_p1_q1a_question.png'

q1a_output_scheme = 'output/images/maths_h_2022_p1_q1a_scheme.png'

# Extract the question

extract_question_as_image(

pdf_path=exam_pdf_path,

page_num=q1a_page,

start_anchor=q1a_start_anchor,

end_anchor=q1a_end_anchor,

output_path=q1a_output_question

)

# Extract the marking scheme (assuming it's on page 2 of the scheme PDF)

extract_question_as_image(

pdf_path=scheme_pdf_path,

page_num=2,

start_anchor=q1a_start_anchor,

end_anchor=q1a_end_anchor,

output_path=q1a_output_scheme

)

This script, when integrated into the main data pipeline, will systematically process all exam papers and marking schemes, generating a complete library of isolated, high-resolution question and solution images, named according to a consistent convention (e.g., subject_level_year_paper_question_type.png).

## Section 3: High-Fidelity OCR for STEM and Search Functionality

To enable the powerful keyword search feature envisioned for the platform, the text within each extracted question and marking scheme image must be accurately digitized. This process is known as Optical Character Recognition (OCR). However, a critical distinction must be made: the accuracy of OCR technology varies dramatically when dealing with standard prose versus specialized scientific, technological, engineering, and mathematics (STEM) content.

### The Challenge of STEM Content

Standard open-source OCR engines like Tesseract, while excellent for general text, are notoriously unreliable for interpreting mathematical and chemical notation.10 For example, a standard OCR might misinterpret the integral symbol

∫ as a long 's', a fraction bar as a hyphen, or Greek letters like θ as the digit 9.12 Such errors would render the search functionality useless for a large portion of the Leaving Cert curriculum. A search for "integral" or "theta" would fail to find the relevant questions, severely degrading the user experience and undermining the platform's value as a study tool. Even advanced cloud services from major providers like Microsoft Azure and Google Cloud Vision have documented struggles with complex, inline mathematical formulas.12

### A Two-Tiered OCR Strategy

To balance cost and accuracy, a two-tiered approach to OCR is recommended. This strategy applies the right tool for the right job, ensuring high fidelity where it matters most.

1. **For Text-Heavy Subjects:** For subjects like English, History, Geography, and Business, which primarily consist of standard text, a high-performance, cost-effective cloud OCR service is the ideal choice. **Amazon Textract** is a strong contender, known for its ability to extract text, tables, and forms with high accuracy from scanned documents.13 It provides a reliable and scalable solution for the bulk of non-STEM subjects.
2. **For STEM Subjects:** For Mathematics, Applied Mathematics, Physics, Chemistry, and Computer Science (which involves code snippets), a specialized OCR API is not a luxury but a necessity.
    - **Mathpix:** This service is a market leader specifically for recognizing complex mathematical notation, including handwritten equations. It can output structured data formats like LaTeX, which is a perfect, unambiguous representation of mathematical formulas.17 Its Python SDK (
        
        mpxpy) simplifies integration, allowing the data pipeline to send an image and receive highly accurate, structured text in return.21
        
    - **Mistral OCR:** A newer, powerful competitor, Mistral OCR has shown in benchmarks to outperform even established players like Google and Microsoft, particularly in recognizing mathematical text and tables.23 It also provides structured output and has a Python SDK, making it another excellent choice for this task.25

### OCR Tool Comparison

The following table summarizes the trade-offs between different OCR solutions to aid in making an informed decision based on budget and quality requirements.

| Tool Name | Best For | Key Strengths | Key Weaknesses | Pricing Model | Implementation Complexity |
| --- | --- | --- | --- | --- | --- |
| **Tesseract** | Simple, offline, no-cost projects | Open-source, free, supports over 100 languages.11 | Poor accuracy on complex layouts, handwriting, and especially mathematical notation.13 | Free | Low (Python wrapper pytesseract is straightforward). |
| **Amazon Textract** | Text-heavy documents, forms, and tables | High accuracy on standard text and structured data; integrates well with other AWS services.15 | Not specialized for mathematical or chemical formulas; can struggle with complex scientific notation.28 | Pay-as-you-go (per page).28 | Medium (requires AWS account setup and using the AWS SDK). |
| **Google Vision API** | General-purpose image analysis and text extraction | High accuracy on a wide variety of images and text; low latency.14 | Similar to Textract, not optimized for complex math; Document AI is better but more complex.28 | Pay-as-you-go (per 1,000 pages).28 | Medium (requires Google Cloud project setup and client libraries). |
| **Mathpix** | Mathematical, scientific, and handwritten content | Industry-leading accuracy for math and science; outputs structured formats like LaTeX and MathML.17 | More expensive for general text; overkill for non-STEM subjects. | Subscription-based with API usage tiers. | Low (well-documented Python SDK available).18 |
| **Mistral OCR** | AI-driven, high-accuracy document understanding | Excellent benchmark performance, especially for math and tables; preserves document structure well.23 | Newer service, potentially less long-term community support than AWS/Google. | API usage-based pricing. | Low (official Python client library available).27 |

### Implementation with Mathpix

The data processing pipeline will be enhanced to include a function that calls the chosen specialized OCR API. The following Python code demonstrates how to use the mpxpy SDK to process one of the images generated in the previous section.

Python

import os

from mpxpy.mathpix_client import MathpixClient

def ocr_stem_image(image_path, app_id, app_key):

"""

Uses Mathpix to perform OCR on an image containing STEM content.

Returns the recognized text in Mathpix Markdown format.

"""

try:

client = MathpixClient(app_id=app_id, app_key=app_key)

# Process an image file

options = {

"formats": ["mmd"], # Request Mathpix Markdown format

}

result = client.image_new(file_path=image_path, options=options)

result.wait_until_complete(timeout=60) # Wait for processing

if result.mmd:

return result.to_mmd_text()

else:

print(f"OCR failed for {image_path}: {result.error}")

return None

except Exception as e:

print(f"An error occurred during OCR: {e}")

return None

# --- Example Usage ---

if __name__ == '__main__':

# These would be stored securely as environment variables

MATHPIX_APP_ID = os.environ.get("MATHPIX_APP_ID")

MATHPIX_APP_KEY = os.environ.get("MATHPIX_APP_KEY")

image_to_process = 'output/images/maths_h_2022_p1_q1a_question.png'

if os.path.exists(image_to_process) and MATHPIX_APP_ID and MATHPIX_APP_KEY:

ocr_text = ocr_stem_image(image_to_process, MATHPIX_APP_ID, MATHPIX_APP_KEY)

if ocr_text:

print("--- OCR Result ---")

print(ocr_text)

# This text would then be saved to the database

else:

print("Image file not found or Mathpix credentials not set.")

This function will be called within the main pipeline script for every question and marking scheme image from a STEM subject. The resulting high-fidelity text will be stored in the database, providing the foundation for a truly useful and reliable search feature.

## Section 4: Building the Topic-Question Map via Web Scraping

To accurately categorize each exam question, the most reliable and efficient method is to leverage the existing structure on studyclix.ie, which the project has the rights to use. Since the site does not provide a public API for developers, the necessary metadata must be collected through web scraping.29 This process will create a structured map that links every question to its corresponding topics.

### Technology Choice: BeautifulSoup

For this task, a combination of the requests library (for fetching web page content) and BeautifulSoup (for parsing the HTML) is the ideal choice.31 While more advanced frameworks like Scrapy are powerful for large-scale, complex crawling operations involving following many links,

BeautifulSoup offers a simpler, more direct approach that is perfectly suited for extracting data from a known set of pages.33 Its learning curve is gentler, making it a better fit for a project lead with limited hands-on development experience.

### Scraping Logic

The scraping script will execute a clear, methodical process to gather the required data:

1. **Identify Target URLs:** The script will need a list of all subject and topic pages to crawl. This can be pre-compiled by navigating the site manually or by writing a preliminary scraper to gather all topic links from each subject's main page. For example, it would start at the Leaving Cert Maths page and find the links to "Probability," "Algebra," "Trigonometry," etc.
2. **Inspect HTML Structure:** Before writing the code, the key is to use browser developer tools (usually accessed by right-clicking on a page element and selecting "Inspect") to understand the HTML structure of the target pages.35 By examining the
    
    studyclix.ie questions page (e.g., the Probability page from the query), one can identify the specific HTML tags and CSS classes that consistently contain the question information. For instance, each question might be wrapped in a <div> with a class like question-container, and within that, the question identifier ("2024 - Paper 2 - Question 2") might be in a <span> with a class of question-meta.
    
3. **Extract Metadata:** The Python script will loop through the target URLs. For each page, it will:
    - Use requests.get(url) to download the HTML content.
    - Create a BeautifulSoup object from the HTML text.
    - Use methods like soup.find_all('div', class_='question-container') to locate every question block on the page.38
    - Within each block, it will find and extract the text of the question identifier.

### Output and Integration

The scraper's final output will be a structured data file, such as a JSON or CSV. This file will serve as the master "instruction set" for the entire data pipeline. A JSON structure might look like this:

JSON

[

{

"subject": "Mathematics",

"level": "Higher",

"topic": "Probability",

"questions": [

"2024 - Paper 2 - Question 2",

"2023 - Paper 2 - Question 3",

...

]

},

{

"subject": "Mathematics",

"level": "Higher",

"topic": "Algebra - Quadratics",

"questions": [

"2022 - Paper 1 - Question 4",

"2021 - Paper 1 - Question 5",

...

]

}

]

This file will be the first thing the main data processing script reads. The script will then iterate through this structure, using the subject, level, and question identifier to locate the correct PDF and extract the content as detailed in Section 2.

### Annotated Python Script for Scraping

The following script provides a template for scraping a single topic page. This can be expanded into a full crawler that iterates over all subjects and topics.

Python

import requests

from bs4 import BeautifulSoup

import json

def scrape_topic_page(url):

"""

Scrapes a single StudyClix topic page to extract question identifiers.

NOTE: The CSS selectors used here are hypothetical and MUST be updated

by inspecting the actual HTML of studyclix.ie.

"""

try:

response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})

response.raise_for_status() # Raise an exception for bad status codes

soup = BeautifulSoup(response.text, 'html.parser')

# --- These selectors are examples. They must be verified. ---

# Find the topic name from an H1 tag, for example.

topic_name = soup.find('h1').get_text(strip=True) if soup.find('h1') else 'Unknown Topic'

# Find all question containers.

# This is the most critical selector to get right.

question_containers = soup.find_all('div', class_='question-item-container') # Hypothetical class

question_identifiers =

for container in question_containers:

# Find the element containing the question identifier text.

meta_element = container.find('span', class_='question-meta-data') # Hypothetical class

if meta_element:

identifier = meta_element.get_text(strip=True)

question_identifiers.append(identifier)

return {

"topic": topic_name,

"url": url,

"questions": question_identifiers

}

except requests.exceptions.RequestException as e:

print(f"Error fetching URL {url}: {e}")

return None

# --- Example Usage ---

if __name__ == '__main__':

# URL from the user query

probability_url = 'https://www.studyclix.ie/leaving-certificate/mathematics/higher/probability/questions'

scraped_data = scrape_topic_page(probability_url)

if scraped_data:

print(f"Scraped {len(scraped_data['questions'])} questions for topic: {scraped_data['topic']}")

# Save the output to a JSON file

with open('scraped_probability_questions.json', 'w') as f:

json.dump(scraped_data, f, indent=2)

print("Data saved to scraped_probability_questions.json")

This systematic scraping process ensures that every question is categorized accurately according to a trusted source, forming the reliable foundation upon which the rest of the application is built.

### **Part II: Backend Architecture and Implementation with Supabase**

With the data extraction and categorization pipeline established, the next phase is to build a robust and performant backend to store, manage, and serve this content. Supabase, with its PostgreSQL foundation and suite of integrated tools, provides an excellent platform for this. This part details the design of the database schema, the implementation of powerful search and filtering capabilities, and a professional strategy for managing the image assets.

## Section 5: Designing a Scalable Database Schema

A well-designed database schema is the bedrock of any scalable application. It ensures data integrity, optimizes query performance, and simplifies development. For the "addy" platform, a relational schema is essential, particularly for handling the relationship between questions and topics correctly.

### The Importance of a Many-to-Many Relationship

A core requirement of the platform is that a single exam question can be associated with multiple topics. For example, a calculus question might fall under both "Differentiation - Rules" and "Differentiation - Applications." Simultaneously, a single topic will contain many questions. This is a classic **many-to-many** relationship.

Attempting to model this by storing a list or array of topic names within the questions table would be a significant architectural mistake. While possible in PostgreSQL, it violates database normalization principles, makes querying inefficient (especially for filtering), and complicates data maintenance.

The correct and standard approach is to use a third table, often called a **join table** or **junction table**.40 This table, which we will name

question_topics, exists solely to connect the questions table and the topics table. Each row in question_topics will contain a foreign key to a question (question_id) and a foreign key to a topic (topic_id), creating an explicit link between the two. This design is highly efficient, easily indexable, and is automatically understood by Supabase's data APIs, which can intelligently resolve these joins for you.42

### Proposed Database Schema

The following schema is designed for clarity, performance, and scalability. It organizes the data into logical entities, establishing clear relationships between them. Supabase Studio provides a visual schema designer that can be used to create this structure without writing SQL, but the CREATE TABLE statements are also provided for clarity and reproducibility.40

**Database Schema Definition**

| Table Name | Column Name | Data Type | Constraints / Description |
| --- | --- | --- | --- |
| **subjects** | id | bigint | Primary Key, Generated always as identity |
|  | name | text | Not Null, Unique (e.g., "Mathematics", "Biology") |
| **topics** | id | bigint | Primary Key, Generated always as identity |
|  | name | text | Not Null (e.g., "Probability", "Algebra - Quadratics") |
|  | subject_id | bigint | Foreign Key -> subjects.id |
| **papers** | id | bigint | Primary Key, Generated always as identity |
|  | subject_id | bigint | Foreign Key -> subjects.id |
|  | year | integer | Not Null (e.g., 2023) |
|  | level | text | Not Null (e.g., "Higher", "Ordinary") |
|  | paper_number | integer | Nullable (e.g., 1, 2) |
| **questions** | id | uuid | Primary Key, default uuid_generate_v4() |
|  | paper_id | bigint | Foreign Key -> papers.id |
|  | question_identifier | text | Not Null, Unique (e.g., "2022_P1_Q4a") |
|  | ocr_text_question | text | Full OCR'd text of the question. |
|  | ocr_text_scheme | text | Full OCR'd text of the marking scheme. |
|  | image_url_question | text | URL to the hosted question image (e.g., on Cloudinary). |
|  | image_url_scheme | text | URL to the hosted marking scheme image. |
|  | marks | integer | Total marks for the question. |
| **question_topics** | id | bigint | Primary Key, Generated always as identity |
|  | question_id | uuid | Foreign Key -> questions.id |
|  | topic_id | bigint | Foreign Key -> topics.id |
|  | (Composite Unique) |  | UNIQUE (question_id, topic_id) |
| **user_progress** | id | bigint | Primary Key, Generated always as identity |
|  | user_id | uuid | Foreign Key -> auth.users.id |
|  | question_id | uuid | Foreign Key -> questions.id |
|  | status | text | e.g., "completed", "incomplete" |
|  | (Composite Unique) |  | UNIQUE (user_id, question_id) |

### SQL CREATE TABLE Statements

SQL

- - subjects table

CREATE TABLE public.subjects (

id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

name text NOT NULL UNIQUE

);

-- topics table

CREATE TABLE public.topics (

id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

name text NOT NULL,

subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE

);

-- papers table

CREATE TABLE public.papers (

id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,

year integer NOT NULL,

level text NOT NULL,

paper_number integer

);

-- questions table

CREATE TABLE public.questions (

id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

paper_id bigint NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,

question_identifier text NOT NULL UNIQUE,

ocr_text_question text,

ocr_text_scheme text,

image_url_question text,

image_url_scheme text,

marks integer

);

-- The critical many-to-many join table

CREATE TABLE public.question_topics (

id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,

topic_id bigint NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,

UNIQUE (question_id, topic_id)

);

-- Table for tracking user progress

CREATE TABLE public.user_progress (

id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,

status text NOT NULL DEFAULT 'incomplete',

UNIQUE (user_id, question_id)

);

This schema provides a clean, normalized, and relational structure that will serve as a robust foundation for all application features.

## Section 6: Implementing Powerful Search and Filtering

With a well-structured database, the next step is to implement the core data retrieval mechanisms that will power the user experience: keyword search and topic-based filtering. Supabase provides powerful tools built on top of PostgreSQL to handle both of these requirements efficiently.

### Keyword Search with Full-Text Search (FTS)

To implement a fast and flexible keyword search, we will utilize PostgreSQL's built-in Full-Text Search (FTS) capabilities.45 FTS is far more powerful than simple

LIKE queries because it understands language semantics, such as stemming (searching for "run" will also match "running" and "ran") and ranking, and it is highly optimized for performance.

**Implementation Steps:**

1. **Create a tsvector Column:** The first step is to add a special column of type tsvector to the questions table. This column will store a pre-processed, searchable representation of the text content. We will combine the text from both the question and its marking scheme into this single vector for comprehensive searching.46
    
    SQL
    
    -- Add the tsvector column to the questions table
    
    ALTER TABLE public.questions
    
    ADD COLUMN fts tsvector
    
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(ocr_text_question, '') |
    

| ' ' |

| coalesce(ocr_text_scheme, ''))) STORED;

```

This SQL command creates a generated column fts that automatically updates whenever the ocr_text_question or ocr_text_scheme fields change. to_tsvector('english',...) processes the text using the English language dictionary for stemming and stop-word removal.

1. **Create a GIN Index:** To make searches on the tsvector column extremely fast, we must create a Generalized Inverted Index (GIN) on it.47
    
    SQL
    
    -- Create a GIN index on the new fts column
    
    CREATE INDEX questions_fts_idx ON public.questions USING gin(fts);
    
2. **Querying from the Frontend:** With the backend set up, the Next.js application can perform searches using the textSearch method from the Supabase JavaScript client. This method handles the conversion of the user's search query into a tsquery and uses the @@ match operator behind the scenes.48
    
    JavaScript
    
    // Example in a Next.js Server Component or API route
    
    import { createClient } from '@/utils/supabase/server';
    
    async function searchQuestions(searchTerm) {
    
    const supabase = createClient();
    
    // Example: find questions containing "ecology" AND "definition"
    
    const formattedQuery = searchTerm.split(' ').join(' & ');
    
    const { data, error } = await supabase
    
    .from('questions')
    
    .select(`
    
    id,
    
    question_identifier,
    
    image_url_question,
    
    image_url_scheme
    
    `)
    
    .textSearch('fts', formattedQuery);
    
    if (error) {
    
    console.error('Search error:', error);
    
    return;
    
    }
    
    return data;
    
    }
    

### Efficient Multi-Topic Filtering

A more complex challenge is filtering for questions that belong to *multiple* selected topics simultaneously (e.g., find questions tagged with both "Algebra" AND "Functions"). Performing this type of query efficiently requires moving beyond simple SELECT statements on the client side. The best approach is to encapsulate the complex logic within a PostgreSQL function, which can then be called as a Remote Procedure Call (RPC) from the application.46

**Implementation Steps:**

1. **Create a PostgreSQL Function (RPC):** This function will accept an array of topic_ids as input and return a set of questions that are associated with *all* of those topics. It uses a GROUP BY clause on the question_id and a HAVING clause to ensure the count of matching topics equals the number of topics requested.51
    
    SQL
    
    CREATE OR REPLACE FUNCTION get_questions_by_topics(topic_ids bigint)
    
    RETURNS SETOF questions AS $$
    
    BEGIN
    
    RETURN QUERY
    
    SELECT q.*
    
    FROM questions q
    
    JOIN question_topics qt ON q.id = qt.question_id
    
    WHERE qt.topic_id = ANY(topic_ids)
    
    GROUP BY q.id
    
    HAVING COUNT(DISTINCT qt.topic_id) = array_length(topic_ids, 1);
    
    END;
    
    $$ LANGUAGE plpgsql;
    
2. **Calling the RPC from the Frontend:** The Next.js application can now call this function easily using the supabase.rpc() method. This keeps the frontend code clean and delegates the heavy lifting of the query to the database, which is optimized for such tasks.
    
    JavaScript
    
    // Example in a Next.js component
    
    import { createClient } from '@/utils/supabase/client';
    
    async function filterByTopics(selectedTopicIds) {
    
    const supabase = createClient();
    
    // selectedTopicIds would be an array like
    
    const { data, error } = await supabase
    
    .rpc('get_questions_by_topics', { topic_ids: selectedTopicIds });
    
    if (error) {
    
    console.error('Filter error:', error);
    
    return;
    
    }
    
    return data;
    
    }
    

By combining PostgreSQL's native FTS for keyword search and RPCs for complex relational filtering, the "addy" platform can provide a fast, responsive, and powerful data exploration experience for its users.

## Section 7: A Professional Strategy for Image Asset Management

The "smart screenshot" engine will generate thousands of high-resolution images of questions and marking schemes. How these images are stored, optimized, and delivered to the user is a critical architectural decision that directly impacts application performance, user experience, and development complexity. While Supabase Storage is a viable option for general file storage, a specialized digital asset management (DAM) service like **Cloudinary** offers significant advantages that are purpose-built for this type of media-heavy application.

### Offloading Image Handling to a Specialized Service

Using a dedicated service like Cloudinary is recommended over self-hosting the images in Supabase Storage for several key reasons:

1. **Automatic Optimization and Transformation:** Cloudinary can automatically perform crucial optimizations on the fly. When an image is requested, it can be resized to fit the user's screen, compressed to reduce file size without sacrificing visual quality, and converted to modern, efficient formats like WebP or AVIF.52 Achieving this level of optimization manually would require significant development effort, including setting up serverless functions and image processing libraries.
2. **Global Content Delivery Network (CDN):** Cloudinary serves all assets through a global CDN.54 This means that when a user in another country requests an image, it is delivered from a server geographically close to them, drastically reducing latency and improving page load times. While Supabase also uses a CDN, Cloudinary's is specifically optimized for media delivery.
3. **Simplified Development Workflow:** The development workflow becomes much simpler. The data pipeline uploads a single, high-resolution master image to Cloudinary once. The frontend application then only needs to append URL parameters to request different versions (e.g., a thumbnail for the list view, a full-size version for the detail view). This eliminates the need for any image processing logic in the backend or frontend code.52
4. **Advanced Features:** Cloudinary offers a vast suite of additional features, such as adding watermarks, applying AI-based effects, and analyzing image content, which could be leveraged for future enhancements to the platform.53

### Implementation with Cloudinary

The integration of Cloudinary into the data pipeline is straightforward.

1. **Setup:** Create a free Cloudinary account and obtain the cloud_name, api_key, and api_secret from the dashboard. These credentials should be stored securely as environment variables.
2. **Python SDK Integration:** The Python script from the data pipeline will be modified to upload the generated PNG images directly to Cloudinary using their official Python SDK. The library can be installed with pip install cloudinary.
3. **Upload and Store URL:** After each image is generated by PyMuPDF, the script will call cloudinary.uploader.upload(). This method sends the image to Cloudinary and returns a JSON response containing a secure, permanent URL for the asset.56 This URL is the only piece of information that needs to be stored in the
    
    image_url_question and image_url_scheme columns of the questions table in Supabase.
    

### Annotated Python Script for Uploading

The following snippet shows how the extract_question_as_image function from Section 2 can be modified to upload to Cloudinary instead of saving locally.

Python

import cloudinary

import cloudinary.uploader

import os

import fitz # PyMuPDF

# --- Configure Cloudinary at the start of your script ---

cloudinary.config(

cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME"),

api_key = os.environ.get("CLOUDINARY_API_KEY"),

api_secret = os.environ.get("CLOUDINARY_API_SECRET"),

secure = True

)

def extract_and_upload_question(pdf_path, page_num, start_anchor, end_anchor, public_id):

"""

Extracts a question, uploads it to Cloudinary, and returns the secure URL.

"""

try:

doc = fitz.open(pdf_path)

page = doc.load_page(page_num - 1)

clip_rect = find_question_bounds(page, start_anchor, end_anchor) # Using function from Sec 2

if clip_rect:

zoom_matrix = fitz.Matrix(3, 3) # High DPI for quality

pix = page.get_pixmap(matrix=zoom_matrix, clip=clip_rect)

image_bytes = pix.tobytes("png") # Get image data as bytes

# Upload the image bytes to Cloudinary

upload_result = cloudinary.uploader.upload(

image_bytes,

public_id=public_id,

overwrite=True,

resource_type="image"

)

print(f"Successfully uploaded {public_id} to Cloudinary.")

return upload_result.get('secure_url')

else:

print(f"Could not find anchor '{start_anchor}' on page {page_num}")

return None

except Exception as e:

print(f"An error occurred during extraction/upload: {e}")

return None

finally:

if 'doc' in locals() and doc:

doc.close()

# --- Example Usage in the main pipeline ---

# The pipeline would generate a unique public_id for each asset, e.g.:

# 'maths_h_2022_p1_q1a_question'

# It would then call the function and store the returned URL in the database.

By adopting this professional asset management strategy, the "addy" platform will be faster, more scalable, and simpler to maintain, allowing development to focus on core educational features rather than infrastructure.

### **Part III: Frontend Development with Next.js and React**

This part outlines the development of the user-facing application using the Next.js framework. It covers structuring the project, connecting to the Supabase backend, building the core user interface components as depicted in the wireframes, and implementing personalization features like user authentication and progress tracking.

## Section 8: Structuring the Next.js Application

A well-organized Next.js project is crucial for maintainability and scalability. The recommended approach is to leverage the official with-supabase template and the modern App Router, which provides a solid foundation for server-side rendering, client-side interactivity, and secure authentication.

### Initial Project Setup

The project should be initialized using the create-next-app command with the Supabase template. This automates much of the initial configuration.59

Bash

npx create-next-app@latest my-addy-app --example with-supabase

cd my-addy-app

This template pre-configures:

- **TypeScript:** For type safety and improved developer experience.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **Supabase Client Libraries:** Includes @supabase/supabase-js and the essential @supabase/ssr for server-side authentication.
- **Environment Variables:** Sets up a .env.local.example file for storing Supabase API keys securely.

### Supabase Client Configuration

The @supabase/ssr package is designed to handle user sessions securely in a server-rendered Next.js environment.60 It enables the creation of two types of Supabase clients:

1. **Server Client:** Used in Server Components, API Routes, and Server Actions. This client is created on-demand for each request and reads the user's session from encrypted cookies. The template typically provides a helper function in utils/supabase/server.ts for this purpose.
2. **Client Component Client:** Used in components that run in the browser (marked with "use client"). This is a singleton client that manages the session on the client side. The template provides a helper for this in utils/supabase/client.ts.

This dual-client setup is fundamental to working with Supabase in the Next.js App Router and is handled correctly by the starter template.

### Recommended Project Organization

A logical folder structure will make the codebase easier to navigate and manage as the application grows. The following structure within the app directory is recommended:

app/

├── (auth)/ # Route group for auth pages (login, signup)

│ └── login/

│ └── page.tsx

├── (main)/ # Route group for the main app layout

│ ├── [subject]/

│ │ └── [topic]/

│ │ └── page.tsx # The main question list view

│ ├── layout.tsx # Main layout with sidebar

│ └── page.tsx # Homepage/dashboard

├── api/ # For any custom API routes

│ └──...

├── components/ # Reusable React components

│ ├── ui/ # Generic UI elements (Button, Card, etc.)

│ ├── layout/ # Layout components (Sidebar, Navbar)

│ └── questions/ # Components specific to questions (QuestionCard, FilterPanel)

├── lib/ # Helper functions, constants, type definitions

│ └── types.ts # TypeScript type definitions for database tables

├── utils/ # Utility functions (e.g., Supabase clients)

│ ├── supabase/

│ │ ├── client.ts

│ │ └── server.ts

│ └──...

└── layout.tsx # Root layout

└── globals.css

This structure separates concerns, with route groups (auth) and (main) managing different layouts, a centralized components directory for UI elements, and a lib folder for shared logic and types.

## Section 9: Building the Core User Interface

This section provides architectural patterns and code strategies for building the key UI elements from the wireframes, focusing on data fetching and state management.

### The Filter Sidebar

The sidebar (as seen in Image 1) is the primary navigation and filtering tool. It needs to be dynamic and responsive to user input.

- **Data Fetching:** The list of subjects and their corresponding topics should be fetched from the Supabase database. This can be done in the layout.tsx file for the (main) route group, making the data available to all pages within that layout.
    
    TypeScript
    
    // In app/(main)/layout.tsx
    
    import { createClient } from '@/utils/supabase/server';
    
    import Sidebar from '@/components/layout/Sidebar';
    
    export default async function MainLayout({ children }) {
    
    const supabase = createClient();
    
    const { data: subjects } = await supabase
    
    .from('subjects')
    
    .select(`*, topics (*)`); // Fetch subjects and their nested topics
    
    return (
    
    <div className="flex">
    
    <Sidebar subjects={subjects ||} />
    
    <main className="flex-1 p-8">{children}</main>
    
    </div>
    
    );
    
    }
    
- **State Management:** The state of the selected filters (topics, years, etc.) should be managed within a client component ("use client"). To make the application state shareable and bookmarkable, the filter criteria should be stored in the URL's query parameters. The useRouter and useSearchParams hooks from next/navigation are used for this. When a user checks a topic checkbox, the component updates the URL, which in turn triggers a re-fetch of the data on the page.

### The Question List

The main content area (Image 2) displays the list of questions that match the current filters.

- **Data Fetching Logic:** The page component (e.g., app/(main)/[subject]/[topic]/page.tsx) will be a Server Component. It will read the filter parameters from the URL (provided by Next.js as searchParams), call the appropriate Supabase function (.rpc() for multi-topic filters or .textSearch() for search), and pass the resulting data to a client component for rendering.
    
    TypeScript
    
    // In app/(main)/[subject]/[topic]/page.tsx
    
    import { get_questions_by_topics } from '@/lib/data-access'; // A helper function for the RPC call
    
    export default async function QuestionListPage({ searchParams }) {
    
    const selectedTopicIds = searchParams.topics?.split(',') ||;
    
    // Fetch data based on URL parameters
    
    const questions = await get_questions_by_topics(selectedTopicIds);
    
    return (
    
    <div>
    
    <h1>{questions.length} Questions Found</h1>
    
    <QuestionListClient questions={questions} />
    
    </div>
    
    );
    
    }
    
- **Display and Pagination:** The QuestionListClient component will map over the questions array and render each question's image (using the Cloudinary URL). To handle potentially hundreds of questions, pagination or an "infinite scroll" mechanism should be implemented. Supabase's .range(from, to) modifier can be used to fetch data in chunks.

### The Detailed Question View

This view (Image 1) displays a single question and its marking scheme.

- **Component Structure:** This will be a client component to handle the interactive "Show marking scheme" button.
- **State Management:** A simple useState hook can manage the visibility of the marking scheme.
    
    TypeScript
    
    // In a component like QuestionView.tsx
    
    'use client';
    
    import { useState } from 'react';
    
    import Image from 'next/image'; // For optimized images
    
    export default function QuestionView({ question }) {
    
    const = useState(false);
    
    return (
    
    <div>
    
    {/* Question Image */}
    
    <Image src={question.image_url_question} alt="Exam Question" width={800} height={600} />
    
    <button onClick={() => setShowScheme(!showScheme)}>
    
    {showScheme? 'Hide marking scheme' : 'Show marking scheme'}
    
    </button>
    
    {/* Marking Scheme, conditionally rendered */}
    
    {showScheme && (
    
    <div className="marking-scheme">
    
    <Image src={question.image_url_scheme} alt="Marking Scheme" width={800} height={600} />
    
    {/* Also display ocr_text_scheme for accessibility and searchability */}
    
    <p>{question.ocr_text_scheme}</p>
    
    </div>
    
    )}
    
    </div>
    
    );
    
    }
    

This component-based architecture, combining Server Components for data fetching and Client Components for interactivity, aligns with modern Next.js best practices and provides a performant and maintainable frontend.

## Section 10: Enabling User Personalization

To elevate the platform from a simple question bank to a personalized study tool, user-specific features are essential. The "Mark as complete" functionality is a prime example. This requires user authentication and a secure way to store user-specific data.

### Authentication with Supabase Auth

Supabase Auth provides a complete solution for user management, including sign-up, login, and session handling, which integrates seamlessly with Next.js.60

- **Setup:** The with-supabase Next.js template already includes the necessary middleware and API routes for handling authentication flows like email/password login, magic links, and social logins (e.g., Google).60 The primary setup involves configuring the desired authentication providers in the Supabase Dashboard.
- **Login/Signup UI:** A login page (e.g., app/(auth)/login/page.tsx) will contain a form that calls the server actions for signIn or signUp provided by the Supabase helper libraries. These actions securely handle the communication with the Supabase Auth backend.

### "Mark as Complete" Feature

This feature allows a logged-in user to track their progress.

- **Backend Logic:** The user_progress table in the database (defined in Section 5) is designed for this purpose. When a user clicks the "Mark as complete" button, a function on the frontend will make an API call to Supabase to either insert a new row into this table or update an existing one for that specific user_id and question_id.
    
    JavaScript
    
    // Client-side function to update progress
    
    import { createClient } from '@/utils/supabase/client';
    
    async function markQuestionAsComplete(questionId, userId) {
    
    const supabase = createClient();
    
    const { data, error } = await supabase
    
    .from('user_progress')
    
    .upsert({
    
    user_id: userId,
    
    question_id: questionId,
    
    status: 'completed'
    
    }, {
    
    onConflict: 'user_id, question_id' // If a row already exists, it will be updated
    
    });
    
    if (error) {
    
    console.error('Failed to update progress:', error);
    
    } else {
    
    // Revalidate data or update UI state to show completion
    
    }
    
    }
    
- **Row Level Security (RLS):** This is the most critical security aspect of the feature. Without RLS, any user could potentially view or modify the progress of any other user. RLS enforces rules at the database level, ensuring data is only accessible by authorized users.59
    
    The following SQL policies must be enabled on the user_progress table in the Supabase SQL Editor:
    
    SQL
    
    -- 1. Enable RLS on the table
    
    ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
    
    -- 2. Create a policy to allow users to view their OWN progress
    
    CREATE POLICY "Users can view their own progress"
    
    ON public.user_progress FOR SELECT
    
    USING (auth.uid() = user_id);
    
    -- 3. Create a policy to allow users to insert/update their OWN progress
    
    CREATE POLICY "Users can insert or update their own progress"
    
    ON public.user_progress FOR ALL
    
    USING (auth.uid() = user_id)
    
    WITH CHECK (auth.uid() = user_id);
    
    The auth.uid() function is a special Supabase function that returns the ID of the currently authenticated user making the request. These policies guarantee that data access is securely confined to the individual user.
    
- **Frontend UI:** The question component will check if a progress record exists for the current user and question. If it does, it can display the "Done" checkmark as seen in Image 2. The "Mark as complete" button will call the markQuestionAsComplete function. This creates a seamless feedback loop for the user, powered by a secure and robust backend implementation.

### **Part IV: Synthesis and Strategic Roadmap**

This final part consolidates the detailed technical plans into an actionable development strategy. It outlines a phased approach for building the Minimum Viable Product (MVP) and discusses how the chosen architecture is designed for future growth and scalability.

## Section 11: A Phased MVP Development Plan

To manage complexity and ensure a focused development process, the project should be broken down into distinct, sequential phases. This approach allows for iterative progress and testing at each stage, reducing risk and building momentum.

### Phase 1: Data Pipeline Construction (The Foundation)

This is the most critical and foundational phase. The goal is to create the complete, automated pipeline that processes the raw PDFs into the necessary data and assets.

1. **Environment Setup:** Configure a Python development environment with all required libraries: PyMuPDF, requests, beautifulsoup4, cloudinary, and the SDK for the chosen specialized OCR service (e.g., mpxpy for Mathpix).
2. **Metadata Scraper:** Build and thoroughly test the studyclix.ie web scraper (Section 4). Run it to generate the complete topic-question map as a JSON or CSV file. This file is the master manifest for the entire pipeline.
3. **"Smart Screenshot" Engine:** Develop the core PDF parsing script using PyMuPDF (Section 2). Test it rigorously on a variety of exam papers (different years, subjects, layouts) to fine-tune the heuristics for defining question boundaries.
4. **Asset Management Integration:** Create a Cloudinary account and integrate the cloudinary.uploader into the pipeline script (Section 7). Ensure that generated images are successfully uploaded and their secure URLs are captured.
5. **Specialized OCR Integration:** Set up an account with the chosen STEM OCR provider (e.g., Mathpix). Integrate the API calls into the pipeline (Section 3). Implement the two-tiered logic: use the specialized OCR for STEM subjects and a standard cloud OCR (or skip OCR initially for text-heavy subjects to save cost) for others.
6. **Full Pipeline Execution:** Run the complete, end-to-end pipeline for a single subject (e.g., Higher Level Mathematics) to generate all question images, marking scheme images, and their corresponding OCR'd text. Verify the output for accuracy and completeness.

### Phase 2: Backend and Database Setup

With a sample of processed data ready, the backend can be constructed.

1. **Create Supabase Project:** Initialize a new project in the Supabase Dashboard.
2. **Implement Schema:** Using the Supabase SQL Editor, execute the CREATE TABLE statements from Section 5 to build the full database schema.
3. **Data Ingestion:** Write a separate Python script to read the output from the Phase 1 pipeline and perform a bulk insert into the corresponding Supabase tables (subjects, topics, papers, questions, question_topics).
4. **Configure Search and Filters:** In the Supabase SQL Editor, add the tsvector column and GIN index for Full-Text Search. Create the PostgreSQL function (RPC) required for multi-topic filtering (Section 6).

### Phase 3: Core Frontend Implementation

This phase focuses on building the non-authenticated user experience.

1. **Initialize Next.js Project:** Set up the Next.js application using the with-supabase template and connect it to the Supabase project via environment variables (Section 8).
2. **Build Layout and Sidebar:** Create the main application layout, including the dynamic filter sidebar that fetches subjects and topics from the database.
3. **Build Question Views:** Develop the components for the question list and the detailed question view (Section 9).
4. **Implement Filtering and Search:** Wire up the frontend components to the backend. Implement the client-side logic that updates the URL based on filter selections and calls the appropriate Supabase queries (RPC for topics, textSearch for keywords). Ensure the UI updates correctly with the fetched data.

### Phase 4: User Features and Deployment

The final phase adds personalization and prepares the application for launch.

1. **Implement Authentication:** Configure Supabase Auth and build the login, sign-up, and sign-out flows (Section 10).
2. **Build "Mark as Complete" Feature:** Implement the frontend button and the backend logic to update the user_progress table. Crucially, apply and test the Row Level Security policies to ensure data privacy.
3. **Deployment:** Deploy the Next.js application to a suitable hosting provider like Vercel, which is optimized for Next.js and integrates seamlessly with GitHub for continuous deployment.
4. **Full Data Load:** Once the MVP is stable and deployed, run the data pipeline for all remaining subjects to fully populate the database.

## Section 12: Future-Proofing and Scaling Your Platform

The technical architecture outlined in this report is not just for the MVP; it is designed with future growth and scalability in mind.

### Scalability

The chosen technology stack is inherently scalable:

- **Asset Delivery:** By offloading all image handling to **Cloudinary**, the application is prepared for high traffic. Cloudinary's CDN and transformation engine will handle the load of serving millions of image requests without any strain on the application's own infrastructure.54
- **Database:** **Supabase** runs on AWS and offers scalable PostgreSQL databases. As the user base and data volume grow, the database instance can be upgraded with minimal downtime. The use of proper indexing and efficient RPCs ensures that query performance remains high.
- **Application Hosting:** Deploying the Next.js application to a serverless platform like **Vercel** means the application can automatically scale to handle traffic spikes. There is no need to manually provision or manage servers.

### Future Features

The current database schema provides a strong foundation for a wide range of future enhancements that can increase the platform's value:

- **User-Generated Content:** A user_notes table could be added, linked to both user_id and question_id, allowing students to add their own notes or alternative solutions to questions.
- **Custom Mock Exams:** A feature could be built to allow users to select a set of questions (based on topics or keywords) and generate a custom "exam paper." The user_progress table could be extended to track performance on these custom tests.
- **Advanced Analytics:** By analyzing aggregated, anonymized data from the user_progress table, the platform could provide insights into which topics or specific questions students find most difficult, creating valuable feedback for both students and teachers.
- **Expansion:** The schema, particularly the subjects table, makes it straightforward to expand the platform to include other exam systems, such as the Junior Cycle, or even international curricula, by simply adding new subjects and running the data pipeline on the new source material.

### Cost Management

As the platform grows, the primary operational costs will be driven by:

1. **Specialized OCR API Calls:** This is likely to be a significant upfront cost during the initial data ingestion phase. Once all past papers are processed, this cost becomes negligible until new papers are released.
2. **Cloudinary:** Costs are based on storage, transformations, and bandwidth. Cloudinary's optimizations (like serving smaller, cached images) naturally help control bandwidth costs.
3. **Supabase:** Costs are based on database size, API requests, and compute usage. The free and pro tiers are generous for starting out, and costs will scale predictably with user growth.

By making strategic choices—such as using a two-tiered OCR approach and offloading media to a specialized service—this architecture provides a cost-effective yet powerful foundation for building a successful and lasting educational technology platform.

### Works cited

1. Find the bounds of a text string in a PDF using Python | YellowDuck.be, accessed on July 11, 2025, https://www.yellowduck.be/posts/find-the-bounds-of-a-text-string-in-a-pdf-using-python
2. Text - PyMuPDF 1.26.3 documentation, accessed on July 11, 2025, https://pymupdf.readthedocs.io/en/latest/recipes-text.html
3. Appendix 1: Details on Text Extraction - PyMuPDF 1.26.3 documentation, accessed on July 11, 2025, https://pymupdf.readthedocs.io/en/latest/app1.html
4. The Basics - PyMuPDF 1.26.3 documentation, accessed on July 11, 2025, https://pymupdf.readthedocs.io/en/latest/the-basics.html
5. Get text from coordinates · pymupdf PyMuPDF · Discussion #2128 - GitHub, accessed on July 11, 2025, https://github.com/pymupdf/PyMuPDF/discussions/2128
6. Tutorial - PyMuPDF 1.26.3 documentation, accessed on July 11, 2025, https://pymupdf.readthedocs.io/en/latest/tutorial.html
7. Images - PyMuPDF 1.26.3 documentation, accessed on July 11, 2025, https://pymupdf.readthedocs.io/en/latest/recipes-images.html
8. Extracting Tables from PDFs with PyMuPDF - Artifex Software, accessed on July 11, 2025, https://artifex.com/blog/extracting-tables-from-pdfs-with-pymupdf
9. How do I extract a table from a pdf file using pymupdf [closed] - Stack Overflow, accessed on July 11, 2025, https://stackoverflow.com/questions/56155676/how-do-i-extract-a-table-from-a-pdf-file-using-pymupdf
10. Top 8 OCR Libraries in Python to Extract Text from Image - Analytics Vidhya, accessed on July 11, 2025, https://www.analyticsvidhya.com/blog/2024/04/ocr-libraries-in-python/
11. Top 7 Python OCR Libraries for Text Extraction from Images - Tecmint, accessed on July 11, 2025, https://www.tecmint.com/python-text-extraction-from-images/
12. OCR issues extracting math formulas with Document Intelligence - Microsoft Q&A, accessed on July 11, 2025, https://learn.microsoft.com/en-us/answers/questions/2260900/ocr-issues-extracting-math-formulas-with-document
13. Our search for the best OCR tool in 2023, and what we found - Source - OpenNews, accessed on July 11, 2025, https://source.opennews.org/articles/our-search-best-ocr-tool-2023/
14. OCR With Google AI, accessed on July 11, 2025, https://cloud.google.com/use-cases/ocr
15. Intelligently Extract Text & Data with OCR - Amazon Textract, accessed on July 11, 2025, https://aws.amazon.com/textract/
16. 9 Best OCR Tools in 2025 – My Top Picks After Testing - G2 Learning Hub, accessed on July 11, 2025, https://learn.g2.com/best-ocr-software
17. Handwriting Recognition - Mathpix, accessed on July 11, 2025, https://mathpix.com/handwriting-recognition
18. Mathpix Python SDK Overview, accessed on July 11, 2025, https://mathpix.com/docs/mpxpy
19. Introduction – Mathpix API v3 Reference, accessed on July 11, 2025, https://docs.mathpix.com/
20. OCR lib for math formulas - Stack Overflow, accessed on July 11, 2025, https://stackoverflow.com/questions/3570220/ocr-lib-for-math-formulas
21. Available Output Formats in Mathpix Python SDK, accessed on July 11, 2025, https://mathpix.com/docs/mpxpy/formats
22. Processing PDFs with Mathpix Python SDK, accessed on July 11, 2025, https://mathpix.com/docs/mpxpy/pdf
23. Mistral AI Launches Best-in-Class OCR API: An Overview - Parsio, accessed on July 11, 2025, https://parsio.io/blog/what-is-mistral-ocr/
24. mistral-ocr-latest - AI/ML API Documentation, accessed on July 11, 2025, https://docs.aimlapi.com/api-references/vision-models/ocr-optical-character-recognition/mistral-ai/mistral-ocr-latest
25. mistral-ocr-parser - PyPI, accessed on July 11, 2025, https://pypi.org/project/mistral-ocr-parser/
26. A Step-by-Step Guide to Using Mistral OCR - Cohorte Projects, accessed on July 11, 2025, https://www.cohorte.co/blog/a-step-by-step-guide-to-using-mistral-ocr
27. client-python/docs/sdks/ocr/README.md at main - GitHub, accessed on July 11, 2025, https://github.com/mistralai/client-python/blob/main/docs/sdks/ocr/README.md
28. AWS vs Google Vision (OCR Features Comparison) | IronOCR - Iron Software, accessed on July 11, 2025, https://ironsoftware.com/csharp/ocr/blog/compare-to-other-components/aws-vs-google-vision-comparison/
29. FAQs - Studyclix, accessed on July 11, 2025, https://www.studyclix.ie/faqs
30. Studyclix: Home, accessed on July 11, 2025, https://www.studyclix.ie/
31. A guide to web scraping in Python using Beautiful Soup - Opensource.com, accessed on July 11, 2025, https://opensource.com/article/21/9/web-scraping-python-beautiful-soup
32. Beautiful Soup: Web Scraping with Python - SerpApi, accessed on July 11, 2025, https://serpapi.com/blog/beautiful-soup-build-a-web-scraper-with-python/
33. Scrapy Tutorial — Scrapy 2.13.3 documentation, accessed on July 11, 2025, https://docs.scrapy.org/en/latest/intro/tutorial.html
34. Scrapy, accessed on July 11, 2025, https://www.scrapy.org/
35. Beautiful Soup Tutorial - How to Parse Web Data With Python - Oxylabs, accessed on July 11, 2025, https://oxylabs.io/blog/beautiful-soup-parsing-tutorial
36. Web Scraping with Beautiful Soup - Pluralsight, accessed on July 11, 2025, https://www.pluralsight.com/resources/blog/guides/web-scraping-with-beautiful-soup
37. Web Scraping using Beautiful Soup | BrowserStack, accessed on July 11, 2025, https://www.browserstack.com/guide/web-scraping-using-beautiful-soup
38. How to find elements by class using Beautiful Soup - Educative.io, accessed on July 11, 2025, https://www.educative.io/answers/how-to-find-elements-by-class-using-beautiful-soup
39. How to find element by class using Beautifulsoup - Proxyway, accessed on July 11, 2025, https://proxyway.com/knowledge-base/how-to-find-element-by-class-using-beautifulsoup
40. Tables and Data | Supabase Docs, accessed on July 11, 2025, https://supabase.com/docs/guides/database/tables
41. Implementing many-to-many relationships with the UI · supabase · Discussion #710 - GitHub, accessed on July 11, 2025, https://github.com/orgs/supabase/discussions/710
42. Querying Joins and Nested tables | Supabase Docs, accessed on July 11, 2025, https://supabase.com/docs/guides/database/joins-and-nesting
43. Database Design for a Multiplayer/Single Quiz game - Stack Overflow, accessed on July 11, 2025, https://stackoverflow.com/questions/54181058/database-design-for-a-multiplayer-single-quiz-game
44. Visual Schema Designer | Supabase Features, accessed on July 11, 2025, https://supabase.com/features/visual-schema-designer
45. Keyword search | Supabase Docs, accessed on July 11, 2025, https://supabase.com/docs/guides/ai/keyword-search
46. Full Text Search | Supabase Docs, accessed on July 11, 2025, https://supabase.com/docs/guides/database/full-text-search
47. Full Text Search - Supabase Docs - Vercel, accessed on July 11, 2025, https://docs-chiae8gzf-supabase.vercel.app/docs/guides/database/full-text-search
48. Text search with Supabase - YouTube, accessed on July 11, 2025, https://m.youtube.com/shorts/1LjSv-zTypo
49. Supabase Fuzzy Full Text Search - Code.Build, accessed on July 11, 2025, https://code.build/p/supabase-fuzzy-full-text-search-BS0SWP
50. supabase/apps/docs/content/guides/database/full-text-search.mdx at master - GitHub, accessed on July 11, 2025, https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/full-text-search.mdx
51. postgresql - Query "all of" across many-to-many relation, accessed on July 11, 2025, https://dba.stackexchange.com/questions/235471/query-all-of-across-many-to-many-relation
52. Image Transformations for Developers | Documentation - Cloudinary, accessed on July 11, 2025, https://cloudinary.com/documentation/image_transformations
53. Transform & Optimize Your Visuals - Cloudinary Image, accessed on July 11, 2025, https://cloudinary.com/products/image
54. Image and Video Upload, Storage, Optimization and CDN, accessed on July 11, 2025, https://cloudinary.com/
55. Programmatically Uploading Images, Videos, and Other Files | Documentation - Cloudinary, accessed on July 11, 2025, https://cloudinary.com/documentation/upload_images
56. Python SDK – Python Upload + Image, Video Transformations | Documentation - Cloudinary, accessed on July 11, 2025, https://cloudinary.com/documentation/django_integration
57. Python image and video upload | Documentation - Cloudinary, accessed on July 11, 2025, https://cloudinary.com/documentation/django_image_and_video_upload
58. Uploading Images in Python with the Cloudinary Python SDK - Dev Hints - YouTube, accessed on July 11, 2025, https://www.youtube.com/watch?v=dDljAsM3T7c
59. Use Supabase with Next.js, accessed on July 11, 2025, https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
60. Build a User Management App with Next.js | Supabase Docs, accessed on July 11, 2025, https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
61. Build a User Management App with React | Supabase Docs, accessed on July 11, 2025, https://supabase.com/docs/guides/getting-started/tutorials/with-react
62. The Complete Tutorial to Building a CRUD App with React.js and Supabase - Adevait, accessed on July 11, 2025, https://adevait.com/react/building-crud-app-with-react-js-supabase
63. Next.js with Supabase Google Login: Step-by-Step Guide | Teknasyon Engineering, accessed on July 11, 2025, https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501