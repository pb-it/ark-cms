const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Create #2', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
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

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#create content with relation - test cache update', async function () {
        this.timeout(15000);

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
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const script = fs.readFileSync(path.join(path.resolve(__dirname) + '/data/scripts/create_star.js'), "utf-8");
        const response = await driver.executeAsyncScript(script);
        var id;
        try {
            id = parseInt(response);
        } catch (error) {
            console.log(error);
        }
        assert.notEqual(id, null, 'No ID after entry creation');
        driver.get(config['host'] + '/data/movie/' + id);

        await ExtendedTestHelper.delay(1000);

        var xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        driver.actions({ bridge: true }).contextClick(panel, webdriver.Button.RIGHT).perform();

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Details"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();

        modal = await window.getTopModal();
        xpath = `//p[text()="John Doe"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#create within create - with backlink property(via)', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        await helper.setupModel(path.join(__dirname, './data/models/profile.json'));
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
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
        var input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('profiles');
        await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var elem = await form.getElement().findElement(webdriver.By.css('select#model > option[value="profile"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(100);
        elem = await form.getElement().findElement(webdriver.By.xpath('//select[@name="multiple"]/option[@value="true"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(100);
        input = await form.getFormInput('tableName');
        var bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, null);
        input = await form.getFormInput('via');
        bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, null);
        await input.sendKeys('star');
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('id');
        assert.notEqual(input, null);
        var bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, 'true');
        input = await form.getFormInput('created_at');
        assert.notEqual(input, null);
        bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, 'true');
        var entry = await form.getFormEntry('profiles');
        assert.notEqual(entry, null);
        var button = await entry.findElement(webdriver.By.xpath('.//button[text()="Create"]'));
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});