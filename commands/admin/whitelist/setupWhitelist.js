const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    PermissionsBitField,
} = require('discord.js');
const WhitelistSetups = require("../../../controllers/WhitelistSetups");
const MinecraftRcon = require("../../../controllers/MinecraftRcon");
module.exports = {
    name: 'setupwhitelist',
    description: 'Sets up a command that allows users to whitelist themselves on a Minecraft server.',
    testOnly: false,
    deleted: false,
    guildOnly: true,
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
            name: 'whitelisted_role',
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

        if (await WhitelistSetups.get(serverId)) {
            return interaction.reply({
                content: 'A whitelist setup already exists for this server. Please remove it by using the `/removewhitelist` command before setting up a new one.',
                ephemeral: true,
            });
        }

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

        // Check if the admin channel is valid and accessible
        const channel = await client.channels.fetch(adminChannel).catch(() => null);
        if (!channel || !(await checkAccessToChannel(channel))) {
            return interaction.reply({
                content: 'Invalid admin channel provided! Please provide a valid text channel where the bot can send messages.',
                ephemeral: true,
            });
        }

        // Check if the RCON connection is valid
        if (!(await checkRconAccess(serverIp, rconPort, rconPassword))) {
            return interaction.reply({
                content: 'Failed to connect to the RCON server. Please check the IP, port, and password.',
                ephemeral: true,
            });
        }

        // Save the server info to the database
        await WhitelistSetups.insert(
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

async function checkAccessToChannel(channel) {
    if (!channel || !channel.isTextBased()) {
        return false;
    }

    try {
        await channel.guild.members.fetchMe(); // Make sure bot's member data is available
    } catch (err) {
        console.error("Failed to fetch bot member:", err);
        return false;
    }

    const permissions = channel.permissionsFor(channel.guild.members.me);
    if (!permissions) {
        return false; // No permissions available
    }

    if (!permissions.has('ViewChannel') || !permissions.has('SendMessages')) {
        return false; // Lacks basic access
    }

    return true;
}


async function checkRconAccess(serverIp, rconPort, rconPassword) {
    try {
        console.log(`Attempting to connect to RCON server at ${serverIp}:${rconPort} with password ${rconPassword}`);
        await new MinecraftRcon(serverIp, rconPort, rconPassword)
        return true
    } catch (error) {
        console.error(`Failed to connect to RCON server at ${serverIp}:${rconPort} - ${error.message}`);
        return false; // If there's an error, return false
    }
}
