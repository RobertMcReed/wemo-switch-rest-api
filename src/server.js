const jwt = require('jsonwebtoken');
const express = require('express');

const app = express();

const server = module.exports = {};

server.init = (deviceMap) => {
    const deviceArr = Object.values(deviceMap);

    deviceArr.forEach(device => {
        console.log('\n', 'Registered device: ', JSON.stringify(device.getInfo(), null, 2));
    });

    if (process.env.SECRET) {
        app.use((req, res, next) => {
            let token = null;
            const bearerKey = 'Bearer ';
    
            const { authorization: authHeader } = req.headers;
    
            if (authHeader && String(authHeader).startsWith(bearerKey)) {
                ([, token] = authHeader.split(bearerKey));
            }
            let verified = false;
    
            if (token) {
                try {
                    jwt.verify(token, process.env.SECRET);
                    verified = true;
                } catch {}
            }
    
            if (!verified) {
                return next(new Error('Access Denied'))
            }
    
            next();
        });
    }

    app.get('/wemo/devices', (req, res) => {
        res.json({
            devices: deviceArr.map(device => device.getInfo()),
        });
    });

    app.get(`/wemo/name/:name/state`, async (req, res) => {
        const device = deviceMap[req.params.name];

        if (!device) return res.sendStatus(404);

        const state = await device.getState();
        const data = {
            name: device.rename || device.name,
            state,
        };

        res.json(data);
    });

    app.post(`/wemo/name/:name/state/:state`, async (req, res) => {
        let state = req.params.state.toLowerCase();
        if (!['on', 'off', '0', '1', "true", "false"].includes(state)) return res.sendStatus(400);

        const device = deviceMap[req.params.name];

        if (!device) return res.sendStatus(404);

        state = ['on', '1', 'true'].includes(state) ? true : false;
        await device.setState(state);
        const data = {
            name: device.rename || device.name,
            state,
        };

        res.json(data);
    });

    app.get(`/wemo/name/:name/state/insight`, async (req, res) => {
        const device = deviceMap[req.params.name];

        if (!device) return res.sendStatus(404);
        if (!device.insight) return res.sendStatus(400);

        const insight = await device.getInsight();
        const data = {
            name: device.rename || device.name,
            state: insight.binaryState === '0' ? false : true,
            insight
        };

        res.json(data);
    });

    app.use((err, req, res, next) => {
        res.sendStatus(err.message === 'Access Denied' ? 401 : 500);
    });
};

server.start = (port = 3000) => {
    app.listen(port, () => {
        console.log('\nApp listening on port', port);
    })
}