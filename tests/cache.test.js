const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - cache', function () {

    let bSetup;
    let proxy;
    let driver;

    before('#setup', async function () {
        this.timeout(10000);

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

    it('#test batch size', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        //await app.navigate('/data/star');
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);
        var tabPanel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Defaults"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        var panel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 7);

        var form = new Form(helper, forms[6]);
        var input = await form.getFormInput('iBatchSize');
        assert.notEqual(input, null);
        await input.clear();
        await input.sendKeys('2');
        await ExtendedTestHelper.delay(1000);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
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
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Cache');
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null, 'Missing Cache-Modal');
        tabPanel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var rows = await tabPanel.findElements(webdriver.By.xpath('./div/div/div[@class="panel"]/div/table/tr'));
        assert.ok(rows.length >= 2);

        var text;
        var columns;
        var bFound = false;
        for (var i = 1; i < rows.length; i++) {
            columns = await rows[i].findElements(webdriver.By.xpath('./td'));
            assert.equal(columns.length, 3);
            text = await columns[0].getText();
            if (text === 'movie') {
                bFound = true;
                break;
            }
        }
        assert.ok(bFound);
        await ExtendedTestHelper.delay(1000);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

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

        modal = await window.getTopModal();
        if (modal) {
            const xpathHeader = './div[@class="modal-content"]/div[@class="panel"]/div/h2';
            var head = null;
            try {
                head = await modal.getElement().findElement(webdriver.By.xpath(xpathHeader));
            } catch (error) {
                ;
            }
            if (head) {
                text = await head.getText();
                if (text === 'Cache') {
                    try {
                        button = await modal.getElement().findElement(webdriver.By.xpath('.//button[text()="Update"]')); // update cache
                        if (button) {
                            await button.click();
                            await app.waitLoadingFinished(600);
                            try { // info dialog popup may dispose alert
                                await driver.wait(webdriver.until.alertIsPresent(), 1000);
                                var alert = await driver.switchTo().alert();
                                text = await alert.getText();
                                if (text == 'Updated successfully!')
                                    await alert.accept();
                                await app.waitLoadingFinished(10);
                            } catch (error) {
                                ;
                            }
                            await ExtendedTestHelper.delay(1000);
                            bCheck = true;
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            } else
                throw new Error('Unexpected modal open');
        }
        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Cache');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null, 'Missing Cache-Modal');
        tabPanel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(tabPanel, null, 'Panel not found!');
        button = await tabPanel.findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Database"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);
        rows = await tabPanel.findElements(webdriver.By.xpath('./div/div/div[@class="panel"]/div/table/tr'));
        assert.ok(rows.length >= 2);

        var row;
        for (var i = 1; i < rows.length; i++) {
            columns = await rows[i].findElements(webdriver.By.xpath('./td'));
            assert.equal(columns.length, 4);
            text = await columns[0].getText();
            if (text === 'movie') {
                row = rows[i];
                break;
            }
        }
        assert.notEqual(row, null);
        button = await row.findElement(webdriver.By.xpath('.//button[text()="Reload"]'));
        assert.notEqual(button, null, 'Button not found!');

        const proxy = helper.getProxy();
        assert.notEqual(proxy, null);
        const opt = {
            'captureHeaders': true,
            'captureContent': true,
            'captureBinaryContent': true
        };
        await proxy.startHar(opt);

        await button.click();
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
        assert.ok(iCount >= 4);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.navigate('/');
        driver.executeScript(function () {
            localStorage.setItem('bIndexedDB', 'false');
        });
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test offline mode', async function () {
        this.timeout(30000);

        //await app.setDebugMode(true);
        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            localStorage.setItem('debug', JSON.stringify({ bDebug: true }));
            localStorage.setItem('bExperimentalFeatures', 'true');
            /*const controller = app.getController();
            controller.reloadApplication(true);*/
            //await controller.reloadState();

            callback('OK');
        });
        assert.equal(response, 'OK', 'Enabling features failed');

        const app = helper.getApp();
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        //await app.navigate('/data/star');
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Cache');
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null, 'Missing Cache-Modal');
        const tabPanel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
        assert.notEqual(tabPanel, null, 'Panel not found!');
        var button = await tabPanel.findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Offline Mode"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        const checkbox = await tabPanel.findElement(webdriver.By.xpath('.//input[@type="checkbox" and @id="offlineMode"]'));
        assert.notEqual(checkbox, null);
        await checkbox.click();
        await ExtendedTestHelper.delay(1000);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        const xpathBubble = `//div[@id="sidemenu"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title='Cache']/span[@class='bubble' and text()='!']`;
        var notification = await driver.findElements(webdriver.By.xpath(xpathBubble));
        assert.equal(notification.length, 1);

        await app.reload();
        await ExtendedTestHelper.delay(1000);

        notification = await driver.findElements(webdriver.By.xpath(xpathBubble));
        assert.equal(notification.length, 0);

        return Promise.resolve();
    });
});