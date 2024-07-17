const mysql = require('mysql');

// MySQL connection configuration
const db = mysql.createConnection({
    host: 'localhost', // Replace with your MySQL server host
    user: 'root', // Replace with your MySQL username
    password: '', // Replace with your MySQL password
    database: 'mydb' // Replace with your MySQL database name
    });

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

module.exports = db;
