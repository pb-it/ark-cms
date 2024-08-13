const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const itif = (condition) => condition ? it : it.skip;

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - DataService / Fetch', function () {

    async function editModelDefaults() {
        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('dummy');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        assert.notEqual(modelModal, null);
        const tabPanel = await modelModal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]'));
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
        //var option = await forms[6].findElement(webdriver.By.css('select#bConfirmation > option[value="true"]'));
        var option = await form.getElement().findElement(webdriver.By.xpath('.//select[starts-with(@id,"bConfirmation")]/option[text()="true"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
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

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    }

    async function loadAll() {
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
        await sidemenu.click('dummy');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        await driver.wait(webdriver.until.alertIsPresent(), 1000);
        const alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Continue fetching all \'dummy\'?');
        await alert.accept();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.equal(modal, null);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 10);

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

        await helper.setupScenario(2);
        await app.reload(); // clear cache
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        return Promise.resolve();
    });

    after('#teardown', async function () {
        if (helper && bSetup && global.allPassed) {
            await helper.teardown();
            global.helper = null;
        }
        return Promise.resolve();
        //return driver.quit();
    });

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test confirm dialog on fetch all', async function () {
        this.timeout(30000);

        await editModelDefaults();
        await loadAll();

        const app = helper.getApp();
        await app.navigate('/');
        await app.waitLoadingFinished(10);

        return Promise.resolve();
    });

    xit('#test ...', async function () {
        this.timeout(30000);

        if (proxy) {
            // ...
        } else
            this.skip();

        return Promise.resolve();
    });

    itif(config['proxy'])('#test batch size', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        await app.navigate('/');
        await app.waitLoadingFinished(10);

        await app.reload();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const proxy = helper.getProxy();
        assert.notEqual(proxy, null);
        const opt = {
            'captureHeaders': true,
            'captureContent': true,
            'captureBinaryContent': true
        };
        await proxy.startHar(opt);

        await loadAll();
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
            if (ent['request']['url'].startsWith(api + '/api/data/v1/dummy?'))
                iCount++;
        }
        assert.equal(iCount, 6);

        await app.navigate('/');
        await app.waitLoadingFinished(10);

        return Promise.resolve();
    });
});