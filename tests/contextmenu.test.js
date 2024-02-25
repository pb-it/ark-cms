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

    it('#test contextmenu details/show', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        //await app.navigate('/data/star');
        var sidemenu = app.getSideMenu();
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

        driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Details"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();

        modal = await app.getTopModal();
        xpath = `//p[text()="John Doe"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);

        await modal.closeModal();
        modal = await app.getTopModal();
        assert.equal(modal, null);

        driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Show"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Show"]/following-sibling::div/ul[@class="contextmenu"]/li/div[1][text()="movies"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        elements = await panels[0].findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        text = await elements[0].getText();
        assert.equal(text, 'TestMovie');

        return Promise.resolve();
    });

    it('#test contextmenu set/add', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        //await app.navigate('/data/star');
        var sidemenu = app.getSideMenu();
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

        driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        var xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Set"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Set"]/following-sibling::div/ul[@class="contextmenu"]/li/div[1][text()="gender"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.notEqual(modal, null);
        var form = await helper.getForm(modal);
        var option = await form.findElement(webdriver.By.css('select#gender > option[value="male"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);
        var button = await helper.getButton(modal, 'Apply');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Add"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Add"]/following-sibling::div/ul[@class="contextmenu"]/li/div[1][text()="movies"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.findElement(webdriver.By.xpath('//div[@class="panel"]'));

        var input = await panel.findElement(webdriver.By.xpath('//div[@class="select"][1]/input[starts-with(@list,"movies")]'));
        assert.notEqual(input, null);
        option = await panel.findElement(webdriver.By.xpath('//div[@class="select"][1]/datalist[starts-with(@id,"movies")]/option[text()="TestMovie"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await TestHelper.delay(1000);

        button = await helper.getButton(modal, 'Add');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});