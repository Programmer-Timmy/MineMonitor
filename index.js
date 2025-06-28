require('dotenv').config();

const { Client, GatewayIntentBits } = require("discord.js");
const eventHandeler = require('./handlers/eventHandeler');
const {markWhitelistRequestAsRejected, markWhitelistRequestAsAccepted} = require("./utils/databaseFunctions");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
});
eventHandeler(client);

client.login(process.env.DISCORD_TOKEN);