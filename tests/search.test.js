const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe('Testsuit - Search', function () {

    async function checkThumbnail(panel) {
        const file = config['host'] + '/public/images/missing_image.png';
        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const xpathThumb = xpathPanel + `/div/div[@class="thumbnail"]/img`;
        var thumb = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathThumb }), 1000);
        var img = await thumb.getAttribute('src');
        var i = 0;
        const loadingIcon = config['host'] + '/public/images/loading_icon.gif';
        while (img === loadingIcon && i < 10) {
            await ExtendedTestHelper.delay(1000);
            thumb = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathThumb }), 1000);
            img = await thumb.getAttribute('src');
            i++;
        }
        assert.equal(img, file);
        return Promise.resolve();
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

        return Promise.resolve();
    });

    /*after('#teardown', async function () {
        return driver.quit();
    });*/

    afterEach(function () {
        if (global.allPassed)
            allPassed = allPassed && (this.currentTest.state === 'passed');
    });

    it('#test search', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('movie');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        const tnb = window.getTopNavigationBar();
        const sb = tnb.getSearchBox();
        await sb.search('pirate');
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        var elements = await panels[0].findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'Pirates of the Caribbean');

        return Promise.resolve();
    });

    it('#test search in url', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        await app.reload();
        await ExtendedTestHelper.delay(1000);

        var response = await driver.executeAsyncScript(async () => {
            const callback = arguments[arguments.length - 1];

            var res;
            try {
                const controller = app.getController();
                const cache = controller.getDataService().getCache();
                const mc = cache.getModelCache('_model');
                if (!mc)
                    res = 'OK';
            } catch (error) {
                alert('Error');
                console.error(error);
                res = error;
            } finally {
                callback(res);
            }
        });
        assert.equal(response, 'OK', "Cache not empty");

        await app.navigate('/data/_model?_search=model');
        await ExtendedTestHelper.delay(1000);
        var url = await driver.getCurrentUrl();
        assert.equal(url, config['host'] + '/data/_model?_search=model');
        const window = app.getWindow();
        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var title = await panels[0].getElement().findElement(webdriver.By.xpath('div/p'));
        assert.notEqual(title, null);
        var text = await title.getText();
        assert.equal(text, '_model');

        return Promise.resolve();
    });

    /**
     * Test if search configuration is error-free after changing panelConfig
     */
    it('#test search configuration', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var title = await panels[0].getElement().findElement(webdriver.By.xpath('div/p'));
        assert.notEqual(title, null);
        var text = await title.getText();
        assert.equal(text, 'John Doe');

        await window.getTopNavigationBar().openEditView();
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.getElement().findElements(webdriver.By.xpath('.//div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 1);
        var option = await forms[0].findElement(webdriver.By.css('select#panelType > option[value="MediaPanel"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#details > option[value="title"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        var button = await panel.getButton('Set as default');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        await driver.wait(webdriver.until.alertIsPresent());
        var alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Changed successfully');
        await alert.accept();
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Apply');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        title = await panels[0].getElement().findElement(webdriver.By.xpath('div/div/p'));
        assert.notEqual(title, null);
        text = await title.getText();
        assert.equal(text, 'John Doe');
        await checkThumbnail();

        await app.reload(); // clear panelConfig from state
        await ExtendedTestHelper.delay(2000);

        const tnb = window.getTopNavigationBar();
        const sb = tnb.getSearchBox();
        await sb.openConfiguration();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        button = await panel.getButton('Apply');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await checkThumbnail();

        return Promise.resolve();
    });

    it('#test search box rerender', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('star');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await ExtendedTestHelper.delay(1000);

        const tnb = window.getTopNavigationBar();
        const sb = tnb.getSearchBox();
        await sb.openConfiguration();
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Home');
        await ExtendedTestHelper.delay(1000);
        await driver.navigate().back();
        await ExtendedTestHelper.delay(1000);

        await sb.openConfiguration();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);

        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await app.getWindow().getTopModal();
        assert.equal(modal, null);

        return Promise.resolve();
    });

    it('#test search string', async function () {
        this.timeout(30000);

        const app = helper.getApp();

        const model = {
            "name": "text",
            "options": {
                "increments": true,
                "timestamps": true
            },
            "attributes": [
                {
                    "name": "title",
                    "dataType": "string"
                },
                {
                    "name": "text",
                    "dataType": "text"
                }
            ]
        }
        await app.getModelController().addModel(model);

        const data = [
            {
                'title': 'original',
                'text': 'Lorem ipsum dolor sit amet,...'
            },
            {
                'title': 'twisted',
                'text': 'Lorem dolor ipsum sit amet,...'
            }
        ];
        await helper._setupData('text', data, true);

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('text');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Show');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('All');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 2);

        const tnb = window.getTopNavigationBar();
        const sb = tnb.getSearchBox();
        await sb.openConfiguration();
        await ExtendedTestHelper.delay(1000);
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var formEntry = await form.getElement().findElement(webdriver.By.xpath(`./div[@class="formentry" and starts-with(@id, "form:searchFields:")]`));
        assert.notEqual(formEntry, null);
        var button = await formEntry.findElement(webdriver.By.xpath('.//button[text()="Select All"]'));
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Apply');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await sb.search('Lorem Ipsum');
        await ExtendedTestHelper.delay(100);
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 2);

        await sb.clear();
        await sb.search('"Lorem Ipsum"');
        await ExtendedTestHelper.delay(100);
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var title = await panels[0].getElement().findElement(webdriver.By.xpath('div/p'));
        assert.notEqual(title, null);
        var text = await title.getText();
        assert.equal(text, 'original');

        return Promise.resolve();
    });
});