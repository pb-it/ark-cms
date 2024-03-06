const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

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

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        await app.navigate('/');

        await TestHelper.delay(1000);

        const response = await driver.executeAsyncScript(async () => {
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
        assert.equal(response, 'OK', "Preparation failed!");
        await app.reload();

        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    after('#teardown', async function () {
        driver.executeScript(function () {
            localStorage.setItem('bIndexedDB', 'false');
        });

        return Promise.resolve();
        //return driver.quit();
    });

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test indexedDB', async function () {
        this.timeout(30000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const controller = app.getController();
                const cache = controller.getDataService().getCache();
                await cache.deleteModelCache();
                var mc = cache.getModelCache('star');
                if (mc != null)
                    throw new Error('Clearing cache failed!');
                const stars = await controller.getDataService().fetchData('star', null, null, null, null, null, null, true);
                mc = cache.getModelCache('star');
                res = await mc.getCompleteRecordSet();
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        //console.log(response);
        assert.equal(Array.isArray(response) && response.length == 1 && response[0]['name'] === 'John Doe', true, 'Updating cache failed!');

        const app = helper.getApp();
        const window = app.getWindow();
        //await app.navigate('/data/star');
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('star');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const tools = await app.getApiController().getTools();
        const cmd = `async function test() {
    const star = {
        'name': 'Jane Doe'
    };
    const model = controller.getShelf().getModel('star');
    var tmp = await model.create(star);
    var id;
    if (tmp && tmp['id'])
        await controller._protocol(null, null, 'POST', 'star', tmp['id'], star);
    else
        throw new Error('Missing ID');
    return Promise.resolve('OK');
};        
module.exports = test;`
        const res = await tools.serverEval(cmd);
        assert.equal(res, 'OK', "Creation of content failed!");

        await app.reload();

        await TestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null, 'Missing Update-Modal');
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Update"]'));
        assert.notEqual(button, null, 'Update button not found');
        await button.click();

        await driver.wait(webdriver.until.alertIsPresent());
        const alert = await driver.switchTo().alert();
        const text = await alert.getText();
        assert.equal(text, 'Updated successfully!');
        await alert.accept();

        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        /*sidemenu = window.getSideMenu();
        await sidemenu.click('Reload');
        await TestHelper.delay(1000);*/

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const controller = app.getController();
                const cache = controller.getDataService().getCache();
                const mc = cache.getModelCache('star');
                res = await mc.getCompleteRecordSet();
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        //console.log(response);
        assert.equal(Array.isArray(response) && response.length == 2, true, 'Updating cache failed!');

        return Promise.resolve();
    });
});