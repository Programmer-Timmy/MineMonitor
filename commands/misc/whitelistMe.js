const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const {
    getWhitelistSetup,
    hasPendingRequest,
    addWhitelistRequest, checkWhitelistSetup,
} = require('../../utils/databaseFunctions');
const {getMinecraftUUID} = require("../../utils/mcApi");

module.exports = {
    name: 'whitelistme',
    description: 'Request to be whitelisted on the Minecraft server.',
    testOnly: false,
    deleted: false,
    options: [
        {
            name: 'minecraft_username',
            description: 'Your Minecraft username',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const serverId = interaction.guildId;
        const userId = interaction.user.id;
        const username = interaction.options.getString('minecraft_username');

        const setup = await checkWhitelistSetup(serverId);
        if (!setup) {
            return interaction.reply({
                content: '❌ This server has not been configured for whitelisting yet.',
                ephemeral: true,
            });
        }

        const alreadyRequested = await hasPendingRequest(serverId, userId);
        const alreadyRejected = await hasPendingRequest(serverId, userId, false);
        const alreadyAccepted = await hasPendingRequest(serverId, userId, true);
        if (alreadyRequested) {
            return interaction.reply({
                content: '⚠️ You already have a pending whitelist request. Please wait for an admin to respond.',
                ephemeral: true,
            });
        }
        if (alreadyRejected) {
            return interaction.reply({
                content: '❌ You have previously been rejected for whitelisting. Please contact an admin if you believe this is a mistake.',
                ephemeral: true,
            });
        }
        if (alreadyAccepted) {
            return interaction.reply({
                content: '✅ You are already whitelisted on this server.',
                ephemeral: true,
            });
        }

        const uuid = await getMinecraftUUID(username);
        if (!uuid) {
            return interaction.reply({
                content: '❌ Could not find a Minecraft account with that username. Please check the spelling.',
                ephemeral: true,
            });
        }

        await addWhitelistRequest(serverId, userId, username, uuid);

        const adminChannel = setup.adminChannel;

        await interaction.reply({
            content: `✅ Your request to whitelist **${username}** has been sent to the admins.`,
            ephemeral: true,
        });

        const embed = new EmbedBuilder()
            .setTitle('Whitelist Request')
            .setDescription(`**User:** <@${userId}>\n**Minecraft username:** \`${username}\``)
            .setColor(0x00AAFF)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`accept_whitelist:${userId}:${username}`)
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`reject_whitelist:${userId}:${username}`)
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger)
        );

        const channel = await client.channels.fetch(adminChannel);
        await channel.send({ embeds: [embed], components: [row] });
    },
};
