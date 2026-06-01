const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterTable() {
    try {
        const pool = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("Altering table messages...");
        
        try {
            await pool.query("ALTER TABLE messages MODIFY COLUMN message TEXT NULL;");
            console.log("Modified message to allow NULL");
        } catch(e) {
            console.log("Failed to modify message:", e.message);
        }
        
        try {
            await pool.query("ALTER TABLE messages ADD COLUMN type VARCHAR(20) DEFAULT 'text';");
            console.log("Added type column");
        } catch(e) {
            console.log("type column might already exist:", e.message);
        }

        try {
            await pool.query("ALTER TABLE messages ADD COLUMN media_url TEXT NULL;");
            console.log("Added media_url column");
        } catch(e) {
            console.log("media_url column might already exist:", e.message);
        }

        console.log("Alter table complete.");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
alterTable();
