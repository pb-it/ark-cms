const config = require('./config/test-config.js');
const { TestHelper } = require('@pb-it/ark-cms-selenium-test-helper');

describe("Root Suite", function () {

    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new TestHelper();
            await helper.setup(config);
        }
        driver = helper.getBrowser().getDriver();

        global.allPassed = true;

        return Promise.resolve();
    });

    after('#teardown', async function () {
        if (allPassed)
            await driver.quit();
        return Promise.resolve();
    });

    require('./login.test.js');
    require('./clear.test.js');
    require('./settings.test.js');
    require('./content_open.test.js');
    require('./model_create.test.js');
    require('./content_create.test.js');
    require('./model_add_relation.test.js');
    require('./content_create2.test.js');
    require('./view.test.js');
    require('./idb.test.js');
    require('./auth.test.js');
    require('./misc.test.js');
});