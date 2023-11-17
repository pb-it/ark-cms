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

        await helper.login();

        await TestHelper.delay(1000);

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return await driver.quit();
    });*/

    it('#create new model', async function () {
        this.timeout(10000);

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

        await TestHelper.delay(100);

        var modal = await helper.getTopModal();
        var form = await helper.getForm(modal);
        var input = await helper.getFormInput(form, 'name');
        input.sendKeys('movie');
        button = await helper.getButton(modal, 'Apply');
        button.click();

        await TestHelper.delay(100);

        var modelModal = await helper.getTopModal();
        button = await helper.getButton(modelModal, 'Add Attribute');
        button.click();

        await TestHelper.delay(100);

        modal = await helper.getTopModal();
        form = await helper.getForm(modal);
        input = await helper.getFormInput(form, 'name');
        input.sendKeys('name');
        form.findElement(webdriver.By.css('select#dataType > option[value="string"]')).click();
        modal.findElement(webdriver.By.xpath('//button[text()="Apply"]')).click();

        await TestHelper.delay(100);

        modal = await helper.getTopModal();
        modal.findElement(webdriver.By.xpath('//button[text()="Apply"]')).click();

        await TestHelper.delay(100);

        modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]')).click();

        await TestHelper.delay(100);

        modal = await helper.getTopModal();
        modal.findElement(webdriver.By.xpath('//button[text()="Ignore"]')).click();

        await TestHelper.delay(1000);

        modal = await helper.getTopModal();
        assert.equal(modal, null);

        //TODO: check

        //driver.quit();
        return Promise.resolve();
    });
});