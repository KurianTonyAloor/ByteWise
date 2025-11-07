const puppeteer = require('puppeteer');

/**
 * A helper function to perform a DuckDuckGo search and extract the top results.
 */
async function performSearch(browser, query) {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        const results = await page.evaluate(() => {
            const resultNodes = Array.from(document.querySelectorAll('a.result__a'));
            return resultNodes.slice(0, 5).map(node => ({
                title: node.innerText,
                url: node.href
            }));
        });
        return results;
    } catch (error) {
        console.error(`Failed to perform search for query "${query}":`, error.message);
        return [];
    } finally {
        await page.close();
    }
}

/**
 * Finds materials by creating hyper-specific search queries using the user's profile.
 * @param {string} courseName - The name of the course.
 * @param {object} user - The user's profile object.
 * @returns {Promise<{youtubeLectures: Array, notes: Array}>}
 */
async function findCourseMaterials(courseName, user) {
    console.log(`--- Starting CONTEXTUAL search for: "${courseName}" ---`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

    try {
        // --- THIS IS THE FIX ---
        // Conditionally build the base search query.
        let baseQuery = `${user.university} ${user.program} semester ${user.semester} ${courseName}`;
        if (user.scheme) {
            // Only add 'scheme' to the query if it exists for the user.
            baseQuery = `${user.university} ${user.program} scheme ${user.scheme} semester ${user.semester} ${courseName}`;
        }
        // --------------------

        const youtubeQuery = `${baseQuery} youtube lecture playlist`;
        const notesQuery = `${baseQuery} notes pdf`;
        
        console.log(`YouTube Query: "${youtubeQuery}"`);
        console.log(`Notes Query: "${notesQuery}"`);

        const [youtubeLectures, notes] = await Promise.all([
            performSearch(browser, youtubeQuery),
            performSearch(browser, notesQuery)
        ]);

        console.log(`Found ${youtubeLectures.length} YouTube links and ${notes.length} notes links.`);
        
        return { youtubeLectures, notes };
    } catch (error) {
        console.error("An error occurred during material finding:", error);
        return { youtubeLectures: [], notes: [] };
    } finally {
        await browser.close();
    }
}

module.exports = { findCourseMaterials };

