const os = require('os');
const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

async function openApi(path) {
    const driver = helper.getBrowser().getDriver();

    const handle = await driver.getWindowHandle();
    await driver.switchTo().newWindow('tab');

    const app = helper.getApp();
    const api = await app.getApiUrl();
    await driver.get(api + path);
    await ExtendedTestHelper.delay(1000);

    //TODO: basic auth popup handling

    const xpath = `/html/body`;
    const body = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
    const text = await body.getText();

    await driver.close();
    await driver.switchTo().window(handle);

    return Promise.resolve(text);
}

describe('Testsuit - Misc.', function () {

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

    it('#changelog on update', async function () {
        this.timeout(60000);

        driver.executeScript(function () {
            localStorage.setItem('appVersion', '0.1.1');
        });
        await ExtendedTestHelper.delay(1000);

        const app = helper.getApp();
        await app.logout();
        await ExtendedTestHelper.delay(1000);

        await app.login();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        const button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
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
        await app.reload();
        await ExtendedTestHelper.delay(1000);
        await app.login();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        const modal = await window.getTopModal();
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
            await model.setDefinition(def, true);
            //await app.controller.getApiController().reloadModels();

            callback('OK');
        });
        assert.equal(response, 'OK');

        const path = '/api/data/v1/star';
        var text = await openApi(path);
        //console.log(text);
        assert.notEqual(text, 'Not Found');
        var tmp = JSON.parse(text);
        assert.equal(tmp['data'].length, 1);

        const app = helper.getApp();
        await app.logout();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);

        text = await openApi(path);
        console.log(text);
        assert.equal(text, 'Unauthorized');

        text = await openApi('/api/data/v1/movie');
        console.log(text);
        assert.notEqual(text, 'Unauthorized');
        tmp = JSON.parse(text);
        assert.equal(tmp['data'].length, 7);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        await app.login();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#test API restart while create', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];

        const ac = app.getApiController();
        await ac.restart(true);

        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var modal;
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null); // 401: Unauthorized
        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.logout();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        await app.login();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    xit('#test API restart while create #2', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
                const controller = app.getController();
                const ac = controller.getApiController();
                await ac.restartApi();
                res = 'OK';
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, 'OK', "Restarting API failed");
        await ExtendedTestHelper.delay(2000);

        /*const cmdCtrl = os.platform().includes('darwin') ? webdriver.Key.COMMAND : webdriver.Key.CONTROL;
        await driver.actions().keyDown(cmdCtrl)
            .sendKeys('r') // reload
            .keyUp(cmdCtrl)
            .perform();
            sidemenu = window.getSideMenu();*/
        sidemenu = window.getSideMenu();
        await sidemenu.click('Reload');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null); // ERR_CONNECTION_REFUSED
        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});