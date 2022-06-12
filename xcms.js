const server = require('./config/server');

const bodyParser = require('body-parser');
const path = require('path');

const express = require('express');

const webclient = require('./src/common/webclient.js');

const app = express();
//app.use(express.static(application_root));
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('*', function (req, res, next) {
    /*switch (req.path) {
    }*/
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.post('/curl', async (req, res, next) => {
    var url = req.body.url;
    try {
        var body = await webclient.curl(url);
        res.end(body);
    } catch (err) {
        next(err);
    }
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

app.listen(server.port, () => {
    console.log("✔ Express server listening on port %d in %s mode", server.port, app.get('env'));
});