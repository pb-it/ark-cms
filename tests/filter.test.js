const assert = require('assert');
const webdriver = require('selenium-webdriver');
//const test = require('selenium-webdriver/testing');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(30000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();

        await TestHelper.delay(1000);

        await app.prepare(config['api'], config['username'], config['password']);

        await TestHelper.delay(1000);

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

    xit('#test prepare', async function () {
        this.timeout(30000);

        const app = helper.getApp();

        var str = fs.readFileSync(path.join(__dirname, './data/models/studio.json'), 'utf8');
        var model = JSON.parse(str);
        await app.getModelController().addModel(model);

        str = fs.readFileSync(path.join(__dirname, './data/models/star.json'), 'utf8');
        model = JSON.parse(str);
        await app.getModelController().addModel(model);

        str = fs.readFileSync(path.join(__dirname, './data/models/movie.json'), 'utf8');
        model = JSON.parse(str);
        await app.getModelController().addModel(model);

        await app.reload();
        await TestHelper.delay(1000);

        const ds = app.getDataService();
        str = fs.readFileSync(path.join(__dirname, './data/crud/studios.json'), 'utf8');
        var data = JSON.parse(str);
        var res;
        for (var entry of data) {
            res = await ds.create('studio', entry);
            assert.notEqual(Object.keys(res).length, 0);
        }

        str = fs.readFileSync(path.join(__dirname, './data/crud/movies.json'), 'utf8');
        data = JSON.parse(str);
        for (var entry of data) {
            res = await ds.create('movie', entry);
            assert.notEqual(Object.keys(res).length, 0);
        }

        await app.navigate('/data/studio');
        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 3);

        await app.navigate('/data/movie');
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        return Promise.resolve();
    });

    it('#test filter', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await TestHelper.delay(1000);
        }
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        await window.getTopNavigationBar().openApplyFilter();
        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var button = await window.getButton(modal, 'New');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('query');
        assert.notEqual(input, null);
        await input.sendKeys('$.[?(@.studio.id==1)]');
        await TestHelper.delay(1000);
        button = await window.getButton(modal, 'Filter');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        await TestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 3);

        await window.getTopNavigationBar().openApplyFilter();
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await window.getButton(modal, 'New');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('query');
        assert.notEqual(input, null);
        await input.sendKeys('$.[?(@.name=~/(man|pirate|potter)/i)]');
        await TestHelper.delay(1000);
        button = await window.getButton(modal, 'Filter');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        await TestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);
        var title = await panels[0].getElement().findElement(webdriver.By.xpath(`./div/p`));
        assert.notEqual(title, null);
        var text = await title.getText();
        assert.equal(text, 'Iron Man');

        const xpathMenu = `//*[@id="topnav"]/div/div[contains(@class, 'menuitem') and contains(@class, 'filter')]`;
        menu = await driver.findElements(webdriver.By.xpath(xpathMenu));
        assert.equal(menu.length, 2);
        await menu[0].click();
        await TestHelper.delay(1000);
        var submenu = await menu[0].findElement(webdriver.By.xpath(`./div[contains(@class, 'submenugroup')]/div[contains(@class, 'menuitem') and text()="Edit"]`));
        assert.notEqual(submenu, null);
        await submenu.click();
        await TestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.sendKeys('Marvel Studios');
        button = await window.getButton(modal, 'Save');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);
        await driver.wait(webdriver.until.alertIsPresent());
        const alert = await driver.switchTo().alert();
        text = await alert.getText();
        assert.equal(text, 'Saved successfully');
        await alert.accept();

        await modal.closeModal();
        await TestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.navigate('/data/movie');
        await TestHelper.delay(1000);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 5);

        await window.getTopNavigationBar().openApplyFilter();
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await window.getButton(modal, 'Marvel Studios');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);
        button = await window.getButton(modal, 'Apply');
        assert.notEqual(button, null);
        await button.click();
        await TestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        modal = await window.getTopModal();
        assert.equal(modal, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 3);

        return Promise.resolve();
    });

    it('#test filter in searchbar', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await TestHelper.delay(1000);
        }
        await sidemenu.click('movie');
        await TestHelper.delay(1000);
        await sidemenu.click('Show');
        await TestHelper.delay(1000);
        await sidemenu.click('All');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        var input = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/input[@id="searchField"]'));
        assert.equal(input.length, 1);
        await input[0].sendKeys('$.[?(@.studio.id==3)]');

        var button = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/button[@id="searchButton"]'));
        assert.equal(button.length, 1);
        await button[0].click();
        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);
        var elements = await panels[0].findElements(webdriver.By.xpath('div/p'));
        assert.equal(elements.length, 1);
        var text = await elements[0].getText();
        assert.equal(text, 'Pirates of the Caribbean');

        await input[0].clear();
        await TestHelper.delay(1000);
        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 5);

        return Promise.resolve();
    });
});

