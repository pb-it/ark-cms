const fs = require('fs');
const path = require('path');

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

    it('#test prepare', async function () {
        this.timeout(30000);

        const app = helper.getApp();

        var str = fs.readFileSync(path.join(__dirname, './data/models/studio.json'), 'utf8');
        var model = JSON.parse(str);
        await helper.getModelController().addModel(model);

        str = fs.readFileSync(path.join(__dirname, './data/models/star.json'), 'utf8');
        model = JSON.parse(str);
        await helper.getModelController().addModel(model);

        str = fs.readFileSync(path.join(__dirname, './data/models/movie.json'), 'utf8');
        model = JSON.parse(str);
        await helper.getModelController().addModel(model);

        await app.reload();
        await TestHelper.delay(1000);

        str = fs.readFileSync(path.join(__dirname, './data/crud/studios.json'), 'utf8');
        var data = JSON.parse(str);
        var res;
        for (var entry of data) {
            res = await app.create('studio', entry);
            assert.notEqual(Object.keys(res).length, 0);
        }

        str = fs.readFileSync(path.join(__dirname, './data/crud/movies.json'), 'utf8');
        data = JSON.parse(str);
        for (var entry of data) {
            res = await app.create('movie', entry);
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

    it('#test search', async function () {
        this.timeout(30000);

        const app = helper.getApp();
        const sidemenu = app.getSideMenu();
        await sidemenu.click('Data');
        await TestHelper.delay(1000);
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
        await input[0].sendKeys('pirate');

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

        return Promise.resolve();
    });
});