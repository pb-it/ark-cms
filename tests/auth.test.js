const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Authentication/Authorization', function () {

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

        await app.setDebugMode(true);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#create user', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('_user');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('email');
        assert.notEqual(input, null);
        await input.sendKeys('-');
        input = await form.getFormInput('username');
        assert.notEqual(input, null);
        await input.sendKeys('user');
        input = await form.getFormInput('password');
        assert.notEqual(input, null);
        await input.sendKeys('user');
        //const option = await form.findElement(webdriver.By.css('select#roles... > option[value="user"]'));
        const option = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"roles")]/option[text()="user"]'));
        assert.notEqual(option, null);
        input = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"roles")]'));
        assert.notEqual(input, null);
        const value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await TestHelper.delay(100);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.logout();
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);

        await app.login('user', 'user');
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.logout();
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);

        await app.login();
        await app.waitLoadingFinished(10);
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});