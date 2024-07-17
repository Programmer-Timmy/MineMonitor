const mcs = require('node-mcstatus');
const db = require('../../utils/databaseConnection.js');
const {deleteServerFromDatabase} = require('../../utils/databaseFunctions.js');
const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionsBitField,
} = require('discord.js');
const {saveServerInfo, checkServerInDatabase} = require("../../utils/databaseFunctions");

const options = {query: true};

module.exports = {
    name: 'serverstatus',
    description: 'Pings a Minecraft server and returns its status! The status is updated every minute.',
    testOnly: false,
    deleted: false,
    permissionsRequired: [PermissionsBitField.Flags.Administrator],
    options: [
        {
            name: 'server_ip',
            description: 'The IP of the Minecraft server',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'port',
            description: 'The port of the Minecraft server',
            required: false,
            type: ApplicationCommandOptionType.Integer,
        },
    ],
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {

        const serverIp = interaction.options.get('server_ip').value;
        const port = interaction.options.get('port')?.value || 25565;

        const guildId = interaction.guildId; // Get the Discord server (Guild) ID
        const channelId = interaction.channelId;

        if (!isValidIP(serverIp)) {
            return interaction.reply({
                content: 'Invalid IP address provided! Please provide a valid IP address or hostname.',
                ephemeral: true,
            });
        }

        if (!isValidPort(port)) {
            return interaction.reply({
                content: 'Invalid port provided! Ports must be between 0 and 65535.',
                ephemeral: true,
            });
        }

        // if the server is already in the database, delete the old message and add a new one
        const serverInDatabase = await checkServerInDatabase(guildId);
        if (serverInDatabase) {
            try {
                await deleteServerFromDatabase(guildId)
                const channel = await client.channels.fetch(serverInDatabase.channelId);
                const message = await channel.messages.fetch(serverInDatabase.messageId);
                if (message) {
                    await message.delete();
                }
            } catch (error) {
                console.error('Error deleting old message:', error);
            }
        }

        try {
            let result = await mcs.statusJava(serverIp, port, options);
            let color = result['online'] ? 5763719 : 15548997;

            const resultData = result;

            const embed = getEmbed(resultData, resultData.online);

            const sentMessage = await interaction.reply({embeds: [embed], fetchReply: true});

            await saveServerInfo(guildId, channelId, sentMessage.id, serverIp, port);

        } catch (error) {
            console.error(error);
        }
    },
};

/**
 * Check if a valid ip or hostname is provided
 *
 * @param {string} ip
 *
 * @returns {boolean}
 */
function isValidIP(ip) {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const hostnameRegex = /^([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,}$/;

    return ipRegex.test(ip) || hostnameRegex.test(ip);
}

/**
 * Check if a valid port is provided
 *
 * @param {number} port
 *
 * @returns {boolean}
 */
function isValidPort(port) {
    return port >= 0 && port <= 65535;

}

/**
 * Gives the embed for the server status
 *
 * @param {Object} resultData
 * @param {boolean} online
 *
 * @returns {EmbedBuilder}
 */
function getEmbed(resultData, online) {
    let color = online ? 5763719 : 15548997;

    if (online) {
        let playerData = resultData.players.list
            .map((element) => {
                return '- ' + element.name_clean;
            })
            .join('\n');

        if (resultData.players.list.length === 0) {
            playerData = ' ';
        }

        return new EmbedBuilder()
            .setColor(color)
            .setTitle(`Status of ${resultData.host}`)
            .setDescription(':green_circle: Server is online')
            .setThumbnail(
                `https://api.mcstatus.io/v2/icon/${resultData.host}`
            )
            .addFields(
                {
                    name: 'Version',
                    value: `${resultData.version.name_clean}`,
                },
                {
                    name: `Players online: ${resultData.players.online}`,
                    value: `${playerData}`,
                },
                {
                    name: 'Max players',
                    value: `${resultData.players.max}`,
                },
                {
                    name: 'Motd',
                    value: `${resultData.motd.clean}`,
                }
            )
            .setTimestamp();
    } else {
        return new EmbedBuilder()
            .setColor(color)
            .setTitle(`Status of ${resultData.host}`)
            .setDescription(':red_circle: Server is offline')
            .setTimestamp();
    }
}

