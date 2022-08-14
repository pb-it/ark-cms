class ConfigPanel extends TabPanel {

    _$commonPanel;
    _$logPanel;

    _data;
    _form;

    _bConfirmOnApply;

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

            if (!this._data) {
                var bDebug = cc.getDebugConfig()['bDebug'];
                this._data = {
                    'version': app.controller.getVersionController().getAppVersion(),
                    'api': cc.getApiOrigin() + "/api",
                    'bDebug': bDebug,
                    'bConfirmOnApply': bDebug || (app.controller.getStorageController().loadLocal('bConfirmOnApply') === 'true')
                };
            }
            var skeleton = [
                { name: 'version', dataType: 'string', readonly: true },
                { name: 'api', label: 'API', dataType: 'string' },
                {
                    name: 'bDebug',
                    label: 'Debug Mode',
                    tooltip: '**Warning**: Will also enable experimental / unsafe features. Use with caution!',
                    dataType: 'boolean',
                    required: true,
                    defaultValue: false,
                    changeAction: async function () {
                        var fData = await this._form.readForm();

                        var entry = this._form.getEntry('bConfirmOnApply');
                        var attribute = entry.getAttribute();
                        attribute['readonly'] = fData['bDebug'];
                        if (fData['bDebug']) {
                            this._bConfirmOnApply = fData['bConfirmOnApply'];
                            await entry.renderValue(true);
                        } else
                            await entry.renderValue(this._bConfirmOnApply);
                        //await this._form.renderForm();
                        return Promise.resolve();
                    }.bind(this),
                },
                {
                    name: 'bConfirmOnApply',
                    label: 'Confirm on apply',
                    dataType: 'boolean',
                    required: true,
                    defaultValue: false,
                    readonly: this._data['bDebug']
                }
            ];
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

                    if (fdata['bConfirmOnApply']) {
                        if (!await app.controller.getModalController().openDiffJsonModal(this._data, fdata))
                            return Promise.reject();
                    }

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

                    app.controller.getStorageController().storeLocal('bConfirmOnApply', fdata['bConfirmOnApply']);

                    if (bReloadApp)
                        app.controller.reloadApplication();
                    else {
                        app.controller.reloadState();
                        this.dispose();
                    }

                    return Promise.resolve();
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

    async _hasChanged() {
        var org = this._data;
        var current = await this._form.readForm();
        return Promise.resolve(!isEqualJson(org, current));
    }
}