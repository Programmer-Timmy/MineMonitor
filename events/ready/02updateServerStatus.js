const mcs = require('node-mcstatus');
const db = require('../../utils/databaseConnection.js');
const { EmbedBuilder, Client } = require('discord.js');
const ServerStatus = require("../../controllers/ServerStatus");

const options = { timeout: 5000, enableSRV: true };

/**
 * Function to update Minecraft server status messages based on database information
 * @param {Client} client The Discord client instance
 */
const updateServerStatus = async (client) => {
    try {
        // Fetch all server statuses from the database
        const serverStatuses = await getAllServerStatuses();
        if (serverStatuses.length !== 0) {
            // Iterate through each server status
            for (const serverStatus of serverStatuses) {
                if (!await checkIfServerExists(client, serverStatus.serverId, serverStatus.channelId, serverStatus.messageId)) {
                    console.log(`Server, channel, or message does not exist for serverId ${serverStatus.serverId}`);

                    // Delete the server status from the database
                    await ServerStatus.delete(serverStatus.serverId);
                    continue;
                }

                const {serverId, channelId, messageId, serverIp, port} = serverStatus;

                try {
                    let result = await mcs.statusJava(serverIp, port, options);
                    let color = result.online ? 5763719 : 15548997;
                    const resultData = result;

                    // Prepare embed based on server status
                    let embed;
                    if (result.online) {
                        let playerData = resultData.players.list
                            .map((player) => `- ${player.name_raw}`)
                            .join('\n');


                        if (resultData.players.list.length === 0) {
                            playerData = ' ';
                        }

                        embed = new EmbedBuilder()
                            .setColor(color)
                            .setTitle(`Status of ${resultData.host}`)
                            .setDescription(':green_circle: Server is online')
                            .setThumbnail(`https://api.mcstatus.io/v2/icon/${resultData.host}`)
                            .addFields(
                                {name: 'Version', value: `${resultData.version.name_clean}`},
                                {name: `Players online: ${resultData.players.online}`, value: playerData},
                                {name: 'Max players', value: `${resultData.players.max}`},
                                {name: 'MOTD', value: `${resultData.motd.clean}`}
                            )
                            .setTimestamp();
                    } else {
                        embed = new EmbedBuilder()
                            .setColor(color)
                            .setTitle(`Status of ${resultData.host}`)
                            .setDescription(':red_circle: Server is offline')
                            .setTimestamp();
                    }

                    // Update or send message based on messageId
                    if (messageId) {
                        await updateOrSendMessage(channelId, messageId, embed, client);
                    } else {
                        const sentMessageId = await sendMessage(client, channelId, embed);
                        await updateDatabase(serverId, channelId, sentMessageId, serverIp, port);
                    }
                } catch (error) {
                    console.error(`Error updating server status for serverId ${serverId}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching server statuses from database:', error);
    }
};

/**
 * Function to fetch all server statuses from the database
 */
async function getAllServerStatuses() {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM server_status', (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}



/**
 * Function to update or send a message in Discord
 * @param {string} channelId The ID of the channel to send or update the message
 * @param {string} messageId Optional - The ID of the message to update
 * @param {EmbedBuilder} embed The embed to update or send
 */
async function updateOrSendMessage(channelId, messageId, embed, client) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (messageId) {
            const message = await channel.messages.fetch(messageId);
            if (message) {
                await message.edit({ embeds: [embed] });
            }
        } else {
            const sentMessage = await sendMessage(client, channelId, embed);
            return sentMessage.id;
        }
    } catch (error) {
        console.error('Error updating or sending message:', error);
    }
}

/**
 * Function to send a message in Discord
 * @param {Client} client The Discord client instance
 * @param {string} channelId The ID of the channel to send the message
 * @param {EmbedBuilder} embed The embed to send
 * @returns {string} The ID of the sent message
 */
async function sendMessage(client, channelId, embed) {
    try {
        const channel = await client.channels.fetch(channelId);
        const sentMessage = await channel.send({ embeds: [embed] });
        return sentMessage.id;
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

/**
 * Function to update server information in the database
 * @param {string} serverId The ID of the server
 * @param {string} channelId The ID of the channel
 * @param {string} messageId The ID of the message
 * @param {string} serverIp The IP address of the server
 * @param {number} port The port of the server
 */
async function updateDatabase(serverId, channelId, messageId, serverIp, port) {
    try {
        await db.query(
            `INSERT INTO server_status (serverId, channelId, messageId, serverIp, port) VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE channelId = VALUES(channelId), messageId = VALUES(messageId), serverIp = VALUES(serverIp), port = VALUES(port)`,
            [serverId, channelId, messageId, serverIp, port]
        );
    } catch (error) {
        console.error('Error updating database:', error);
    }
}

module.exports = (client) => {
    // Ensure client is retained in the closure scope
    setInterval(() => updateServerStatus(client), 6000); // Example: Update every 5 minutes
};

/**
 * Check if the channel, or message exists in discord
 *
 * @param {string} serverId The ID of the server
 * @param {string} channelId The ID of the channel
 * @param {string} messageId The ID of the message
 *
 * @returns {boolean} Whether the server, channel, or message exists
 */
async function checkIfServerExists(client, serverId, channelId, messageId) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (messageId) {
            const message = await channel.messages.fetch(messageId);
            return !!message;
        }
        return !!channel;
    } catch (error) {
        return false;
    }
}
