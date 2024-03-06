const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - File', function () {

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

        await app.resetLocalStorage();
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

    it('#test add model', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const str = fs.readFileSync(path.join(__dirname, './data/models/file.json'), 'utf8');
        const model = JSON.parse(str);
        const id = await app.getModelController().addModel(model);

        await app.reload();
        await TestHelper.delay(1000);
        await app.login();
        await TestHelper.delay(1000);

        return Promise.resolve();
    });

    xit('#test create image', async function () {
        this.timeout(60000);

        const data = {
            'title': 'Testbild',
            'file': {
                'url': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png'
            }
        }

        const app = helper.getApp();
        const ds = app.getDataService();
        await ds.create('file', data);

        return Promise.resolve();
    });

    it('#test create image', async function () {
        this.timeout(60000);

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
        await sidemenu.click('file');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await TestHelper.delay(1000);

        const xpath = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        const form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'title');
        assert.notEqual(input, null);
        await input.sendKeys('Testbild');
        await TestHelper.delay(100);
        const inputs = await form.findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 11)
            input = inputs[6];
        else
            input = null;
        assert.notEqual(input, null);
        await input.sendKeys('https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png');
        await TestHelper.delay(100);

        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        const panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        const api = await app.getApiUrl();
        const file = api + '/cdn/Testbild.png';
        const xpathThumb = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]/div/div[@class="thumbnail"]/img`;
        var thumb = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathThumb }), 1000);
        var img = await thumb.getAttribute('src');
        var i = 0;
        const loadingIcon = config['host'] + '/public/images/loading_icon.gif';
        while (img === loadingIcon && i < 10) {
            await TestHelper.delay(1000);
            thumb = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathThumb }), 1000);
            img = await thumb.getAttribute('src');
            i++;
        }
        assert.equal(img, file);

        return Promise.resolve();
    });

    it('#test create video', async function () {
        this.timeout(60000);

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
        await sidemenu.click('file');
        await TestHelper.delay(1000);
        await sidemenu.click('Create');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panel = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathPanel }), 1000);
        const form = await window.getForm(panel);
        var input = await window.getFormInput(form, 'title');
        assert.notEqual(input, null);
        await input.sendKeys('Big Buck Bunny (BBB)');
        await TestHelper.delay(100);
        const inputs = await form.findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 11)
            input = inputs[6];
        else
            input = null;
        assert.notEqual(input, null);
        await input.sendKeys('https://www.w3schools.com/html/mov_bbb.mp4');
        await TestHelper.delay(100);
        input = inputs[9];
        assert.notEqual(input, null);
        await input.sendKeys('https://peach.blender.org/wp-content/uploads/title_anouncement.jpg');
        await TestHelper.delay(100);

        button = await window.getButton(panel, 'Create');
        assert.notEqual(button, null);
        await button.click();

        const overlay = await driver.wait(webdriver.until.elementLocated({ 'xpath': '//div[@id="overlay"]' }), 1000);
        var display = await overlay.getCssValue('display');
        if (display == 'none')
            await TestHelper.delay(1000);

        var i = 0;
        while (display == 'block' && i < 10) {
            await TestHelper.delay(1000);
            display = await overlay.getCssValue('display');
            i++;
        }

        await TestHelper.delay(1000);

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test check context menu', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.navigate('/data/file');
        await TestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 2);

        var input = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/input[@id="searchField"]'));
        assert.equal(input.length, 1);
        await input[0].sendKeys('Bunny');

        var button = await driver.findElements(webdriver.By.xpath('//form[@id="searchForm"]/button[@id="searchButton"]'));
        assert.equal(button.length, 1);
        await button[0].click();
        await TestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        await TestHelper.delay(1000);
        var xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Play"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Create"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Create"]/following-sibling::div/ul[@class="contextmenu"]/li/div[1][text()="Playlist File"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await TestHelper.delay(1000);

        const downloads = await helper.getBrowser().getDownloads();
        const playlist = downloads[0];
        assert.notEqual(playlist, undefined, 'Download failed');
        var i = 0;
        while (!fs.existsSync(playlist) && i < 5) {
            await TestHelper.delay(1000);
            i++;
        }
        assert.equal(fs.existsSync(playlist), true, 'Download failed');

        const api = await app.getApiUrl();
        const file = api + '/cdn/mov_bbb.mp4';

        var text = fs.readFileSync(playlist, "utf-8").trim();
        const expected = `#EXTM3U
#EXTINF:-1,Big Buck Bunny (BBB)
${file}`;
        assert.equal(text, expected, 'File missmatch');

        return Promise.resolve();
    });
});