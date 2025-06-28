class ServerStatus {
    static db = require("../utils/databaseConnection");

    static insert(serverId, channelId, messageId, serverIp, port) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `INSERT INTO server_status (serverId, channelId, messageId, serverIp, port) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE channelId = VALUES(channelId), messageId = VALUES(messageId), serverIp = VALUES(serverIp), port = VALUES(port)`,
                [serverId, channelId, messageId, serverIp, port],
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

    static update(serverId, channelId, messageId, serverIp, port) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `UPDATE server_status SET channelId = ?, messageId = ?, serverIp = ?, port = ? WHERE serverId = ?`,
                [channelId, messageId, serverIp, port, serverId],
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

    static delete(serverId) {
        return new Promise((resolve, reject) => {
            this.db.query(
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

    static get(serverId) {
        return new Promise((resolve, reject) => {
            this.db.query(
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

    static getAll() {
        return new Promise((resolve, reject) => {
            this.db.query('SELECT * FROM server_status', (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }
}

module.exports = ServerStatus;