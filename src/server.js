const os = require('os');
const path = require('path');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Flatted = require('flatted');

const webclient = require('./common/webclient.js');

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
            if (vcs) {
                var version;
                if (req.query['v'])
                    version = req.query['v'];
                else if (req.query['version'])
                    version = req.query['version'];
                var sReset = req.query['force'] || req.query['reset'];
                var bReset = (sReset === 'true');
                var bRemove = req.query['rm'] && (req.query['rm'] === 'true');
                var msg;
                try {
                    msg = await this._controller.update(version, bReset, bRemove);
                    console.log(msg);
                    if (msg) {
                        var strUpToDate;
                        if (vcs['client'] === VcsEnum.GIT)
                            strUpToDate = 'Already up to date.'; // 'Bereits aktuell.' ... localize
                        else if (vcs['client'] === VcsEnum.SVN)
                            strUpToDate = 'Updating \'.\':' + os.EOL + 'At revision';
                        if (msg.startsWith(strUpToDate))
                            console.log("[App] Already up to date");
                        else {
                            console.log("[App] ✔ Updated");
                            bUpdated = true;
                        }
                    } else
                        throw new Error('Missing response from version control system!');
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
                this._controller.restart();
            return Promise.resolve();
        });
        systemRouter.get('/restart', async (req, res) => {
            res.send("Restarting..");
            this._controller.restart();
        });
        systemRouter.get('/shutdown', async (req, res) => {
            res.send("Shutdown initiated");
            process.exit();
        });
        systemRouter.post('/curl', async (req, res, next) => {
            var url = req.body.url;
            try {
                var response = await webclient.get(url);
                res.setHeader('Content-Type', 'application/json');
                res.end(Flatted.stringify(response));
            } catch (err) {
                next(err);
            }
        });
        systemRouter.get('/curl', async (req, res, next) => {
            var url = req.query['url'];
            try {
                var response = await webclient.get(url);
                res.setHeader('Content-Type', 'application/json');
                res.end(Flatted.stringify(response));
            } catch (err) {
                next(err);
            }
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