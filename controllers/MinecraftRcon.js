const {Rcon} = require("rcon-client");

class MinecraftRcon {

    /**
     * Creates an instance of MinecraftRcon.
     * @param serverIp
     * @param serverPort
     * @param rconPassword
     * @returns {Promise<unknown>}
     */
    constructor(serverIp, serverPort, rconPassword) {
        this.serverIp = serverIp;
        this.serverPort = serverPort;
        this.rconPassword = rconPassword;


        return new Promise((resolve, reject) => {
            const resolver = this
            this.rconClient = Rcon.connect({
                host: this.serverIp,
                port: this.serverPort || 25575,
                password: this.rconPassword,
            }).then(() => {
                    console.log(`✅ Connected to Minecraft RCON server at ${this.serverIp}:${this.serverPort}`);
                    resolve(resolver);
                })
                .catch((error) => {
                    console.error(`❌ Failed to connect to Minecraft RCON server: ${error.message}`);
                    reject(error);
                });
        });
    }

    /**
     * Executes a command on the Minecraft server via RCON.
     * @param command {string} The command to execute.
     * @returns {Promise<*>} A promise that resolves with the command response.
     * @private
     */
    async _sendCommand(command) {
        if (!this.rconClient) {
            throw new Error("RCON client is not connected");
        }
        try {
            const response = await this.rconClient.send(command);
            return response;
        } catch (error) {
            console.error("Failed to send command to Minecraft RCON server:", error);
            throw error;
        }
    }

    async whitelist(username, action = "add") {
        if (!username) {
            throw new Error("Username is required to whitelist/unwhitelist a player");
        }
        const command = `whitelist ${action} ${username}`;
        return this._sendCommand(command);
    }
}

module.exports = MinecraftRcon;