const os = require('os');
const path = require('path');
const fs = require('fs');

const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Extensions', function () {

    async function execPromise(command) {
        return new Promise(function (resolve, reject) {
            require('child_process').exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(stdout.trim());
            });
        });
    }

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

        await app.setDebugMode(true);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test panel extension', async function () {
        this.timeout(30000);

        if (os.type() === 'Linux' || os.type() === 'Darwin') {
            const ext = 'panelExt';
            const file = path.resolve(__dirname, `./tmp/panelExt.zip`);

            var cmd = 'cd ' + path.resolve(__dirname, `./data/extensions`) + '; zip -r ' + file + ' panelExt;';
            console.log(cmd);
            var response = await execPromise(cmd);
            console.log(response);

            const app = helper.getApp();
            await app.getExtensionController().addExtension(ext, file, true);

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            await app.login();
            await ExtendedTestHelper.delay(1000);

            var modal = await app.getWindow().getTopModal();
            assert.equal(modal, null);

            const window = app.getWindow();
            const sidemenu = window.getSideMenu();
            await sidemenu.click('Extensions');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('panelExt');
            await ExtendedTestHelper.delay(1000);
            await sidemenu.click('Configure');
            await ExtendedTestHelper.delay(1000);

            modal = await app.getWindow().getTopModal();
            assert.notEqual(modal, null);
            var panel = await modal.getPanel();
            assert.notEqual(panel, null);
            var form = await panel.getForm();
            assert.notEqual(form, null);
            var input = await form.getFormInput('code');
            assert.notEqual(input, null);
            var code = fs.readFileSync(path.join(__dirname, './data/panels/dummy-test-panel.js'), 'utf8');
            await input.sendKeys(code);
            await ExtendedTestHelper.delay(1000);
            var button = await panel.getButton('Apply');
            assert.notEqual(button, null);
            await button.click();
            await ExtendedTestHelper.delay(1000);

            await driver.wait(webdriver.until.alertIsPresent(), 1000);
            alert = await driver.switchTo().alert();
            var text = await alert.getText();
            assert.equal(text, 'Changes applied successfully.\nReload website for the changes to take effect!');
            await alert.accept();
            await ExtendedTestHelper.delay(1000);

            await app.reload();
            await ExtendedTestHelper.delay(1000);

            await app.navigate('/test-panel');

            var canvas = await window.getCanvas();
            assert.notEqual(canvas, null);
            var panels = await canvas.getPanels();
            assert.equal(panels.length, 1);
        } else
            this.skip();

        return Promise.resolve();
    });
});