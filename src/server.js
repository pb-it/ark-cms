const os = require('os');
const path = require('path');

const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const VcsEnum = require('./common/vcs-enum.js');

class Server {

    _controller;
    _publicDir;
    _app;
    _svr;

    constructor(controller) {
        this._controller = controller;
        if (process.env.NODE_ENV === 'production')
            this._publicDir = '../dist/public';
        else
            this._publicDir = '../public';
    }

    async initApp() {
        const app = express();
        app.use(cors());
        app.use(bodyParser.json({ limit: '50mb', extended: true }));
        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

        app.get('/robots.txt', function (req, res) {
            res.sendFile(path.join(__dirname, this._publicDir + '/robots.txt'));
        }.bind(this));

        app.use('/public', express.static(path.join(__dirname, this._publicDir), { fallthrough: false }));

        var systemRouter = express.Router();
        systemRouter.get('/info', function (req, res) {
            res.json(this._controller.getInfo());
        }.bind(this));
        systemRouter.get('/update', async function (req, res) {
            var bUpdated = false;
            if (this._vcs) {
                var newVersion;
                if (req.query['v'])
                    newVersion = req.query['v'];
                else if (req.query['version'])
                    newVersion = req.query['version'];
                var bForce = req.query['force'] === 'true';
                var bReset = req.query['reset'] === 'true';
                var bRemove = req.query['rm'] === 'true';
                var msg;
                try {
                    var bUpdate;
                    if (!bForce && this._vcs['client'] === VcsEnum.GIT) {
                        if (newVersion) {
                            var v;
                            if (newVersion === 'latest') {
                                var url = 'https://raw.githubusercontent.com/pb-it/ark-cms/main/package.json';
                                var response = await fetch(url);
                                var json = await response.json();
                                v = json['version'];
                            } else
                                v = newVersion;

                            var appVersion = this.getPkgVersion();
                            if (v !== appVersion) {
                                var partsApp = appVersion.split('.');
                                var partsNew = v.split('.');
                                if (partsNew[0] > partsApp[0] ||
                                    (partsNew[0] == partsApp[0] && partsNew[1] > partsApp[1])) {
                                    msg = "An update of the major or minor release version may result in incompatibilitiy problems! Force only after studying changelog!";
                                } else
                                    bUpdate = true;
                            } else {
                                console.log("[App] Already up to date");
                                msg = "Already up to date";
                            }
                        } else
                            bUpdate = true;
                    } else
                        bUpdate = true;

                    if (bUpdate) {
                        msg = await this.update(newVersion, bReset, bRemove);
                        console.log(msg);
                        if (msg) {
                            var strUpToDate;
                            if (this._vcs['client'] === VcsEnum.GIT)
                                strUpToDate = 'Already up to date.'; // 'Bereits aktuell.' ... localize
                            else if (this._vcs['client'] === VcsEnum.SVN)
                                strUpToDate = 'Updating \'.\':' + os.EOL + 'At revision';
                            if (msg.startsWith(strUpToDate))
                                console.log("[App] Already up to date");
                            else {
                                console.log("[App] ✔ Updated");
                                bUpdated = true;
                            }
                        } else
                            throw new Error('Missing response from version control system!');
                    }
                } catch (error) {
                    if (error['message'])
                        msg = error['message']; // 'Command failed:...'
                    else
                        msg = error;
                    console.error(msg);
                    console.log("[App] ✘ Update failed");
                } finally {
                    res.send(msg.replace('\n', '<br/>'));
                }
            } else
                res.send('No version control system detected!');
            if (bUpdated)
                this.restart();
            return Promise.resolve();
        }.bind(this._controller));
        systemRouter.get('/restart', async (req, res) => {
            res.send("Restarting..");
            this._controller.restart();
        });
        systemRouter.get('/shutdown', async (req, res) => {
            res.send("Shutdown initiated");
            process.exit();
        });
        app.use('/cms', systemRouter);

        app.get('*', function (req, res, next) {
            res.sendFile(path.join(__dirname, this._publicDir + '/index.html'));
        }.bind(this));

        /*app.use(function (err, req, res, next) {
            var msg;
            if (err.errno && err.errno == -4058) { // ENOENT: no such file or directory
                if (err.code && err.path)
                    msg = err.code + ": " + err.path;
            } else if (err.statusCode && err.statusMessage)
                msg = err.statusCode + ": " + err.statusMessage;
        
            res.status(500);
            if (msg) {
                console.error(msg);
                res.send(msg);
            } else {
                console.error(err);
                res.send(err);
            }
        });*/

        const config = this._controller.getServerConfig();
        /*var port;
        if (config)
            port = config['port'];
        app.listen(port, () => {
            console.log("[Express] ✔ Server listening on port %d in %s mode", port, app.get('env'));
        });*/
        this._svr = await this._initServer(app, config, this._controller.getAppRoot());

        return Promise.resolve(app);
    }

    async _initServer(app, config, appRoot) {
        var server;
        if (config['ssl'] && appRoot) {
            const options = {
                key: fs.readFileSync(path.join(appRoot, 'config/ssl/key.pem'), 'utf8'),
                cert: fs.readFileSync(path.join(appRoot, 'config/ssl/cert.pem'), 'utf8')
            };

            if (options)
                server = https.createServer(options, app);
            else {
                var msg = "No valid SSL certificate found";
                console.error(msg);
                Logger.error("[App] ✘ " + msg);
            }
        } else
            server = http.createServer(app);
        if (server) {
            /*server.setTimeout(600 * 1000, (socket) => {
                console.log('timeout');
                socket.destroy();
            });*/
            return new Promise(function (resolve, reject) {
                server.listen(config['port'], function () {
                    console.log(`[Express] ✔ Server listening on port ${config['port']} in ${app.get('env')} mode`);
                    resolve(this);
                });
                server.once('error', (err) => {
                    if (err) {
                        server.close();
                        reject(err);
                    }
                });
            });
        }
        return Promise.reject();
    }

    async teardown() {
        return new Promise(function (resolve, reject) {
            if (this._svr) {
                const id = setTimeout(function () {
                    throw new Error('[Express] ✘ Could not close connections in time, forcefully shutting down');
                }, 10000);
                this._svr.close(function (err) {
                    clearTimeout(id);
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            } else
                resolve();
        }.bind(this));
    }
}

module.exports = Server;