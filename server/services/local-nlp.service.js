const nlp = require('compromise');

// This function is our "Lightweight NLM" for course extraction
function extractCourseNames(text) {
    console.log("--- Running Local NLP Extraction ---");
    const courses = [];
    const seenCourses = new Set();

    // Expanded blacklist of common non-course, all-caps words/phrases
    const JUNK_PHRASES = new Set([
        'SYLLABUS', 'SELECT YOUR BRANCH', 'UPLOAD NOTES', 'HOME', 'NOTES', 
        'QUESTION PAPERS', 'EXAM TIMETABLE', 'MORE', 'LOGIN',
        'REGISTER', 'CONTACT', 'ABOUT', 'PRIVACY POLICY', 'TERMS OF SERVICE',
        'COURSE CODE', 'CREDIT TRANSFER', 'RECOMMENDED FOR YOU', 'KTU NEWS FOLLOWERS',
        'KTU LEARNING PORTAL', 'DOWNLOAD NOW', 'COMMON COURSES', 'MINOR COURSE',
        'HONOURS COURSES', 'CURRICULUM'
    ]);

    // Regex to find potential course codes (e.g., CST301, PCCST502)
    const codeRegex = /[A-Z]{3,5}\d{3,4}/g;
    
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        const upperCaseLine = trimmedLine.toUpperCase();
        
        // Skip empty lines, blacklisted phrases, or lines that are just a course code
        if (!trimmedLine || JUNK_PHRASES.has(upperCaseLine) || /^[A-Z]{3,5}\d{3,4}$/.test(trimmedLine)) {
            continue;
        }

        // --- NEW FIX ---
        // If the line contains "SYLLABUS", it's almost certainly a page title, not a course name.
        if (upperCaseLine.includes('SYLLABUS')) {
            continue;
        }
        // ---------------

        // Ignore lines that are likely lab courses
        if (upperCaseLine.includes(' LAB') || upperCaseLine.endsWith('LAB-II') || upperCaseLine.endsWith('LAB-I')) {
            continue;
        }

        const matches = trimmedLine.match(codeRegex);

        // Heuristic 1: High-confidence match if a line contains a course code.
        if (matches) {
            const course_code = matches[0];
            let course_name = trimmedLine.replace(codeRegex, '').trim();
            course_name = course_name.replace(/^[^a-zA-Z]+/, ''); 

            if (course_name.includes('(')) {
                course_name = course_name.split('(')[0].trim();
            }

            if (course_name.length > 5 && !seenCourses.has(course_name)) {
                courses.push({ course_code, course_name });
                seenCourses.add(course_name);
            }
        } 
        // Heuristic 2: Stricter rules for all-caps lines without a code.
        else if (trimmedLine.length > 10 && upperCaseLine === trimmedLine && trimmedLine.includes(' ')) {
            if (upperCaseLine.endsWith('ENGINEERING') || upperCaseLine.endsWith('SCIENCE') || upperCaseLine.endsWith('TECHNOLOGY') || upperCaseLine.includes('CURRICULUM')) {
                continue;
            }

            const course_name = trimmedLine.replace(/\s+/g, ' ');
            
            if (!seenCourses.has(course_name)) {
                courses.push({ course_code: 'N/A', course_name });
                seenCourses.add(course_name);
            }
        }
    }

    console.log(`Local NLP found ${courses.length} potential courses.`);
    return courses;
}

module.exports = { extractCourseNames };

