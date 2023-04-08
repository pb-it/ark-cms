class EditAttributesPanel extends Panel {

    _model;
    _attributes;

    _list;
    _listVis;

    _form;
    _data;

    constructor(model) {
        super({ 'title': 'Attributes' });

        this._model = model;
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var mac = this._model.getModelAttributesController();
        this._attributes = mac.getAttributes();

        this._list = new List();
        if (this._attributes) {
            for (var a of this._attributes) {
                this._list.addEntry(new ListEntry(a['name'] + ": " + a['dataType'], a));
            }
        }

        var vListConfig = {
            alignment: 'vertical',
            editable: true
        }
        this._listVis = new ListVis(vListConfig, 'attributes', this._list);
        this._listVis.init();
        $div.append(this._listVis.renderList());

        $div.append('<br/>');

        var $button = $('<button>')
            .text('Add Attribute')
            .click(async function (event) {
                event.stopPropagation();
                return this._renderForm1();
            }.bind(this));
        $div.append($button);

        return Promise.resolve($div);
    }

    getAttributes() {
        var attributes = this._listVis.getList().getEntries().map(function (entry) {
            return entry.getData();
        });
        return attributes;
    }

    _addAttributeEntry(data) {
        this._list.addEntry(new ListEntry(data['name'] + ": " + data['dataType'], data));
        this._listVis.init();
        this._listVis.renderList();
    }

    async _renderForm1() {
        var skeleton = [
            {
                name: 'name',
                dataType: 'string',
                required: true
            },
            {
                name: 'dataType',
                dataType: 'enumeration',
                options: [
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
                    { 'value': 'relation' },
                    { 'value': 'file' }
                ],
                view: 'select',
                required: true
            }
        ];
        var attrPanel = new FormPanel(null, skeleton, { 'persistent': true });
        attrPanel.setApplyAction(async function () {
            var data = await attrPanel.getForm().readForm();
            if (data.name) {
                if (!data.name.startsWith('_')) {
                    if (/[^a-zA-Z0-9_-]/.test(data.name))
                        throw new Error("For field 'name' only alphanumeric characters, underscore(except first position) and minus(dash/hyphen) are allowed");
                } else
                    throw new Error("Field 'name' must not start with an underscore");

                var lower = data.name.toLowerCase();
                var attribues = this.getAttributes();
                if (attribues) {
                    var names = attribues.map(function (x) {
                        return x.name;
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
        return app.controller.getModalController().openPanelInModal(attrPanel);
    }

    async _renderForm2() {
        var skeleton;
        if (this._data['dataType']) {
            switch (this._data['dataType']) {
                case 'boolean':
                    skeleton = [
                        { 'name': 'required', 'dataType': 'boolean' },
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
                case 'string':
                case 'url':
                case 'text':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string', 'tooltip': '**Info**: Constraints depend on database and character encoding. Default is 255 for \'string\' and 65,535 for \'text\'' }
                    ];
                    var info = app.controller.getApiController().getApiInfo();
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
                        skeleton.push({ 'name': 'cdn', 'label': 'CDN', 'tooltip': 'If all resources/entries share the same CDN you can define it here and omit it in the input field.', 'dataType': 'string' });
                    if (this._data['dataType'] === 'string' || this._data['dataType'] === 'url') {
                        skeleton.push(
                            { 'name': 'unique', 'tooltip': '**Info**: Unique attributes may be limited in length by your database system!', 'dataType': 'boolean' }
                        );
                    } else {
                        skeleton.push(
                            {
                                'name': 'view',
                                'label': 'syntax',
                                'dataType': 'enumeration',
                                'options': [
                                    { 'value': '<auto>', 'disabled': true },
                                    { 'value': 'csv' },
                                    { 'value': 'xml' },
                                    { 'value': 'json', 'disabled': true },
                                    { 'value': 'plain' },
                                    { 'value': 'html' },
                                    { 'value': 'plain+html' },
                                    { 'value': 'markdown' }
                                ],
                                'tooltip': `Default behavior is as \'plain\' which may result in WYSIWYG.
\'plain+html\' enables you to mix preformatted plain text with interpret and rendered html-code between \<html\>/\</html\> tags.`,
                                'view': 'select'
                            },
                            {
                                'name': 'bSyntaxPrefix',
                                'label': 'individual syntax',
                                'tooltip': `Choose syntax individual for every entry.
An media / MIME type string will be prepended to your data.
You will not see this information in forms, but it is stored with your actual string in the database and consumes space.`,
                                'dataType': 'boolean',
                                'required': true,
                                'defaultValue': false
                            },
                            { 'name': 'size', 'dataType': 'string' }
                        );
                    }
                    skeleton.push(
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    );
                    break;
                case 'json':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string', 'tooltip': 'constraints depend on database and character encoding' },
                        { 'name': 'size', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
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
                            'dataType': 'string',
                            'required': true,
                            'tooltip': 'separate options with semicolon(;) and without whitespaces'
                        },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' },
                        { 'name': 'bUseString', 'label': 'Use basic string datatype.', 'dataType': 'boolean', 'view': 'labelRight', 'required': true, 'defaultValue': false }
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
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'time' }
                    ];
                    break;
                case 'date':
                    skeleton = [
                        { 'name': 'required', 'dataType': 'boolean' },
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
                        { 'name': 'required', 'dataType': 'boolean' },
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
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'timestamp' }
                    ];
                    break;
                case 'relation':
                    var models = app.controller.getModelController().getModels();
                    var allModelNames = models.map(function (model) {
                        return model.getDefinition()['name'];
                    });
                    var thisModelName = this._model.getName();
                    var options = [];
                    var attributes = this.getAttributes();
                    var exist;
                    if (attributes)
                        exist = attributes.filter(function (x) { return x['dataType'] === "relation" && x['model'] && x['multiple'] });
                    for (var name of allModelNames) {
                        if (name === thisModelName)
                            continue;
                        else if (exist && exist.indexOf(name) !== -1)
                            continue;
                        else
                            options.push({ 'value': name });
                    }
                    options = options.sort((a, b) => a['value'].localeCompare(b['value']));

                    skeleton = [
                        { 'name': 'model', 'dataType': 'enumeration', 'options': options, 'view': 'select', 'required': true },
                        { 'name': 'multiple', 'dataType': 'boolean', 'required': true },
                        { 'name': 'via', 'dataType': 'string' }
                    ];
                    break;
                case 'integer':
                    skeleton = [
                        { 'name': 'length', 'tooptip': 'Info:\nThis value is only used for format information within the database', 'dataType': 'integer' },
                        { 'name': 'unsigned', 'dataType': 'boolean', 'required': true, 'defaultValue': false },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'integer' }
                    ];
                    break;
                case 'decimal':
                    skeleton = [
                        { 'name': 'length', 'tooptip': 'Info:\nThis value is only used for format information within the database', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'decimal' }
                    ];
                    break;
                case 'double':
                    skeleton = [
                        { 'name': 'length', 'tooptip': 'Info:\nThis value is only used for format information within the database', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'double' }
                    ];
                    break;
                case 'file':
                    var options = [];
                    var attributes = this.getAttributes();
                    var strAttr;
                    if (attributes) {
                        strAttr = attributes.filter(function (x) { return x['dataType'] === "string" });
                        if (strAttr) {
                            options = strAttr.map(function (x) {
                                return { 'value': x['name'] };
                            });
                            options = options.sort((a, b) => a['value'].localeCompare(b['value']));
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
                            changeAction: async function () {
                                var fData = await this._form.readForm(false, false);
                                var cdn = this._form.getFormEntry('cdn');
                                var fn = this._form.getFormEntry('filename_prop');
                                if (fData['storage'] == 'filesystem') {
                                    await cdn.show();
                                    fn.hide();
                                } else {
                                    cdn.hide();
                                    await fn.show();
                                }
                                return Promise.resolve();
                            }.bind(this),
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
                            'options': options,
                            'view': 'select'
                        },
                        { 'name': 'required', 'dataType': 'boolean' },
                        //{ 'name': 'unique', 'dataType': 'boolean', 'defaultValue': true, 'readonly': false }
                    ];
                    break;
                default:
                    skeleton = [];
            }
            skeleton.push({ 'name': 'persistent', 'dataType': 'boolean', 'required': true, 'defaultValue': true });
            skeleton.push({ 'name': 'readonly', 'dataType': 'boolean', 'required': true, 'defaultValue': false });
            skeleton.push({ 'name': 'hidden', 'dataType': 'boolean' });
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
        var data = await panel.getForm().readForm();

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
                    this._data['options'] = data['options'].split(';').map(function (x) { return { 'value': x } });
                    this._data['bUseString'] = data['bUseString'];
                    break;
                case 'text':
                case 'json':
                    if (data.length) //TODO: MEDIUMTEXT / LONGTEXT
                        this._data.length = data.length;
                    if (data.charEncoding)
                        this._data.charEncoding = data.charEncoding;
                    if (data.view)
                        this._data.view = data.view;
                    if (data.bSyntaxPrefix)
                        this._data.bSyntaxPrefix = data.bSyntaxPrefix;
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
                    if (data.multiple == true)
                        this._data.multiple = data.multiple;
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
            }
        }

        if (data.required)
            this._data.required = data.required;
        if (this._data['dataType'] !== 'boolean' && data.defaultValue)
            this._data.defaultValue = data.defaultValue;

        if (data.persistent === false)
            this._data.persistent = false;
        if (data.readonly === true)
            this._data.readonly = true;
        if (data.hidden === true)
            this._data.hidden = true;

        return Promise.resolve();
    }
}