const db = require("./databaseConnection");

async function saveWhitelistSetup(serverId, serverIp, rconPort, rconPassword, adminChannel, whitelistRole) {
    return new Promise((resolve, reject) => {
        db.query(
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

async function checkWhitelistSetup(serverId) {
    return new Promise((resolve, reject) => {
        db.query(
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

async function removeWhitelistSetup(serverId) {
    return new Promise((resolve, reject) => {
        db.query(
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

function hasPendingRequest(serverId, userId, accepted = null) {
    let status = '';
    switch (accepted) {
        case null:
            status = 'pending';
            break;
        case false:
            status = 'rejected';
            break;
        case true:
            status = 'accepted';
            break;
        default:
            status = 'pending';
            break;
    }
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM whitelist_requests WHERE serverId = ? AND userId = ? AND status = ?`,
            [serverId, userId, status],
            (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            }
        );
    });
}

function hasRejectedRequest(serverId, userId) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM whitelist_requests WHERE serverId = ? AND userId = ? AND status = 'rejected'`,
            [serverId, userId],
            (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            }
        );
    });
}

function hasAcceptedRequest(serverId, userId) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM whitelist_requests WHERE serverId = ? AND userId = ? AND status = 'accepted'`,
            [serverId, userId],
            (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            }
        );
    });
}

function addWhitelistRequest(serverId, userId, username, uuid) {
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO whitelist_requests (serverId, userId, username, minecraftUuid) VALUES (?, ?, ?, ?)`,
            [serverId, userId, username, uuid],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

function markWhitelistRequestAsAccepted(userId, username) {
    return new Promise((resolve, reject) => {
        db.query(
            `UPDATE whitelist_requests SET status = 'accepted' WHERE userId = ? AND username = ?`,
            [userId, username],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

function markWhitelistRequestAsRejected(userId, username) {
    return new Promise((resolve, reject) => {
        db.query(
            `UPDATE whitelist_requests SET status = 'rejected' WHERE userId = ? AND username = ?`,
            [userId, username],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

async function getWhitelistSetup(serverId) {
    return new Promise((resolve, reject) => {
        db.query(
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

async function removeWhitelistRequests(serverId) {
    return new Promise((resolve, reject) => {
        db.query(
            `DELETE FROM whitelist_requests WHERE serverId = ?`,
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

module.exports = {
    deleteServerFromDatabase,
    checkServerInDatabase,
    getServerInfo,
    saveWhitelistSetup,
    checkWhitelistSetup,
    removeWhitelistSetup,
    hasPendingRequest,
    addWhitelistRequest,
    markWhitelistRequestAsRejected,
    getWhitelistSetup,
    markWhitelistRequestAsAccepted,
    removeWhitelistRequests
};