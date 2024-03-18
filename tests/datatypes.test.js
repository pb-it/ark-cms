const path = require('path');

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

        await helper.setupModel(path.join(__dirname, './data/models/misc.json'));

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test boolean datatype', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('misc');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var checkbox = await form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="checkbox" and @name="bool_checkbox"]'));
        assert.notEqual(checkbox, null);
        await checkbox.click();
        await ExtendedTestHelper.delay(1000);

        var button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        checkbox = await form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="checkbox" and @name="bool_checkbox"]'));
        assert.notEqual(checkbox, null);
        var value = await checkbox.getAttribute('value');
        assert.equal(value, 'on');

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test input datatypes', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('misc');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('string');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('text');
        assert.notEqual(input, null);
        await input.sendKeys('Text');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('url');
        assert.notEqual(input, null);
        await input.sendKeys('https://example.com/');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('json');
        assert.notEqual(input, null);
        await input.sendKeys('[]');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('timestamp');
        assert.notEqual(input, null);
        const date = new Date();
        const isoString = date.toISOString().replace('T', ' ').split('.')[0];
        await input.sendKeys(isoString);
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('datetime');
        assert.notEqual(input, null);
        await input.sendKeys(isoString);
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('date');
        assert.notEqual(input, null);
        await input.sendKeys('2020-01-01');
        await ExtendedTestHelper.delay(1000);
        input = await form.getFormInput('time');
        assert.notEqual(input, null);
        await input.sendKeys('00:00:01');
        await ExtendedTestHelper.delay(1000);
        var button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('string');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'Test');
        input = await form.getFormInput('text');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'Text');
        input = await form.getFormInput('url');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'https://example.com/');
        input = await form.getFormInput('json');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '[]');
        input = await form.getFormInput('timestamp');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, isoString);
        input = await form.getFormInput('datetime');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, isoString);
        input = await form.getFormInput('date');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '2020-01-01');
        input = await form.getFormInput('time');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '00:00:01.000');

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test enumeration datatype', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('misc');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var option = await form.getElement().findElement(webdriver.By.css('select#enum_select > option[value="A"]'));
        assert.notEqual(option, null);
        await option.click();
        await ExtendedTestHelper.delay(1000);
        var input = await form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="radio" and @value="B"]'));
        assert.notEqual(input, null);
        await input.click();
        await ExtendedTestHelper.delay(1000);

        var button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var select = await form.getElement().findElement(webdriver.By.css('select#enum_select'));
        assert.notEqual(select, null);
        var value = await select.getAttribute('value');
        assert.equal(value, 'A');
        input = await form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="radio" and @value="B"]'));
        assert.notEqual(input, null);
        assert.equal(await input.isSelected(), true);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test relation datatype', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('misc');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"relation")]'));
        assert.notEqual(input, null);
        var option = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"relation")]/option[text()="admin"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(1000);

        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
        var button = await panel.getElement().findElement(webdriver.By.xpath('./div[@class="data"]/button[text()="Create"]')); //panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);

        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
                var form;
                const controller = app.getController();
                const modals = controller.getModalController().getModals();
                if (modals.length > 0) {
                    const panel = modals[modals.length - 1].getPanel();
                    if (panel && panel instanceof CrudPanel) {
                        /*const obj = panel.getObject();
                        const model = obj.getModel();
                        const data = obj.getData();*/

                        form = panel.getForm();
                    }
                }
                if (form)
                    res = await form.readForm();
                else
                    throw new Error('Form not found');
            } catch (error) {
                alert('Error');
                console.error(error);
                res = null;
            } finally {
                callback(res);
            }
        });
        const relation = response?.relation;
        assert.equal(relation, 1);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});