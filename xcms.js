const serverConfig = require('./config/server');

const bodyParser = require('body-parser');
const path = require('path');

const express = require('express');

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
app.use('/public', express.static(path.join(__dirname, 'public'), {fallthrough: false}));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

var systemRouter = express.Router();
systemRouter.get('/update', function (req, res) {
    require("child_process").exec('git pull', function (err, stdout, stderr) {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
        console.log(stdout);
        restart();
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
    if (err.statusCode && err.statusMessage)
        console.error(err.statusCode + ": " + err.statusMessage);
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