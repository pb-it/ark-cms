const fs = require('fs');
const path = require('path');

const assert = require('assert');
//const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Clear', function () {

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

        await app.prepare(config['api'], config['username'], config['password'], false); // ignore migration errors
        await ExtendedTestHelper.delay(1000);

        /*const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);*/

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#clear database', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const ac = app.getApiController();
        await app.resetLocalStorage();
        await ac.clearDatabase();

        await ac.restart(true);
        await app.reload();
        await ExtendedTestHelper.delay(1000);
        await app.prepare(helper.getConfig()['api']);
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#clear CDN', async function () {
        this.timeout(60000);

        if (config['cdn']) {
            for (const file of fs.readdirSync(config['cdn'])) {
                fs.rmSync(path.join(config['cdn'], file), { recursive: true, force: true });
            }
        } else
            this.skip();

        return Promise.resolve();
    });
});