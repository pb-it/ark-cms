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
                options: ['boolean', 'integer', 'decimal', 'double', 'string', 'text', 'url', 'json', 'time', 'date', 'datetime', 'timestamp', 'enumeration', 'relation', 'blob', 'base64'],
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
                        { 'name': 'defaultValue', 'dataType': 'enumeration', 'options': ['none/null', 'true', 'false'], 'view': 'select' }
                    ];
                    break;
                case 'string':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string' },
                        { 'name': 'unique', 'dataType': 'boolean' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    ];
                    break;
                case 'text':
                case 'json':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string' },
                        { 'name': 'size', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    ];
                    break;
                case 'url':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string' },
                        { 'name': 'cdn', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' },
                        { 'name': 'defaultValue', 'dataType': 'string' }
                    ];
                    break;
                case 'enumeration':
                    skeleton = [
                        {
                            'name': 'view',
                            'dataType': 'enumeration',
                            'options': ['select', 'radio'],
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
                        { 'name': 'defaultValue', 'dataType': 'string' }
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
                    var names = models.map(function (model) {
                        return model.getData()['name'];
                    });
                    var mName = this._model.getName();
                    var options = [];
                    var attributes = this._model.getModelAttributesController().getAttributes();
                    var exist = [];
                    if (attributes) {
                        for (var attr of attributes) {
                            if (attr['dataType'] === "relation" && attr['model'] && attr['multiple'])
                                exist.push(attr['model']);
                        }
                    }
                    attributes.filter(function (x) { return x['dataType'] === "relation" && x['dataType'] });
                    for (var name of names) {
                        if (name !== mName && exist.indexOf(name) == -1)
                            options.push(name);
                    }
                    options = options.sort((a, b) => a.localeCompare(b));

                    skeleton = [
                        { 'name': 'model', 'dataType': 'enumeration', 'options': options, 'view': 'select', 'required': true },
                        { 'name': 'multiple', 'dataType': 'boolean', 'required': true },
                        { 'name': 'via', 'dataType': 'string' }
                    ];
                    break;
                case 'blob':
                case 'base64':
                    skeleton = [
                        { 'name': 'length', 'dataType': 'string' },
                        { 'name': 'required', 'dataType': 'boolean' }
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
                            if (length > 0 && length < 256)
                                this._data.length = data.length;
                            else
                                throw new Error("Field 'length' has to be between 0 and 256");
                        } else
                            throw new Error("Field 'length' is not a number");
                    }
                    if (data.unique)
                        this._data.unique = data.unique;
                    break;
                case 'text':
                case 'json':
                    /*if (data.length) {
                        if (!isNaN(data.length)) {
                            var length = parseInt(data.length);
                            if (length > 0 && length < 65536)
                                this._data.length = data.length;
                            else
                                throw new Error("Field 'length' has to be between 0 and 65,536");
                        } else
                            throw new Error("Field 'length' is not a number");
                    }*/
                    if (data.length) //MEDIUMTEXT / LONGTEXT
                        this._data.length = data.length;
                    if (data.size)
                        this._data.size = data.size;
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
                    this._data['options'] = data['options'].split(';');
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