const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Datatypes', function () {

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
        var checkbox = await form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="checkbox" and @name="bool_checkbox"]'));
        assert.notEqual(checkbox, null);
        await checkbox.click();
        await ExtendedTestHelper.delay(1000);

        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
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
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
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

    it('#test time(UTC) datatype', async function () {
        this.timeout(60000);

        const model = {
            'name': 'time',
            'options': {
                'increments': true,
                'timestamps': true
            },
            'attributes': [
                {
                    'name': 'dt',
                    'dataType': 'datetime',
                    'timeZone': 'UTC'
                }
            ]
        };
        const app = helper.getApp();
        const id = await app.getModelController().addModel(model);

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('time');
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
        var input = await form.getFormInput('dt');
        assert.notEqual(input, null);
        const date = new Date();
        const isoString = date.toISOString().replace('T', ' ').split('.')[0];
        await input.sendKeys(isoString);
        await ExtendedTestHelper.delay(1000);

        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
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
        input = await form.getFormInput('dt');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, isoString);

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
        var option = await form.getElement().findElement(webdriver.By.css('select#enum_select > option[value="A"]'));
        assert.notEqual(option, null);
        await option.click();
        await ExtendedTestHelper.delay(1000);
        var input = await form.getElement().findElement(webdriver.By.xpath('.//fieldset/input[@type="radio" and @value="B"]'));
        assert.notEqual(input, null);
        await input.click();
        await ExtendedTestHelper.delay(1000);

        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
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

    /**
     * Cache update will fail when created relation is not an array
     */
    it('#test relation datatype #2', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ds = app.getDataService();

        var tmp = await ds.read('misc', null, null, null, null, null, null, true);
        const count = tmp.length;

        const models = await ds.read('_model');
        assert.ok(models.length > 0);
        var id = models[0]['id'];

        var err;
        try {
            const entry = {
                'relation_multi': id
            };
            var tmp = await ds.create('misc', entry);
            console.log(tmp);
            assert.notEqual(Object.keys(tmp).length, 0);
            assert.equal(tmp['relation_multi'], id);
            id = tmp['id'];
        } catch (error) {
            err = error;
        }
        assert.equal(err, 'Error: Empty response! Take a look at the browser log for more details.');

        tmp = await ds.read('misc', null, null, null, null, null, null, true);
        assert.equal(tmp.length, count);

        return Promise.resolve();
    });

    /**
     * timestamp with defaultVaulue = 'CURRENT_TIMESTAMP'
     */
    it('#test timestamp default', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.setDebugMode(true);
        const ds = app.getDataService();

        const models = await ds.read('_model');
        var model;
        for (var m of models) {
            if (m['definition']['name'] === 'misc') {
                model = m;
                break;
            }
        }
        assert.notEqual(model, null);

        const definition = model['definition'];
        for (var attr of definition['attributes']) {
            if (attr['name'] === 'timestamp') {
                attr['defaultValue'] = 'CURRENT_TIMESTAMP';
                break;
            }
        }

        var tmp = await ds.update('_model', model['id'], definition);
        assert.equal(tmp, model['id']); // assert.notEqual(Object.keys(tmp).length, 0);

        await app.reload(); //TODO: why is cache not updated?
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var bIndexDB = false;
        if (bIndexDB) {
            var modal = await window.getTopModal();
            assert.notEqual(modal, null, 'Missing Update-Modal');
            var button = await modal.findElement(webdriver.By.xpath('.//button[text()="Update"]'));
            assert.notEqual(button, null, 'Update button not found');
            await button.click();

            await driver.wait(webdriver.until.alertIsPresent());
            var alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text, 'Updated successfully!');
            await alert.accept();
            await ExtendedTestHelper.delay(1000);
        }

        modal = await window.getTopModal();
        assert.equal(modal, null);

        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('misc');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);
        //const tabPanel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        const tabPanel = await modelModal.getPanel();
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="RAW"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var panel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var elems = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(elems.length, 1);
        var form = new Form(helper, elems[0]);
        var input = await form.getFormInput('json');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        var obj = JSON.parse(value);
        var attr = obj['attributes'].filter((x) => x['name'] === 'timestamp');
        assert.equal(attr.length, 1);
        assert.equal(attr[0]['defaultValue'], 'CURRENT_TIMESTAMP');

        await modelModal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
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
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        alert = null;
        try {
            await this._driver.wait(webdriver.until.alertIsPresent(), 1000);
            alert = await this._driver.switchTo().alert();
            text = await alert.getText();
            console.log(text);
        } catch (error) {
            ;
        }
        assert.equal(alert, null);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('timestamp');
        assert.notEqual(input, null);
        value = await input.getAttribute('value');
        assert.equal(value, '');

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
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var obj = await ExtendedTestHelper.readJson(window, panels[0]);
        assert.notEqual(obj['timestamp'], null);

        return Promise.resolve();
    });

    it('#test calculated title', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.setDebugMode(true);

        await helper.setupModel(path.join(__dirname, './data/models/title.json'));

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('title');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        /*var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('title');
        assert.notEqual(input, null);*/

        var button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Create empty entry?');
        await alert.accept();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });
});