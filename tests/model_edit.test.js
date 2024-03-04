const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const { Select } = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

    async function openDefaultsTab() {
        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Models');
        await TestHelper.delay(1000);
        await sidemenu.click('star');
        await TestHelper.delay(1000);
        await sidemenu.click('Edit');
        await TestHelper.delay(1000);

        const modelModal = await app.getTopModal();
        assert.notEqual(modelModal, null);
        const tabPanel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Defaults"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await TestHelper.delay(1000);

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

    it('#add second model', async function () {
        this.timeout(10000);

        const str = fs.readFileSync(path.join(__dirname, './data/models/star.json'), 'utf8');
        const model = JSON.parse(str);
        const id = await helper.getModelController().addModel(model);
        assert.equal(id, 9);

        await driver.navigate().refresh();
        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    it('#add relation to model', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Models');
        await TestHelper.delay(1000);
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Edit');
        await TestHelper.delay(1000);

        const modelModal = await app.getTopModal();
        var button = await helper.getButton(modelModal, 'Add Attribute');
        assert.notEqual(button, null, 'Button not found!');
        button.click();

        await TestHelper.delay(100);

        var modal = await app.getTopModal();
        assert.notEqual(modal, null);
        var form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        const input = await helper.getFormInput(form, 'name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('stars');
        await form.findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(100);

        modal = await app.getTopModal();
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

        await TestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

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
        const modelModal = await app.getTopModal();
        assert.notEqual(modelModal, null);

        var panel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 6);
        var option = await forms[0].findElement(webdriver.By.css('select#panelType > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#details > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#float > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);

        option = await forms[1].findElement(webdriver.By.css('select#title > option[value=""]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#close without change', async function () {
        this.timeout(10000);

        await openDefaultsTab();
        const app = helper.getApp();
        const modelModal = await app.getTopModal();
        assert.notEqual(modelModal, null);

        await modelModal.closeModal();
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#edit model defaults', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        var res = await app.create('star', { 'name': 'John Wick' });
        assert.notEqual(Object.keys(res).length, 0);
        const id = res['id'];

        await openDefaultsTab();
        var modelModal = await app.getTopModal();
        assert.notEqual(modelModal, null);

        var panel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        //var form = await helper.getForm(panel);
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
        await TestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#details > option[value="title"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#float > option[value="left"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);

        option = await forms[1].findElement(webdriver.By.css('select#title > option[value="name"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.equal(modal, null);

        // check
        await openDefaultsTab();
        modelModal = await app.getTopModal();
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
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        assert.equal(modal, null);

        sidemenu = app.getSideMenu();
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

        const file = config['host'] + '/public/images/missing_image.png';
        const xpathThumb = `./div/div[@class="thumbnail"]/img`;
        var thumb = await panels[0].findElement(webdriver.By.xpath(xpathThumb));
        assert.notEqual(thumb, null, 'Thumbnail not found!');
        var img = await thumb.getAttribute('src');
        var i = 0;
        const loadingIcon = config['host'] + '/public/images/loading_icon.gif';
        while (img === loadingIcon && i < 10) {
            await TestHelper.delay(1000);
            thumb = thumb = await panels[0].findElement(webdriver.By.xpath(xpathThumb));
            img = await thumb.getAttribute('src');
            i++;
        }
        assert.equal(img, file);

        var title = await panels[0].findElement(webdriver.By.xpath(`./div/div/p`));
        assert.notEqual(title, null, 'Title not found!');
        var text = await title.getText();
        assert.equal(text, 'John Wick');

        res = await app.delete('star', id);
        assert.notEqual(Object.keys(res).length, 0);

        return Promise.resolve();
    });
});