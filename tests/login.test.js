const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');
const TestSetup = require('./helper/test-setup.js');
const TestHelper = require('./helper/test-helper.js');

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('Testsuit', function () {
    it('#test login', async function () {
        this.timeout(10000);

        var driver = await new TestSetup().getDriver('firefox');
        var helper = new TestHelper(driver);

        await delay(1000);

        var modal = await helper.getTopModal();
        var input = modal.findElement(webdriver.By.css('input[id="username"]'));
        input.sendKeys('admin');
        input = modal.findElement(webdriver.By.css('input[id="password"]'));
        input.sendKeys('admin');
        button = await helper.getButton(modal, 'Login');
        button.click();

        //driver.quit();
        return Promise.resolve();
    });
});