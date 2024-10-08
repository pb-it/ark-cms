const fs = require('fs');
const path = require('path');

const assert = require('assert');
const webdriver = require('selenium-webdriver');

const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

const { Form } = require('@pb-it/ark-cms-selenium-test-helper');

describe('Testsuit - File', function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new ExtendedTestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();
        const app = helper.getApp();
        await ExtendedTestHelper.delay(1000);

        await app.resetLocalStorage();
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

    it('#test add model', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const str = fs.readFileSync(path.join(__dirname, './data/models/file.json'), 'utf8');
        const model = JSON.parse(str);
        const id = await app.getModelController().addModel(model);

        await app.reload();
        await ExtendedTestHelper.delay(1000);
        await app.login();
        await ExtendedTestHelper.delay(1000);

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
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('file');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('title');
        assert.notEqual(input, null);
        await input.sendKeys('Testbild');
        await ExtendedTestHelper.delay(100);
        const inputs = await form.getElement().findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 11)
            input = inputs[6];
        else
            input = null;
        assert.notEqual(input, null);
        await input.sendKeys('https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png');
        await ExtendedTestHelper.delay(100);

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        const panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        const api = await app.getApiUrl();
        const file = api + '/cdn/Testbild.png';
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
    });

    it('#test create video', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('file');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('title');
        assert.notEqual(input, null);
        await input.sendKeys('Big Buck Bunny (BBB)');
        await ExtendedTestHelper.delay(100);
        const inputs = await form.getElement().findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 11)
            input = inputs[6];
        else
            input = null;
        assert.notEqual(input, null);
        await input.sendKeys('https://www.w3schools.com/html/mov_bbb.mp4');
        await ExtendedTestHelper.delay(100);
        input = inputs[9];
        assert.notEqual(input, null);
        await input.sendKeys('https://peach.blender.org/wp-content/uploads/title_anouncement.jpg');
        await ExtendedTestHelper.delay(100);

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();

        const overlay = await driver.wait(webdriver.until.elementLocated({ 'xpath': '//div[@id="overlay"]' }), 1000);
        var display = await overlay.getCssValue('display');
        if (display == 'none')
            await ExtendedTestHelper.delay(1000);

        var i = 0;
        while (display == 'block' && i < 10) {
            await ExtendedTestHelper.delay(1000);
            display = await overlay.getCssValue('display');
            i++;
        }

        await ExtendedTestHelper.delay(1000);

        const modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        return Promise.resolve();
    });

    it('#test check context menu', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.navigate('/data/file');
        await ExtendedTestHelper.delay(1000);

        const xpathPanel = `//*[@id="canvas"]/ul/li/div[contains(@class, 'panel')]`;
        var panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 2);

        const window = app.getWindow();
        const tnb = window.getTopNavigationBar();
        const sb = tnb.getSearchBox();
        await sb.search('Bunny');
        await ExtendedTestHelper.delay(1000);

        panels = await driver.findElements(webdriver.By.xpath(xpathPanel));
        assert.equal(panels.length, 1);

        driver.actions({ bridge: true }).contextClick(panels[0], webdriver.Button.RIGHT).perform();
        await ExtendedTestHelper.delay(1000);
        var xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Play"]`;
        var item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Create"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await ExtendedTestHelper.delay(1000);

        xpath = `/html/body/ul[@class="contextmenu"]/li/div[1][text()="Create"]/following-sibling::div/ul[@class="contextmenu"]/li/div[1][text()="Playlist File"]`;
        item = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpath }), 1000);
        assert.notEqual(item, null, 'ContextMenu Entry not found');
        await item.click();
        await ExtendedTestHelper.delay(1000);

        const downloads = await helper.getBrowser().getDownloads();
        const playlist = downloads[0];
        assert.notEqual(playlist, undefined, 'Download failed');
        var i = 0;
        while (!fs.existsSync(playlist) && i < 5) {
            await ExtendedTestHelper.delay(1000);
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

    it('#test file base64', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        const str = fs.readFileSync(path.join(__dirname, './data/models/file_base64.json'), 'utf8');
        const model = JSON.parse(str);
        const id = await app.getModelController().addModel(model);

        await app.reload();
        await ExtendedTestHelper.delay(1000);
        await app.login();
        await ExtendedTestHelper.delay(1000);

        const window = app.getWindow();
        const sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('file_base64');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('title');
        assert.notEqual(input, null);
        await input.sendKeys('Testbild');
        await ExtendedTestHelper.delay(100);
        var inputs = await form.getElement().findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 7)
            input = inputs[5];
        else
            input = null;
        assert.notEqual(input, null);
        const file_url = 'https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png';
        await input.sendKeys(file_url);
        await ExtendedTestHelper.delay(100);

        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        await app.waitLoadingFinished(10);

        var modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

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
        assert.ok(img && img.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg'));

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Edit');
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        inputs = await form.getElement().findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 7)
            input = inputs[5];
        else
            input = null;
        assert.notEqual(input, null);
        var value = await input.getAttribute('value');
        assert.equal(value, file_url);
        button = await panel.getButton('Remove');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);
        inputs = await form.getElement().findElements(webdriver.By.xpath(`./div[@class="formentry"]/div[@class="value"]/input`));
        if (inputs && inputs.length == 7)
            input = inputs[5];
        else
            input = null;
        value = await input.getAttribute('value');
        assert.equal(value, '');
        button = await panel.getButton('Update');
        assert.notEqual(button, null);
        await button.click();
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);
        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        thumb = await driver.wait(webdriver.until.elementLocated({ 'xpath': xpathThumb }), 1000);
        img = await thumb.getAttribute('src');
        const file = config['host'] + '/public/images/missing_image.png';
        assert.ok(img && img === file);

        return Promise.resolve();
    });

    it('#test base64', async function () {
        this.timeout(60000);

        const app = helper.getApp();
        await app.setDebugMode(true);
        const bDebugMode = true;

        const window = app.getWindow();
        var sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('New');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var panel = await modal.getPanel();
        assert.notEqual(panel, null);
        var form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('logo');
        var button = await modal.findElement(webdriver.By.xpath(`.//button[text()="Apply"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        const modelModal = await window.getTopModal();
        button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('name');
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="string"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('url');
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="url"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath(`.//button[text()="Add Attribute"]`));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        input = await form.getFormInput('name');
        assert.notEqual(input, null, 'Input not found!');
        await input.sendKeys('file64');
        var elem = await form.getElement().findElement(webdriver.By.css('select#dataType > option[value="file"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        panel = await modal.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var elem = await form.getElement().findElement(webdriver.By.css('select#storage > option[value="database(base64)"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        elem = await form.getElement().findElement(webdriver.By.css('select#url_prop > option[value="url"]'));
        assert.notEqual(elem, null, 'Option not found!');
        await elem.click();
        await ExtendedTestHelper.delay(1000);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Apply"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(100);

        button = await modelModal.findElement(webdriver.By.xpath('.//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        button = await modal.findElement(webdriver.By.xpath('.//button[text()="Ignore"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        if (bDebugMode) {
            await app.waitLoadingFinished(10);
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Data');
        await ExtendedTestHelper.delay(1000);
        var menu = await sidemenu.getEntry('other');
        if (menu) {
            await sidemenu.click('other');
            await ExtendedTestHelper.delay(1000);
        }
        await sidemenu.click('logo');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Create');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        var canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panel = await canvas.getPanel();
        assert.notEqual(panel, null);
        form = await panel.getForm();
        assert.notEqual(form, null);
        var input = await form.getFormInput('name');
        assert.notEqual(input, null);
        await input.sendKeys('Docker');
        await ExtendedTestHelper.delay(1000);
        var entry = await form.getFormEntry('file64');
        assert.notEqual(entry, null);
        var inputs = await entry.findElements(webdriver.By.xpath(`./div[@class="value"]/input`));
        assert.equal(inputs.length, 2);
        input = inputs[0];
        await input.sendKeys('https://upload.wikimedia.org/wikipedia/commons/4/4e/Docker_%28container_engine%29_logo.svg');
        await ExtendedTestHelper.delay(1000);
        button = await panel.getButton('Create');
        assert.notEqual(button, null);
        await button.click();
        if (bDebugMode) {
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            panel = await modal.getPanel();
            assert.notEqual(panel, null);
            var elements = await panel.getElement().findElements(webdriver.By.xpath('.//textarea'));
            assert.equal(elements.length, 2);
            var text = await elements[1].getAttribute('value');
            assert.equal(text, '{\n\t"name": "Docker",\n\t"file64": {\n\t\t"url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Docker_%28container_engine%29_logo.svg"\n\t}\n}');

            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        var panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('logo');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var tabPanel = await modal.getPanel();
        assert.notEqual(tabPanel, null);
        button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Defaults"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        panel = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 7);

        var option = await forms[0].findElement(webdriver.By.css('select#panelType > option[value="MediaPanel"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);
        option = await forms[0].findElement(webdriver.By.css('select#details > option[value="title"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);

        option = await forms[1].findElement(webdriver.By.css('select#title > option[value="name"]'));
        assert.notEqual(option, null, 'Option not found!');
        await option.click();
        await ExtendedTestHelper.delay(1000);

        form = new Form(helper, forms[4]);
        input = await form.getFormInput('file');
        assert.notEqual(input, null);
        await input.sendKeys('file64');
        await ExtendedTestHelper.delay(1000);

        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        if (bDebugMode) {
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.reload();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var contextmenu = await panels[0].openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Details');
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        await modal.closeModal();
        await ExtendedTestHelper.delay(1000);
        modal = await window.getTopModal();
        assert.equal(modal, null);

        sidemenu = window.getSideMenu();
        await sidemenu.click('Models');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('logo');
        await ExtendedTestHelper.delay(1000);
        await sidemenu.click('Edit');
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var tabPanel = await modal.getPanel();
        assert.notEqual(tabPanel, null);
        button = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div[@class="tab"]/button[text()="Defaults"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        await ExtendedTestHelper.delay(1000);

        panel = await tabPanel.getElement().findElement(webdriver.By.xpath('./div/div/div[@class="panel"]'));
        assert.notEqual(panel, null, 'Panel not found!');
        var forms = await panel.findElements(webdriver.By.xpath('./div/form[contains(@class, "crudform")]'));
        assert.equal(forms.length, 7);

        form = new Form(helper, forms[4]);
        input = await form.getFormInput('thumbnail');
        assert.notEqual(input, null);
        await input.sendKeys('file64');
        await ExtendedTestHelper.delay(1000);

        button = await modal.findElement(webdriver.By.xpath('//button[text()="Apply and Close"]'));
        assert.notEqual(button, null, 'Button not found!');
        await button.click();
        if (bDebugMode) {
            await ExtendedTestHelper.delay(1000);
            modal = await window.getTopModal();
            assert.notEqual(modal, null);
            button = await modal.findElement(webdriver.By.xpath('//button[text()="OK"]'));
            assert.notEqual(button, null);
            await button.click();
        }
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        modal = await window.getTopModal();
        assert.equal(modal, null);

        await app.reload();
        await app.waitLoadingFinished(10);
        await ExtendedTestHelper.delay(1000);

        canvas = await window.getCanvas();
        assert.notEqual(canvas, null);
        panels = await canvas.getPanels();
        assert.equal(panels.length, 1);

        var thumb = await panels[0].getElement().findElement(webdriver.By.xpath('./div/div[@class="thumbnail"]/img'));
        var img = await thumb.getAttribute('src');
        const file = config['host'] + '/public/images/missing_image.png';
        assert.ok(img && img != file);

        return Promise.resolve();
    });
});