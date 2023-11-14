const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('Testsuit', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();

        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return await driver.quit();
    });*/

    it('#clear database', async function () {
        this.timeout(60000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            localStorage.setItem('bExperimentalFeatures', 'false');
            localStorage.setItem('debug', JSON.stringify({ bDebug: false }));
            localStorage.setItem('bConfirmOnApply', 'false');
            localStorage.setItem('bConfirmOnLeave', 'false');
            localStorage.setItem('bIndexedDB', 'false');

            const data = {
                'cmd': `async function test() {
    var res;
    const knex = controller.getKnex();
    var rs = await knex.raw("DROP DATABASE cms;");
    rs = await knex.raw("CREATE DATABASE cms;");
    return Promise.resolve('OK');
};
                
module.exports = test;`};

            const ac = app.getController().getApiController();
            const client = ac.getApiClient();
            var res = await client.request('POST', '/sys/tools/dev/eval?_format=text', data);
            if (res == 'OK') {
                await ac.restartApi();
                await sleep(5000);
                var bReady = await ac.waitApiReady();
                if (bReady)
                    res = 0;
                else
                    res = 1;
            }
            callback(res);
        });
        assert.equal(response, 0, 'API server did not restart in time!');

        await driver.navigate().refresh();
        await delay(100);

        await helper.login();

        var modal = await helper.getTopModal();
        assert.equal(modal, null);

        //driver.quit();
        return Promise.resolve();
    });
});