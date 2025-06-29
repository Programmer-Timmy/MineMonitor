import {Rcon} from "rcon-client";

class MinecraftRcon {

    constructor(serverIp, serverPort, rconPassword) {
        this.serverIp = serverIp;
        this.serverPort = serverPort;
        this.rconPassword = rconPassword;

        return new Promise((resolve, reject) => {
            const resolver = this
            this.rconClient = new Rcon(this.serverIp, this.serverPort, this.rconPassword).connect().then(() => {
                console.log("Connected to Minecraft RCON server");
                resolve(resolver);
            }).catch((error) => {
                console.error("Failed to connect to Minecraft RCON server:", error);
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