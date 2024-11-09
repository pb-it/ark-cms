const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Thumbnail', function () {

    async function getThumbnail(panel) {
        const xpathThumb = `./div/div[@class="thumbnail"]/img`;
        var thumb = await panel.findElement(webdriver.By.xpath(xpathThumb));
        assert.notEqual(thumb, null, 'Thumbnail not found!');
        var img = await thumb.getAttribute('src');
        var i = 0;
        const loadingIcon = config['host'] + '/public/images/loading_icon.gif';
        while (img === loadingIcon && i < 10) {
            await ExtendedTestHelper.delay(1000);
            thumb = await panel.findElement(webdriver.By.xpath(xpathThumb));
            img = await thumb.getAttribute('src');
            i++;
        }
        return Promise.resolve(img);
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

    it('#test thumbnail multi', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);
        await app.setDebugMode(true);
        //await helper.setupScenario(1);

        //await app.navigate('/data/image');
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('image');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 0);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('image');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);
        var tabPanel = await modelModal.getPanel();
        assert.notEqual(tabPanel, null);
        var button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Defaults"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var panel = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 7);

        var form = new Form(helper, forms[4]);
        var input = await form.getFormInput('thumbnail');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'file');
        await input.sendKeys(';url');
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

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('image');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var entry = await form.getFormEntry('file');
        assert.notEqual(entry, null);
        var inputs = await entry.findElements(webdriver.By.xpath(`./div[@class="value"]/input`));
        assert.equal(inputs.length, 3);
        input = inputs[1];
        const url = 'https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png';
        await input.sendKeys(url);
        await ExtendedTestHelper.delay(100);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        const image = await ExtendedTestHelper.readJson(window, panels[0]);
        assert.notEqual(image['id'], null);

        const api = await app.getApiUrl();
        var file = api + '/cdn/' + image['file'];
        var thumb = await getThumbnail(panels[0].getElement());
        assert.equal(thumb, file);

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
        entry = await form.getFormEntry('file');
        assert.notEqual(entry, null);
        var checkbox = await entry.findElement(webdriver.By.xpath('.//input[@type="checkbox"]'));
        assert.notEqual(checkbox, null);
        await checkbox.click();
        await ExtendedTestHelper.delay(100);
        button = await panel.getButton('Update');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.reload();
        await ExtendedTestHelper.delay(1000);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        thumb = await getThumbnail(panels[0].getElement());
        assert.equal(thumb, url);
        await ExtendedTestHelper.delay(1000);

        const ds = app.getDataService();
        var res = await ds.delete('image', image['id']);
        assert.notEqual(Object.keys(res).length, 0);

        return Promise.resolve();
    });

    it('#test set star thumbnail', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);
        await app.setDebugMode(true);
        //await helper.setupScenario(1);

        //await app.navigate('/data/star');
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var elements = await panels[0].getElement().findElements(webdriver.By.xpath('div/div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'John Doe');

        var star = await ExtendedTestHelper.readJson(window, panels[0]);
        assert.notEqual(star['id'], null);

        const miss = config['host'] + '/public/images/missing_image.png';
        var thumb = await getThumbnail(panels[0].getElement());
        assert.equal(thumb, miss);
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        var button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('profilepicture');
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="relation"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
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
        var elem = await form.getElement().findElement(webdriver.By.css('select#model > option[value="image"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        elem = await form.getElement().findElement(webdriver.By.xpath('.//select[@name="multiple"]/option[@value="false"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var tabPanel = await modelModal.getPanel();
        assert.notEqual(tabPanel, null);
        button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Defaults"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        panel = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 7);

        form = new Form(helper, forms[4]);
        input = await form.getFormInput('thumbnail');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '');
        await input.sendKeys('profilepicture');
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

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('image');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var entry = await form.getFormEntry('file');
        assert.notEqual(entry, null);
        var inputs = await entry.findElements(webdriver.By.xpath(`./div[@class="value"]/input`));
        assert.equal(inputs.length, 3);
        input = inputs[1];
        const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Contact-new.svg/1024px-Contact-new.svg.png';
        await input.sendKeys(url);
        await ExtendedTestHelper.delay(100);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var image = await ExtendedTestHelper.readJson(window, panels[0]);
        assert.notEqual(image['id'], null);

        await app.navigate('/data/star/' + star['id']);
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var response = await driver.executeAsyncScript(async (panel, url) => {
            const callback = arguments[arguments.length - 1];

            var dropEvent = document.createEvent('CustomEvent');
            dropEvent.initCustomEvent('drop', true, true, null);
            dropEvent.dataTransfer = {
                data: {
                },
                setData: function (type, val) {
                    this.data[type] = val;
                },
                getData: function (type) {
                    return this.data[type];
                }
            };
            dropEvent.dataTransfer.setData('text/plain', url);
            panel.dispatchEvent(dropEvent);

            callback('OK');
        }, panels[0].getElement(), config['host'] + '/data/image/' + image['id']);
        assert.equal(response, 'OK', "DropEvent Failed!");

        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal(); // Change thumbnail?
        assert.notEqual(modal, null);
        /*panel = await modal.getPanel();
        assert.notEqual(panel, null);*/
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Yes"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        /*canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);*/
        const api = await app.getApiUrl();
        var file = api + '/cdn/' + image['file'];
        thumb = await getThumbnail(panels[0].getElement());
        assert.equal(thumb, file);
        await ExtendedTestHelper.delay(1000);

        await app.navigate('/data/image/' + image['id']);
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
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
        entry = await form.getFormEntry('file');
        assert.notEqual(entry, null);
        var checkbox = await entry.findElement(webdriver.By.xpath('.//input[@type="checkbox"]'));
        assert.notEqual(checkbox, null);
        await checkbox.click();
        await ExtendedTestHelper.delay(100);
        button = await panel.getButton('Update');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);

        thumb = await getThumbnail(panels[0].getElement());
        assert.equal(thumb, url);
        await ExtendedTestHelper.delay(1000);

        await app.navigate('/data/star/' + star['id']);
        await app.waitLoadingFinished(10);
        await app.reload();
        await ExtendedTestHelper.delay(1000);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        thumb = await getThumbnail(panels[0].getElement());
        assert.equal(thumb, url);
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });
});