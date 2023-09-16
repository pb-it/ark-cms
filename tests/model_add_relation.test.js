const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config.js');
const TestSetup = require('./helper/test-setup.js');
const TestHelper = require('./helper/test-helper.js');

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('Testsuit', function () {
    it('#add relation to model', async function () {
        this.timeout(10000);

        var driver = await new TestSetup(config).getDriver();
        var helper = new TestHelper(driver);

        await delay(1000);

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

            var ac = app.getController().getApiController().getApiClient();
            ac.requestData('PUT', '_model?v=0.5.0-beta', model)
                .then((x) => callback(x))
                .catch((x) => callback(x));
        });

        driver.navigate().refresh();

        await delay(1000);

        var modal = await helper.getTopModal();
        if (modal) {
            button = await helper.getButton(modal, 'Skip');
            button.click();
        }

        var xpath = `//*[@id="sidenav"]/div[contains(@class, 'menu') and contains(@class, 'iconbar')]/div[contains(@class, 'menuitem') and @title="Models"]`;
        var button;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();
        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')]/div[contains(@class, 'menuitem') and starts-with(text(),"movie")]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();
        xpath = `//*[@id="sidepanel"]/div/div[contains(@class, 'menu')][2]/div[contains(@class, 'menuitem') and .="Edit"]`;
        button = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        button.click();

        await delay(100);

        var modelModal = await helper.getTopModal();
        button = await helper.getButton(modelModal, 'Add Attribute');
        button.click();

        await delay(100);

        modal = await helper.getTopModal();
        form = await helper.getForm(modal);
        input = await helper.getFormInput(form, 'name');
        input.sendKeys('stars');
        form.findElement(webdriver.By.css('select#dataType > option[value="relation"]')).click();
        modal.findElement(webdriver.By.xpath('//button[text()="Apply"]')).click();

        await delay(100);

        modal = await helper.getTopModal();
        form = await helper.getForm(modal);
        form.findElement(webdriver.By.css('select#model > option[value="star"]')).click();
        form.findElement(webdriver.By.xpath('//select[@name="multiple"]/option[@value="true"]')).click();
        modal.findElement(webdriver.By.xpath('//button[text()="Apply"]')).click();

        await delay(100);

        modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]')).click();

        //driver.quit();
        return Promise.resolve();
    });
});