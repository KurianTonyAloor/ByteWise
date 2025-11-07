const cron = require('node-cron');
const db = require("../config/db.config.js");

// Schedule a task to run once every day at midnight
const scheduleSemesterUpdate = () => {
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily semester check...');
        
        // Find users whose last update was more than ~6 months (180 days) ago
        const query = `
            UPDATE users 
            SET 
                semester = semester + 1, 
                last_semester_update = CURDATE() 
            WHERE 
                DATEDIFF(CURDATE(), last_semester_update) > 180 AND semester < 8;
        `;

        db.query(query, (err, res) => {
            if (err) {
                console.error("Error updating semesters:", err);
                return;
            }
            if (res.affectedRows > 0) {
                console.log(`Successfully updated ${res.affectedRows} user(s) to the next semester.`);
            } else {
                console.log("No users needed a semester update.");
            }
        });
    });
};

module.exports = { scheduleSemesterUpdate };