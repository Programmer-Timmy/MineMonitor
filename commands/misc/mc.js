const mcs = require("node-mcstatus");
const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");

const options = { query: true };

module.exports = {
  name: "mc",
  description: "pings my mc server!",
  // devOnly: Boolean,
  testOnly: false,
  // options: Object[],
  deleted: false,

  options: [
    {
      name: "server_ip",
      description: "The ip of the server",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "port",
      description: "The port of the server",
      required: true,
      type: ApplicationCommandOptionType.Number,
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: (client, interaction) => {
    const serverIp = interaction.options.get("server_ip").value;
    const port = interaction.options.get("port").value;
    let resultData;
    let collor = 5763719;
    mcs
      .statusJava(serverIp, port, options)
      .then((result) => {
        const resultData = result;
        
        console.log(result);

        if (resultData['online'] === false) {collor = 15548997}
        if (resultData["online"] === true) {
          
          let playerData = resultData["players"]["list"].map((element) => {
            return element.name_clean;
          });

          if (resultData["players"]["list"].length === 0) {
            playerData = " ";
          }

          const online = new EmbedBuilder()
            .setColor(collor)
            .setTitle(`Status van ${resultData["host"]}`)
            .setDescription(":green_circle: Server is online")
            .setThumbnail(
              `https://api.mcstatus.io/v2/icon/${resultData["host"]}`
            )
            .addFields(
              {
                name: "Versie",
                value: `${resultData["version"]["name_clean"]}`,
              },
              {
                name: `Spelers online: ${resultData["players"]["online"]}`,
                value: `${playerData}`,
              },
              {
                name: "Max spelers",
                value: `${resultData["players"]["max"]}`,
              },
              {
                name: "Motd",
                value: `${resultData["motd"]["clean"]}`,
              }
            )
            .setTimestamp();
          interaction.reply({ embeds: [online] });
        } else {
          const offline = new EmbedBuilder()
            .setColor(collor)
            .setTitle(`Status van ${resultData["host"]}`)
            .setDescription(":red_circle: Server is offline")
            .addFields({
              name: " ",
              value: `Stuur een bericht naar de server owner!`,
            })
            .setTimestamp();
          interaction.reply({ embeds: [offline] });

        }
      })
      .catch((error) => {
        console.log(error);
      });
  },
};
