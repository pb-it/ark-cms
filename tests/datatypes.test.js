const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(30000);

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

    it('#test datatypes', async function () {
        this.timeout(60000);

        await helper.setupModel(path.join(__dirname, './data/models/misc.json'));
        const app = helper.getApp();
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('misc');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('string');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('url');
        assert.notEqual(input, null);
        await input.sendKeys('https://example.com/');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('json');
        assert.notEqual(input, null);
        await input.sendKeys('[]');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('timestamp');
        assert.notEqual(input, null);
        const date = new Date();
        const isoString = date.toISOString().replace('T', ' ').split('.')[0];
        await input.sendKeys(isoString);
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('datetime');
        assert.notEqual(input, null);
        await input.sendKeys(isoString);
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('date');
        assert.notEqual(input, null);
        await input.sendKeys('2020-01-01');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('time');
        assert.notEqual(input, null);
        await input.sendKeys('00:00:01');
        await ExtendedTestHelper.delay(1000);
        var button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('string');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'Test');
        input = await form.getFormInput('url');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'https://example.com/');
        input = await form.getFormInput('json');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '[]');
        input = await form.getFormInput('timestamp');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, isoString);
        input = await form.getFormInput('datetime');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, isoString);
        input = await form.getFormInput('date');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '2020-01-01');
        input = await form.getFormInput('time');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '00:00:01.000');

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});