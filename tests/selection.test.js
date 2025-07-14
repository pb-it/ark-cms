const os = require('os');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

//const { Panel } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Selection', function () {

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

    it('#test selection', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();

        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('dummy');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        var alert = await driver.switchTo().alert();
        var text = await alert.getText();
        assert.equal(text, 'Continue fetching all \'dummy\'?');
        await alert.accept();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 10);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var selected = app.getController().getSelectionController().getSelected();
            callback(selected.length);
        });
        assert.equal(response, 0, 'Wrong selection count');

        const cmdCtrl = os.platform().includes('darwin') ? webdriver.Key.COMMAND : webdriver.Key.CONTROL;
        await driver.actions()
            .click(panels[0].getElement())
            .keyDown(cmdCtrl)
            .sendKeys('a')
            .keyUp(cmdCtrl)
            .perform();
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, "panel") and contains(@class, "selected")]`;
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 10);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var selected = app.getController().getSelectionController().getSelected();
            callback(selected.length);
        });
        assert.equal(response, 10, 'Wrong selection count');

        return Promise.resolve();
    });

    it('#test selection within modal', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();

        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
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
        var panel = panels[0];
        var elements = await panel.getElement().findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'TestMovie');

        var contextmenu = await panel.openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Details');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null, 'Missing modal');

        panel = await modal.getPanel();
        panels = await panel.getElement().findElements(webdriver.By.xpath('.//div[contains(@class, "panel")]'));
        assert.equal(panels.length, 1);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var selected = app.getController().getSelectionController().getSelected();
            callback(selected.length);
        });
        assert.equal(response, 0, 'Wrong selection count');

        //var xPanel = new Panel(panels[0]);
        var className = await panels[0].getAttribute('class');
        var classList = className.split(/\s+/);
        assert.notEqual(classList.indexOf('selectable'), -1);
        assert.equal(classList.indexOf('selected'), -1);

        await panels[0].click();
        await ExtendedTestHelper.delay(1000);
        className = await panels[0].getAttribute('class');
        classList = className.split(/\s+/);
        assert.notEqual(classList.indexOf('selected'), -1);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var selected = app.getController().getSelectionController().getSelected();
            callback(selected.length);
        });
        assert.equal(response, 1, 'Wrong selection count');

        //await panel.getElement().click();
        await driver.actions().move({ origin: panel.getElement(), x: -200, y: -200 }).click().perform(); //)

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var selected = app.getController().getSelectionController().getSelected();
            callback(selected.length);
        });
        assert.equal(response, 0, 'Wrong selection count');

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var selected = app.getController().getSelectionController().getSelected();
            callback(selected.length);
        });
        assert.equal(response, 1, 'Wrong selection count');

        return Promise.resolve();
    });
});