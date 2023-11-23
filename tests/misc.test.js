const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

async function openApi(path) {
    const driver = helper.getBrowser().getDriver();

    const handle = await driver.getWindowHandle();
    await driver.switchTo().newWindow('tab');

    const app = helper.getApp();
    const api = await app.getApiUrl();
    await driver.get(api + path);

    const xpath = `/html/body`;
    const body = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
    const text = await body.getText();

    await driver.close();
    await driver.switchTo().window(handle);

    return Promise.resolve(text);
}

describe('Testsuit', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();

        await TestHelper.delay(1000);

        await app.login(config['api'], config['username'], config['password']);

        await TestHelper.delay(1000);

        const modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    xit('#create db dump', async function () {
        this.timeout(60000);

        const ac = helper.getApiController();
        const tools = ac.getTools();
        await tools.downloadBackup();

        const downloads = await helper.getBrowser().getDownloads();
        const file = downloads[0];
        console.log(file);
        assert.notEqual(file, undefined, 'Download failed');
        var i = 0;
        while (!fs.existsSync(file) && i < 5) {
            await TestHelper.delay(1000);
            i++;
        }
        assert.equal(fs.existsSync(file), true, 'Download failed');

        return Promise.resolve();
    });

    xit('#restore db dump', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ac = helper.getApiController();
        const tools = ac.getTools();

        await tools.restoreBackup(path.join(__dirname, './data/sql/start_01.sql'));

        await TestHelper.delay(1000);

        await ac.restart(true);
        await app.reload();
        await TestHelper.delay(1000);
        await app.login();

        const modal = await app.getTopModal();
        assert.equal(modal, null);

        //TODO: verify data

        return Promise.resolve();
    });

    it('#test public model', async function () {
        this.timeout(60000);

        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const controller = app.getController();
            const model = controller.getModelController().getModel('movie');
            const def = model.getDefinition();
            def['public'] = true;
            await model.setDefinition(def);
            //await app.controller.getApiController().reloadModels();

            callback('OK');
        });
        assert.equal(response, 'OK');

        const path = '/api/data/v1/star';
        var text = await openApi(path);
        //console.log(text);
        assert.notEqual(text, 'Not Found');
        var tmp = JSON.parse(text);
        assert.equal(tmp['data'].length, 2);

        driver.executeScript(function () {
            app.getController().getAuthController().logout();
        });

        await TestHelper.delay(1000);

        const app = helper.getApp();
        var modal = await app.getTopModal();
        assert.notEqual(modal, null);

        text = await openApi(path);
        console.log(text);
        assert.equal(text, 'Unauthorized');

        text = await openApi('/api/data/v1/movie');
        console.log(text);
        assert.notEqual(text, 'Unauthorized');
        tmp = JSON.parse(text);
        assert.equal(tmp['data'].length, 1);

        return Promise.resolve();
    });
});