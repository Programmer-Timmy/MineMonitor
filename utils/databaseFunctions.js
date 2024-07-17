const db = require("./databaseConnection");

async function deleteServerFromDatabase(serverId) {
    return new Promise((resolve, reject) => {
        db.query(
            `DELETE FROM server_status WHERE serverId = ?`,
            [serverId],
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

async function saveServerInfo(serverId, channelId, messageId, serverIp, port) {
    try {
        await db.query(
            `INSERT INTO server_status (serverId, channelId, messageId, serverIp, port) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE channelId = VALUES(channelId), messageId = VALUES(messageId), serverIp = VALUES(serverIp), port = VALUES(port)`,
            [serverId, channelId, messageId, serverIp, port]
        );
    } catch (error) {
        console.error('Error saving server info:', error);
    }
}

async function checkServerInDatabase(serverId) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM server_status WHERE serverId = ?`,
            [serverId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.length > 0 ? rows[0] : null);
                }
            }
        );
    });
}

/**
 * Get the server information from the database
 *
 * @param {string} serverId The ID of the server
 *
 * @returns {Promise<Object>} The server information
 */
async function getServerInfo(serverId) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM server_status WHERE serverId = ?`,
            [serverId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.length > 0 ? rows[0] : null);
                }
            }
        );
    });
}

module.exports = {
    deleteServerFromDatabase,
    saveServerInfo,
    checkServerInDatabase,
    getServerInfo,
};