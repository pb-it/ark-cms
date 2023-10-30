const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
const TestSetup = require('./helper/test-setup.js');
const TestHelper = require('./helper/test-helper.js');

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('Testsuit', function () {
    it('#open content', async function () {
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

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Data"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(1000);

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"_registry")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][2]/div[contains(@class, 'menuitem') and starts-with(text(),"Show")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][3]/div[contains(@class, 'menuitem') and .="All"]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(100);

        var xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        var count = elements.length;
        assert.equal(count > 1, true);

        driver.actions({ bridge: true }).contextClick(elements[0], webdriver.Button.RIGHT).perform();

        xpath = `/html/body/ul[@class="contextmenu"]/li[starts-with(text(),"Open")]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        item.click();

        await delay(100);

        var url = await driver.getCurrentUrl();
        assert.equal(url.endsWith('/data/_registry?key=test'), true);

        elements = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(elements.length, 1);

        await driver.navigate().back();
        await delay(100);

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