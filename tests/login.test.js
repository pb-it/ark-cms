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

        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return await driver.quit();
    });*/

    it('#test login', async function () {
        this.timeout(10000);

        var modal = await helper.getTopModal();
        assert.equal(modal != null, true, 'Modal not open!');
        var input = modal.findElement(webdriver.By.css('input[id="username"]'));
        input.sendKeys('admin');
        input = modal.findElement(webdriver.By.css('input[id="password"]'));
        input.sendKeys('admin');
        button = await helper.getButton(modal, 'Login');
        button.click();

        await TestHelper.delay(1000);

        modal = await helper.getTopModal();
        if (modal) {
            button = await helper.getButton(modal, 'Skip');
            button.click();
        }

        //driver.quit();
        return Promise.resolve();
    });
});