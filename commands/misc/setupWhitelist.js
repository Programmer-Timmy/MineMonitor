const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    PermissionsBitField,
} = require('discord.js');
const {saveWhitelistSetup, checkWhitelistSetup} = require("../../utils/databaseFunctions");

module.exports = {
    name: 'setupwhitelist',
    description: 'Sets up a command that allows users to whitelist themselves on a Minecraft server.',
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
            name: 'rcon_password',
            description: 'The RCON password for the Minecraft server',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'admin_accept_channel',
            description: 'The channel where the whitelist requests will be sent for admin approval',
            required: true,
            type: ApplicationCommandOptionType.Channel,
        },
        {
            name: 'rcon_port',
            description: 'The port of the RCON server (usually 25575)',
            required: false,
            type: ApplicationCommandOptionType.Integer,
        },
        {
            name: 'whitelist_role',
            description: 'The role that will be given to users when they are whitelisted',
            required: false,
            type: ApplicationCommandOptionType.Role,
        },
    ],
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const serverIp = interaction.options.get('server_ip').value;
        const rconPassword = interaction.options.get('rcon_password').value;
        const adminChannel = interaction.options.get('admin_accept_channel').value;
        const whitelistRole = interaction.options.get('whitelist_role')?.role.id || null;
        const rconPort = interaction.options.get('rcon_port')?.value || 25575;
        const serverId = interaction.guildId; // Get the Discord server (Guild) ID
        if (await checkWhitelistSetup(serverId)) {
            return interaction.reply({
                content: 'A whitelist setup already exists for this server. Please remove it by using the `/removewhitelist` command before setting up a new one.',
                ephemeral: true,
            });
        }

        console.log(`Setting up whitelist for server: ${serverIp}, RCON Port: ${rconPort}, Admin Channel: ${adminChannel}, Whitelist Role: ${whitelistRole ? whitelistRole : 'None'} for server ID: ${serverId}`);


        if (!isValidIP(serverIp) && !isValidHostname(serverIp)) {
            return interaction.reply({
                content: 'Invalid IP address or hostname provided! Please provide a valid IP address or hostname.',
                ephemeral: true,
            });
        }

        if (!isValidPort(rconPort)) {
            return interaction.reply({
                content: 'Invalid port provided! Ports must be between 0 and 65535.',
                ephemeral: true,
            });
        }
        // Save the server info to the database
        await saveWhitelistSetup(
            serverId,
            serverIp,
            rconPort,
            rconPassword,
            adminChannel,
            whitelistRole
        );

        return interaction.reply({
            content: `✅ Whitelist setup complete for server ${serverIp}:${rconPort}. Admins will receive requests in <#${adminChannel}>.`,
            ephemeral: true,
        });
    },
};

function isValidIP(ip) {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

function isValidHostname(hostname) {
    const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/;
    return hostnameRegex.test(hostname);
}

function isValidPort(port) {
    return Number.isInteger(port) && port >= 0 && port <= 65535;
}

