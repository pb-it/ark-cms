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

    it('#test navigation', async function () {
        this.timeout(30000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            var profiles;
            var bFound;
            const controller = app.getController();
            var tmp = await controller.getDataService().fetchData('_registry', null, 'key=profiles');
            if (tmp) {
                if (tmp.length == 0)
                    profiles = { 'available': [] };
                else if (tmp.length == 1) {
                    profiles = JSON.parse(tmp[0]['value']);
                    for (var menu of profiles['available']) {
                        if (menu['name'] === 'test') {
                            bFound = true;
                            break;
                        }
                    }
                } else
                    throw new Error('Unexpected resonse!');
            } else
                throw new Error('Unexpected resonse!');
            if (!bFound) {
                profiles['available'].push({
                    'name': 'test',
                    'menu': ['test1', 'test2']
                });
            }
            const ac = app.getController().getApiController().getApiClient();
            await ac.requestData('PUT', '_registry', { 'key': 'profiles', 'value': JSON.stringify(profiles) });

            callback('OK');
        });
        assert.equal(response, 'OK');

        const app = helper.getApp();
        await app.reload();
        await TestHelper.delay(1000);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const controller = app.getController();
            var route = {
                "regex": "^/test1$",
                "fn": async function () {
                    alert('test1');
                    return Promise.resolve();
                }
            };
            controller.getRouteController().addRoute(route);
            route = {
                "regex": "^/test2$",
                "fn": async function () {
                    alert('test2');
                    return Promise.resolve();
                }
            };
            controller.getRouteController().addRoute(route);

            callback('OK');
        });
        assert.equal(response, 'OK');

        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('test');
        await TestHelper.delay(1000);
        await sidemenu.click('test1');
        await TestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent());
        const alert = await driver.switchTo().alert();
        const text = await alert.getText();
        assert.equal(text, 'test1');
        await alert.accept();

        return Promise.resolve();
    });
});