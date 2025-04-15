const config = require('./config/test-config.js');
const ExtendedTestHelper = require('./helper/extended-test-helper.js');

describe("Root Suite", function () {

    let bSetup;
    let driver;

    before('#setup', async function () {
        this.timeout(10000);

        if (!global.helper) {
            global.helper = new ExtendedTestHelper();
            await helper.setup(config);
            bSetup = true;
        }
        driver = helper.getBrowser().getDriver();

        global.allPassed = true;

        return Promise.resolve();
    });

    after('#teardown', async function () {
        this.timeout(15000);

        if (allPassed) {
            if (bSetup)
                await helper.teardown();
            /*else
                await driver.quit();*/
        }

        return Promise.resolve();
    });

    require('./login.test.js');
    require('./helper.test.js');
    require('./clear.test.js');
    require('./settings.test.js');
    require('./content_open.test.js');
    require('./model_create.test.js');
    require('./content_create.test.js');
    require('./model_edit.test.js');
    require('./content_create2.test.js');
    require('./dataservice.test.js');
    require('./modules.test.js');
    require('./datatypes.test.js');
    require('./form.test.js');
    require('./delete.test.js');
    require('./panel.test.js');
    require('./collection.test.js');
    require('./contextmenu.test.js');
    require('./navigation.test.js');
    require('./state.test.js');
    require('./search.test.js');
    require('./sort.test.js');
    require('./filter.test.js');
    require('./view.test.js');
    require('./thumbnail.test.js');
    require('./cache.test.js');
    require('./idb.test.js');
    require('./file.test.js');
    require('./auth.test.js');
    require('./extensions.test.js');
    require('./misc.test.js');
});