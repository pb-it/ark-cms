//const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
const { TestSetup, TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {
    it('#test login', async function () {
        this.timeout(10000);

        var driver = await new TestSetup(config).getDriver();
        var helper = new TestHelper(driver);

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        if (modal) {
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
        }

        //driver.quit();
        return Promise.resolve();
    });
});