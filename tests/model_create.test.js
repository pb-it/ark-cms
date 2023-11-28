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

    it('#create new model', async function () {
        this.timeout(10000);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Models');
        await TestHelper.delay(1000);
        await sidemenu.click('New');
        await TestHelper.delay(1000);

        var modal = await app.getTopModal();
        var form = await modal.findElement(webdriver.By.xpath('//form[@class="crudform"]'));
        var input = await helper.getFormInput(form, 'name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('movie');
        button = await modal.findElement(webdriver.By.xpath(`//button[text()="Apply"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(1000);

        const modelModal = await app.getTopModal();
        button = await modelModal.findElement(webdriver.By.xpath(`//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(100);

        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        form = await modal.findElement(webdriver.By.xpath('//form[@class="crudform"]'));
        input = await helper.getFormInput(form, 'name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('name');
        var elem = await form.findElement(webdriver.By.css('select#dataType > option[value="string"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(100);

        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(100);

        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('//button[text()="Ignore"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();

        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        //TODO: check

        return Promise.resolve();
    });
});