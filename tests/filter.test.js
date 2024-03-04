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

    it('#test filter', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        const xpathFilter = `//*[@id="topnav"]/div/div/div/i[contains(@class, 'fa-filter')]`;
        var view = await driver.findElements(webdriver.By.xpath(xpathFilter));
        assert.equal(view.length, 1);
        await view[0].click();
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.notEqual(modal, null);

        var button = await helper.getButton(modal, 'New');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        const form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        /*var panel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(panel, null);
        const form = await helper.getForm(panel);*/
        assert.notEqual(form, null);
        //var input = await helper.getFormInput(form, 'query');
        var elements = await form.findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/textarea[@name="query"]`));
        assert.equal(elements.length, 1);
        var input = elements[0];
        assert.notEqual(input, null);
        await input.sendKeys('$.[?(@.studio.id==1)]');
        await TestHelper.delay(1000);
        button = await helper.getButton(modal, 'Filter');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 3);

        return Promise.resolve();
    });

    it('#test filter in searchbar', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        var input = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/input[@id="searchField"]'));
        assert.equal(input.length, 1);
        await input[0].sendKeys('$.[?(@.studio.id==3)]');

        var button = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/button[@id="searchButton"]'));
        assert.equal(button.length, 1);
        await button[0].click();
        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        var elements = await panels[0].findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'Pirates of the Caribbean');

        await input[0].clear();
        await TestHelper.delay(1000);
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        return Promise.resolve();
    });
});

