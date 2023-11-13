const fs = require('fs');
const path = require('path');

//const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
const { TestSetup, TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('Testsuit', function () {
    it('#create content / test cache', async function () {
        this.timeout(10000);

        var driver = await new TestSetup(config).getDriver();
        var helper = new TestHelper(driver);

        await delay(1000);

        var modal = await helper.getTopModal();
        if (modal) {
            button = await helper.getButton(modal, 'Skip');
            button.click();
        }

        driver.executeScript(function () {
            localStorage.setItem('bIndexedDB', 'true');
        });

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Data"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"movie")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][2]/div[contains(@class, 'menuitem') and starts-with(text(),"Show")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][3]/div[contains(@class, 'menuitem') and .="All"]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(1000);

        var script = fs.readFileSync(path.join(path.resolve(__dirname) + '/scripts/content.js'), "utf-8");
        var response = await driver.executeAsyncScript(script);
        var id;
        try {
            id = parseInt(response);
        } catch (error) {
            console.log(error);
        }

        if (id) {
            driver.get(config['host'] + '/data/movie/' + id);

            await delay(1000);

            modal = await helper.getTopModal();
            if (modal) {
                button = await helper.getButton(modal, 'Skip');
                button.click();
            }

            var xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
            var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
            driver.actions({ bridge: true }).contextClick(panel, webdriver.Button.RIGHT).perform();

            xpath = `/html/body/ul[@class="contextmenu"]/li[text()="Details"]`;
            var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
            item.click();

            modal = await helper.getTopModal();
            xpath = `//p[text()="John Doe"]`;
            item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        }

        //driver.quit();
        return Promise.resolve();
    });
});