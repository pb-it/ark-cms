const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const { Select } = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit', function () {

    async function openDefaultsTab() {
        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);
        const tabPanel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Defaults"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    }

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

    it('#add second model', async function () {
        this.timeout(10000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/star.json'), 'utf8');
        const model = JSON.parse(str);
        const app = helper.getApp();
        const id = await app.getModelController().addModel(model);
        assert.equal(id, 9);

        await driver.navigate().refresh();
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#add relation to model', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        var button = await window.getButton(modelModal, 'Add Attribute');
        assert.notEqual(button, null, 'Button not found!');
        button.click();

        await ExtendedTestHelper.delay(100);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        const input = await window.getFormInput(form, 'name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('stars');
        await form.findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await ExtendedTestHelper.delay(100);

        modal = await window.getTopModal();
        form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        var elem = await form.findElement(webdriver.By.css('select#model > option[value="star"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        elem = await form.findElement(webdriver.By.xpath('//select[@name="multiple"]/option[@value="true"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#remove and rename attributes', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);
        const attrPanel = await modelModal.getPanel();
        assert.notEqual(attrPanel, null);
        var attr = await attrPanel.getElement().findElement(webdriver.By.xpath('./div/div/div[@class="panel"]/div/div[@class="list"]/ul/li/div[@class="node" and text()="premiere: date"]'));
        assert.notEqual(attr, null);
        var contextmenu = await window.openContextMenu(attr);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Rename');
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.clear();
        await ExtendedTestHelper.delay(1000);
        await input.sendKeys('release');
        await ExtendedTestHelper.delay(1000);
        var button = await panel.getButton('Apply');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        attr = await attrPanel.getElement().findElement(webdriver.By.xpath('./div/div/div[@class="panel"]/div/div[@class="list"]/ul/li/div[@class="node" and text()="junk: integer"]'));
        assert.notEqual(attr, null);
        var contextmenu = await window.openContextMenu(attr);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Delete');
        await ExtendedTestHelper.delay(1000);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        const tools = await app.getApiController().getTools();
        const cmd = `async function test() {
    var tableInfo;
    const model = controller.getShelf().getModel('movie');
    const knex = model.getShelf().getKnex();
    const table = model.getTableName();
    const bExist = await knex.schema.hasTable(table);
    if (bExist)
        tableInfo = await knex.table(table).columnInfo();
    return Promise.resolve(tableInfo);
};        
module.exports = test;`
        const res = await tools.serverEval(cmd);
        const data = JSON.parse(res);
        assert.equal(data['premiere'], undefined);
        assert.equal(JSON.stringify(data['release']), JSON.stringify({ "defaultValue": null, "type": "date", "maxLength": null, "nullable": true }));
        assert.equal(data['junk'], undefined);

        return Promise.resolve();
    });

    xit('#reset model defaults', async function () {
        this.timeout(10000);

        /*const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
                const controller = app.getController();
                const model = controller.getModelController().getModel('star');
                const def = model.getDefinition();
                if (def['defaults']) {
                    delete def['defaults'];
                    await model.setDefinition(def);
                }
                res = 'OK';
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, 'OK', 'Reset defaults failed');*/

        await openDefaultsTab();
        const app = helper.getApp();
        const window = app.getWindow();
        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);

        var panel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 6);
        var option = await forms[0].findElement(webdriver.By.css('select#panelType > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#details > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#float > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);

        option = await forms[1].findElement(webdriver.By.css('select#title > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#close without change', async function () {
        this.timeout(10000);

        await openDefaultsTab();
        const app = helper.getApp();
        const window = app.getWindow();
        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);

        await modelModal.closeModal();
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#edit model defaults', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var res = await ds.create('star', { 'name': 'John Wick' });
        assert.notEqual(Object.keys(res).length, 0);
        const id = res['id'];

        await openDefaultsTab();
        const window = app.getWindow();
        var modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);

        var panel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        //var form = await window.getForm(panel);
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 6);
        var element = await forms[0].findElement(webdriver.By.xpath('./div[@class="formentry"]/div[@class="value"]/select[@id="panelType"]'));
        assert.notEqual(element, null, 'Select not found!');
        //var select = new Select(element);
        //var options = await select.getAllSelectedOptions();
        //assert.equal(options.length, 1);
        var value = await element.getAttribute('value');
        assert.equal(value, '');
        var option = await forms[0].findElement(webdriver.By.css('select#panelType > option[value="MediaPanel"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#details > option[value="title"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#float > option[value="left"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);

        option = await forms[1].findElement(webdriver.By.css('select#title > option[value="name"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        // check
        await openDefaultsTab();
        modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);

        panel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 6);
        element = await forms[0].findElement(webdriver.By.xpath('./div[@class="formentry"]/div[@class="value"]/select[@id="panelType"]'));
        assert.notEqual(element, null, 'Select not found!');
        value = await element.getAttribute('value');
        assert.equal(value, 'MediaPanel');
        element = await forms[0].findElement(webdriver.By.xpath('./div[@class="formentry"]/div[@class="value"]/select[@id="details"]'));
        assert.notEqual(element, null, 'Select not found!');
        value = await element.getAttribute('value');
        assert.equal(value, 'title');
        element = await forms[0].findElement(webdriver.By.xpath('./div[@class="formentry"]/div[@class="value"]/select[@id="float"]'));
        assert.notEqual(element, null, 'Select not found!');
        value = await element.getAttribute('value');
        assert.equal(value, 'left');

        element = await forms[1].findElement(webdriver.By.xpath('./div[@class="formentry"]/div[@class="value"]/select[@id="title"]'));
        assert.notEqual(element, null, 'Select not found!');
        value = await element.getAttribute('value');
        assert.equal(value, 'name');

        await modelModal.closeModal();
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        const file = config['host'] + '/public/images/missing_image.png';
        const xpathThumb = `./div/div[@class="thumbnail"]/img`;
        var thumb = await panels[0].findElement(webdriver.By.xpath(xpathThumb));
        assert.notEqual(thumb, null, 'Thumbnail not found!');
        var img = await thumb.getAttribute('src');
        var i = 0;
        const loadingIcon = config['host'] + '/public/images/loading_icon.gif';
        while (img === loadingIcon && i < 10) {
            await ExtendedTestHelper.delay(1000);
            thumb = thumb = await panels[0].findElement(webdriver.By.xpath(xpathThumb));
            img = await thumb.getAttribute('src');
            i++;
        }
        assert.equal(img, file);

        var title = await panels[0].findElement(webdriver.By.xpath(`./div/div/p`));
        assert.notEqual(title, null, 'Title not found!');
        var text = await title.getText();
        assert.equal(text, 'John Wick');

        return Promise.resolve();
    });

    it('#add relation within same model', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var res = await ds.create('star', { 'name': 'Dad' });
        assert.notEqual(Object.keys(res).length, 0);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        var button = await window.getButton(modelModal, 'Add Attribute');
        assert.notEqual(button, null, 'Button not found!');
        button.click();

        await ExtendedTestHelper.delay(100);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        var input = await window.getFormInput(form, 'name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('father');
        await form.findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await ExtendedTestHelper.delay(100);

        modal = await window.getTopModal();
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var elem = await form.getElement().findElement(webdriver.By.css('select#model > option[value="star"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(100);
        elem = await form.getElement().findElement(webdriver.By.xpath('//select[@name="multiple"]/option[@value="false"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(100);
        input = await form.getFormInput('tableName');
        var bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, 'true');
        input = await form.getFormInput('via');
        bDisabled = await input.getAttribute('disabled');
        assert.equal(bDisabled, 'true');
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 2);

        var title = await panels[0].findElement(webdriver.By.xpath(`./div/div/p`));
        assert.notEqual(title, null, 'Title not found!');
        var text = await title.getText();
        assert.equal(text, 'John Wick');

        var contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"father")]'));
        assert.notEqual(input, null);
        var option = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"father")]/option[text()="Dad"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Update"]'));
        assert.notEqual(button, null, 'Button not found');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('father');
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        title = await panels[0].findElement(webdriver.By.xpath(`./div/div/p`));
        assert.notEqual(title, null, 'Title not found!');
        text = await title.getText();
        assert.equal(text, 'Dad');

        contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Delete');
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        //var button = await helper.getButton(modal, 'Confirm');
        var elements = await modal.findElements(webdriver.By.xpath(`//input[@type="submit" and @name="confirm"]`));
        assert.equal(elements.length, 1);
        button = elements[0];
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        title = await panels[0].findElement(webdriver.By.xpath(`./div/div/p`));
        assert.notEqual(title, null, 'Title not found!');
        text = await title.getText();
        assert.equal(text, 'John Wick');

        var contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#add relation within same model #2', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var res = await ds.create('star', { 'name': 'Friend' });
        assert.notEqual(Object.keys(res).length, 0);
        const id = res['id'];

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        var button = await window.getButton(modelModal, 'Add Attribute');
        assert.notEqual(button, null, 'Button not found!');
        button.click();

        await ExtendedTestHelper.delay(100);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        var input = await window.getFormInput(form, 'name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('friends');
        await form.findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await ExtendedTestHelper.delay(100);

        modal = await window.getTopModal();
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var elem = await form.getElement().findElement(webdriver.By.css('select#model > option[value="star"]'));
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
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 2);

        var title = await panels[0].findElement(webdriver.By.xpath(`./div/div/p`));
        assert.notEqual(title, null, 'Title not found!');
        var text = await title.getText();
        assert.equal(text, 'John Wick');

        var contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/input[starts-with(@list,"friends")]'));
        assert.notEqual(input, null);
        var option = await form.getElement().findElement(webdriver.By.xpath('//div[@class="select"]/datalist[starts-with(@id,"father")]/option[text()="Friend"]'));
        assert.notEqual(option, null);
        var value = await option.getAttribute('value');
        await input.sendKeys(value);
        await input.sendKeys(webdriver.Key.ENTER);
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Update"]'));
        assert.notEqual(button, null, 'Button not found');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        contextmenu = await window.openContextMenu(panels[0]);
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('friends');
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        title = await panels[0].findElement(webdriver.By.xpath(`./div/div/p`));
        assert.notEqual(title, null, 'Title not found!');
        text = await title.getText();
        assert.equal(text, 'Friend');

        var tmp = await ds.read('star');
        if (tmp.length > 0) {
            for (var entry of tmp) {
                await ds.delete('star', entry['id']);
            }
        }

        return Promise.resolve();
    });
});