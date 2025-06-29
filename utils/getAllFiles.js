const fs = require('fs');
const path = require('path');

/**
 * Recursively retrieves all files or folders in a directory.
 * @param {string} directory - The starting directory.
 * @param {boolean} foldersOnly - Whether to return only folders.
 * @returns {string[]} - List of file or folder paths.
 */
module.exports = function getAllFiles(directory, foldersOnly = false) {
    const results = [];

    const items = fs.readdirSync(directory, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(directory, item.name);

        if (item.isDirectory()) {
            // If foldersOnly is true, push the folder
            if (foldersOnly) {
                results.push(fullPath);
            }

            // Recurse into subdirectory regardless
            const nested = getAllFiles(fullPath, foldersOnly);
            results.push(...nested);
        } else if (!foldersOnly) {
            // Only add files when foldersOnly is false
            results.push(fullPath);
        }
    }

    return results;
};
