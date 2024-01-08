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

        if (helper.getConfig()['api'])
            await app.setApiUrl(helper.getConfig()['api']);
        await app.reload();

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
        var modal = await app.getTopModal();
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
                    modal = await app.getTopModal();
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
        var button = await helper.getButton(modal, 'Login');
        assert.notEqual(button, null, 'Login button not found!');
        await button.click();

        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        if (modal) {
            button = await helper.getButton(modal, 'Skip');
            if (button)
                button.click();
        }

        return Promise.resolve();
    });
});