class AddAttributeController {

    _model;
    _cb;

    _data;

    constructor(model, cb) {
        this._model = model;
        this._cb = cb;
    }

    async renderForm1() {
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
                    { 'value': 'blob', 'tooltip': '**Experimental**: Only enabled in debug mode.', 'disabled': !app.controller.isInDebugMode() },
                    { 'value': 'base64', 'tooltip': '**Experimental**: Only enabled in debug mode.', 'disabled': !app.controller.isInDebugMode() },
                    { 'value': 'file', 'tooltip': '**Experimental**: Only enabled in debug mode.', 'disabled': !app.controller.isInDebugMode() }
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
                var attribues = this._model.getModelAttributesController().getAttributes();
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
            return this.renderForm2();
        }.bind(this));
        return app.controller.getModalController().openPanelInModal(attrPanel);
    }

    async renderForm2() {
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
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string', 'tooltip': 'constraints depend on database and character encoding' },
                        { 'name': 'unique', 'tooltip': '**Info**: Unique attributes may be limited in length by your database system!', 'dataType': 'boolean' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    ];
                    break;
                case 'text':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string', 'tooltip': 'constraints depend on database and character encoding' },
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
                        { 'name': 'size', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    ];
                    break;
                case 'json':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string', 'tooltip': 'constraints depend on database and character encoding' },
                        { 'name': 'size', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    ];
                    break;
                case 'url':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string' },
                        { 'name': 'cdn', 'label': 'CDN', 'tooltip': 'If all resources/entries share the same CDN you can define it here and omit it in the input field.', 'dataType': 'string' },
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
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'datetime' }
                    ];
                    break;
                case 'timestamp':
                    skeleton = [
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'timestamp' }
                    ];
                    break;
                case 'relation':
                    var models = app.controller.getModelController().getModels();
                    var allModelNames = models.map(function (model) {
                        return model.getData()['name'];
                    });
                    var thisModelName = this._model.getName();
                    var options = [];
                    var attributes = this._model.getModelAttributesController().getAttributes();
                    var exist;
                    if (attributes)
                        exist = attributes.filter(function (x) { return x['dataType'] === "relation" && attr['model'] && attr['multiple'] });
                    for (var name of allModelNames) {
                        if (name === thisModelName)
                            break;
                        else if (exist && exist.indexOf(name) !== -1)
                            break;
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
                case 'blob':
                case 'base64':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' }
                    ];
                    break;
                case 'file':
                    skeleton = [
                        { 'name': 'length', 'tooltip': '**Info**: max. length of filename', 'dataType': 'string', 'defaultValue': '250', 'readonly': false },
                        { 'name': 'localPath', 'tooltip': '**Example**: \'../cdn\'', 'dataType': 'string', 'required': true },
                        { 'name': 'cdn', 'label': 'CDN', 'tooltip': '**Example**: local CDN: \'/cdn\'', 'dataType': 'string', 'required': true },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'unique', 'dataType': 'boolean', 'defaultValue': true, 'readonly': false }
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
                    The precise limit may also depend on the concrete database engine and your chooesen character encoding.<br/>
                    e.g. MySQL MyISAM Storage Engine limits to 1000 bytes.<br/>
                    With utf8mb4 Character Set the maximum length would be 250.<br/>
                    Leaving the length field unfilled would lead to the default setting of 255 characters and the database will<br/>
                    refuse to create the relvant column.<br/><br/>`);
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

                        if (this._cb)
                            await this._cb(this._data);

                        attrPanel.dispose();
                        return Promise.resolve();
                    }.bind(this));
                $d.append($continue);

                panel.setContent($d);

                await app.controller.getModalController().openPanelInModal(panel);
            } else {
                if (this._cb)
                    await this._cb(this._data);

                attrPanel.dispose();
            }
            return Promise.resolve();
        }.bind(this));
        return app.controller.getModalController().openPanelInModal(attrPanel);
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
                    if (data.unique)
                        this._data.unique = data.unique;
                    break;
                case 'url':
                    if (data.length) {
                        if (!isNaN(data.length)) {
                            var length = parseInt(data.length);
                            if (length > 0 && length < 256)
                                this._data.length = data.length;
                            else
                                throw new Error("Field 'length' has to be between 0 and 256");
                        } else
                            throw new Error("Field 'length' is not a number");
                    }
                    if (data.cdn)
                        this._data.cdn = data.cdn;
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
                    break;
                case 'relation':
                    this._data.model = data.model;
                    if (data.multiple == true)
                        this._data.multiple = data.multiple;
                    if (data.via)
                        this._data.via = data.via;
                    break;
                case 'blob':
                case 'base64':
                    if (data.length) //MEDIUMTEXT / LONGTEXT
                        this._data.length = data.length;
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
                    if (data.length)
                        this._data.length = data.length;
                    if (data.localPath)
                        this._data.localPath = data.localPath;
                    if (data.cdn)
                        this._data.cdn = data.cdn;
                    if (data.unique)
                        this._data.unique = data.unique;
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