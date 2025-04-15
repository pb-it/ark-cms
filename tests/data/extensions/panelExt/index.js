const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

const routePublic = {
    'regex': '^/panelExt/public/(.*)$',
    'fn': async function (req, res, next) {
        const file = req.locals['match'][1];
        const filePath = path.join(__dirname, 'public', file);
        if (fs.existsSync(filePath))
            res.sendFile(filePath);
        else
            next();
        return Promise.resolve();
    }.bind(this)
};

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);

    ws.addExtensionRoute({
        'regex': '^/panelExt/configure$',
        'fn': async function (req, res, next) {
            this._config = req.body;

            try {
                if (req.body && req.body['code'])
                    fs.writeFileSync(path.join(__dirname, './public/test-panel.js'), req.body['code']);
                else
                    throw new Error('Missing code');
                res.send('OK');
            } catch (error) {
                Logger.parseError(error);
                if (error) {
                    res.status(500);
                    if (error['message'])
                        res.send(error['message']);
                    else
                        res.send(error.toString());
                }
            }

            return Promise.resolve();
        }.bind(this)
    });

    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };