const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

    let driver;

    async function checkErrorMessage(bEqual) {
        const xpath = '/html/body/div[@class="modal"]/div[@class="modal-content"]/div[@class="panel"]/div';
        const panel = driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 5000);
        assert.notEqual(panel, null);
        const text = await panel.getText();
        //console.log(text);
        assert.equal(text.startsWith('Attempt to connect to API failed!'), bEqual, 'Wrong Error Message!');
        return Promise.resolve();
    }

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

    it('#change API Settings', async function () {
        this.timeout(60000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            localStorage.setItem('api', 'https://localhost:5008');

            callback('OK');
        });
        assert.equal(response, 'OK', 'Changing Settings Failed!');

        const app = helper.getApp();
        await app.reload();

        var modal = await app.getTopModal();
        await checkErrorMessage(true);
        await modal.closeModal();

        xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Configuration"]`;
        var button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(button, null);
        await button.click();

        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        var form = await modal.findElement(webdriver.By.xpath('//form[@class="crudform"]'));
        var input = await helper.getFormInput(form, 'api');
        assert.notEqual(input, null);
        await input.clear();
        await input.sendKeys(helper.getConfig()['api']);

        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply and Reload"]'));
        assert.notEqual(button, null);
        await button.click();

        await TestHelper.delay(1000);

        await checkErrorMessage(false);

        modal = await app.getTopModal(); // close tutorial modal
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Skip"]'));
        assert.notEqual(button, null);
        await button.click();

        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});