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

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test formentry properties', async function () {
        this.timeout(60000);

        const app = helper.getApp();

        await helper.setupModel(path.join(__dirname, './data/models/form.json'));
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const ds = app.getDataService();
        var tmp = await ds.read('form');
        if (tmp.length > 0) {
            for (var entry of tmp) {
                await ds.delete('form', entry['id']);
            }
        }
        const data = {
            'string': 'Test',
            'readonly': 'Dummy',
            'hidden': 'Lorem Ipsum'
        };
        var res = await ds.create('form', data);
        assert.notEqual(Object.keys(res).length, 0);

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('form');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);

        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
                const controller = app.getController();
                const modals = controller.getModalController().getModals();
                if (modals.length == 1) {
                    const panel = modals[0].getPanel();
                    if (panel && panel instanceof CrudPanel) {
                        /*const obj = panel.getObject();
                        const model = obj.getModel();
                        const data = obj.getData();

                        const form = panel.getForm();
                        const fData = await form.readForm();*/
                        res = await panel.getChanges(false);
                    }
                }
            } catch (error) {
                alert('Error');
                console.error(error);
                res = null;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, null);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});