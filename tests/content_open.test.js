const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(30000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();

        await TestHelper.delay(1000);

        await app.prepare(config['api'], config['username'], config['password']);

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

    it('#open content', async function () {
        this.timeout(10000);

        var response = await driver.executeAsyncScript(async () => {
            var callback = arguments[arguments.length - 1];

            localStorage.setItem('debug', JSON.stringify({ bDebug: true }));
            var controller = app.getController();
            //controller.reloadApplication(); // will kill this script
            await controller.initController();
            controller.getView().initView();
            //await controller.reloadState();

            var data = {
                'key': 'test',
                'value': 'test'
            };

            var ac = app.getController().getApiController().getApiClient();
            ac.requestData('PUT', '_registry', data)
                .then((x) => callback(x))
                .catch((x) => callback(x));
        });

        await TestHelper.delay(1000);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('_registry');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        var count = elements.length;
        assert.equal(count > 1, true);

        await driver.actions({ bridge: true }).contextClick(elements[0], webdriver.Button.RIGHT).perform();

        xpath = `/html/body/ul[@class="contextmenu"]/li[starts-with(text(),"Open")]`;
        const item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();

        await TestHelper.delay(100);

        const url = await driver.getCurrentUrl();
        assert.equal(url.endsWith('/data/_registry?key=test'), true);

        elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(elements.length, 1);

        await driver.navigate().back();
        await TestHelper.delay(100);

        elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(elements.length, count);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            localStorage.setItem('debug', JSON.stringify({ bDebug: false }));
            localStorage.setItem('bConfirmOnApply', 'false');
            const controller = app.getController();
            //controller.reloadApplication(); // will kill this script
            await controller.initController();
            controller.getView().initView();
            //await controller.reloadState();

            callback();
        });

        return Promise.resolve();
    });
});