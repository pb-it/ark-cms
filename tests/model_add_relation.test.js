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

    it('#add relation to model', async function () {
        this.timeout(10000);

        var response = await driver.executeAsyncScript(() => {
            var callback = arguments[arguments.length - 1];
            var model = {
                "name": "star",
                "options": {
                    "increments": true,
                    "timestamps": true
                },
                "attributes": [
                    {
                        "name": "name",
                        "dataType": "string"
                    },
                    {
                        "name": "gender",
                        "dataType": "enumeration",
                        "options": [
                            {
                                "value": "male"
                            },
                            {
                                "value": "female"
                            },
                            {
                                "value": "other"
                            }
                        ]
                    },
                    {
                        "name": "movies",
                        "dataType": "relation",
                        "model": "movie",
                        "multiple": true
                    }
                ]
            };

            const controller = app.getController();
            const ac = controller.getApiController().getApiClient();
            const version = controller.getVersionController().getAppVersion();
            ac.requestData('PUT', '_model?v=' + version, model)
                .then((x) => callback(x))
                .catch((x) => callback(x));
        });
        assert.equal(response, 9);

        await driver.navigate().refresh();
        await TestHelper.delay(100);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Models');
        await TestHelper.delay(1000);
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Edit');
        await TestHelper.delay(1000);

        const modelModal = await app.getTopModal();
        var button = await helper.getButton(modelModal, 'Add Attribute');
        assert.notEqual(button, null, 'Button not found!');
        button.click();

        await TestHelper.delay(100);

        var modal = await app.getTopModal();
        assert.notEqual(modal, null);
        var form = await modal.findElement(webdriver.By.xpath('//form[@class="crudform"]'));
        const input = await helper.getFormInput(form, 'name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('stars');
        await form.findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(100);

        modal = await app.getTopModal();
        form = await modal.findElement(webdriver.By.xpath('//form[@class="crudform"]'));
        var elem = await form.findElement(webdriver.By.css('select#model > option[value="star"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        elem = await form.findElement(webdriver.By.xpath('//select[@name="multiple"]/option[@value="true"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });
});