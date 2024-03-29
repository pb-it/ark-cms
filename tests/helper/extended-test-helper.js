const path = require('path');
const fs = require('fs');

const assert = require('assert');

const { TestHelper } = require("@pb-it/ark-cms-selenium-test-helper");

const Controller = require('../../src/controller.js');

class ExtendedTestHelper extends TestHelper {

    _controller;

    constructor() {
        super();
    }

    async setup(config) {
        if (config['cmsServerConfig']) {
            this._controller = new Controller();
            await this._controller.init(config['cmsServerConfig']);
        }
        return super.setup(config);
    }

    async teardown() {
        if (this._controller)
            await this._controller.getServer().teardown();
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
            default:
        }

        return Promise.resolve();
    }
}

module.exports = ExtendedTestHelper;