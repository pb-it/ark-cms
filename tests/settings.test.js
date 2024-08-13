const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Settings', function () {

    let driver;

    async function checkErrorMessage(bEqual) {
        const xpath = '/html/body/div[@class="modal"]/div[@class="modal-content"]/div[@class="panel"]/div';
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 5000);
        assert.notEqual(panel, null);
        const text = await panel.getText();
        //console.log(text);
        assert.equal(text.startsWith('Attempt to connect to API failed') || text.startsWith('API can\'t be reached'), bEqual, 'Wrong Error Message!');
        return Promise.resolve();
    }

    before('#setup', async function () {
        this.timeout(10000);

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
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        modal = await window.getTopModal();
        assert.notEqual(modal, null, "Modal with connection-error not open");
        await checkErrorMessage(true);
        await modal.closeModal();

        const sidemenu = window.getSideMenu();
        await sidemenu.click('Configuration');

        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var formElement = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        assert.notEqual(formElement, null);
        var form = new Form(helper, formElement);
        var input = await form.getFormInput('api');
        assert.notEqual(input, null);
        await input.clear();
        if (helper.getConfig()['api'])
            await input.sendKeys(helper.getConfig()['api']);

        var button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply and Reload"]'));
        assert.notEqual(button, null);
        await button.click();

        await ExtendedTestHelper.delay(1000);

        await checkErrorMessage(false);

        modal = await window.getTopModal(); // close tutorial modal
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Skip"]'));
        assert.notEqual(button, null);
        await button.click();

        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});