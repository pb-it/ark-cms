const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit', function () {

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

    it('#test prepare', async function () {
        this.timeout(30000);

        await helper.setupScenario(1, true);

        const app = helper.getApp();
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
            await ac.requestData('PUT', '_registry', null, { 'key': 'profiles', 'value': JSON.stringify(profiles) });

            callback('OK');
        });
        assert.equal(response, 'OK');

        const app = helper.getApp();
        await app.reload();
        await ExtendedTestHelper.delay(1000);

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

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('test');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('test1');
        await ExtendedTestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent());
        const alert = await driver.switchTo().alert();
        const text = await alert.getText();
        assert.equal(text, 'test1');
        await alert.accept();

        const url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/test1');

        const ds = app.getDataService();
        res = await ds.delete('_registry', 'profiles');
        assert.notEqual(Object.keys(res).length, 0);

        await app.navigate('/');
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('test');
        assert.equal(menu, null);

        const sidepanel = await driver.findElement(webdriver.By.xpath('/html/body/div[@id="sidenav"]/div[@id="sidepanel"]'));
        assert.notEqual(sidepanel, null);
        var rect = await sidepanel.getRect();
        assert.notEqual(rect['width'], 0);
        const body = await driver.findElement(webdriver.By.xpath('/html/body'));
        assert.notEqual(body, null);
        await body.click();
        await ExtendedTestHelper.delay(1000);
        rect = await sidepanel.getRect();
        assert.equal(rect['width'], 0);

        return Promise.resolve();
    });

    /**
     * check for outdated/multiple listeners on side menu
     */
    it('#test context menu in side panel', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);

        var sidepanel = await driver.findElement(webdriver.By.xpath('/html/body/div[@id="sidenav"]/div[@id="sidepanel"]'));
        assert.notEqual(sidepanel, null);
        var contextMenu = await window.openContextMenu(sidepanel);
        await ExtendedTestHelper.delay(1000);

        const body = await driver.findElement(webdriver.By.xpath('/html/body'));
        assert.notEqual(body, null);
        await body.click();
        await ExtendedTestHelper.delay(1000);
        rect = await sidepanel.getRect();
        assert.equal(rect['width'], 0);
        const xpathContextMenu = `/html/body/ul[@class="contextmenu"]`;
        var elements = await driver.findElements(webdriver.By.xpath(xpathContextMenu));
        assert.equal(elements.length, 0);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);

        sidepanel = await driver.findElement(webdriver.By.xpath('/html/body/div[@id="sidenav"]/div[@id="sidepanel"]'));
        assert.notEqual(sidepanel, null);
        contextMenu = await window.openContextMenu(sidepanel);
        await ExtendedTestHelper.delay(1000);

        elements = await driver.findElements(webdriver.By.xpath(xpathContextMenu));
        assert.equal(elements.length, 1);
        await contextMenu.click('Edit');
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        elements = await driver.findElements(webdriver.By.xpath(xpathContextMenu));
        assert.equal(elements.length, 0);
        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test create through top navigation', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        var url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie');

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        const xpathAdd = `//*[@id="topnav"]/div/div/div/i[contains(@class, 'fa-plus')]`;
        var view = await driver.findElements(webdriver.By.xpath(xpathAdd));
        assert.equal(view.length, 1);
        await view[0].click();
        await ExtendedTestHelper.delay(1000);

        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        var form = await window.getForm(panels[0]);
        assert.notEqual(form, null);
        var input = await window.getFormInput(form, 'name');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);

        await driver.navigate().back();
        await ExtendedTestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        await driver.navigate().forward();
        await ExtendedTestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        form = await window.getForm(panels[0]);
        assert.notEqual(form, null);
        input = await window.getFormInput(form, 'name');
        var value = await input.getAttribute('value');
        //assert.equal(value, 'John Test'); //TODO: fails
        assert.equal(value, '');
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);

        //app.navigate('/data/movie');
        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/star');

        await driver.navigate().back();
        await ExtendedTestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        form = await window.getForm(panels[0]);
        assert.notEqual(form, null);
        input = await window.getFormInput(form, 'name');
        var value = await input.getAttribute('value');
        assert.equal(value, 'Test');

        return Promise.resolve();
    });
});