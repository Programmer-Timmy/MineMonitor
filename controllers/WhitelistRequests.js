class WhitelistRequests {

    static db = require('../utils/databaseConnection');

    static insert(serverId, userId, username, minecraftUuid) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `INSERT INTO whitelist_requests (serverId, userId, username, minecraftUuid) VALUES (?, ?, ?, ?)`,
                [serverId, userId, username, minecraftUuid],
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

    static update(serverId, userId, username, minecraftUuid) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `UPDATE whitelist_requests SET username = ?, minecraftUuid = ? WHERE serverId = ? AND userId = ?`,
                [username, minecraftUuid, serverId, userId],
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

    static delete(serverId, userId) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `DELETE FROM whitelist_requests WHERE serverId = ? AND userId = ?`,
                [serverId, userId],
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

    static get(serverId, userId) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `SELECT * FROM whitelist_requests WHERE serverId = ? AND userId = ?`,
                [serverId, userId],
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

    static getAll(serverId) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `SELECT * FROM whitelist_requests WHERE serverId = ?`,
                [serverId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    static markRequest(userId, username, accepted = true) {
        return new Promise((resolve, reject) => {
            const status = accepted ? 'accepted' : 'rejected';
            this.db.query(
                `UPDATE whitelist_requests SET status = ? WHERE userId = ? AND username = ?`,
                [status, userId, username],
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
}

module.exports = WhitelistRequests;