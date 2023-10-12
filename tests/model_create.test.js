const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
const TestSetup = require('./helper/test-setup.js');
const TestHelper = require('./helper/test-helper.js');

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('Testsuit', function () {
    it('#create new model', async function () {
        this.timeout(10000);

        var driver = await new TestSetup(config).getDriver();
        var helper = new TestHelper(driver);

        await delay(1000);

        var modal = await helper.getTopModal();
        if (modal) {
            button = await helper.getButton(modal, 'Skip');
            button.click();
        }

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Models"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();
        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and .="New"]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(100);

        var modal = await helper.getTopModal();
        var form = await helper.getForm(modal);
        var input = await helper.getFormInput(form, 'name');
        input.sendKeys('movie');
        button = await helper.getButton(modal, 'Apply');
        button.click();

        await delay(100);

        var modelModal = await helper.getTopModal();
        button = await helper.getButton(modelModal, 'Add Attribute');
        button.click();

        await delay(100);

        modal = await helper.getTopModal();
        form = await helper.getForm(modal);
        input = await helper.getFormInput(form, 'name');
        input.sendKeys('name');
        form.findElement(webdriver.By.css('select#dataType > option[value="string"]')).click();
        modal.findElement(webdriver.By.xpath('//button[text()="Apply"]')).click();

        await delay(100);

        modal = await helper.getTopModal();
        modal.findElement(webdriver.By.xpath('//button[text()="Apply"]')).click();

        await delay(100);

        modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]')).click();

        await delay(100);

        modal = await helper.getTopModal();
        modal.findElement(webdriver.By.xpath('//button[text()="Ignore"]')).click();

        await delay(1000);

        modal = await helper.getTopModal();
        assert.equal(modal, null);

        //TODO: check

        //driver.quit();
        return Promise.resolve();
    });
});