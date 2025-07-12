const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const {getMinecraftUUID} = require("../../../utils/mcApi");
const WhitelistSetups = require("../../../controllers/WhitelistSetups");
const WhitelistRequests = require("../../../controllers/WhitelistRequests");

module.exports = {
    name: 'whitelistme',
    description: 'Request to be whitelisted on the Minecraft server.',
    testOnly: false,
    deleted: false,
    guildOnly: true,
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

        const setup = await WhitelistSetups.get(serverId);
        if (!setup) {
            return interaction.reply({
                content: '❌ This server has not been configured for whitelisting yet.',
                ephemeral: true,
            });
        }

        const alreadyRequested = await WhitelistRequests.get(serverId, userId);

        if (alreadyRequested) {
            return handleAlreadyRequested(alreadyRequested, interaction);
        }

        const uuid = await getMinecraftUUID(username);
        if (!uuid) {
            return interaction.reply({
                content: '❌ Could not find a Minecraft account with that username. Please check the spelling.',
                ephemeral: true,
            });
        }

        await WhitelistRequests.insert(serverId, userId, username, uuid);

        const adminChannel = setup.adminChannel;

        await interaction.reply({
            content: `✅ Your request to whitelist **${username}** has been sent to the admins.`,
            ephemeral: true,
        });

        const embed = buildEmbed(userId, username);

        const row = buildButtons(userId, username);

        const channel = await client.channels.fetch(adminChannel);
        await channel.send({ embeds: [embed], components: [row] });
    },
};

/**
 * Handles the response for users who have already requested whitelisting.
 * @param {Object} alreadyRequested - The previous whitelist request object.
 * @param {Interaction} interaction - The interaction object from Discord.
 * @returns {*} - A reply to the interaction indicating the status of the previous request.
 */
function handleAlreadyRequested(alreadyRequested, interaction) {
    switch (alreadyRequested.status) {
        case 'pending':
            return interaction.reply({
                content: '⚠️ You already have a pending whitelist request. Please wait for an admin to respond.',
                ephemeral: true,
            });
        case 'rejected':
            return interaction.reply({
                content: '❌ You have previously been rejected for whitelisting. Please contact an admin if you believe this is a mistake.',
                ephemeral: true,
            });
        case 'accepted':
            return interaction.reply({
                content: '✅ You are already whitelisted on this server with `' + alreadyRequested.username + '`. If this is incorrect, please contact an admin.',
                ephemeral: true,
            });
        default:
            // No previous request found, continue with the whitelisting process
            break;
    }
}


/**
 * Builds the buttons for the whitelist request embed.
 *
 * @param {string} userId - The ID of the user making the request.
 * @param {string} username - The Minecraft username of the user making the request.
 * @returns {ActionRowBuilder<AnyComponentBuilder>} - The action row containing the accept and reject buttons.
 */
function buildButtons(userId, username) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`accept_whitelist:${userId}:${username}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`reject_whitelist:${userId}:${username}`)
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger)
    );
}

/**
 * Builds the embed for the whitelist request.
 * @param {string} userId - The ID of the user making the request.
 * @param {string} username  - The Minecraft username of the user making the request.
 * @returns {EmbedBuilder} - The embed containing the whitelist request information.
 */
function buildEmbed(userId, username) {
    return new EmbedBuilder()
        .setTitle('Whitelist Request')
        .setDescription(`**User:** <@${userId}>\n**Minecraft username:** \`${username}\``)
        .setColor(0x00AAFF)
        .setTimestamp();
}
