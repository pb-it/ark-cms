const path = require('path');

const Controller = require(path.join(__dirname, './src/controller.js'));

const app = new Controller();

(async () => {
    await app.init();
    return Promise.resolve();
})();