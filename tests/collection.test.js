const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Collection', function () {

    let bSetup;
    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            bSetup = true;
            global.helper = new ExtendedTestHelper();
            await helper.setup(config);
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
        if (bSetup) {
            await helper.teardown();
            await driver.quit();
        }
        return Promise.resolve();
    });

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test create collection model', async function () {
        this.timeout(30000);

        await helper.setupModel(path.join(__dirname, './data/models/image.json'));
        await helper.setupModel(path.join(__dirname, './data/models/gallery.json'));

        return Promise.resolve();
    });

    it('#test add collection attribute', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        await app.navigate('/');

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);

        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);
        var panel = await modelModal.getPanel();
        assert.notEqual(panel, null);
        var button = await panel.getButton('Add Attribute');
        assert.notEqual(button, null, 'Button not found!');
        button.click();
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        const input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('galleries');
        await ExtendedTestHelper.delay(1000);
        await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var elem = await form.getElement().findElement(webdriver.By.css('select#model > option[value="gallery"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        elem = await form.getElement().findElement(webdriver.By.xpath('.//select[@name="multiple"]/option[@value="true"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        button = await modelModal.findElement(webdriver.By.xpath('.//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('.//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test add relation', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        var elements = await panels[0].findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'TestMovie');

        var contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Add');
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('galleries');
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var button = await panel.getElement().findElement(webdriver.By.xpath('./div/div[@class="select"][1]/button[text()="Create"]'));
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('title');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('TestGallery');
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('.//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        button = await panel.getButton('Add');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test remove relation', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        var elements = await panels[0].findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'TestMovie');

        var contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var entry = await form.getFormEntry('galleries');
        assert.notEqual(entry, null);
        var button = await entry.findElement(webdriver.By.xpath('./div[@class="value"]/div[@class="select"]/ul/li/button[text()="Remove"]'));
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Update');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('.//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});