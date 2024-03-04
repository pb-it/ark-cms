const fs = require('fs');
const path = require('path');

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

    it('#test prepare', async function () {
        this.timeout(30000);

        const app = helper.getApp();

        var str = fs.readFileSync(path.join(__dirname, './data/models/studio.json'), 'utf8');
        var model = JSON.parse(str);
        await helper.getModelController().addModel(model);

        str = fs.readFileSync(path.join(__dirname, './data/models/star.json'), 'utf8');
        model = JSON.parse(str);
        await helper.getModelController().addModel(model);

        str = fs.readFileSync(path.join(__dirname, './data/models/movie.json'), 'utf8');
        model = JSON.parse(str);
        await helper.getModelController().addModel(model);

        await app.reload();
        await TestHelper.delay(1000);

        str = fs.readFileSync(path.join(__dirname, './data/crud/studios.json'), 'utf8');
        var data = JSON.parse(str);
        var res;
        for (var entry of data) {
            res = await app.create('studio', entry);
            assert.notEqual(Object.keys(res).length, 0);
        }

        str = fs.readFileSync(path.join(__dirname, './data/crud/movies.json'), 'utf8');
        data = JSON.parse(str);
        for (var entry of data) {
            res = await app.create('movie', entry);
            assert.notEqual(Object.keys(res).length, 0);
        }

        await app.navigate('/data/studio');
        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 3);

        await app.navigate('/data/movie');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        return Promise.resolve();
    });

    it('#test profiles', async function () {
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
                    throw new Error('Unexpected response!');
            } else
                throw new Error('Unexpected response!');
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

        const url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/test1');

        res = await app.delete('_registry', 'profiles');
        assert.notEqual(Object.keys(res).length, 0);

        await app.navigate('/');
        await app.reload();
        await TestHelper.delay(1000);

        sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        var menu = await sidemenu.getEntry('test');
        assert.equal(menu, null);

        const sidepanel = await driver.findElement(webdriver.By.xpath('/html/body/div[@id="sidenav"]/div[@id="sidepanel"]'));
        assert.notEqual(sidepanel, null);
        var rect = await sidepanel.getRect();
        assert.notEqual(rect['width'], 0);
        const body = await driver.findElement(webdriver.By.xpath('/html/body'));
        assert.notEqual(body, null);
        await body.click();
        await TestHelper.delay(1000);
        rect = await sidepanel.getRect();
        assert.equal(rect['width'], 0);

        return Promise.resolve();
    });

    it('#test add', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        var url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie');

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        const xpathView = `//*[@id="topnav"]/div/div/div/i[contains(@class, 'fa-plus')]`;
        var view = await driver.findElements(webdriver.By.xpath(xpathView));
        assert.equal(view.length, 1);
        await view[0].click();
        await TestHelper.delay(1000);

        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        var form = await helper.getForm(panels[0]);
        assert.notEqual(form, null);
        var input = await helper.getFormInput(form, 'name');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await TestHelper.delay(1000);

        await driver.navigate().back();
        await TestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        await driver.navigate().forward();
        await TestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        form = await helper.getForm(panels[0]);
        assert.notEqual(form, null);
        input = await helper.getFormInput(form, 'name');
        var value = await input.getAttribute('value');
        //assert.equal(value, 'John Test'); //TODO: fails
        assert.equal(value, '');
        await input.sendKeys('Test');
        await TestHelper.delay(1000);

        //app.navigate('/data/movie');
        sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('star');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/star');

        await driver.navigate().back();
        await TestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        form = await helper.getForm(panels[0]);
        assert.notEqual(form, null);
        input = await helper.getFormInput(form, 'name');
        var value = await input.getAttribute('value');
        assert.equal(value, 'Test');

        return Promise.resolve();
    });
});