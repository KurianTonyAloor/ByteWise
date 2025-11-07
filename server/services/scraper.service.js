const puppeteer = require('puppeteer');
const axios = require('axios'); // Still needed if you ever revert to API-based search
const { extractCourseNames } = require('./local-nlp.service.js');
// pdf-parse is correctly removed
require('dotenv').config();

// This is the primary function for finding courses using DuckDuckGo web scraping.
async function findAndExtractCourses(userInfo) {
    const { university, program, scheme, semester } = userInfo;
    
    // 1. Engineer the search query, conditionally including the scheme
    let searchQuery = `${university} ${program} semester ${semester} syllabus courses`;
    if (scheme) {
        searchQuery = `${university} ${program} ${scheme} scheme semester ${semester} syllabus courses`;
    }
    
    console.log(`Starting DuckDuckGo web search with query: "${searchQuery}"`);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    let urls = [];
    try {
        // 2. Perform the search on DuckDuckGo's HTML version
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        // 3. Extract the top 4 result URLs
        urls = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a.result__a'));
            // Ensure href attribute exists before mapping
            return links.slice(0, 4).map(link => link.href).filter(href => href); 
        });

    } catch (error) {
        console.error("Failed to perform web search on DuckDuckGo:", error.message);
        await browser.close();
        return [];
    }

    if (urls.length === 0) {
        console.log("Could not find any URLs from DuckDuckGo search.");
        await browser.close();
        return [];
    }

    console.log(`Found ${urls.length} potential syllabus URLs to check.`);

    // 4. Iterate through URLs, scrape text, and extract courses
    try {
        for (const url of urls) {
            console.log(`Attempting to scrape: ${url}`);
            try {
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
                const pageText = await page.evaluate(() => document.body.innerText);
                
                // 5. Use our local NLP extractor
                const extractedCourses = extractCourseNames(pageText);

                // 6. If courses are found, return immediately
                if (extractedCourses.length > 0) {
                    console.log(`Success! Found courses on: ${url}`);
                    return extractedCourses; 
                }
            } catch (e) {
                console.log(`Failed to scrape or process ${url}: ${e.message}`);
                // Continue to the next URL if one fails
            }
        }
        
        console.log("Checked all URLs but found no courses.");
        return []; // Return empty if no courses found after checking all URLs

    } catch (error) {
        console.error("An error occurred during the site scraping process:", error);
        return [];
    } finally {
        // Ensure browser is always closed
        if (browser) await browser.close();
    }
}

// Export ONLY the function this file is responsible for.
module.exports = { findAndExtractCourses };

