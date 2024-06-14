const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Panel', function () {

    async function checkForm(form) {
        const app = helper.getApp();
        const window = app.getWindow();
        var input = await window.getFormInput(form, 'id');
        assert.notEqual(input, null);
        var id = await input.getAttribute('value');
        assert.equal(id, '1');
        var bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, 'true');
        var bReadonly = await input.getAttribute('readonly');
        assert.equal(bReadonly, null);

        input = await window.getFormInput(form, 'name');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'John Doe');
        bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, null);
        bReadonly = await input.getAttribute('readonly');
        assert.equal(bReadonly, null);
        //var div = await form.findElement(webdriver.By.xpath('./div[@class="formentry"]/div[@class="value"]/input[@name="name"]/parent::*'));
        var div = await input.findElement(webdriver.By.xpath('./..'));
        var scrollHeight = parseInt(await div.getAttribute('scrollHeight'));
        var clientHeight = parseInt(await div.getAttribute('clientHeight')); // offsetHeight
        //console.log(scrollHeight + ' - ' + clientHeight);
        assert.ok(scrollHeight <= clientHeight); // scrollHeight > clientHeight => 'Scrollable'
        var scrollWidth = parseInt(await div.getAttribute('scrollWidth'));
        var clientWidth = parseInt(await div.getAttribute('clientWidth'));
        //console.log(scrollWidth + ' - ' + clientWidth);
        assert.ok(scrollWidth <= clientWidth);

        return Promise.resolve();
    }

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

    it('#test details panel', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
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

        var elements = await panels[0].findElements(webdriver.By.xpath('div/div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'John Doe');

        var contextmenu = await window.openContextMenu(panels[0]);
        await TestHelper.delay(1000);
        await contextmenu.click('Details');
        await TestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        //var panel = await modal.findElement(webdriver.By.xpath('//div[contains(@class, "panel")]'));
        var panel = await modal.findElement(webdriver.By.xpath('//div[@class="panel"]')); // classlist must not contain 'selectable'
        assert.notEqual(panel, null);
        var bDraggable = await panel.getAttribute('draggable');
        assert.equal(bDraggable, 'false');

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test edit panel', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
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

        var elements = await panels[0].findElements(webdriver.By.xpath('div/div/p'));
        assert.equal(elements.length, 1);

        var text = await elements[0].getText();
        assert.equal(text, 'John Doe');

        var contextmenu = await window.openContextMenu(panels[0]);
        await TestHelper.delay(1000);
        await contextmenu.click('Edit');
        await TestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        //var panel = await modal.findElement(webdriver.By.xpath('//div[contains(@class, "panel")]'));
        var panel = await modal.findElement(webdriver.By.xpath('//div[@class="panel"]')); // classlist must not contain 'selectable'
        assert.notEqual(panel, null);
        var form = await window.getForm(panel);

        assert.notEqual(form, null);
        await checkForm(form);

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.navigate('/data/star/1/edit');
        await TestHelper.delay(1000);
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        form = await window.getForm(panels[0]);
        await checkForm(form);

        await window.getTopNavigationBar().openEditView();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.findElement(webdriver.By.xpath('.//div[@class="panel"]'));
        form = await panel.findElement(webdriver.By.xpath('.//form[contains(@class, "crudform")]'));
        //form = await modal.findElement(webdriver.By.xpath('.//form[contains(@class, "crudform")]'));
        //form = await window.getForm(panel);
        /*driver.executeScript(function () {
            arguments[0].style.backgroundColor = 'lightblue';
        }, form);*/
        const option = await form.findElement(webdriver.By.css('select#float > option[value="left"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        var button = await window.getButton(modal, 'Apply');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        form = await window.getForm(panels[0]);
        await checkForm(form);

        const title = await panels[0].getAttribute('title');
        console.log(title);
        assert.equal(title, '');

        return Promise.resolve();
    });
});