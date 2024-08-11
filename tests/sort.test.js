const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Sort', function () {

    async function checkCanvas(window, data, dt) {
        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 3);
        var title = await panels[0].getElement().findElement(webdriver.By.xpath('div/p'));
        assert.notEqual(title, null);
        var text = await title.getText();
        assert.equal(text, data[1][dt]);
        title = await panels[1].getElement().findElement(webdriver.By.xpath('div/p'));
        assert.notEqual(title, null);
        text = await title.getText();
        assert.equal(text, data[0][dt]);
        title = await panels[2].getElement().findElement(webdriver.By.xpath('div/p'));
        assert.notEqual(title, null);
        text = await title.getText();
        assert.equal(text, data[2][dt]);
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

    it('#test sort by name,timestamp', async function () {
        this.timeout(60000);

        await helper.setupModel(path.join(__dirname, './data/models/misc.json'));
        const app = helper.getApp();
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const file = path.join(__dirname, './data/crud/misc_1.json');

        const ds = app.getDataService();
        var tmp = await ds.read('misc');
        if (tmp.length > 0) {
            for (var entry of tmp) {
                await ds.delete('misc', entry['id']);
            }
        }
        await helper.setupData('misc', file);

        const str = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(str);

        const window = app.getWindow();
        var response;
        for (var dt of ['string', 'timestamp', 'datetime', 'date', 'time']) {
            response = await driver.executeAsyncScript(async () => {
                const callback = arguments[arguments.length - 1];
                var res;
                try {
                    const controller = app.getController();
                    const model = controller.getModelController().getModel('misc');
                    if (model) {
                        const def = model.getDefinition();
                        def['defaults'] = {
                            "title": arguments[0],
                            "sort": arguments[0] + ":desc",
                            "view": {
                                "details": "title"
                            }
                        };
                        await model.setDefinition(def);
                        res = 'OK';
                    } else
                        throw new Error('Model \'misc\' not found');
                } catch (error) {
                    console.error(error);
                    alert('Error');
                    res = error;
                } finally {
                    callback(res);
                }
            }, dt);
            assert.equal(response, 'OK', 'Setting defaults failed');

            await app.navigate('/data/misc');
            await ExtendedTestHelper.delay(1000);
            await checkCanvas(window, data, dt);
        }

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const controller = app.getController();
                const db = controller.getDatabase();
                if (db)
                    await db.deleteDatabase();

                localStorage.setItem('bIndexedDB', 'true');
                localStorage.setItem('bAutomaticUpdateIndexedDB', 'false');

                //controller.reloadApplication();
                res = 'OK';
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, 'OK', "Enabling IndexedDB failed");

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const controller = app.getController();
                const cache = controller.getDataService().getCache();
                var mc = cache.getModelCache('misc');
                var tmp = await mc.getCompleteRecordSet();
                if (tmp.length == 3) {
                    await cache.deleteModelCache('misc');
                    mc = cache.getModelCache('misc');
                    if (!mc)
                        res = 'OK';
                }
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, 'OK', "Clearing cache failed");

        for (var dt of ['string', 'timestamp', 'datetime', 'date', 'time']) {
            response = await driver.executeAsyncScript(async () => {
                const callback = arguments[arguments.length - 1];
                var res;
                try {
                    const controller = app.getController();
                    const model = controller.getModelController().getModel('misc');
                    if (model) {
                        const def = model.getDefinition();
                        def['defaults'] = {
                            "title": arguments[0],
                            "sort": arguments[0] + ":desc",
                            "view": {
                                "details": "title"
                            }
                        };
                        await model.setDefinition(def);
                        res = 'OK';
                    } else
                        throw new Error('Model \'misc\' not found');
                } catch (error) {
                    console.error(error);
                    alert('Error');
                    res = error;
                } finally {
                    callback(res);
                }
            }, dt);
            assert.equal(response, 'OK', 'Setting defaults failed');

            await app.navigate('/data/misc');
            await ExtendedTestHelper.delay(1000);
            await checkCanvas(window, data, dt);
        }

        await app.resetLocalStorage();
        await app.logout();
        /*await app.reload();
        await ExtendedTestHelper.delay(1000);
        var modal = await app.getWindow().getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);*/

        return Promise.resolve();
    });
});