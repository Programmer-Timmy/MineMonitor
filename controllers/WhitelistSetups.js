class WhitelistSetups {

    static db = require('../utils/databaseConnection');

    static insert (serverId, serverIp, rconPort, rconPassword, adminChannel, whitelistRole) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `INSERT INTO whitelist_setups (serverId, serverIp, rconPort, rconPassword, adminChannel, whitelistRole) VALUES (?, ?, ?, ?, ?, ?)`,
                [serverId, serverIp, rconPort, rconPassword, adminChannel, whitelistRole],
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

    static get (serverId) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `SELECT * FROM whitelist_setups WHERE serverId = ?`,
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

    static update (serverId, serverIp, rconPort, rconPassword, adminChannel, whitelistRole) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `UPDATE whitelist_setups SET serverIp = ?, rconPort = ?, rconPassword = ?, adminChannel = ?, whitelistRole = ? WHERE serverId = ?`,
                [serverIp, rconPort, rconPassword, adminChannel, whitelistRole, serverId],
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

    static delete (serverId) {
        return new Promise((resolve, reject) => {
            this.db.query(
                `DELETE FROM whitelist_setups WHERE serverId = ?`,
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
}

module.exports = WhitelistSetups;