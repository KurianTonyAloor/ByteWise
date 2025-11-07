const PyqAnalysis = require("../models/pyq.model.js");

/**
 * Finds a real analysis of frequent topics from the database.
 * @param {number} userId - The user's ID.
 * @param {string} courseName - The name of the course.
 * @returns {Promise<Array<{topic: string, frequency: number}>>}
 */
async function findPyqAnalysis(userId, courseName) {
    console.log(`--- Fetching Real PYQ Analysis for user ${userId} and course: "${courseName}" ---`);
    
    // Wrap the callback-style model function in a Promise
    return new Promise((resolve, reject) => {
        PyqAnalysis.find(userId, courseName, (err, data) => {
            if (err) {
                // If there's an error, reject the promise
                reject(err);
            } else {
                // Otherwise, resolve the promise with the data
                resolve(data);
            }
        });
    });
}

module.exports = { findPyqAnalysis };

