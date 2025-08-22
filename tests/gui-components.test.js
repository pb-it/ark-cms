const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Menu } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - GUI Components', function () {

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

        await app.setDebugMode(true);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test select', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var tmp = await ds.read('_extension', null, 'name=panelExt');
        if (tmp.length == 1) {
            const window = app.getWindow();
            const sidemenu = window.getSideMenu();
            await sidemenu.click('Extensions');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panel = await canvas.getPanel('panelExt');
            assert.notEqual(panel, null);
            var xpath = `.//div[contains(@class, 'menuitem') and contains(@class, 'root')]`;
            var element = await panel.getElement().findElement(webdriver.By.xpath(xpath));
            assert.notEqual(element, null);
            var menu = new Menu(helper, element);
            await menu.open();
            await ExtendedTestHelper.delay(1000);
            await menu.click('Configure');
            await ExtendedTestHelper.delay(1000);

            modal = await app.getWindow().getTopModal();
            assert.notEqual(modal, null);
            var panel = await modal.getPanel();
            assert.notEqual(panel, null);
            var form = await panel.getForm();
            assert.notEqual(form, null);
            var input = await form.getFormInput('code');
            assert.notEqual(input, null);
            var code = fs.readFileSync(path.join(__dirname, './data/panels/select-test-panel.js'), 'utf8');
            await input.sendKeys(code);
            await ExtendedTestHelper.delay(1000);
            var button = await panel.getButton('Apply');
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);

            await driver.wait(webdriver.until.alertIsPresent(), 1000);
            alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text, 'Changes applied successfully.\nReload website for the changes to take effect!');
            await alert.accept();
            await ExtendedTestHelper.delay(1000);

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            await app.navigate('/data/movie');
            await ExtendedTestHelper.delay(1000);
            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 7);

            await app.navigate('/test-panel');
            canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            panels = await canvas.getPanels();
            assert.equal(panels.length, 1);
            var select = await panels[0].getElement().findElement(webdriver.By.xpath('.//div[@class="select"]'));
            assert.notEqual(select, null);
            var options = await select.findElements(webdriver.By.xpath('./datalist/option'));
            assert.equal(options.length, 4);
        } else
            this.skip();

        return Promise.resolve();
    });

    it('#test list', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var tmp = await ds.read('_extension', null, 'name=panelExt');
        if (tmp.length == 1) {
            const window = app.getWindow();
            const sidemenu = window.getSideMenu();
            await sidemenu.click('Extensions');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panel = await canvas.getPanel('panelExt');
            assert.notEqual(panel, null);
            var xpath = `.//div[contains(@class, 'menuitem') and contains(@class, 'root')]`;
            var element = await panel.getElement().findElement(webdriver.By.xpath(xpath));
            assert.notEqual(element, null);
            var menu = new Menu(helper, element);
            await menu.open();
            await ExtendedTestHelper.delay(1000);
            await menu.click('Configure');
            await ExtendedTestHelper.delay(1000);

            modal = await app.getWindow().getTopModal();
            assert.notEqual(modal, null);
            var panel = await modal.getPanel();
            assert.notEqual(panel, null);
            var form = await panel.getForm();
            assert.notEqual(form, null);
            var input = await form.getFormInput('code');
            assert.notEqual(input, null);
            var code = fs.readFileSync(path.join(__dirname, './data/panels/list-test-panel.js'), 'utf8');
            await input.sendKeys(code);
            await ExtendedTestHelper.delay(1000);
            var button = await panel.getButton('Apply');
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);

            await driver.wait(webdriver.until.alertIsPresent(), 1000);
            alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text, 'Changes applied successfully.\nReload website for the changes to take effect!');
            await alert.accept();
            await ExtendedTestHelper.delay(1000);

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            await app.navigate('/test-panel');
            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 1);
            var form = await panels[0].getForm();
            assert.notEqual(form, null);
            var entry = await form.getFormEntry('testList');
            assert.notEqual(entry, null);

            var button = await panels[0].getElement().findElement(webdriver.By.xpath('.//button[text()="read"]'));
            assert.notEqual(button, null, 'Button not found!');
            await button.click();
            await ExtendedTestHelper.delay(1000);

            var result = await panels[0].getElement().findElement(webdriver.By.xpath('./div/div[1]'));
            assert.notEqual(result, null);
            var text = await result.getText();
            assert.equal(text, JSON.stringify(['val1', 'val3']));
        } else
            this.skip();

        return Promise.resolve();
    });

    it('#test progress bar', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const ds = app.getDataService();
        var tmp = await ds.read('_extension', null, 'name=panelExt');
        if (tmp.length == 1) {
            const window = app.getWindow();
            const sidemenu = window.getSideMenu();
            await sidemenu.click('Extensions');
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panel = await canvas.getPanel('panelExt');
            assert.notEqual(panel, null);
            var xpath = `.//div[contains(@class, 'menuitem') and contains(@class, 'root')]`;
            var element = await panel.getElement().findElement(webdriver.By.xpath(xpath));
            assert.notEqual(element, null);
            var menu = new Menu(helper, element);
            await menu.open();
            await ExtendedTestHelper.delay(1000);
            await menu.click('Configure');
            await ExtendedTestHelper.delay(1000);

            modal = await app.getWindow().getTopModal();
            assert.notEqual(modal, null);
            var panel = await modal.getPanel();
            assert.notEqual(panel, null);
            var form = await panel.getForm();
            assert.notEqual(form, null);
            var input = await form.getFormInput('code');
            assert.notEqual(input, null);
            var code = fs.readFileSync(path.join(__dirname, './data/panels/progressbar-test-panel.js'), 'utf8');
            await input.sendKeys(code);
            await ExtendedTestHelper.delay(1000);
            var button = await panel.getButton('Apply');
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);

            await driver.wait(webdriver.until.alertIsPresent(), 1000);
            alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text, 'Changes applied successfully.\nReload website for the changes to take effect!');
            await alert.accept();
            await ExtendedTestHelper.delay(1000);

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            await app.navigate('/test-panel');
            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 1);

            var elem = panels[0].getElement();
            var bar = await elem.findElement(webdriver.By.xpath('.//div[@class="progressbar"]/div[1]'));
            assert.notEqual(bar, null);
            var value = await bar.getCssValue('width');
            assert.equal(value, '0px');
            var label = await elem.findElement(webdriver.By.xpath('.//div[@class="progressbar"]/div[2]'));
            assert.notEqual(label, null);
            var text = await label.getText();
            assert.equal(text, '0%');
            await ExtendedTestHelper.delay(10000);
            value = await bar.getCssValue('width');
            assert.notEqual(value, '0px');
            text = await label.getText();
            assert.equal(text, '100%');
        } else
            this.skip();

        return Promise.resolve();
    });
});