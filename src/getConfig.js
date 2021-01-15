const path = require('path');
const fs = require('fs-extra');

const fp = path.resolve(`${__dirname}/../config.json`);

module.exports = async () => {
    if (await fs.pathExists(fp)) {
        return fs.readJSON(fp);
    } else {
        console.log('No config.json found. Scanning for all Wemo devices...');
    }
}