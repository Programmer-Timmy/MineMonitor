const {
    Client,
    Interaction,
    PermissionsBitField,
    ApplicationCommandOptionType,
} = require('discord.js');
const { removeWhitelistSetup, checkWhitelistSetup, removeWhitelistRequests} = require('../../utils/databaseFunctions');

module.exports = {
    name: 'removewhitelist',
    description: 'Removes the whitelist setup for this server.',
    testOnly: false,
    deleted: false,
    permissionsRequired: [PermissionsBitField.Flags.Administrator],
    options: [],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const serverId = interaction.guildId;

        const exists = await checkWhitelistSetup(serverId);
        if (!exists) {
            return interaction.reply({
                content: 'No whitelist setup found for this server.',
                ephemeral: true,
            });
        }

        await removeWhitelistSetup(serverId);
        await removeWhitelistRequests(serverId);

        return interaction.reply({
            content: '✅ Whitelist setup successfully removed.',
            ephemeral: true,
        });
    },
};
