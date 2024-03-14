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

    it('#open content', async function () {
        this.timeout(10000);

        /*var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
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
                await ac.requestData('PUT', '_registry', null, data);
                res = 'OK';
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, 'OK', "Creating entry failed");
        await TestHelper.delay(1000);*/

        const app = helper.getApp();
        await app.setDebugMode(true);

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
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
        assert.equal(elements.length, 1);

        await driver.actions({ bridge: true }).contextClick(elements[0], webdriver.Button.RIGHT).perform();

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Open"]`;
        const item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null);
        await item.click();

        await TestHelper.delay(100);

        const url = await driver.getCurrentUrl();
        assert.equal(url.endsWith('/data/_registry?key=version'), true);

        elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(elements.length, 1);

        await driver.navigate().back();
        await TestHelper.delay(100);

        elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(elements.length, 1);

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