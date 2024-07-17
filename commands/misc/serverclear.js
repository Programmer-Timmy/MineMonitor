const {PermissionsBitField, ApplicationCommandOptionType} = require("discord.js");
const {checkServerInDatabase, deleteServerFromDatabase, getServerInfo} = require("../../utils/databaseFunctions");
module.exports = {
    name: 'serverclear',
    description: 'Clears the Minecraft server status from the database and removes the status message.',
    testOnly: false,
    deleted: false,
    permissionsRequired: [PermissionsBitField.Flags.Administrator],

    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const serverId = interaction.guildId;

        if (!await checkServerInDatabase(serverId)) {
            return interaction.reply({
                content: 'This server is not in the database.',
                ephemeral: true,
            });
        }

        const server = await getServerInfo(serverId);

        await deleteMessage(client, server.channelId, server.messageId);

        await deleteServerFromDatabase(serverId);

        interaction.reply({
            content: 'Server status cleared from the database.',
            ephemeral: true,
        });
    }
}

/**
 * Delete the message form discord
 *
 * @param {Client} client The discord client
 * @param {string} channelId The ID of the channel
 * @param {string} messageId The ID of the message
 *
 * @returns { Promise<void> }
 */
async function deleteMessage(client, channelId, messageId) {
    const channel = await client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);
    await message.delete();

}
