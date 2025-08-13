const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const common = require('../src/common/common.js');

describe('Testsuit - IndexDB', function () {

    async function checkDatabasePanel() {
        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Cache');
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        const tabPanel = await modal.getPanel();
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Database"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var rows = await tabPanel.getElement().findElements(webdriver.By.xpath('./div/div/div[@class="panel"]/div/table/tr'));
        assert.ok(rows.length >= 2);

        var text;
        var columns;
        var bFound = false;
        for (var i = 1; i < rows.length; i++) {
            columns = await rows[i].findElements(webdriver.By.xpath('./td'));
            assert.equal(columns.length, 4);
            text = await columns[0].getText();
            if (text === 'movie') {
                bFound = true;
                break;
            }
        }
        assert.ok(bFound);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    }

    let bSetup;
    let proxy;
    let driver;

    before('#setup', async function () {
        this.timeout(30000);

        if (!global.allPassed)
            global.allPassed = true;

        if (!global.helper) {
            global.helper = new ExtendedTestHelper();
            bSetup = true;
        }/* else {
            //await helper.teardown();
            //await helper.getBrowser().teardown();
        }*/

        proxy = helper.getProxy();
        var bSetupProxy;
        if (!proxy && config['proxy']) {
            bSetupProxy = true;
            const requiredArgs = ['proxy-bypass-list=<-loopback>', 'ignore-certificate-errors'];
            //const requiredArgs = ['proxy-bypass-list=<-loopback>', 'ignore-certificate-errors', 'disable-web-security', 'allow-insecure-localhost', 'allow-running-insecure-content']
            if (config['browser']['arguments']) {
                var bFound;
                for (var arg of requiredArgs) {
                    bFound = false;
                    for (var a of config['browser']['arguments']) {
                        if (a === arg) {
                            bFound = true;
                            break;
                        }
                    }
                    if (!bFound)
                        config['browser']['arguments'].push(arg);
                }
            } else
                config['browser']['arguments'] = requiredArgs;
        }

        if (bSetup || bSetupProxy)
            await helper.setup(config, bSetupProxy);
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();
        await ExtendedTestHelper.delay(1000);

        proxy = helper.getProxy();
        const bStrict = false;
        if (bStrict)
            assert.notEqual(proxy, null, 'Proxy not running!');

        await app.prepare(config['api'], config['username'], config['password']);
        await ExtendedTestHelper.delay(1000);

        const modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        await app.navigate('/');
        await ExtendedTestHelper.delay(1000);

        const ds = app.getDataService();
        var tmp = await ds.read('movie');
        if (tmp.length > 0) {
            for (var entry of tmp) {
                if (entry['name'] === 'Titanic' || entry['name'] === 'Gladiator')
                    await ds.delete('movie', entry['id']);
            }
        }

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

        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    after('#teardown', async function () {
        driver.executeScript(function () {
            localStorage.setItem('bIndexedDB', 'false');
        });
        if (bSetup)
            await helper.teardown();
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
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

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
        await ExtendedTestHelper.delay(1000);

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
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        /*sidemenu = window.getSideMenu();
        await sidemenu.click('Reload');
        await ExtendedTestHelper.delay(1000);*/

        const url = await driver.getCurrentUrl();
        assert.ok(url.endsWith('/data/star'));
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 2);

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

    it('#test indexedDB #2', async function () {
        this.timeout(30000);

        var err;
        try {
            const version = await common.exec('curl --version');
            //console.log(version);
        } catch (error) {
            err = error;
        }
        if (!err) {
            const app = helper.getApp();
            const ds = app.getDataService();
            var tmp = await ds.read('star', null, 'id_neq=1');
            assert.equal(tmp.length, 1);

            var cmd = 'curl -k -c cookies.txt -d "user=admin&pass=admin" ' + config['api'] + '/sys/auth/login';
            var res = await common.exec(cmd);
            assert.equal(res, 'Found. Redirecting to /');
            cmd = 'curl -X DELETE -k -b cookies.txt ' + config['api'] + '/api/data/v1/star/' + tmp[0]['id'];
            res = await common.exec(cmd);
            assert.equal(res, 'OK');
            fs.rmSync(path.join(__dirname, '../cookies.txt'));

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            const window = app.getWindow();
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
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.equal(modal, null);

            var sidemenu = window.getSideMenu();
            await sidemenu.click('Data');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('star');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('Show');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('All');
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 1);
        } else
            this.skip();

        return Promise.resolve();
    });

    it('#test indexedDB integrity', async function () {
        this.timeout(30000);

        var err;
        try {
            const version = await common.exec('curl --version');
            //console.log(version);
        } catch (error) {
            err = error;
        }
        if (!err) {
            const app = helper.getApp();
            const ac = app.getApiController();
            const tools = ac.getTools();
            const window = app.getWindow();
            var sidemenu = window.getSideMenu();
            await sidemenu.click('Data');
            await ExtendedTestHelper.delay(1000);
            var menu = await sidemenu.getEntry('other');
            if (menu) {
                await sidemenu.click('other');
                await ExtendedTestHelper.delay(1000);
            }
            await sidemenu.click('movie');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('Show');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('All');
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 5);

            var cmd = 'curl -k -c cookies.txt -d "user=admin&pass=admin" ' + config['api'] + '/sys/auth/login';
            var res = await common.exec(cmd);
            assert.equal(res, 'Found. Redirecting to /');
            cmd = `curl -X POST -k -b cookies.txt ${config['api']}/api/data/v1/movie -H "Content-Type: application/json" -d "{\\"name\\":\\"Titanic\\"}"`;
            res = await common.exec(cmd);
            var data = JSON.parse(res);
            assert.equal(data['name'], 'Titanic');
            cmd = `async function test() {
    const knex = controller.getDatabaseController().getKnex();
    //const rs = await knex.raw("TRUNCATE TABLE _change;");
    const rs = await knex.raw("DELETE FROM _change WHERE id > 0;");
    return Promise.resolve('OK');
};        
module.exports = test;`;
            res = await tools.serverEval(cmd);
            assert.equal(res, 'OK', 'Truncating table failed');
            cmd = `curl -X POST -k -b cookies.txt ${config['api']}/api/data/v1/movie -H "Content-Type: application/json" -d "{\\"name\\":\\"Gladiator\\"}"`;
            res = await common.exec(cmd);
            data = JSON.parse(res);
            assert.equal(data['name'], 'Gladiator');
            fs.rmSync(path.join(__dirname, '../cookies.txt'));

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            var modal = await window.getTopModal();
            assert.notEqual(modal, null, 'Missing modal');
            button = await modal.findElement(webdriver.By.xpath('//button[text()="Delete Copy"]'));
            assert.notEqual(button, null, 'Button not found');
            await button.click();

            await driver.wait(webdriver.until.alertIsPresent());
            const alert = await driver.switchTo().alert();
            const text = await alert.getText();
            assert.equal(text, 'Done');
            await alert.accept();
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.equal(modal, null);

            canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            panels = await canvas.getPanels();
            assert.equal(panels.length, 7);
        } else
            this.skip();

        return Promise.resolve();
    });

    it('#test indexedDB reload', async function () {
        this.timeout(30000);

        //proxy = helper.getProxy();
        //assert.notEqual(proxy, null);
        if (proxy) {
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
            await sidemenu.click('movie');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('Show');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('All');
            await ExtendedTestHelper.delay(1000);

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 7);

            await checkDatabasePanel();

            const opt = {
                'captureHeaders': true,
                'captureContent': true,
                'captureBinaryContent': true
            };
            await proxy.startHar(opt);

            await app.reload();
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);

            const har = await proxy.endHar();
            //console.log(har);
            fs.writeFileSync(path.resolve(__dirname, `./tmp/har.json`), JSON.stringify(har, null, '\t'));
            assert.equal(har['log']['pages'].length, 1);
            //console.log(har['log']['entries'].length);
            var iCount = 0;
            const api = await app.getApiUrl();
            console.log(api);
            for (var ent of har['log']['entries']) {
                //console.log(ent);
                //console.log(ent['request']['url']);
                /*if (ent['request']['url'].startsWith(api))
                    console.log(ent['request']['url']);*/
                if (ent['request']['url'].startsWith(api + '/api/data/v1/movie?'))
                    iCount++;
            }
            assert.equal(iCount, 0);

            await checkDatabasePanel();

            await app.navigate('/');
            await app.waitLoadingFinished(10);
        } else
            this.skip();

        return Promise.resolve();
    });
});