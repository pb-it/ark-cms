const path = require('path');
const fs = require('fs');

const assert = require('assert');

const { TestHelper } = require("@pb-it/ark-cms-selenium-test-helper");

const Controller = require('../../src/controller.js');

class ExtendedTestHelper extends TestHelper {

    static async readJson(window, panel) {
        var contextmenu = await panel.openContextMenu();
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('Debug');
        await ExtendedTestHelper.delay(1000);
        await contextmenu.click('JSON');
        await ExtendedTestHelper.delay(1000);

        var modal = await window.getTopModal();
        assert.notEqual(modal, null);
        var jsonPanel = await modal.getPanel();
        assert.notEqual(jsonPanel, null);
        var div = await jsonPanel.getElement().findElement(webdriver.By.xpath('./div'));
        assert.notEqual(div, null);
        var text = await div.getText();
        var obj = JSON.parse(text);
        //console.log(obj);

        await modal.closeModal();
        modal = await window.getTopModal();
        assert.equal(modal, null);
        return Promise.resolve(obj);
    }

    _controller;

    constructor() {
        super();
    }

    async setup(config, bUseProxy) {
        if (config['cmsServerConfig'] && config['cmsServerConfig']['host'] === 'localhost') {
            if (!this._controller) {
                this._controller = new Controller();
                await this._controller.init(config['cmsServerConfig']);
            }
        }
        return super.setup(config, bUseProxy);
    }

    async teardown() {
        super.teardown();
        if (this._controller) {
            await this._controller.getServer().teardown();
            this._controller = null;
        }
        return Promise.resolve();
    }

    async setupModel(file) {
        const str = fs.readFileSync(file, 'utf8');
        const model = JSON.parse(str);
        return this.getApp().getModelController().addModel(model);
    }

    async setupData(model, file, bExlusive) {
        const str = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(str);
        return this._setupData(model, data, bExlusive);
    }

    async _setupData(model, data, bExlusive) {
        const ds = this.getApp().getDataService();
        if (bExlusive) {
            var tmp = await ds.read(model);
            if (tmp.length > 0) {
                for (var entry of tmp) {
                    await ds.delete(model, entry['id']);
                }
            }
        }
        var res;
        for (var entry of data) {
            res = await ds.create(model, entry);
            assert.notEqual(Object.keys(res).length, 0);
        }
        return Promise.resolve();
    }

    async setupScenario(scenario, bOverride) {
        switch (scenario) {
            case 1:
                const app = this.getApp();
                const ds = app.getDataService();
                const models = await ds.read('_model');

                var bReload;
                if (bOverride || models.filter(function (x) { return x['definition']['name'] === 'studio' }).length == 0) {
                    await this.setupModel(path.join(__dirname, '../data/models/studio.json'));
                    bReload = true;
                }
                if (bOverride || models.filter(function (x) { return x['definition']['name'] === 'star' }).length == 0) {
                    await this.setupModel(path.join(__dirname, '../data/models/star.json'));
                    bReload = true;
                }
                if (bOverride || models.filter(function (x) { return x['definition']['name'] === 'movie' }).length == 0) {
                    await this.setupModel(path.join(__dirname, '../data/models/movie.json'));
                    bReload = true;
                }
                if (bReload) {
                    await app.reload();
                    await TestHelper.delay(1000);
                }

                const studios = await ds.read('studio');
                if (bOverride || studios.length == 0)
                    await this.setupData('studio', path.join(__dirname, '../data/crud/studios.json'), true);
                const movies = await ds.read('movie');
                if (bOverride || movies.length == 0)
                    await this.setupData('movie', path.join(__dirname, '../data/crud/movies.json'), true);
                const stars = await ds.read('star');
                if (stars.length == 0) {
                    const star = {
                        'id': 1,
                        'name': 'John Doe',
                        'gender': 'male'
                    }
                    var res = await ds.create('star', star);
                    assert.notEqual(Object.keys(res).length, 0);
                }

                break;
            case 2:
                var model = {
                    "name": "dummy",
                    "options": {
                        "increments": true,
                        "timestamps": true
                    },
                    "attributes": [
                        {
                            "name": "name",
                            "dataType": "string"
                        }
                    ]
                }
                await this.getApp().getModelController().addModel(model);

                const data = [];
                for (var i = 1; i <= 10; i++) {
                    data.push({
                        'id': i,
                        'name': i
                    });
                }
                await this._setupData('dummy', data, true);
                break;
            default:
        }

        return Promise.resolve();
    }
}

module.exports = ExtendedTestHelper;