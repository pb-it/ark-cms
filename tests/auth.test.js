const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

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
        await TestHelper.delay(1000);

        const xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        const form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'email');
        assert.notEqual(input, null);
        await input.sendKeys('-');
        input = await window.getFormInput(form, 'username');
        assert.notEqual(input, null);
        await input.sendKeys('user');
        input = await window.getFormInput(form, 'password');
        assert.notEqual(input, null);
        await input.sendKeys('user');
        //input = await window.getFormInput(form, 'roles');
        //const option = await form.findElement(webdriver.By.css('select#roles... > option[value="user"]'));
        const option = await form.findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"roles")]/option[text()="user"]'));
        assert.notEqual(option, null);
        input = await form.findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"roles")]'));
        assert.notEqual(input, null);
        const value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await TestHelper.delay(100);
        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();

        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.logout();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);

        await app.login('user', 'user');

        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.logout();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);

        await app.login();

        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});