class ConfigPanel extends TabPanel {

    _$commonPanel;
    _$logPanel;

    _data;
    _form;

    constructor(config) {
        super(config);
    }

    async _init() {
        await super._init();

        this._$commonPanel = await this._createCommonPanel();
        this._$logPanel = await this._createLogPanel();

        this._panels.push(this._$commonPanel);
        this._panels.push(this._$logPanel);

        await this.openTab(this._$commonPanel);

        return Promise.resolve();
    }

    async _createCommonPanel() {
        var panel = new Panel({ 'title': 'Common' });
        panel._renderContent = async function () {
            var $div = $('<div/>')
                .css({ 'padding': '10' });

            $div.append("LocalStorage:");

            var cc = app.controller.getConfigController();

            var skeleton = [
                { name: 'version', dataType: 'string', readonly: true },
                { name: 'api', label: 'API', dataType: 'string' },
                { name: 'bDebug', label: 'Debug Mode', dataType: 'boolean', required: true, defaultValue: false }
            ];
            this._data = {
                'api': cc.getApiOrigin() + "/api",
                'version': app.controller.getVersionController().getAppVersion(),
                'bDebug': cc.getDebugConfig()['bDebug']
            };
            this._form = new Form(skeleton, this._data);
            var $form = await this._form.renderForm();
            $div.append($form);

            $div.append('<br/><br/>');

            var $clear = $('<button>')
                .text('Clear')
                .click(function (event) {
                    event.stopPropagation();

                    this._form.setData({});
                    this._form.renderForm();
                }.bind(this));
            $div.append($clear);

            var $clear = $('<button>')
                .text('Check for Updates')
                .click(function (event) {
                    event.stopPropagation();

                    app.controller.getVersionController().checkForUpdates();
                }.bind(this));
            $div.append($clear);

            var $apply = $('<button>')
                .css({ 'float': 'right' })
                .text('Apply and Reload')
                .click(async function (event) {
                    event.stopPropagation();

                    var bReloadApp = false;
                    var fdata = await this._form.readForm();
                    if (this._data['version'] !== fdata['version']) {
                        app.controller.getVersionController().setAppVersion(fdata['version']);
                        bReloadApp = true;
                    }
                    if (this._data['api'] !== fdata['api']) {
                        cc.setApi(fdata['api']);
                        bReloadApp = true;
                    }
                    var conf = cc.getDebugConfig();
                    conf['bDebug'] = fdata['bDebug']
                    cc.setDebugConfig(conf);

                    if (bReloadApp)
                        app.controller.reloadApplication();
                    else {
                        app.controller.reloadState();
                        this.dispose();
                    }
                }.bind(this));
            $div.append($apply);
            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createLogPanel() {
        var panel = new Panel({ 'title': 'Log' });
        panel._renderContent = async function () {
            var $div = $('<div/>')
                .css({ 'padding': '10' });

            for (var entry of app.controller.getLogger().getAllLogEntries()) {
                $div.append(entry.toString() + "<br/>");
            }

            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }
}