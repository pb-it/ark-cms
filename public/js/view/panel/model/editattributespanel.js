class EditAttributesPanel extends Panel {

    _model;
    _attributes;
    _changes;

    _list;
    _listVis;
    _options;

    _form;
    _data;

    constructor(model) {
        super({ 'title': 'Attributes' });

        this._model = model;
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const mac = this._model.getModelAttributesController();
        this._attributes = mac.getAttributes();

        this._list = new List();
        if (this._attributes) {
            this._options = this._initContextMenu();
            var label;
            for (var a of this._attributes) {
                label = a['name'] + ": " + a['dataType'];
                if (a['dataType'] === 'relation')
                    label += '[' + a['model'] + ']';
                this._list.addEntry(new ListEntry(label, a, this._options));
            }
        }

        const vListConfig = {
            alignment: 'vertical',
            editable: true
        }
        this._listVis = new ListVis(vListConfig, 'attributes', this._list);
        this._listVis.init();
        $div.append(this._listVis.renderList());

        $div.append('<br/>');

        const $button = $('<button>')
            .text('Add Attribute')
            .click(async function (event) {
                event.stopPropagation();

                if (this._isChangePermitted())
                    await this._renderForm1();
                else
                    this._commitChangesFirstModal();
                return Promise.resolve();
            }.bind(this));
        $div.append($button);

        return Promise.resolve($div);
    }

    _initContextMenu() {
        const renameEntry = new ContextMenuEntry("Rename", async function (event, target) {
            if (this._isChangePermitted()) {
                const node = target.getNode();
                const from = node.getData()['name'];
                const modal = await this._rename(node);
                await modal.waitClosed();
                if (this._model.getId()) {
                    const to = node.getData()['name'];
                    if (from !== to) {
                        var entry;
                        if (this._changes && this._changes.length > 0) {
                            for (var change of this._changes) {
                                if (change.hasOwnProperty('create') && change['create'] == from) {
                                    entry = change;
                                    break;
                                }
                            }
                        }
                        if (entry)
                            entry['create'] = to;
                        else {
                            const change = { 'rename': { 'from': from, 'to': to } };
                            if (this._changes)
                                this._changes.push(change);
                            else
                                this._changes = [change];
                        }
                    }
                }
                const vis = target.getParent();
                vis.init();
                vis.renderList();
            } else
                this._commitChangesFirstModal();
            return Promise.resolve();
        }.bind(this));

        const editEntry = new ContextMenuEntry("Edit", async function (event, target) {
            //TODO:
            return Promise.resolve();
        }.bind(this));
        editEntry.setEnabledFunction(async function (target) {
            return Promise.resolve(false);
        });
        editEntry.setIcon(new Icon('pen-to-square'));

        const options = { 'cmEntries': [renameEntry, editEntry] };
        if (this._model.getId()) {
            options['cbRemove'] = function (entry) {
                const name = entry.getData()['name'];
                var index = -1;
                var from;
                if (this._changes) {
                    var entry;
                    for (var i = 0; i < this._changes.length; i++) {
                        entry = this._changes[i];
                        if (entry.hasOwnProperty('create')) {
                            if (entry['create'] == name) {
                                index = i;
                                break;
                            }
                        } else if (entry.hasOwnProperty('rename')) {
                            if (entry['rename']['to'] == name) {
                                index = i;
                                from = entry['rename']['from'];
                                break;
                            }
                        }
                    }
                }
                if (index == -1) {
                    const change = { 'delete': name };
                    if (this._changes)
                        this._changes.push(change);
                    else
                        this._changes = [change];
                } else if (from)
                    this._changes[index] = { 'delete': from };
                else
                    this._changes.splice(index, 1);
            }.bind(this);
        }
        return options;
    }

    _isChangePermitted() {
        var bChangePermitted = true;
        if (this._changes && this._changes.length > 0) {
            for (var change of this._changes) {
                if (change.hasOwnProperty('rename') || change.hasOwnProperty('delete')) {
                    bChangePermitted = false;
                    break;
                }
            }
        }
        return bChangePermitted;
    }

    _commitChangesFirstModal() {
        const controller = app.getController();
        const modal = controller.getModalController().addModal();
        const panel = new Panel();

        const $d = $('<div/>')
            .html("Please commit current changes first.<br/><br/>");
        $d.append($('<button/>')
            .text("OK")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();
                modal.close();
            }.bind(this)));

        panel.setContent($d);
        modal.openPanel(panel);
    }

    async _rename(node) {
        const attr = node.getData();
        const skeleton = [
            {
                name: 'name',
                dataType: 'string',
                required: true
            }
        ];
        const panel = new FormPanel(null, skeleton, { 'name': attr['name'] });
        panel.setApplyAction(async function () {
            const data = await panel.getForm().readForm();
            if (data['name'] && data['name'] != attr['name']) {
                if (!data['name'].startsWith('_')) {
                    if (/[^a-zA-Z0-9_-]/.test(data['name']))
                        throw new Error("For field 'name' only alphanumeric characters, underscore(except first position) and minus(dash/hyphen) are allowed");
                } else
                    throw new Error("Field 'name' must not start with an underscore");

                const lower = data['name'].toLowerCase();
                const attribues = this.getAttributes();
                if (attribues) {
                    const names = attribues.map(function (x) {
                        return x['name'];
                    });
                    for (var name of names) {
                        if (name.toLowerCase() === lower)
                            throw new Error("An attribute with name '" + name + "' is already defined");
                    }
                }

                attr['name'] = data['name'];
                node.setName(attr['name'] + ": " + attr['dataType']);
            }
            panel.dispose();
            return Promise.resolve();
        }.bind(this));
        return app.getController().getModalController().openPanelInModal(panel);
    }

    getAttributes() {
        const attributes = this._listVis.getList().getEntries().map(function (entry) {
            return entry.getData();
        });
        return attributes;
    }

    getChanges() {
        return this._changes;
    }

    _addAttributeEntry(data) {
        if (this._model.getId()) {
            const change = { 'create': data['name'] };
            if (this._changes)
                this._changes.push(change);
            else
                this._changes = [change];
        }

        this._list.addEntry(new ListEntry(data['name'] + ": " + data['dataType'], data, this._options));
        this._listVis.init();
        this._listVis.renderList();
    }

    async _renderForm1() {
        const dataTypeOptions = [
            { 'value': 'boolean' },
            { 'value': 'integer' },
            { 'value': 'decimal' },
            { 'value': 'double' },
            { 'value': 'string' },
            { 'value': 'text' },
            { 'value': 'url' },
            { 'value': 'json' },
            { 'value': 'time' },
            { 'value': 'date' },
            { 'value': 'datetime' },
            { 'value': 'timestamp' },
            { 'value': 'enumeration' },
            { 'value': 'list' },
            { 'value': 'relation' },
            { 'value': 'file' }
        ];
        const controller = app.getController()
        const dtc = controller.getDataTypeController();
        const types = dtc.getDataType();
        if (types) {
            var tags = Object.keys(types);
            for (var tag of tags)
                dataTypeOptions.push({ 'value': tag });
        }
        const skeleton = [
            {
                name: 'name',
                dataType: 'string',
                required: true
            },
            {
                name: 'dataType',
                dataType: 'enumeration',
                options: dataTypeOptions,
                view: 'select',
                required: true
            }
        ];
        const attrPanel = new FormPanel(null, skeleton, { 'persistent': true });
        attrPanel.setApplyAction(async function () {
            const data = await attrPanel.getForm().readForm();
            if (data['name']) {
                if (!data['name'].startsWith('_')) {
                    if (/[^a-zA-Z0-9_-]/.test(data['name']))
                        throw new Error("For field 'name' only alphanumeric characters, underscore(except first position) and minus(dash/hyphen) are allowed");
                } else
                    throw new Error("Field 'name' must not start with an underscore");

                const lower = data['name'].toLowerCase();
                const attribues = this.getAttributes();
                if (attribues) {
                    const names = attribues.map(function (x) {
                        return x['name'];
                    });
                    for (var name of names) {
                        if (name.toLowerCase() === lower)
                            throw new Error("An attribute with name '" + name + "' is already defined");
                    }
                }

                this._data = data;
                attrPanel.dispose();
            }
            return this._renderForm2();
        }.bind(this));
        return controller.getModalController().openPanelInModal(attrPanel);
    }

    async _renderForm2() {
        var skeleton;
        if (this._data['dataType']) {
            switch (this._data['dataType']) {
                case 'boolean':
                    skeleton = [
                        {
                            'name': 'defaultValue',
                            'dataType': 'enumeration',
                            'options': [
                                { 'value': 'none/null' },
                                { 'value': 'true' },
                                { 'value': 'false' }
                            ],
                            'view': 'select'
                        }
                    ];
                    break;
                case 'integer':
                    skeleton = [
                        { 'name': 'length', 'tooltip': 'Info:\nThis value is only used for format information within the database', 'dataType': 'integer' }
                    ];
                    var info = app.getController().getApiController().getApiInfo();
                    var client = info['db']['client'];
                    if (client === 'mysql' || client === 'mysql2') {
                        skeleton.push(
                            {
                                'name': 'type',
                                'tooltip': 'Info:\nFor information regarding Required Storage and Range of supported Integer Types read the documentation of your DMBS',
                                'dataType': 'enumeration',
                                'options': [
                                    { 'value': 'TINYINT' },
                                    { 'value': 'SMALLINT' },
                                    { 'value': 'MEDIUMINT' },
                                    { 'value': 'INT' },
                                    { 'value': 'BIGINT' }
                                ],
                                'view': 'select'
                            });
                    }
                    skeleton.push([
                        { 'name': 'unsigned', 'dataType': 'boolean', 'required': true, 'defaultValue': false },
                        { 'name': 'defaultValue', 'dataType': 'integer' }
                    ]);
                    break;
                case 'decimal':
                    skeleton = [
                        { 'name': 'length', 'tooltip': 'Info:\nThis value is only used for format information within the database', 'dataType': 'string' },
                        { 'name': 'defaultValue', 'dataType': 'decimal' }
                    ];
                    break;
                case 'double':
                    skeleton = [
                        { 'name': 'length', 'tooltip': 'Info:\nThis value is only used for format information within the database', 'dataType': 'string' },
                        { 'name': 'defaultValue', 'dataType': 'double' }
                    ];
                    break;
                case 'string':
                case 'url':
                case 'text':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string', 'tooltip': '**Info**: Constraints depend on database and character encoding. Default is 255 for \'string\' and 65,535 for \'text\'' }
                    ];
                    var info = app.getController().getApiController().getApiInfo();
                    var client = info['db']['client'];
                    if (client === 'mysql' || client === 'mysql2') {
                        skeleton.push(
                            {
                                'name': 'charEncoding',
                                'label': 'Encoding',
                                'tooltip': `**Info**: The default character encoding for the column will be taken from its table.`,
                                'dataType': 'enumeration',
                                'options': [
                                    { 'value': 'default' },
                                    { 'value': 'latin1' },
                                    { 'value': 'utf8' },
                                    { 'value': 'utf8mb4' }
                                ],
                                'view': 'select'
                            }
                        );
                    }
                    if (this._data['dataType'] === 'url')
                        skeleton.push({ 'name': 'cdn', 'label': 'CDN', 'tooltip': '**Info**: If all resources/entries share the same CDN you can define it here and omit it in the input field.', 'dataType': 'string' });
                    if (this._data['dataType'] === 'string' || this._data['dataType'] === 'url') {
                        skeleton.push(
                            { 'name': 'unique', 'tooltip': '**Info**: Unique attributes may be limited in length by your database system!', 'dataType': 'boolean' }
                        );
                    } else {
                        skeleton.push(
                            { 'name': 'size', 'dataType': 'string' }
                        );
                    }
                    skeleton.push(
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    );
                    break;
                case 'json':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string', 'tooltip': '**Info**: Constraints depend on database and character encoding' },
                        { 'name': 'size', 'dataType': 'string' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    ];
                    break;
                case 'time':
                    skeleton = [
                        {
                            'name': 'timeZone',
                            'dataType': 'enumeration',
                            'options': [
                                { 'value': '<auto>', 'disabled': true },
                                { 'value': 'UTC' }
                            ],
                            'view': 'select'
                        },
                        { 'name': 'defaultValue', 'dataType': 'time' }
                    ];
                    break;
                case 'date':
                    skeleton = [
                        { 'name': 'defaultValue', 'dataType': 'date' }
                    ];
                    break;
                case 'datetime':
                    skeleton = [
                        {
                            'name': 'timeZone',
                            'dataType': 'enumeration',
                            'options': [
                                { 'value': '<auto>', 'disabled': true },
                                { 'value': 'UTC' }
                            ],
                            'view': 'select'
                        },
                        { 'name': 'defaultValue', 'dataType': 'datetime' }
                    ];
                    break;
                case 'timestamp':
                    skeleton = [
                        {
                            'name': 'timeZone',
                            'dataType': 'enumeration',
                            'options': [
                                { 'value': '<auto>', 'disabled': true },
                                { 'value': 'UTC' }
                            ],
                            'view': 'select'
                        },
                        { 'name': 'defaultValue', 'dataType': 'timestamp' }
                    ];
                    break;
                case 'enumeration':
                    skeleton = [
                        {
                            'name': 'view',
                            'dataType': 'enumeration',
                            'options': [{ 'value': 'select' }, { 'value': 'radio' }],
                            'view': 'select',
                            'required': true,
                            'defaultValue': 'select'
                        },
                        {
                            'name': 'options',
                            'dataType': 'text',
                            'required': true,
                            'tooltip': '**Info**: Enter each available option in a separate line'
                        },
                        { 'name': 'defaultValue', 'dataType': 'string' },
                        { 'name': 'bUseString', 'label': 'Use basic string datatype.', 'dataType': 'boolean', 'view': 'labelRight', 'required': true, 'defaultValue': false }
                    ];
                    break;
                case 'list':
                    skeleton = [
                        {
                            'name': 'options',
                            'dataType': 'text',
                            'required': true,
                            'tooltip': '**Info**: Enter each available option in a separate line'
                        }
                    ];
                    break;
                case 'relation':
                    var models = app.getController().getModelController().getModels(true);
                    var allModelNames = models.map(function (model) {
                        return model.getDefinition()['name'];
                    });
                    var options = [];
                    for (var name of allModelNames) {
                        options.push({ 'value': name });
                    }
                    options = options.sort((a, b) => a['value'].localeCompare(b['value']));

                    skeleton = [
                        { 'name': 'model', 'dataType': 'enumeration', 'options': options, 'view': 'select', 'required': true },
                        {
                            'name': 'multiple',
                            'dataType': 'boolean',
                            'required': true,
                            changeAction: async function (entry) {
                                const fData = await entry._form.readForm();
                                const tn = entry._form.getFormEntry('tableName');
                                const via = entry._form.getFormEntry('via');
                                if (fData['multiple']) {
                                    await tn.enable();
                                    await via.enable();
                                } else {
                                    await tn.disable();
                                    await via.disable();
                                }
                                return Promise.resolve();
                            }.bind(this)
                        },
                        { 'name': 'tableName', 'dataType': 'string', 'readonly': true },
                        { 'name': 'via', 'dataType': 'string', 'readonly': true }
                    ];
                    break;
                case 'file':
                    var options = [];
                    var optionsUrl = [];
                    var attributes = this.getAttributes();
                    var attr;
                    if (attributes) {
                        attr = attributes.filter(function (x) { return x['dataType'] === "string" });
                        if (attr) {
                            options = attr.map(function (x) {
                                return { 'value': x['name'] };
                            });
                            options = options.sort((a, b) => a['value'].localeCompare(b['value']));
                        }
                        attr = attributes.filter(function (x) { return x['dataType'] === "string" || x['dataType'] === "url" });
                        if (attr) {
                            optionsUrl = attr.map(function (x) {
                                return { 'value': x['name'] };
                            });
                            optionsUrl = optionsUrl.sort((a, b) => a['value'].localeCompare(b['value']));
                        }
                    }
                    var cdn;
                    var info = app.controller.getApiController().getApiInfo();
                    if (info['cdn'] && info['cdn'].length > 0)
                        cdn = info['cdn'].map(function (x) { return { 'value': x['url'] }; });
                    skeleton = [
                        {
                            'name': 'storage',
                            'dataType': 'enumeration',
                            'options': [
                                { 'value': 'filesystem' },
                                { 'value': 'database(base64)' },
                                { 'value': 'database(blob)', 'disabled': true }
                            ],
                            'view': 'select',
                            'required': true,
                            changeAction: async function (entry) {
                                const fData = await entry._form.readForm({ bSkipNullValues: false, bValidate: false });
                                const cdn = entry._form.getFormEntry('cdn');
                                if (fData['storage'] == 'filesystem')
                                    await cdn.show();
                                else
                                    await cdn.hide();
                                return Promise.resolve();
                            },
                        },
                        {
                            'name': 'cdn',
                            'label': 'CDN',
                            'tooltip': '**INFO**: Available CDNs have to be configured at your backend server(API).',
                            'dataType': 'enumeration',
                            'view': 'select',
                            'options': cdn,
                            'required': true,
                            'hidden': true
                        },
                        //{ 'name': 'length', 'tooltip': '**Info**: max. length of filename', 'dataType': 'string', 'defaultValue': '250', 'readonly': false },
                        {
                            'name': 'filename_prop',
                            'label': 'Filename attribute',
                            'tooltip': '**Info**: Attribute for storing the filename.',
                            'dataType': 'enumeration',
                            'options': options,
                            'view': 'select'
                        },
                        {
                            'name': 'url_prop',
                            'label': 'URL attribute',
                            'tooltip': '**Info**: Attribute for storing the URL information given for downloading the file.',
                            'dataType': 'enumeration',
                            'options': optionsUrl,
                            'view': 'select'
                        }
                        //{ 'name': 'unique', 'dataType': 'boolean', 'defaultValue': true, 'readonly': false }
                    ];
                    break;
                default:
                    const dtc = app.getController().getDataTypeController();
                    var dt = dtc.getDataType(this._data['dataType']);
                    if (dt) {
                        if (dt.getSkeleton)
                            skeleton = dt.getSkeleton(this.getAttributes());
                        else if (dt.skeleton)
                            skeleton = dt.skeleton;
                    }
            }
            if (!skeleton)
                skeleton = [];
            skeleton.push({ 'name': 'persistent', 'dataType': 'boolean', 'required': true, 'defaultValue': true });
            skeleton.push({ 'name': 'readonly', 'dataType': 'boolean', 'required': true, 'defaultValue': false });
            skeleton.push({ 'name': 'hidden', 'dataType': 'boolean' });
            skeleton.push({ 'name': 'required', 'dataType': 'boolean' });
        }

        var attrPanel = new FormPanel(null, skeleton, {});
        attrPanel.setApplyAction(async function () {
            await this._addAttribute(attrPanel);

            if (this._data['dataType'] === 'string' && this._data['unique'] && (!this._data['length'] || this._data['required'])) {
                var panel = new Panel();

                var $d = $('<div/>')
                    .css({ 'padding': '10' });

                $d.append("<b>Info:</b><br/>");
                if (!this._data['length']) {
                    $d.append(`By most databases 'unique' property on string fields is only supported up to a certain length.<br/>
                    The precise limit may also depend on the concrete database engine and your chosen character encoding.<br/>
                    e.g. MySQL MyISAM Storage Engine limits to 1000 bytes.<br/>
                    With utf8mb4 Character Set the maximum length would be 250.<br/>
                    Leaving the length field unfilled would lead to the default setting of 255 characters and the database will<br/>
                    refuse to create the relevant column.<br/><br/>`);
                }
                if (this._data['required']) {
                    $d.append(`Combining the flag 'unique' with 'required'(not null) will work only if there are no existing records
                    of the model in the database.<br/><br/>`);
                }

                var $skip = $('<button>')
                    .text('Change')
                    .click(async function (event) {
                        event.stopPropagation();

                        panel.dispose();
                    }.bind(this));
                $d.append($skip);
                var $continue = $('<button>')
                    .text('Ignore')
                    .css({ 'float': 'right' })
                    .click(async function (event) {
                        event.stopPropagation();

                        panel.dispose();

                        this._addAttributeEntry(this._data);

                        attrPanel.dispose();
                        return Promise.resolve();
                    }.bind(this));
                $d.append($continue);

                panel.setContent($d);

                await app.controller.getModalController().openPanelInModal(panel);
            } else {
                this._addAttributeEntry(this._data);

                attrPanel.dispose();
            }
            return Promise.resolve();
        }.bind(this));
        await app.controller.getModalController().openPanelInModal(attrPanel);
        this._form = attrPanel.getForm();
        return Promise.resolve();
    }

    async _addAttribute(panel) {
        var data = await panel.getForm().readForm({ bIncludeHidden: false, bIncludeReadonly: false });

        var dt;
        if (this._data['dataType']) {
            switch (this._data['dataType']) {
                case 'boolean':
                    if (data.defaultValue) {
                        if (data.defaultValue === 'true')
                            this._data.defaultValue = true;
                        else if (data.defaultValue === 'false')
                            this._data.defaultValue = false;
                    }
                    break;
                case 'string':
                case 'url':
                    if (data.length) {
                        if (!isNaN(data.length)) {
                            var length = parseInt(data.length);
                            if (length > 0 && length <= 65535) //TODO: 65535 bytes - depends on database and character encoding
                                this._data.length = data.length;
                            else
                                throw new Error("Field 'length' has to be between 0 and 65,535");
                        } else
                            throw new Error("Field 'length' is not a number");
                    }
                    if (this._data['dataType'] == 'url' && data.cdn)
                        this._data.cdn = data.cdn;
                    if (data.charEncoding)
                        this._data.charEncoding = data.charEncoding;
                    if (data.unique)
                        this._data.unique = data.unique;
                    break;
                case 'enumeration':
                    this._data['view'] = data['view'];
                    this._data['options'] = data['options'].split('\n').map(function (x) { return { 'value': x.trim() } });
                    this._data['bUseString'] = data['bUseString'];
                    break;
                case 'list':
                    this._data['options'] = data['options'].split('\n').map(function (x) { return { 'value': x.trim() } });
                    break;
                case 'text':
                case 'json':
                    if (data.length) //TODO: MEDIUMTEXT / LONGTEXT
                        this._data.length = data.length;
                    if (data.charEncoding)
                        this._data.charEncoding = data.charEncoding;
                    if (data.view)
                        this._data.view = data.view;
                    if (data.size)
                        this._data.size = data.size;
                    break;
                case 'time':
                case 'date':
                case 'datetime':
                case 'timestamp':
                    if (data['timeZone'])
                        this._data['timeZone'] = data['timeZone'];
                    break;
                case 'relation':
                    this._data.model = data.model;
                    if (data.multiple) {
                        var attributes = this.getAttributes();
                        if (attributes) {
                            var exist = attributes.filter(function (x) { return x['dataType'] === "relation" && x['model'] === data.model && x['multiple'] && x['tableName'] === data.tableName });
                            if (exist && exist.length > 0)
                                throw new Error("Field 'tableName' must be unique");
                        }
                        this._data.multiple = data.multiple;
                        if (data.tableName)
                            this._data.tableName = data.tableName;
                    }
                    if (data.via)
                        this._data.via = data.via;
                    break;
                case 'integer':
                    if (data.length) {
                        if (!isNaN(data.length)) {
                            var length = parseInt(data.length);
                            if (length > 0 && length < 12)
                                this._data.length = data.length;
                            else
                                throw new Error("Field 'length' has to be between 0 and 12");
                        } else
                            throw new Error("Field 'length' is not a number");
                    }
                    if (data['type'])
                        this._data['type'] = data['type'];
                    if (data['unsigned'])
                        this._data['unsigned'] = data['unsigned'];
                    break;
                case 'decimal':
                case 'double':
                    if (data.length) { //TODO: with optional precision (defaults to 8) and scale (defaults to 2)
                        var parts = data.length.split(',');
                        if (parts.length == 1) {
                            if (!isNaN(parts[0])) {
                                //var total = parseInt(parts[0]);
                                this._data.length = data.length;
                            } else
                                throw new Error("Field 'length' is not a number");
                        } else if (parts.length == 2) {
                            if (!isNaN(parts[0]) && !isNaN(parts[1])) {
                                //var total = parseInt(parts[0]);
                                this._data.length = data.length;
                            } else
                                throw new Error("Invalid input in field 'length'");
                        } else
                            throw new Error("Invalid input in field 'length'");
                    }
                    break;
                case 'file':
                    if (data['storage']) {
                        if (data['storage'] == 'database(base64)')
                            this._data['storage'] = 'base64';
                        else if (data['storage'] == 'database(blob)')
                            this._data['storage'] = 'blob';
                        else
                            this._data['storage'] = data['storage'];
                    }
                    if (data['length']) //MEDIUMTEXT / LONGTEXT
                        this._data['length'] = data['length'];
                    if (data['cdn'])
                        this._data['cdn'] = data['cdn'];
                    if (data['filename_prop'])
                        this._data['filename_prop'] = data['filename_prop'];
                    if (data['url_prop'])
                        this._data['url_prop'] = data['url_prop'];
                    if (data['unique'])
                        this._data['unique'] = data['unique'];
                    break;
                default:
                    const dtc = app.getController().getDataTypeController();
                    dt = dtc.getDataType(this._data['dataType']);
                    if (dt) {
                        if (dt.applySkeleton)
                            this._data = dt.applySkeleton(this._data, data);
                        else {
                            var skeleton;
                            if (dt.getSkeleton)
                                skeleton = dt.getSkeleton(this.getAttributes());
                            else
                                skeleton = dt.skeleton;
                            if (skeleton) {
                                var name;
                                for (var entry of skeleton) {
                                    name = entry['name'];
                                    if (name && data.hasOwnProperty(name))
                                        this._data[name] = data[name];
                                }
                            }
                        }
                    }
            }
        }

        if (!dt && this._data['dataType'] !== 'boolean' && data.defaultValue)
            this._data.defaultValue = data.defaultValue;

        if (data.persistent === false)
            this._data.persistent = false;
        if (data.readonly === true)
            this._data.readonly = true;
        if (data.hidden === true)
            this._data.hidden = true;
        if (data.required)
            this._data.required = data.required;

        return Promise.resolve();
    }
}