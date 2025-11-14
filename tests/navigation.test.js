const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const { Panel, Form } = require('@pb-it/ark-cms-selenium-test-helper');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Navigation', function () {

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
        this.timeout(30000);

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

        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('value');
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, '{"available":[]}');
        await input.clear();
        await input.sendKeys('{"available":[{"name":"movie-db","menu":["movie",null,"studio",null,"star"]}]}');

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie-db');
        await ExtendedTestHelper.delay(1000);
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

        // undo
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

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        elements = await driver.findElements(webdriver.By.xpath(xpathContextMenu));
        assert.equal(elements.length, 0);

        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('value');
        assert.notEqual(input, null);
        await input.clear();

        button = await panel.getButton('Update');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 5);

        //const ds = app.getDataService();
        //await ds.delete('misc', id);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            const ac = app.getController().getApiController().getApiClient();
            await ac.requestData('DELETE', '_registry', null, { 'key': 'profiles' });

            callback('OK');
        });
        assert.equal(response, 'OK');

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
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie');

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 5);

        const xpathAdd = `//*[@id="topnav"]/div/div/div/i[contains(@class, 'fa-plus')]`;
        var view = await driver.findElements(webdriver.By.xpath(xpathAdd));
        assert.equal(view.length, 1);
        await view[0].click();
        await ExtendedTestHelper.delay(1000);

        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var form = await panels[0].getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);

        await driver.navigate().back();
        await ExtendedTestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie');
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 5);

        await driver.navigate().forward();
        await ExtendedTestHelper.delay(1000);
        url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/movie/new');
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        form = await panels[0].getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
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
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        form = await panels[0].getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        var value = await input.getAttribute('value');
        assert.equal(value, 'Test');

        return Promise.resolve();
    });

    it('#test side-navigation iconbar', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');

        const xpathDataIcon = `//div[@id="sidemenu"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title='Data']`;
        var icons = await driver.findElements(webdriver.By.xpath(xpathDataIcon));
        assert.equal(icons.length, 1);
        var clazz = await icons[0].getAttribute('class');
        assert.ok(clazz.indexOf('active') != -1);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Models');

        const xpathModelsIcon = `//div[@id="sidemenu"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title='Models']`;
        icons = await driver.findElements(webdriver.By.xpath(xpathModelsIcon));
        assert.equal(icons.length, 1);
        clazz = await icons[0].getAttribute('class');
        assert.ok(clazz.indexOf('active') != -1);

        icons = await driver.findElements(webdriver.By.xpath(xpathDataIcon));
        assert.equal(icons.length, 1);
        var clazz = await icons[0].getAttribute('class');
        assert.ok(clazz.indexOf('active') == -1);

        const xpathActiveIcon = `//div[@id="sidemenu"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and contains(@class, 'active')]`;
        icons = await driver.findElements(webdriver.By.xpath(xpathActiveIcon));
        assert.equal(icons.length, 1);
        var title = await icons[0].getAttribute('title');
        assert.equal(title, 'Models');

        return Promise.resolve();
    });

    it('#test close all modals when loading new state', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var entry = await form.getFormEntry('movies');
        assert.notEqual(entry, null);
        var button = await entry.findElement(webdriver.By.xpath('.//button[text()="Create"]'));
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.sendKeys('Test');
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var bDebugMode = await app.isDebugModeActive();
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('.//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        button = await panel.getButton('Update');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        if (bDebugMode) {
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('.//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);
        }
        await app.waitLoadingFinished(10);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        entry = await form.getFormEntry('movies');
        assert.notEqual(entry, null);
        var elements = await entry.findElements(webdriver.By.xpath('./div[@class="value"]/div[@class="select"]/ul/li/div[contains(@class, "panel")]'));
        assert.equal(panels.length, 1);

        panel = new Panel(helper, elements[0]);
        contextmenu = await panel.openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Details');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        elements = await panel.getElement().findElements(webdriver.By.xpath('.//div[contains(@class, "panel")]'));
        assert.equal(panels.length, 1);
        panel = new Panel(helper, elements[0]);
        contextmenu = await panel.openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Open');
        await app.waitLoadingFinished(10);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Details');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        elements = await panel.getElement().findElements(webdriver.By.xpath('.//div[contains(@class, "panel")]'));
        assert.equal(panels.length, 1);
        panel = new Panel(helper, elements[0]);
        contextmenu = await panel.openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Delete');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        elements = await modal.findElements(webdriver.By.xpath(`.//input[@type="submit" and @name="confirm"]`));
        assert.equal(elements.length, 1);
        button = elements[0];
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test context menu gets closed on browser navigation / popstate', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        var xpath = `/html/body/ul[@class="contextmenu"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu not found');

        await driver.navigate().back();
        await app.waitLoadingFinished(10);

        var elements = await driver.findElements(webdriver.By.xpath(xpath));
        assert.equal(elements.length, 0, 'ContextMenu still open');

        return Promise.resolve();
    });
});