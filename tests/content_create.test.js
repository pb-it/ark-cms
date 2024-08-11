const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Create', function () {

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

        await app.prepare(config['api'], config['username'], config['password']);
        await TestHelper.delay(1000);

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

    it('#create movie', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        const canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        const panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        const form = await panel.getForm();
        assert.notEqual(form, null);
        const input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.sendKeys('TestMovie');
        const button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        return Promise.resolve();
    });
});