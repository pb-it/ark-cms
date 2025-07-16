const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Database', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(20000);

        if (!global.helper) {
            global.helper = new ExtendedTestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();
        await ExtendedTestHelper.delay(1000);

        await app.prepare(config['api'], config['username'], config['password']);
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
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

        const app = helper.getApp();
        const ac = app.getApiController();
        const tools = ac.getTools();
        await tools.downloadBackup();

        const downloads = await helper.getBrowser().getDownloads();
        const file = downloads[0];
        console.log(file);
        assert.notEqual(file, undefined, 'Download failed');
        var i = 0;
        while (!fs.existsSync(file) && i < 5) {
            await ExtendedTestHelper.delay(1000);
            i++;
        }
        assert.equal(fs.existsSync(file), true, 'Download failed');

        return Promise.resolve();
    });

    xit('#restore db dump', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ac = app.getApiController();
        const tools = ac.getTools();

        await tools.restoreBackup(path.join(__dirname, './data/sql/start_01.sql'));
        await ExtendedTestHelper.delay(1000);

        await ac.restart(true);
        await app.reload(true); // bForceMigration
        await ExtendedTestHelper.delay(1000);
        await app.login();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        const modal = await window.getTopModal();
        assert.equal(modal, null);

        //TODO: verify data

        return Promise.resolve();
    });

    it('#test character encoding', async function () {
        this.timeout(60000);

        const app = helper.getApp();

        const ds = app.getDataService();
        var data = {
            'name': 'Max Müller' // mutated vowel
        }
        var response = await ds.create('star', data);
        console.log(response);
        assert.notEqual(response, null);
        const id = response['id'];

        const ac = app.getApiController();
        const tools = ac.getTools();

        await tools.downloadBackup();
        const downloads = await helper.getBrowser().getDownloads();
        const file = downloads[0];
        console.log(file);
        assert.notEqual(file, undefined, 'Download failed');
        var i = 0;
        while (!fs.existsSync(file) && i < 5) {
            await ExtendedTestHelper.delay(1000);
            i++;
        }
        assert.equal(fs.existsSync(file), true, 'Download failed');

        await tools.restoreBackup(file);
        await ExtendedTestHelper.delay(1000);

        await ac.restart(true);
        await app.reload();
        await ExtendedTestHelper.delay(1000);
        await app.login();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.navigate('/data/star/' + id);
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var title = await panels[0].getElement().findElement(webdriver.By.xpath('./div/div/p'));
        assert.notEqual(title, null);
        var text = await title.getText();
        assert.equal(text, 'Max Müller');

        return Promise.resolve();
    });
});