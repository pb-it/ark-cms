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
        const panel = new Panel({ 'title': 'Common' });
        panel._renderContent = async function () {
            const $div = $('<div/>')
                .css({ 'padding': '10' });

            $div.append("LocalStorage:");

            const controller = app.getController();
            const cc = controller.getConfigController();

            if (!this._data) {
                var bDebug;
                var dc = cc.getDebugConfig();
                if (dc.hasOwnProperty('bDebug'))
                    bDebug = dc['bDebug'];
                else
                    bDebug = false;
                this._data = {
                    'version': controller.getVersionController().getAppVersion(),
                    'api': controller.getApiController().getApiOrigin(),
                    'bExperimentalFeatures': controller.getStorageController().loadLocal('bExperimentalFeatures') === 'true',
                    'bDebug': bDebug,
                    'bConfirmOnApply': bDebug || (controller.getStorageController().loadLocal('bConfirmOnApply') === 'true'),
                    'bConfirmOnLeave': controller.getStorageController().loadLocal('bConfirmOnLeave') === 'true',
                    'bIndexedDB': controller.getStorageController().loadLocal('bIndexedDB') === 'true',
                };
            }
            const skeleton = [
                { name: 'version', dataType: 'string', readonly: true },
                { name: 'api', label: 'API', dataType: 'string' },
                {
                    name: 'bExperimentalFeatures',
                    label: 'Enable Experimental Features',
                    dataType: 'boolean',
                    required: true,
                    defaultValue: false,
                    readonly: false
                },
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
                },
                {
                    name: 'bConfirmOnLeave',
                    label: 'Confirm on leave',
                    dataType: 'boolean',
                    required: true,
                    defaultValue: false
                },
                {
                    name: 'bIndexedDB',
                    label: 'Cache whith IndexedDB',
                    dataType: 'boolean',
                    required: true,
                    defaultValue: false,
                    clickAction: async function (event) {
                        var box = this.children().first();
                        if (box.prop('checked')) {
                            if (!confirm(`WARNING!

We do not recommend to activate IndexedDB when using an foreign or shared device!
If you still want to use it make sure to clear the database manually before logging out!
Otherwise your stored data will be disclosed!

Do you want to continue?`))
                                event.preventDefault();
                        }
                        return Promise.resolve();
                    }
                }
            ];
            this._form = new Form(skeleton, this._data);
            var $form = await this._form.renderForm();
            $div.append($form);

            $div.append('<br/>');

            $div.append('State of API:<br/>');
            var msg;
            var color;
            const info = controller.getApiController().getApiInfo();
            if (info) { // app.controller.hasConnection()
                if (controller.getVersionController().isCompatible()) {
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

                    controller.setLoadingState(true);
                    try {
                        await controller.getApiController().fetchApiInfo();
                        await this._$commonPanel.render();
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        if (error && error.status == 0 && !error.response)
                            controller.showErrorMessage('Connection failed');
                        else
                            controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this));
            $div.append($check);

            $div.append('<br/><br/>');

            $div.append('Extensions:<br/>');
            const ec = controller.getExtensionController();
            if (ec) {
                const extensions = ec.getExtensionsInfo();
                var $status;
                if (extensions && Object.keys(extensions).length > 0) {
                    for (var name in extensions) {
                        $div.append('&nbsp;&nbsp;&nbsp;' + name + ': ');
                        if (extensions[name]['version']) {
                            msg = extensions[name]['version'];
                            color = 'green';
                        } else {
                            msg = '**undefined**';
                            color = 'red';
                        }
                        $status = $('<div/>')
                            .css({
                                'display': 'inline-block',
                                'background-color': color
                            })
                            .append(msg);
                        $div.append($status);
                        $div.append('<br/>');
                    }
                }
            }

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

                    controller.getVersionController().checkForUpdates();
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
                            if (!await controller.getModalController().openDiffJsonModal(this._data, fdata))
                                return Promise.reject();
                        }

                        if (!fdata['version']) {
                            controller.getVersionController().clearAppVersion(fdata['version']);
                            bReloadApp = true;
                        }
                        if (this._data['api'] !== fdata['api']) {
                            cc.setApi(fdata['api']);
                            bReloadApp = true;
                        }

                        var conf = cc.getDebugConfig();
                        conf['bDebug'] = fdata['bDebug']
                        cc.setDebugConfig(conf);

                        var sc = controller.getStorageController();
                        sc.storeLocal('bExperimentalFeatures', fdata['bExperimentalFeatures']);
                        sc.storeLocal('bConfirmOnLeave', fdata['bConfirmOnLeave']);
                        sc.storeLocal('bConfirmOnApply', fdata['bConfirmOnApply']);
                        sc.storeLocal('bIndexedDB', fdata['bIndexedDB']);

                        if (bReloadApp) {
                            var db = controller.getDatabase();
                            if (db)
                                await db.deleteDatabase();
                            controller.reloadApplication();
                        } else {
                            controller.reloadState();
                            this.dispose();
                        }
                    } catch (error) {
                        controller.showError(error);
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

            for (var entry of app.getController().getLogger().getAllLogEntries()) {
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