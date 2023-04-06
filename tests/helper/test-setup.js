const os = require('os');
const { Builder, Capabilities } = require('selenium-webdriver');

class TestSetup {

    _bSetupDone = false;
    _driver;

    constructor() {
        if (TestSetup._instance)
            return TestSetup._instance
        TestSetup._instance = this;
    }

    async getDriver(browser) {
        if (!this._bSetupDone) {
            switch (browser) {
                case 'firefox':
                    //driver = new Builder().withCapabilities(Capabilities.firefox()).build();

                    const firefox = require('selenium-webdriver/firefox');
                    var options = new firefox.Options();
                    //options.setBinary(os.homedir() + '/AppData/Local/Mozilla Firefox/firefox.exe');
                    options.setProfile('/home/user/snap/firefox/common/.mozilla/firefox/c0v93y5z.Selenium');
                    this._driver = await new Builder()
                        .forBrowser('firefox')
                        .setFirefoxOptions(options)
                        .build();

                    break;
                case 'chrome':
                default:
                    this._driver = await new Builder().withCapabilities(Capabilities.chrome()).build();
            }

            this._driver.manage().window().maximize();
            this._driver.get('http://localhost:4000');

            this._bSetupDone = true;
        }
        return Promise.resolve(this._driver);
    }
}

module.exports = TestSetup;