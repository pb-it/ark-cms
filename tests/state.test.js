const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(30000);

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

    xit('#test prepare', async function () {
        this.timeout(30000);

        await helper.setupScenario(1);

        const app = helper.getApp();
        await app.navigate('/data/studio');
        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 3);

        await app.navigate('/data/movie');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        return Promise.resolve();
    });

    it('#test state', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        var text = await panels[0].getText();
        assert.equal(text, 'Iron Man');

        //await window.getTopNavigationBar().openSort();
        const xpathSort = `//*[@id="topnav"]/div/div/div/i[contains(@class, 'fa-sort')]`;
        const sort = await driver.findElements(webdriver.By.xpath(xpathSort));
        assert.equal(sort.length, 1);
        await sort[0].click();
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var option = await form.getElement().findElement(webdriver.By.css('select#sortCriteria > option[value="name"]'));
        assert.notEqual(option, null);
        await option.click();
        await ExtendedTestHelper.delay(1000);
        option = await form.getElement().findElement(webdriver.By.css('select#sort > option[value="asc"]'));
        assert.notEqual(option, null);
        await option.click();
        await ExtendedTestHelper.delay(1000);
        var button = await window.getButton(modal, 'Set as default');
        assert.notEqual(button, null);
        await button.click();
        await driver.wait(webdriver.until.alertIsPresent());
        var alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Changed successfully');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);
        button = await window.getButton(modal, 'Apply');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        await app.reload();
        await ExtendedTestHelper.delay(1000);
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        text = await panels[0].getText();
        assert.equal(text, 'Avengers');

        const xpathState = `//*[@id="topnav"]/div/div/i[contains(@class, 'fa-map-marker')]`;
        const state = await driver.findElements(webdriver.By.xpath(xpathState));
        assert.equal(state.length, 1);
        await state[0].click();
        await ExtendedTestHelper.delay(1000);
        const xpathSave = `//*[@id="topnav"]/div/div[contains(@class, 'root')]/div[contains(@class, 'submenugroup')]/div[contains(@class, 'menuitem')]/i[contains(@class, 'fa-save')]`;
        const save = await driver.findElements(webdriver.By.xpath(xpathSave));
        assert.equal(save.length, 1);
        await save[0].click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('new2');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('sort');
        assert.notEqual(input, null, 'Input not found!');
        await input.clear();
        await ExtendedTestHelper.delay(1000);
        await input.sendKeys('id:desc');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('limit');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('2');
        await ExtendedTestHelper.delay(1000);
        button = await window.getButton(modal, 'Save');
        assert.notEqual(button, null);
        await button.click();
        await driver.wait(webdriver.until.alertIsPresent());
        alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Saved successfully');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('State');
        await ExtendedTestHelper.delay(1000);

        const xpathNode = `//div[@class="treenode" and text()="new2"]`;
        const node = await driver.findElements(webdriver.By.xpath(xpathNode));
        assert.equal(node.length, 1);
        await node[0].click();
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 2);
        text = await panels[0].getText();
        assert.equal(text, 'Harry Potter');

        const xpathButton = `//*[@id="topnav"]/div/button`;
        button = await driver.findElements(webdriver.By.xpath(xpathButton));
        assert.equal(button.length, 2);
        text = await button[1].getText();
        assert.equal(text, 'limit:2');
        await button[1].click();
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);
        text = await panels[0].getText();
        assert.equal(text, 'Harry Potter');

        return Promise.resolve();
    });
});