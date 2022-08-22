const os = require('os');
const path = require('path');
const fs = require('fs');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const serverConfigPath = path.join(__dirname, './config/server-config.js');
const serverConfigtemplatePath = path.join(__dirname, './config/server-config-template.js');
if (!fs.existsSync(serverConfigPath) && fs.existsSync(serverConfigtemplatePath))
    fs.copyFileSync(serverConfigtemplatePath, serverConfigPath);
const serverConfig = require(serverConfigPath);

const webclient = require('./src/common/webclient.js');

const VcsEnum = Object.freeze({ GIT: 'git', SVN: 'svn' });

var appRoot = path.resolve(__dirname);
var vcs;
if (fs.existsSync(path.join(appRoot, '.git')))
    vcs = VcsEnum.GIT;
else if (fs.existsSync(path.join(appRoot, '.svn')))
    vcs = VcsEnum.SVN;

async function update(version, bForce) {
    console.log("[App] Processing update request..");
    if (vcs) {
        var updateCmd;
        if (vcs === VcsEnum.GIT) {
            if (bForce)
                updateCmd = 'git reset --hard && '; //git clean -fxd
            else
                updateCmd = "";
            if (version) {
                if (version === 'latest')
                    updateCmd += 'git pull origin main';
                else
                    updateCmd += 'git switch --detach ' + version;
            } else
                updateCmd += 'git pull';
        } else if (vcs === VcsEnum.SVN)
            updateCmd = 'svn update';

        return new Promise((resolve, reject) => {
            require("child_process").exec('cd ' + appRoot + ' && ' + updateCmd + ' && npm install', function (err, stdout, stderr) {
                if (err)
                    reject(err);
                else {
                    resolve(stdout);
                }
            }.bind(this));
        });
    } else
        throw new Error('No version control system detected');
}

function restart() {
    if (!serverConfig['processManager']) {
        process.on("exit", function () {
            require("child_process").spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached: true,
                stdio: "inherit"
            });
        });
    }
    process.exit();
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
});

app.use('/public', express.static(path.join(__dirname, 'public'), { fallthrough: false }));

var systemRouter = express.Router();
systemRouter.get('/info', function (req, res) {
    var pkg = require('./package.json');
    var info = {};
    info['version'] = pkg['version'];
    info['vcs'] = vcs;
    res.json(info);
});
systemRouter.get('/update', async function (req, res) {
    var version = req.query['v'];
    var bForce = req.query['force'] && (req.query['force'] === 'true');
    var msg;
    var bUpdated = false;
    try {
        msg = await update(version, bForce);
        console.log(msg);
        var strUpToDate;
        if (vcs === VcsEnum.GIT)
            strUpToDate = 'Already up to date.';
        else if (vcs === VcsEnum.SVN)
            strUpToDate = 'Updating \'.\':' + os.EOL + 'At revision';
        if (msg.startsWith(strUpToDate))
            console.log("[App] Already up to date");
        else {
            console.log("[App] ✔ Updated");
            bUpdated = true;
        }
    } catch (error) {
        if (error['message'])
            msg = error['message'];
        else
            msg = error;
        console.error(msg);
        console.log("[App] ✘ Update failed");
    } finally {
        res.send(msg.replace('\n', '<br/>'));
    }
    if (bUpdated)
        restart();
    return Promise.resolve();
});
systemRouter.post('/curl', async (req, res, next) => {
    var url = req.body.url;
    try {
        var body = await webclient.curl(url);
        res.end(body);
    } catch (err) {
        next(err);
    }
});
app.use('/system', systemRouter);

app.get('*', function (req, res, next) {
    /*switch (req.path) {
    }*/
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use(function (err, req, res, next) {
    var msg;
    if (err.errno && err.errno == -4058) {
        if (err.code && err.path)
            msg = err.code + ": " + err.path;
    } else if (err.statusCode && err.statusMessage)
        msg = err.statusCode + ": " + err.statusMessage;

    if (msg)
        console.error(msg);
    else
        console.error(err);

    res.status(500); //res.sendStatus(404);
    if (err) {
        res.send(err);
    } else
        res.send();
});

app.listen(serverConfig.port, () => {
    console.log("[Express] ✔ Server listening on port %d in %s mode", serverConfig.port, app.get('env'));
});