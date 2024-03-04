const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

    async function checkThumbnail(panel) {
        const xpathThumb = `./div/div[@class="thumbnail"]/img`;
        const thumb = await panel.findElement(webdriver.By.xpath(xpathThumb));
        assert.notEqual(thumb, null, 'Thumbnail not found!');
        const width = parseInt(await thumb.getAttribute('width'));
        assert.equal(width, 200);
        const height = parseInt(await thumb.getAttribute('height'));
        assert.equal(height, 200);
        return Promise.resolve();
    }

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

    it('#test set thumbnail size', async function () {
        this.timeout(30000);

        const response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];
            var res;
            try {
                const controller = app.getController();
                const model = controller.getModelController().getModel('star');
                const def = model.getDefinition();
                def['defaults'] = {
                    "title": "name",
                    "view": {
                        "panelType": "MediaPanel",
                        "details": "title",
                        "float": "left"
                    }
                };
                await model.setDefinition(def);
                res = 'OK';
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, 'OK', 'Setting defaults failed');

        const app = helper.getApp();
        //await app.navigate('/data/star');
        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('star');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        var elements = await panels[0].findElements(webdriver.By.xpath('div/div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'John Doe');

        const xpathView = `//*[@id="topnav"]/div/div/div/i[contains(@class, 'fa-th')]`;
        var view = await driver.findElements(webdriver.By.xpath(xpathView));
        assert.equal(view.length, 1);
        await view[0].click();
        await TestHelper.delay(1000);
        var modal = await app.getTopModal();
        assert.notEqual(modal, null);

        //const form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        var panel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 2);
        const option = await forms[1].findElement(webdriver.By.css('select#format > option[value="custom"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);
        var input = await helper.getFormInput(forms[1], 'width');
        assert.notEqual(input, null, 'Input not found!');
        await input.clear();
        await input.sendKeys('200');
        await TestHelper.delay(1000);
        input = await helper.getFormInput(forms[1], 'height');
        assert.notEqual(input, null, 'Input not found!');
        await input.clear();
        await input.sendKeys('200');
        await TestHelper.delay(1000);
        var button = await helper.getButton(modal, 'Apply');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        await checkThumbnail(panels[0]);

        view = await driver.findElements(webdriver.By.xpath(xpathView));
        assert.equal(view.length, 1);
        await view[0].click();
        await TestHelper.delay(1000);
        modal = await app.getTopModal();
        assert.notEqual(modal, null);

        button = await helper.getButton(modal, 'Set as default');
        assert.notEqual(button, null);
        await button.click();
        await driver.wait(webdriver.until.alertIsPresent());
        const alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Changed successfully');
        await alert.accept();

        await modal.closeModal();
        modal = await app.getTopModal();
        assert.equal(modal, null);

        await app.reload();
        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        await checkThumbnail(panels[0]);

        return Promise.resolve();
    });

    it('#test view all details', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        //await app.navigate('/data/star');
        var sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        await sidemenu.click('star');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        var elements = await panels[0].findElements(webdriver.By.xpath('div/div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'John Doe');

        const xpathView = `//*[@id="topnav"]/div/div/div/i[contains(@class, 'fa-th')]`;
        var view = await driver.findElements(webdriver.By.xpath(xpathView));
        assert.equal(view.length, 1);
        await view[0].click();
        await TestHelper.delay(1000);
        var modal = await app.getTopModal();
        assert.notEqual(modal, null);

        //const form = await modal.findElement(webdriver.By.xpath('//form[contains(@class, "crudform")]'));
        var panel = await modal.findElement(webdriver.By.xpath('./div[@class="modal-content"]/div[@class="panel"]/div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 2);
        var option = await forms[0].findElement(webdriver.By.css('select#panelType > option[value="CrudPanel"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#details > option[value="all"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await TestHelper.delay(1000);
        var button = await helper.getButton(modal, 'Apply');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await app.getTopModal();
        assert.equal(modal, null);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        elements = await panels[0].findElements(webdriver.By.xpath('div[@class="data"]/div[@class="details"]/div[@class="name"]'));
        assert.equal(elements.length, 6);

        // open view panel again after first time appended new view to state
        // -> verify parsing while opening panel does not mess up settings
        view = await driver.findElements(webdriver.By.xpath(xpathView));
        assert.equal(view.length, 1);
        await view[0].click();
        await TestHelper.delay(1000);
        modal = await app.getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        await TestHelper.delay(1000);

        /*sidemenu = app.getSideMenu();
        await sidemenu.click('Reload');
        await TestHelper.delay(1000);*/

        var input = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/input[@id="searchField"]'));
        assert.equal(input.length, 1);
        await input[0].sendKeys('John');

        button = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/button[@id="searchButton"]'));
        assert.equal(button.length, 1);
        await button[0].click();
        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        elements = await panels[0].findElements(webdriver.By.xpath('div[@class="data"]/div[@class="details"]/div[@class="name"]'));
        assert.equal(elements.length, 6);

        await app.reload();
        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        await checkThumbnail(panels[0]);

        return Promise.resolve();
    });
});