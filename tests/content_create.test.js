const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
const { TestSetup, TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('Testsuit', function () {
    it('#create content', async function () {
        this.timeout(10000);

        var driver = await new TestSetup(config).getDriver();
        var helper = new TestHelper(driver);

        await delay(1000);

        var modal = await helper.getTopModal();
        if (modal) {
            var elements = await modal.findElements(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
            if (elements && elements.length == 1) {
                button = await helper.getButton(elements[0], 'Skip');
                button.click();
            }
        }

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Data"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"movie")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][2]/div[contains(@class, 'menuitem') and .="Create"]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(100);

        xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        var form = await helper.getForm(panel);
        var input = await helper.getFormInput(form, 'name');
        input.sendKeys('TestMovie');
        button = await helper.getButton(panel, 'Create');
        button.click();

        //driver.quit();
        return Promise.resolve();
    });
});