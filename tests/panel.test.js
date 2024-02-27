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

    it('#test details panel', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('star');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        var elements = await panels[0].findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);

        var text = await elements[0].getText();
        assert.equal(text, 'John Doe');

        var contextmenu = await app.openContextMenu(panels[0]);
        await TestHelper.delay(1000);
        await contextmenu.click('Details');
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.notEqual(modal, null);
        //var panel = await modal.findElement(webdriver.By.xpath('//div[contains(@class, "panel")]'));
        var panel = await modal.findElement(webdriver.By.xpath('//div[@class="panel"]')); // classlist must not contain 'selectable'
        assert.notEqual(panel, null);
        var bDraggable = await panel.getAttribute('draggable');
        assert.equal(bDraggable, 'false');

        await modal.closeModal();
        modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});