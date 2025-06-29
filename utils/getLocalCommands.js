const path = require('path');
const getAllFiles = require('./getAllFiles');

module.exports = (exceptions = []) => {
    let localCommands = [];
    const commandNames = new Set();

    const commandCategories = getAllFiles(
        path.join(__dirname, '..', 'commands'),
        true
    );

    for (const commandCategory of commandCategories) {
        const commandFiles = getAllFiles(commandCategory);

        for (const commandFile of commandFiles) {
            const commandObject = require(commandFile);

            if (exceptions.includes(commandObject.name)) {
                continue;
            }
            // Skip if already added (to prevent duplicates)
            if (commandNames.has(commandObject.name)) {
                console.warn(`\x1b[33mDuplicate command found: ${commandObject.name}. Skipping.\x1b[0m`);
                continue;
            }

            commandNames.add(commandObject.name);
            localCommands.push(commandObject);
        }
    }

    console.log(`Found ${localCommands.length} local commands.`);
    return localCommands;
};
