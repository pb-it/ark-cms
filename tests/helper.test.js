const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Helper', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(20000);

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

    it('#test canvas,panel,form,etc', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.setDebugMode(true);

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('_user');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.ok(panels.length >= 1);
        var panel = await canvas.getPanel('admin');
        assert.notEqual(panel, null);

        var contextmenu = await panel.openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);

        var elem = await panel.getElement().findElement(webdriver.By.xpath('.//form[contains(@class, "crudform")]'));
        assert.notEqual(elem, null);
        form = new Form(helper, elem);

        var input = await form.getFormInput('username');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, 'admin');

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.navigate('/');
        await app.waitLoadingFinished(10);

        return Promise.resolve();
    });
});