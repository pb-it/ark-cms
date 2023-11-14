const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
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

        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return await driver.quit();
    });*/

    it('#open content', async function () {
        this.timeout(10000);

        var modal = await helper.getTopModal();
        if (modal) {
            var elements = await modal.findElements(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
            if (elements && elements.length == 1) {
                button = await helper.getButton(elements[0], 'Skip');
                await button.click();
            }
        }

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

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Data"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 5000);
        await button.click();

        await TestHelper.delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"_registry")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        await button.click();

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][2]/div[contains(@class, 'menuitem') and starts-with(text(),"Show")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        await button.click();

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][3]/div[contains(@class, 'menuitem') and .="All"]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        await button.click();

        await TestHelper.delay(100);

        var xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        var count = elements.length;
        assert.equal(count > 1, true);

        await driver.actions({ bridge: true }).contextClick(elements[0], webdriver.Button.RIGHT).perform();

        xpath = `/html/body/ul[@class="contextmenu"]/li[starts-with(text(),"Open")]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        await item.click();

        await TestHelper.delay(100);

        var url = await driver.getCurrentUrl();
        assert.equal(url.endsWith('/data/_registry?key=test'), true);

        elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(elements.length, 1);

        await driver.navigate().back();
        await TestHelper.delay(100);

        elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(elements.length, count);

        response = await driver.executeAsyncScript(async () => {
            var callback = arguments[arguments.length - 1];

            localStorage.setItem('debug', JSON.stringify({ bDebug: false }));
            localStorage.setItem('bConfirmOnApply', 'false');
            var controller = app.getController();
            //controller.reloadApplication(); // will kill this script
            await controller.initController();
            controller.getView().initView();
            //await controller.reloadState();

            callback();
        });

        //driver.quit();
        return Promise.resolve();
    });
});