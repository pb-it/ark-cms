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
                var bDebug;
                var dc = cc.getDebugConfig();
                if (dc.hasOwnProperty('bDebug'))
                    bDebug = dc['bDebug'];
                else
                    bDebug = false;
                this._data = {
                    'version': app.controller.getVersionController().getAppVersion(),
                    'api': app.controller.getApiController().getApiOrigin() + "/api",
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

                        var entry = this._form.getFormEntry('bConfirmOnApply');
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

            $div.append('<br/>');

            $div.append('State of API:<br/>');
            var msg;
            var color;
            var info = app.controller.getApiController().getApiInfo();
            if (info) { // app.controller.hasConnection()
                if (app.controller.getVersionController().isCompatible()) {
                    msg = info['state'];
                    if (info['state'] === 'running')
                        color = 'green';
                    else
                        color = 'orange';
                } else {
                    msg = info['version'];
                    color = 'orange';
                }
            } else {
                msg = 'no connection';
                color = 'red';
            }
            var $info = $('<div/>')
                .css({
                    'display': 'inline-block',
                    'background-color': color
                })
                .append(msg);
            $div.append($info);
            $div.append('<br/>');
            var $check = $('<button>')
                .text('Check again')
                .click(async function (event) {
                    event.stopPropagation();

                    app.controller.setLoadingState(true);
                    try {
                        await app.controller.getApiController().fetchApiInfo();
                        await this._$commonPanel.render();
                        app.controller.setLoadingState(false);
                    } catch (error) {
                        app.controller.setLoadingState(false);
                        app.controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this));
            $div.append($check);

            $div.append('<br/><br/>');

            var $clear = $('<button>')
                .text('Clear')
                .click(function (event) {
                    event.stopPropagation();

                    this._form.setFormData({});
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

                    try {
                        var bReloadApp = false;
                        var fdata = await this._form.readForm();

                        if (fdata['bConfirmOnApply']) {
                            if (!await app.controller.getModalController().openDiffJsonModal(this._data, fdata))
                                return Promise.reject();
                        }

                        if (!fdata['version']) {
                            app.controller.getVersionController().clearAppVersion(fdata['version']);
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
                    } catch (error) {
                        app.controller.showError(error);
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