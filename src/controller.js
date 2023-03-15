const { EOL } = require('os');
const path = require('path');
const fs = require('fs');

const common = require('./common/common.js');
const Server = require('./server.js');

const serverConfigPath = path.join(__dirname, '../config/server-config.js');
const serverConfigtemplatePath = path.join(__dirname, '../config/server-config-template.js');

const VcsEnum = Object.freeze({ GIT: 'git', SVN: 'svn' });

class Controller {

    _appRoot;
    _serverConfig;
    _vcs;
    _server;

    constructor() {
        this._appRoot = path.join(__dirname, "../"); //ends with backslash(linux)
    }

    async init() {
        if (!fs.existsSync(serverConfigPath) && fs.existsSync(serverConfigtemplatePath))
            fs.copyFileSync(serverConfigtemplatePath, serverConfigPath);
        this._serverConfig = require(serverConfigPath);

        if (fs.existsSync(path.join(this._appRoot, '.svn')))
            this._vcs = { 'client': VcsEnum.SVN };
        else if (fs.existsSync(path.join(this._appRoot, '.git'))) {
            this._vcs = { 'client': VcsEnum.GIT };
            var tag;
            try {
                tag = await common.exec('cd ' + this._appRoot + ' && git describe');
                this._vcs['tag'] = tag;
            } catch (error) {
                ;//console.log(error);
            }
            if (!tag) {
                try {
                    var revision = await common.exec('cd ' + this._appRoot + ' && git rev-parse HEAD');
                    if (revision && revision.endsWith(EOL))
                        this._vcs['revision'] = revision.substring(0, revision.length - EOL.length);
                } catch (error) {
                    ;//console.log(error);
                }
            }
        }

        this._server = new Server(this);
        return Promise.resolve();
    }

    getAppRoot() {
        return this._appRoot;
    }

    getServerConfig() {
        return this._serverConfig;
    }

    getInfo() {
        var pkg = require('../package.json');
        var info = {};
        info['version'] = pkg['version'];
        if (this._vcs)
            info['vcs'] = this._vcs;
        return info;
    }

    async update(version, bReset, bRemove) {
        console.log("[App] Processing update request..");
        if (this._vcs) {
            var updateCmd;
            if (this._vcs['client'] === VcsEnum.GIT) {
                if (bReset)
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
            } else if (this._vcs['client'] === VcsEnum.SVN)
                updateCmd = 'svn update';

            if (updateCmd) {
                if (bRemove)
                    updateCmd += " && rm -r node_modules";
            }

            return new Promise((resolve, reject) => {
                if (updateCmd) {
                    require("child_process").exec('cd ' + this._appRoot + ' && ' + updateCmd + ' && npm install', function (err, stdout, stderr) {
                        if (err)
                            reject(err);
                        else {
                            resolve(stdout);
                        }
                    }.bind(this));
                } else
                    reject();
            });
        } else
            throw new Error('No version control system detected!');
    }

    restart() {
        console.log("[App] Restarting..");
        if (!this._serverConfig['processManager']) {
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
}

module.exports = Controller;