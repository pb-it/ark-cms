const webdriver = require('selenium-webdriver');

class TestHelper {

    _driver;

    constructor(driver) {
        this._driver = driver;
    }

    async getTopModal() {
        var modal;
        var elements = await this._driver.findElements(webdriver.By.xpath('/html/body/div[@class="modal"]'));
        if (elements && elements.length > 0)
            modal = elements[elements.length - 1];
        return Promise.resolve(modal);
    }

    async getForm(element) {
        var form;
        var elements = await element.findElements(webdriver.By.xpath('//form[@class="crudform"]'));
        if (elements && elements.length == 1)
            form = elements[0];
        return Promise.resolve(form);
    }

    async getFormInput(form, name) {
        //var formentries = await form.findElements(webdriver.By.xpath('./child::*'));
        // '//form/child::input[@type='password']'
        // '//form/input[@type='password']'
        var input;
        var elements = await form.findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input[@name="${name}"]`));
        if (elements && elements.length == 1)
            input = elements[0];
        return Promise.resolve(input);
    }

    async getButton(element, text) {
        var button;
        var elements = await element.findElements(webdriver.By.xpath(`//button[text()="${text}"]`));
        if (elements && elements.length == 1)
            button = elements[0];
        return Promise.resolve(button);
    }
}

module.exports = TestHelper;