const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - cache', function () {

    let bSetup;
    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new ExtendedTestHelper();
            await helper.setup(config);
            bSetup = true;
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();
        await ExtendedTestHelper.delay(1000);

        await app.prepare(config['api'], config['username'], config['password']);
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    after('#teardown', async function () {
        driver.executeScript(function () {
            localStorage.setItem('bIndexedDB', 'false');
        });
        if (bSetup)
            await helper.teardown();
        return Promise.resolve();
        //return driver.quit();
    });

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test offline mode', async function () {
        this.timeout(30000);

        //await app.setDebugMode(true);
        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            localStorage.setItem('debug', JSON.stringify({ bDebug: true }));
            localStorage.setItem('bExperimentalFeatures', 'true');
            /*const controller = app.getController();
            controller.reloadApplication(true);*/
            //await controller.reloadState();

            callback('OK');
        });
        assert.equal(response, 'OK', 'Enabling features failed');

        const app = helper.getApp();
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        //await app.navigate('/data/star');
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Cache');
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null, 'Missing Cache-Modal');
        const tabPanel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Offline Mode"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        const checkbox = await tabPanel.findElement(webdriver.By.xpath('.//input[@type="checkbox" and @id="offlineMode"]'));
        assert.notEqual(checkbox, null);
        await checkbox.click();
        await ExtendedTestHelper.delay(1000);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        const xpathBubble = `//div[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title='Cache']/span[@class='bubble' and text()='!']`;
        var notification = await driver.findElements(webdriver.By.xpath(xpathBubble));
        assert.equal(notification.length, 1);

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        notification = await driver.findElements(webdriver.By.xpath(xpathBubble));
        assert.equal(notification.length, 0);

        return Promise.resolve();
    });
});