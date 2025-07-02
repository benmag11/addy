# DO NOT DELETE THIS FILE WHEN CLEANING UP CODE BASE


1. For all the code and features you have just introduced:
   
   Act as a senior cybersecurity analyst. Your task is to perform a security audit on the code and features which you have just introduced. Your analysis should be  focused on identifying potential security vulnerabilities.


    - **Primary areas of concern:**
    - **Injection flaws:** Check for any possibility of SQL, NoSQL, OS, or command injection.
    - **Cross-Site Scripting (XSS):** Analyze all user inputs for proper sanitization to prevent stored, reflected, or DOM-based XSS.
    - **Authentication/Authorization:** Look for any weaknesses, potential bypasses, or insecure session management.
    - **Sensitive Data Exposure:** Identify any hardcoded credentials, API keys, or personal data that is handled insecurely.
    - **Cross-Site Request Forgery (CSRF):** Ensure that state-changing requests require anti-CSRF tokens.


