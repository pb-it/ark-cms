const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - Login', function () {

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

        if (helper.getConfig()['api'])
            await app.setApiUrl(helper.getConfig()['api']);
        await app.reload();
        await TestHelper.delay(1000);

        await app.logout();
        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test login', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const window = app.getWindow();
        var modal = await window.getTopModal();
        if (modal) {
            var head;
            try {
                head = await modal.findElement(webdriver.By.xpath('//div[@class="panel"]/div/h2'));
            } catch (error) {
                ;
            }
            if (head) {
                const text = await head.getText();
                if (text === 'Attempt to connect to API failed') {
                    await app.acceptPrivateCertificate();

                    await app.reload();
                    await TestHelper.delay(1000);
                    modal = await window.getTopModal();
                }
            }
        }
        assert.notEqual(modal, null, 'Modal not open!');
        var input = await modal.findElement(webdriver.By.css('input[id="username"]'));
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('admin');
        input = await modal.findElement(webdriver.By.css('input[id="password"]'));
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('admin');
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var button = await panel.getButton('Login');
        assert.notEqual(button, null, 'Login button not found!');
        await button.click();

        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        if (modal) {
            panel = await modal.getPanel();
            assert.notEqual(panel, null);
            button = await panel.getButton('Skip');
            if (button)
                button.click();
        }

        return Promise.resolve();
    });
});