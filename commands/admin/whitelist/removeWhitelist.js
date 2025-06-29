const {
    Client,
    Interaction,
    PermissionsBitField,
} = require('discord.js');
const WhitelistSetups = require("../../../controllers/WhitelistSetups");

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

        const exists = await WhitelistSetups.get(serverId);
        if (!exists) {
            return interaction.reply({
                content: 'No whitelist setup found for this server.',
                ephemeral: true,
            });
        }

        await WhitelistSetups.delete(serverId);
        await WhitelistSetups.delete(serverId);

        return interaction.reply({
            content: '✅ Whitelist setup successfully removed.',
            ephemeral: true,
        });
    },
};
