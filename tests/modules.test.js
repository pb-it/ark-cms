const os = require('os');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Modules', function () {

    async function createModule() {
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
        await sidemenu.click('module');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var panel = panels[0];
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.equal(modal, null);
        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        return Promise.resolve();
    }

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

    it('#test modules', async function () {
        this.timeout(60000);

        await helper.setupModel(path.join(__dirname, './data/models/module.json'));
        const app = helper.getApp();
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('module');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        //const tabPanel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        const tabPanel = await modal.getPanel();
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Modules"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var panel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 1);
        var form = forms[0];

        //var input = await form.getFormInput('server');
        //var input = await window.getFormInput(form, 'server');
        var input = await form.findElement(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/textarea[@name="server"]`));
        assert.notEqual(input, null);
        /*const cmdCtrl = os.platform().includes('darwin') ? webdriver.Key.COMMAND : webdriver.Key.CONTROL; // u'\ue009'
        await driver.actions().keyDown(cmdCtrl)
            .sendKeys('a')
            .keyUp(cmdCtrl)
            .sendKeys(webdriver.Key.DELETE)
            .perform();*/
        await input.clear();
        await ExtendedTestHelper.delay(1000);
        const serverModule = `async function preCreateHook(data) {
    var model = controller.getShelf().getModel('module');
    var links = await model.readAll({ 'name': data['name'] });
    if (links && links.length > 0)
        throw new Error('An module with this name already exists!');
    return Promise.resolve(data);
}

module.exports = { preCreateHook };`
        await input.sendKeys(serverModule);
        await ExtendedTestHelper.delay(1000);

        input = await form.findElement(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/textarea[@name="client"]`));
        assert.notEqual(input, null);
        await input.clear();
        await ExtendedTestHelper.delay(1000);
        const clientModule = `function init() {
    this._prepareDataAction = function (data) {
        data['title'] = data['name'] + ' - 123';
        return data;
    }

    this._doubleClickAction = function (panel) {
        alert(panel.getObject().getData()['name']);
    }
}
export { init };`;
        await input.sendKeys(clientModule);
        await ExtendedTestHelper.delay(1000);

        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await createModule();
        /*const ds = app.getDataService();
        var data = {
            'name': 'Test'
        }
        var response = await ds.create('module', data);
        console.log(response);
        assert.notEqual(response, null);*/

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
                const obj = new CrudObject('module', { 'name': 'Test' });
                var tmp = await obj.create();
            } catch (error) {
                res = error['response'];
            }
            callback(res);
        });
        //console.log(response);
        assert.equal(response['body'], 'Error: An module with this name already exists!');

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('module');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        panel = panels[0];

        var elements = await panel.getElement().findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'Test - 123');

        /*response = await driver.executeScript(function () {
            //const evt = document.createEvent('MouseEvents');
            //evt.initMouseEvent('dblclick', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            //arguments[0].dispatchEvent(evt);

            arguments[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
            return 'OK';
        }, panel.getElement());
        assert.equal(response, 'OK');*/
        await driver.actions().doubleClick(panel.getElement()).perform();

        await driver.wait(webdriver.until.alertIsPresent());
        const alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Test');
        await alert.accept();

        return Promise.resolve();
    });
});