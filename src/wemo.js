const Wemo = require('wemo-client');

const wemo = new Wemo();

function WemoController({
  ip = null,
  port = null,
  name = null,
  rename = null,
}) {
  if (!(name || (ip && port))) throw new Error('Must provide either name or ip and port to WemoController constructor');
  
  this.name = name;
  this.ip = ip;
  this.port = port;
  this.client = null;
  this.rename = rename;
  this.insight = false;
  this.__registeredAt = Date.now();
}

WemoController.discover = async function() {
  wemo.discover((err, deviceInfo) => {
    if (err) return console.log(err);

    console.log(`\nFound device: ${JSON.stringify(deviceInfo, null, 2)}`);
  });
}

WemoController.connectAllDevices = async function() {
  let settled = false;
  const foundDevices = {};

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      settled = true;
      console.log('TIMEOUT_HIT');
      if (!Object.keys(foundDevices).length) {
        reject('NO_DEVICES_FOUND');
      } else {
        resolve(foundDevices);
      }
    }, 5000);

    wemo.discover(async (err, deviceInfo) => {
      if (settled) return;

      if (err) {
        settled = true;
        return reject(err);
      }

      if (!foundDevices[deviceInfo.friendlyName]) {
        const deviceData = { name: deviceInfo.friendlyName };
        const device = new WemoController(deviceData);
        try {
          await device.connect(deviceInfo);
          foundDevices[device.name] = device;
        } catch (e) {
          console.log('Could not connect to device:', e);
        }
      }
    });
  });
}

WemoController.connectDevicesByName = async function(deviceProps) {
  const deviceMap = deviceProps.reduce((acc, props) => ({
    ...acc,
    [props.name]: { ...props },
  }), {});

  let settled = false;
  const foundDevices = {};
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      settled = true;
      console.log('TIMEOUT_HIT');
      if (!Object.keys(foundDevices).length) {
        reject('NO_DEVICES_FOUND');
      } else {
        console.log('DEVICES_NOT_FOUND: ', JSON.stringify(deviceMap, null, 2));
        resolve(foundDevices);
      }
    }, 5000);
  
    wemo.discover(async (err, deviceInfo) => {
      if (settled) return;
      
      if (err) {
        settled = true;
        return reject(err);
      }

      if (deviceMap[deviceInfo.friendlyName]) {
        const deviceData = { ...deviceMap[deviceInfo.friendlyName] };
        delete deviceMap[deviceInfo.friendlyName];
        const device = new WemoController(deviceData);
        try {
          await device.connect(deviceInfo);
          foundDevices[device.rename || device.name] = device;
        } catch(e) {
          console.log('Could not connect to device:', e);
          deviceMap[deviceInfo.friendlyName] = deviceData;
        }
      }

      if (!Object.keys(deviceMap).length) {
        clearTimeout(timeout);
        settled = true;
        resolve(foundDevices);
      }
    });
  });
}

WemoController.prototype.getDeviceInfoByIpAndPort = function() {
  if (!(this.ip && this.port)) throw new Error('device ip and port are required if no name is provided.');

  return new Promise((resolve, reject) => {
    wemo.load(`http://${this.ip}:${this.port}/setup.xml`, (err, deviceInfo) => {
      if (err) return reject(err);

      return resolve(deviceInfo);
    });
  });
}

WemoController.prototype.registerDevice = function(deviceInfo) {
  this.client = wemo.client(deviceInfo);

  // You definitely want to listen to error events (e.g. device went offline),
  // Node will throw them as an exception if they are left unhandled  
  this.client.on('error', (err) => {
    console.log('\nDevice: ', JSON.stringify(this.getInfo(), null, 2));
    console.log('Error: %s', err.code);
  });

  // // Handle BinaryState events
  this.client.on('binaryState', (value) => {
    if (Date.now() - this.__registeredAt < 1000) return;

    console.log('\nDevice: ', JSON.stringify(this.getInfo(), null, 2));
    console.log('Binary State changed to: %s', value);
  });
}

WemoController.prototype.connect = async function(deviceInfo) {
  if (!deviceInfo) {
    deviceInfo = await this.getDeviceInfoByIpAndPort();
  }

  this.name = deviceInfo.friendlyName;
  this.ip = deviceInfo.host;
  this.port = deviceInfo.port;
  this.insight = deviceInfo.deviceType.includes('insight');

  this.registerDevice(deviceInfo);

  return this;
}

WemoController.prototype.getInfo = function() {
  return {
    name: this.rename || this.name,
    ip: this.ip,
    port: this.port,
  };
}

WemoController.prototype.getState = function() {
  return new Promise((resolve, reject) => {
    if (!this.client) throw new Error('WemoController client must be connected before calling member functions.');
    
    this.client.getBinaryState((err, state) => {
      if (err) return reject(err);
      return resolve(state === '0' ? false : true);
    });
  });
}

WemoController.prototype.setState = function(state) {
  return new Promise((resolve, reject) => {
    if (!this.client) throw new Error('WemoController client must be connected before calling member functions.');
  
    this.client.setBinaryState(state ? "1" : "0", (err) => {
      if (err) return reject(err);
      return resolve(true);
    });
  });
} 

WemoController.prototype.on = function() {
  return this.setState(true);
}

WemoController.prototype.off = function() {
  return this.setState(false);
}

WemoController.prototype.getInsight = function() {
  return new Promise((resolve, reject) => {
    if (!this.client) throw new Error('WemoController client must be connected before calling member functions.');
  
    this.client.getInsightParams((err, binaryState, instantPower, data) => {
      if (err) return reject(err);
      return resolve({
        binaryState,
        instantPower,
        data,
      });
    });
  });
}

module.exports = WemoController;
