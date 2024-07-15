const mcs = require('node-mcstatus');
const db = require('../../utils/databaseConnection.js');
const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require('discord.js');

const options = { query: true };

module.exports = {
  name: 'serverstatus',
  description: 'Pings a Minecraft server and returns its status! The status is updated every minute.',
  testOnly: false,
  deleted: false,
  options: [
    {
      name: 'server_ip',
      description: 'The IP of the Minecraft server',
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: 'port',
      description: 'The port of the Minecraft server',
      required: true,
      default: 25565,
      type: ApplicationCommandOptionType.Integer,
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {

    const serverIp = interaction.options.get('server_ip').value;
    const port = interaction.options.get('port').value;

    const guildId = interaction.guildId; // Get the Discord server (Guild) ID
    const channelId = interaction.channelId;

    // if the server is already in the database, delete the old message and add a new one
    const serverInDatabase = await checkServerInDatabase(guildId);
    if (serverInDatabase) {
      try {
        await deleteServerFromDatabase(guildId)
        const channel = await client.channels.fetch(serverInDatabase.channelId);
        const message = await channel.messages.fetch(serverInDatabase.messageId);
        if (message) {
          await message.delete();
        }
      } catch (error) {
        console.error('Error deleting old message:', error);
      }
    }

      try {
        let result = await mcs.statusJava(serverIp, port, options);
        let color = result['online'] ? 5763719 : 15548997;

        const resultData = result;

        if (resultData['online']) {
          let playerData = resultData['players']['list']
              .map((element) => {
                return '- ' + element.name_clean;
              })
              .join('\n');

          if (resultData['players']['list'].length === 0) {
            playerData = ' ';
          }

          const status = new EmbedBuilder()
              .setColor(color)
              .setTitle(`Status of ${resultData['host']}`)
              .setDescription(':green_circle: Server is online')
              .setThumbnail(
                  `https://api.mcstatus.io/v2/icon/${resultData['host']}`
              )
              .addFields(
                  {
                    name: 'Version',
                    value: `${resultData['version']['name_clean']}`,
                  },
                  {
                    name: `Players online: ${resultData['players']['online']}`,
                    value: `${playerData}`,
                  },
                  {
                    name: 'Max players',
                    value: `${resultData['players']['max']}`,
                  },
                  {
                    name: 'Motd',
                    value: `${resultData['motd']['clean']}`,
                  }
              )
              .setTimestamp();

          const originalMessage = await interaction.reply({ embeds: [status], fetchReply: true });
          await saveServerInfo(
              guildId,
              channelId,
              originalMessage.id,
              serverIp,
              port
          );


        } else {
          const offline = new EmbedBuilder()
              .setColor(color)
              .setTitle(`Status of ${resultData['host']}`)
              .setDescription(':red_circle: Server is offline')
              .setTimestamp();

          const originalMessage = await interaction.reply({ embeds: [offline], fetchReply: true });
          await saveServerInfo(
              guildId,
              channelId,
              originalMessage.id,
              serverIp,
              port
          );

        }
      } catch (error) {
        console.error(error);
      }

    async function saveServerInfo(serverId, channelId, messageId, serverIp, port) {
      try {
        await db.query(
            `INSERT INTO server_status (serverId, channelId, messageId, serverIp, port) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE channelId = VALUES(channelId), messageId = VALUES(messageId), serverIp = VALUES(serverIp), port = VALUES(port)`,
            [serverId, channelId, messageId, serverIp, port]
        );
      } catch (error) {
        console.error('Error saving server info:', error);
      }
    }

    async function getServerInfo(serverId) {
      return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM server_status WHERE serverId = ?`,
            [serverId],
            (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows.length > 0 ? rows[0] : null);
              }
            }
        );
      });
    }

    // check if server is already in the database
    async function checkServerInDatabase(serverId) {
      return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM server_status WHERE serverId = ?`,
            [serverId],
            (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows.length > 0 ? rows[0] : null);
              }
            }
        );
      });
    }

    // delete server from database
    async function deleteServerFromDatabase(serverId) {
      return new Promise((resolve, reject) => {
        db.query(
            `DELETE FROM server_status WHERE serverId = ?`,
            [serverId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
        );
      });
    }
  },
};
