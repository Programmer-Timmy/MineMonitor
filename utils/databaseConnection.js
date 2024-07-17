const mysql = require('mysql');

// MySQL connection configuration
const db = mysql.createConnection({
    host: '192.168.2.11', // Replace with your MySQL server host
    user: 'MineMonitor', // Replace with your MySQL username
    password: 'sdMiW6?jG4zDVs@A', // Replace with your MySQL password
    database: 'MineMonitor' // Replace with your MySQL database name
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
