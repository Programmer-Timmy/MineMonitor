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

    mcs
      .statusJava(serverIp, port, options)
      .then((result) => {
        const resultData = result;
        console.log(resultData);
        let playerData = resultData["players"]["list"].map((element) => {
          return element.name_clean;
        });

        if (resultData["players"]["list"].length === 0) {
          playerData = " ";
        }
        
        const status = new EmbedBuilder()
          .setColor(5763719)
          .setTitle(`Status van ${resultData['host']}`)
          .setDescription(":green_circle: Server is online")
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
              value: `${resultData['players']['max']}`,
            },
            {
                name: "Motd",
                value: `${resultData['motd']['clean']}`
            }
          )

          .setTimestamp();
        interaction.reply({ embeds: [status] });
        // https://mcstatus.io/docs#java-status
      })
      .catch((error) => {
        // If the server is offline, then
        // you will NOT receive an error here.
        // Instead, you will use the `result.online`
        // boolean values in `.then()`.
        // Receiving an error here means that there
        // was an error with the service itself.
      });
  },
};
