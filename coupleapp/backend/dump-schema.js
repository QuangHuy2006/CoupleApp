const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function dumpSchema() {
    try {
        const pool = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [tables] = await pool.query('SHOW TABLES');
        const dbName = process.env.DB_NAME;
        const key = `Tables_in_${dbName}`;
        
        let schema = '';

        for (const row of tables) {
            const tableName = row[key] || row[Object.keys(row)[0]];
            const [createTable] = await pool.query(`SHOW CREATE TABLE ${tableName}`);
            schema += createTable[0]['Create Table'] + ';\n\n';
        }

        fs.writeFileSync('mysql_schema.sql', schema);
        console.log('Schema dumped to mysql_schema.sql');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
dumpSchema();
