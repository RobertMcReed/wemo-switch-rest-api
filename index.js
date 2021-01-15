const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname) });

const server = require('./src/server');
const WemoController = require('./src/wemo');
const getConfig = require('./src/getConfig');

if (!process.env.SECRET) {
    console.log('[WARNING] Environment variable SECRET not found.\n\tEndpoints will NOT be protected\n');
}

const main = async () => {
    const deviceConfig = await getConfig();

    let devices = null;
    if (!deviceConfig) {
        devices = await WemoController.connectAllDevices();
    } else {
        devices = await WemoController.connectDevicesByName(deviceConfig);
    }

    server.init(devices);
    server.start(process.env.PORT);
};

if (require.main === module) {
    return main().catch(console.log);
} else {
    throw new Error('Why are you trying to import index.js???');
}
