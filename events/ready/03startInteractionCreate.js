const {
    getWhitelistSetup,
    markWhitelistRequestAsRejected,
    markWhitelistRequestAsAccepted
} = require("../../utils/databaseFunctions");
const {Rcon} = require("rcon-client");
const startInteractionCreate = async (client) => {
    try {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            const [action, userId, username] = interaction.customId.split(':');

            if (!action || !userId || !username) return;

            if (action === 'accept_whitelist') {

                // Optional: give role
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                const whitelistSetup = await getWhitelistSetup(interaction.guildId);

                if (!whitelistSetup) {
                    return interaction.followUp({
                        content: '❌ Whitelist setup not found for this server.',
                        ephemeral: true,
                    });
                }

                try {
                    if (member && whitelistSetup?.whitelistRole) {
                        await member.roles.add(whitelistSetup.whitelistRole).catch(console.error);
                    }
                } catch (error) {
                    console.error(`Failed to add whitelist role: ${error}`);
                    return interaction.followUp({
                        content: '❌ Failed to assign the whitelist role. Please check the server configuration.',
                        ephemeral: true,
                    });
                }


                // send rcon command to whitelist the user
                try {
                    const rcon = await Rcon.connect(
                        {
                            host: whitelistSetup.serverIp,
                            port: whitelistSetup.rconPort || 25575,
                            password: whitelistSetup.rconPassword,
                        }
                    )

                    const response = await rcon.send(`whitelist add ${username}`);
                    console.log(`RCON response: ${response}`);

                    await rcon.end();
                } catch (error) {
                    console.error(`RCON error: ${error}`);
                    return interaction.followUp({
                        content: '❌ Failed to whitelist the user via RCON. Please check the server configuration.',
                        ephemeral: true,
                    });
                }

                // remove old request embed from admin channel
                const adminChannel = await interaction.guild.channels.fetch(whitelistSetup.adminChannel).catch(() => null);
                if (adminChannel) {
                    const messages = await adminChannel.messages.fetch({limit: 100});
                    const requestMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].description.includes(`**User:** <@${userId}>`));
                    if (requestMessage) {
                        await requestMessage.delete().catch(console.error);
                    }
                }

                const user = await client.users.fetch(userId).catch(() => null);
                if (user) {
                    await user.send(`Your whitelist request for **${username}** has been accepted by an admin.`).catch(() => {
                    });
                }

                await markWhitelistRequestAsAccepted(userId, username);
                await interaction.reply({
                    content: `✅ Whitelist request for **${username}** accepted.`,
                    ephemeral: true,
                });

            } else if (action === 'reject_whitelist') {

                const whitelistSetup = await getWhitelistSetup(interaction.guildId);

                if (!whitelistSetup) {
                    return interaction.followUp({
                        content: '❌ Whitelist setup not found for this server.',
                        ephemeral: true,
                    });
                }

                // remove old request embed from admin channel
                const adminChannel = await interaction.guild.channels.fetch(whitelistSetup.adminChannel).catch(() => null);

                if (adminChannel) {
                    const messages = await adminChannel.messages.fetch({limit: 100});
                    const requestMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].description.includes(`**User:** <@${userId}>`));
                    if (requestMessage) {
                        await requestMessage.delete().catch(console.error);
                    }
                }

                // Optional: notify the user
                const user = await client.users.fetch(userId).catch(() => null);
                if (user) {
                    await user.send(`Your whitelist request for **${username}** has been rejected by an admin.`).catch(() => {
                    });
                }

                await markWhitelistRequestAsRejected(userId, username);
                await interaction.reply({
                    content: `❌ Whitelist request for **${username}** rejected.`,
                    ephemeral: true,
                });
            }
        });
    } catch (error) {
        console.error(`There was an error setting up interactionCreate event: ${error}`);
        client.channels.cache.get('YOUR_ERROR_LOG_CHANNEL_ID').send(`Error in interactionCreate: ${error.message}`);
    }
}

module.exports = startInteractionCreate;