const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

    let driver;

    async function checkErrorMessage(bEqual) {
        const xpath = '/html/body/div[@class="modal"]/div[@class="modal-content"]/div[@class="panel"]/div';
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 5000);
        assert.equal(panel != null, true);
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

        await TestHelper.delay(1000);

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return await driver.quit();
    });*/

    it('#change API Settings', async function () {
        this.timeout(60000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            localStorage.setItem('api', 'https://localhost:5008');

            callback('OK');
        });
        assert.equal(response, 'OK', 'Changing Settings Failed!');

        await driver.navigate().refresh();
        await TestHelper.delay(1000);

        await checkErrorMessage(true);
        await helper.closeModal();

        xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Configuration"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        await button.click();

        await TestHelper.delay(1000);

        modal = await helper.getTopModal();
        assert.equal(modal != null, true);
        var form = await helper.getForm(modal);
        var input = await helper.getFormInput(form, 'api');
        await input.clear();
        await input.sendKeys('https://localhost');

        button = await helper.getButton(modal, 'Apply and Reload');
        await button.click();

        await TestHelper.delay(1000);

        await checkErrorMessage(false);

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        //driver.quit();
        return Promise.resolve();
    });
});