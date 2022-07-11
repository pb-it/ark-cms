const path = require('path');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const serverConfig = require('./config/server');
const webclient = require('./src/common/webclient.js');

function restart() {
    if (!serverConfig.pm2) {
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
systemRouter.get('/update', function (req, res) {
    var appRoot = path.resolve(__dirname);
    require("child_process").exec('cd ' + appRoot + ' && git pull && npm update', function (err, stdout, stderr) {
        if (err)
            console.error(`exec error: ${err}`);
        else {
            console.log(stdout);
            restart();
        }
    }.bind(this));
    res.send("updating..");
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
    console.log("✔ Express server listening on port %d in %s mode", serverConfig.port, app.get('env'));
});