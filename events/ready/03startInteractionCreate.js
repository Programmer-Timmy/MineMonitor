const {Rcon} = require("rcon-client");
const WhitelistRequest = require("../../controllers/WhitelistRequests");
const WhitelistSetups = require("../../controllers/WhitelistSetups");
const startInteractionCreate = async (client) => {
    try {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            const [action, userId, username] = interaction.customId.split(':');

            if (!action || !userId || !username) return;

            if (action === 'accept_whitelist') {

                if (!interaction.member.permissions.has('Administrator')) {
                    return interaction.reply({
                        content: '❌ You do not have permission to accept whitelist requests.',
                        ephemeral: true,
                    });
                }

                // Optional: give role
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                const whitelistSetup = await WhitelistSetups.get(interaction.guildId);

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
                    return interaction.reply({
                        content: '❌ Failed to assign the whitelist role. Please check the server configuration.',
                        ephemeral: true,
                    });
                }

                // send rcon command to whitelist the user

                const rcon = await Rcon.connect(
                    {
                        host: whitelistSetup.serverIp,
                        port: whitelistSetup.rconPort || 25575,
                        password: whitelistSetup.rconPassword,
                    }
                ).catch((error) => {
                    console.error(`Failed to connect to RCON server: ${error}`);
                    interaction.reply({
                        content: '❌ Failed to connect to the RCON server. Please check the server configuration.',
                        ephemeral: true,
                    });
                    return null;
                });

                if (!rcon) return;

                const response = await rcon.send(`whitelist add ${username}`);
                console.log(`RCON response: ${response}`);

                await rcon.end();


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
                    await user.send(`Your whitelist request for **${username}** in **${interaction.guild.name}** has been accepted by an admin.`).catch(error => {
                        console.error(`Failed to send acceptance message to user ${userId}: ${error}`);
                    });
                }

                await WhitelistRequest.markRequest(userId, username, true);
                await interaction.reply({
                    content: `✅ Whitelist request for **${username}** accepted.`,
                    ephemeral: true,
                });

            } else if (action === 'reject_whitelist') {

                if (!interaction.member.permissions.has('Administrator')) {
                    return interaction.reply({
                        content: '❌ You do not have permission to accept whitelist requests.',
                        ephemeral: true,
                    });
                }

                const whitelistSetup = await WhitelistSetups.get(interaction.guildId);

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
                    await user.send(`Your whitelist request for **${username}** in **${interaction.guild.name}** has been rejected by an admin.`).catch(() => {
                        console.error(`Failed to send rejection message to user ${userId}: ${error}`);
                    });
                }

                await WhitelistRequest.markRequest(userId, username, false);
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