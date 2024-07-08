const { EOL } = require('os');
const path = require('path');
const fs = require('fs');

const VcsEnum = require('./common/vcs-enum.js');
const common = require('./common/common.js');
const Server = require('./server.js');

const serverConfigPath = path.join(__dirname, '../config/server-config.js');
const serverConfigtemplatePath = path.join(__dirname, '../config/server-config-template.js');

class Controller {

    _appRoot;
    _serverConfig;
    _vcs;
    _server;

    constructor() {
        this._appRoot = path.join(__dirname, "../"); //ends with backslash(linux)
    }

    async init(config) {
        if (config)
            this._serverConfig = config;
        else {
            if (!fs.existsSync(serverConfigPath) && fs.existsSync(serverConfigtemplatePath))
                fs.copyFileSync(serverConfigtemplatePath, serverConfigPath);
            this._serverConfig = require(serverConfigPath);
        }

        this._vcs = await this._checkVcs(this._appRoot);

        this._server = new Server(this);
        await this._server.initApp();
        return Promise.resolve();
    }

    async _checkVcs(appRoot) {
        var vcs;
        if (fs.existsSync(path.join(appRoot, '.svn')))
            vcs = { 'client': VcsEnum.SVN };
        else if (fs.existsSync(path.join(appRoot, '.git'))) {
            vcs = { 'client': VcsEnum.GIT };
            var tag;
            try {
                tag = await common.exec('cd ' + appRoot + ' && git describe --tags --exact-match');
                if (tag) {
                    if (tag.endsWith(EOL))
                        tag = tag.substring(0, tag.length - EOL.length);
                    vcs['tag'] = tag;
                }
            } catch (error) {
                ;//console.log(error);
            }
            if (!tag) {
                try {
                    var revision = await common.exec('cd ' + appRoot + ' && git rev-parse HEAD');
                    if (revision) {
                        if (revision.endsWith(EOL))
                            revision = revision.substring(0, revision.length - EOL.length);
                        vcs['revision'] = revision;
                    }
                } catch (error) {
                    ;//console.log(error);
                }
            }
        }
        return Promise.resolve(vcs);
    }

    getAppRoot() {
        return this._appRoot;
    }

    getServer() {
        return this._server;
    }

    getServerConfig() {
        return this._serverConfig;
    }

    getPkgVersion() {
        var pkg = require('../package.json');
        return pkg['version'];
    }

    getInfo() {
        var info = {};
        info['version'] = this.getPkgVersion();
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
                    require("child_process").exec('cd ' + this._appRoot + ' && ' + updateCmd + ' && npm install && npm run clean && npm run build', function (err, stdout, stderr) {
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