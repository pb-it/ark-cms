const os = require('os');
const path = require('path');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const VcsEnum = require('./common/vcs-enum.js');

class Server {

    _controller;
    _app;

    constructor(controller) {
        this._controller = controller;
        var config = this._controller.getServerConfig();
        var port;
        if (config)
            port = config['port'];
        this._app = this.initApp(port);
    }

    initApp(port) {
        const app = express();
        app.use(cors());
        app.use(bodyParser.json({ limit: '50mb', extended: true }));
        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

        app.get('/robots.txt', function (req, res) {
            res.sendFile(path.join(__dirname, '../public/robots.txt'));
        });

        app.use('/public', express.static(path.join(__dirname, '../public'), { fallthrough: false }));

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
                var sReset = req.query['force'] || req.query['reset'];
                var bReset = (sReset === 'true');
                var bRemove = req.query['rm'] && (req.query['rm'] === 'true');
                var msg;
                try {
                    var bUpdate;
                    if (this._vcs['client'] === VcsEnum.GIT) {
                        var url = 'https://raw.githubusercontent.com/pb-it/wing-cms/main/package.json';
                        var response = await fetch(url);
                        var json = await response.json();
                        var newVersion = json['version'];

                        var appVersion = this.getPkgVersion();
                        if (newVersion !== appVersion) {
                            var partsApp = appVersion.split('.');
                            var partsNew = newVersion.split('.');
                            if ((partsNew[0] > partsApp[0] ||
                                (partsNew[0] == partsApp[0] && partsNew[1] > partsApp[1])) &&
                                !bReset) {
                                msg = "An update of the major or minor release version may result in incompatibilitiy problems! Force only after studying changelog!";
                            } else
                                bUpdate = true;
                        } else {
                            Logger.info("[App] Already up to date");
                            msg = "Already up to date";
                        }
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
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

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

        app.listen(port, () => {
            console.log("[Express] ✔ Server listening on port %d in %s mode", port, app.get('env'));
        });

        return app;
    }
}

module.exports = Server;