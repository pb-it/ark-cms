const path = require('path');
const fs = require('fs');

const assert = require('assert');

const { TestHelper } = require("@pb-it/ark-cms-selenium-test-helper");

class ExtendedTestHelper extends TestHelper {

    constructor() {
        super();
    }

    async setupModel(file) {
        const str = fs.readFileSync(file, 'utf8');
        const model = JSON.parse(str);
        return this.getApp().getModelController().addModel(model);
    }

    async setupData(model, file) {
        const str = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(str);
        const ds = this.getApp().getDataService();
        var res;
        for (var entry of data) {
            res = await ds.create(model, entry);
            assert.notEqual(Object.keys(res).length, 0);
        }
        return Promise.resolve();
    }

    async setupScenario(scenario) {
        switch (scenario) {
            case 1:
                const app = this.getApp();
                const ds = app.getDataService();
                const models = await ds.read('_model');

                var bReload;
                if (models.filter(function (x) { return x['name'] === 'studio' }).length == 0) {
                    await this.setupModel(path.join(__dirname, '../data/models/studio.json'));
                    bReload = true;
                }
                if (models.filter(function (x) { return x['name'] === 'star' }).length == 0) {
                    await this.setupModel(path.join(__dirname, '../data/models/star.json'));
                    bReload = true;
                }
                if (models.filter(function (x) { return x['name'] === 'movie' }).length == 0) {
                    await this.setupModel(path.join(__dirname, '../data/models/movie.json'));
                    bReload = true;
                }
                if (bReload) {
                    await app.reload();
                    await TestHelper.delay(1000);
                }

                const studios = await ds.read('studio');
                if (studios.length == 0)
                    await this.setupData('studio', path.join(__dirname, '../data/crud/studios.json'));
                const movies = await ds.read('movie');
                if (movies.length == 0)
                    await this.setupData('movie', path.join(__dirname, '../data/crud/movies.json'));
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