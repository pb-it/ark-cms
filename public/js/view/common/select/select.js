class Select {

    _name;
    _id;

    _typeString;
    _iUpperBound;
    _createData;

    _cb;

    _options;
    _selectedValues;
    _bInitDone;

    _$div;
    _$input;
    _$datalist;
    _$searchButton;
    _$createButton;
    _$list;

    constructor(name, typeString, iUpperBound = -1, cb) {
        this._name = name;
        this._id = name.toLowerCase() + Date.now() + Math.floor(Math.random() * 100);

        this._typeString = typeString;
        this._iUpperBound = iUpperBound;

        this._cb = cb;

        const model = app.getController().getModelController().getModel(this._typeString);
        if (model) {
            const mpcc = model.getModelPanelConfigController();
            //const panelConfig = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.title);
            const panelConfig = new MediaPanelConfig();
            const conf = { ...model.getModelDefaultsController().getDefaultPanelConfig() };
            delete conf['display'];
            delete conf['float'];
            if (conf['panelType'] === 'CollectionPanel') {
                conf['panelType'] = 'CrudPanel';
                conf['details'] = DetailsEnum.title;
            }
            panelConfig.initPanelConfig(model, ActionEnum.read, conf);
            this._panelConfig = panelConfig;
        } else
            throw new Error('Model \'' + this._typeString + '\' not found');
    }

    getModelName() {
        return this._typeString;
    }

    getUpperBound() {
        return this._iUpperBound;
    }

    getOptions() {
        return this._options;
    }

    setCreateData(createData) {
        this._createData = createData;
    }

    setSelectedValues(values) {
        this._selectedValues = values;
    }

    async addSelectedValues(values) {
        for (var value of values) {
            for (var option of this._options) {
                if (value == option.getData()) {
                    if (!option.isSelected())
                        option.setSelected(true);
                    break;
                }
            }
        }
        await this._update();
        return Promise.resolve();
    }

    async initSelect(optData) {
        this._options = [];
        if (!optData)
            optData = await app.getController().getDataService().fetchData(this._typeString);

        if (this._selectedValues && this._selectedValues.length > 0) {
            var ids = [];
            var id;
            for (var item of this._selectedValues) {
                id = null;
                if (item) {
                    if (typeof item === 'object')
                        id = item['id'];
                    else if (Number.isInteger(item))
                        id = item;
                }
                if (id)
                    ids.push(id);
                else {
                    var name = this._name;
                    var index = name.indexOf(':');
                    if (index != -1)
                        name = name.substring(0, index);
                    throw new Error('Received undefined or unknown entry for select \'' + name + '\'');
                }
            }

            for (var data of optData) {
                if (Number.isInteger(data))
                    data = await app.getController().getDataService().fetchData(this._typeString, data);
                this._options.push(new Option(CrudObject.getTitle(this._typeString, data), data, ids.indexOf(data.id) >= 0));
            }
        } else {
            for (var data of optData)
                this._options.push(new Option(CrudObject.getTitle(this._typeString, data), data));
        }
        this._bInitDone = true;
        return Promise.resolve();
    }

    setSelected(id, bValue) {
        var bFound = false;
        for (var option of this._options) {
            if (option.getID() == id) {
                option.setSelected(bValue);
                bFound = true;
                break;
            }
        }
        if (bFound)
            this._updateDatalist();
        return bFound;
    }

    async render() {
        this._$div = $('<div/>').addClass('select');
        return this._rerender();
    }

    async _rerender() {
        this._$div.empty();

        var selected = this.getSelectedOptions();
        var bDisable = this._iUpperBound > 0 && selected.length >= this._iUpperBound;

        this._$datalist = $('<datalist/>').attr({ id: this._id });
        this._updateDatalist();

        this._$input = $('<input/>').attr(
            {
                list: this._id,
                autoComplete: "off",
                size: 80
            }
        )
            .prop("disabled", bDisable)
            .on('mousedown', async function (e) {
                if (!this._bInitDone) {
                    var controller = app.getController();
                    try {
                        controller.setLoadingState(true);
                        await this.initSelect();
                        await this._rerender();
                        this._$input.focus(); // TODO: open datalist dropdown
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                    }
                }
                return Promise.resolve();
            }.bind(this))
            .on('input', async function (e) {
                e.preventDefault();

                if (e.originalEvent.inputType == 'insertFromPaste' || e.originalEvent.inputType === 'insertFromDrop') {
                    var str = this._$input.val();
                    if (str && (str.startsWith('http://') || str.startsWith('https://'))) {
                        var controller = app.getController();
                        try {
                            controller.setLoadingState(true);
                            var url = new URL(str);
                            var state = State.getStateFromUrl(url);
                            if (state && state['typeString'] && state['typeString'] === this._typeString) {
                                this._$input.val('');

                                var data = await controller.getDataService().fetchDataByState(state);
                                if (data) {
                                    if (Array.isArray(data)) {
                                        if (data.length > 0) {
                                            var nok = [];
                                            for (var item of data) {
                                                if (!this.setSelected(item['id'], true))
                                                    nok.push(item['id']);
                                            }
                                            if (nok.length > 0)
                                                alert('IDs:' + nok.join(',') + ' not found!');
                                        }
                                    } else {
                                        if (!this.setSelected(data['id'], true))
                                            alert('ID:' + data['id'] + ' not found!');
                                    }
                                }
                                await this._update();
                                this._$input.blur(); //removes focus - closes datalist dropdown
                                this._$input.focus();
                            }
                            controller.setLoadingState(false);
                        } catch (err) {
                            controller.setLoadingState(false);
                            controller.showError(error);
                        }
                    }
                } else if (e.originalEvent.inputType === 'insertReplacementText') //'insertText','deleteContentBackward',...
                    this._checkInput();

                return Promise.resolve();
            }.bind(this))
            .bind('keydown', function (e) { //keypress keydown keyup paste
                if (e.keyCode == 13) {
                    e.preventDefault();
                    this._checkInput();
                }
            }.bind(this));
        //change only gets triggert when input looses focus
        /*.bind('change', function (e) {
            e.preventDefault();
            this._checkInput();
        }.bind(this));*/

        this._$div.append(this._$input);
        this._$div.append(this._$datalist);

        this._$div.append("&nbsp;");

        this._$searchButton = $("<button/>")
            .text("Search")
            .prop("disabled", bDisable)
            .click(function (event) {
                event.preventDefault();
                event.stopPropagation();
                var panel = new SearchEntryPanel(this);
                return app.getController().getModalController().openPanelInModal(panel);
            }.bind(this));
        this._$div.append(this._$searchButton);

        this._$div.append("&nbsp;");

        this._$createButton = $("<button/>")
            .text("Create")
            .prop("disabled", bDisable)
            .click(function (event) {
                event.preventDefault();
                event.stopPropagation();
                var panel = PanelController.createPanel(this._typeString, this._createData, ActionEnum.create);
                panel._config.crudCallback = async function (data) {
                    this._options.push(new Option(CrudObject.getTitle(this._typeString, data), data, true));
                    await this._update();
                    return Promise.resolve(true);
                }.bind(this);
                return app.getController().getModalController().openPanelInModal(panel);
            }.bind(this));
        this._$div.append(this._$createButton);

        this._$list = $('<ul/>');
        this._$div.append(this._$list);

        await this._rerenderSelected();
        return Promise.resolve(this._$div);
    }

    async _update() {
        var selected = this.getSelectedOptions();
        var bDisable = this._iUpperBound > 0 && selected.length >= this._iUpperBound;

        if (this._$input)
            this._$input.prop("disabled", bDisable);
        if (this._$searchButton)
            this._$searchButton.prop("disabled", bDisable);
        if (this._$createButton)
            this._$createButton.prop("disabled", bDisable);

        this._updateDatalist();
        await this._rerenderSelected();
        return Promise.resolve();
    }

    _updateDatalist() {
        if (this._$datalist) {
            this._$datalist.empty();
            if (this._options) {
                var text;
                var options = this._options.filter(function (x) { return !x.isSelected() });
                for (var option of options) {
                    text = option.getName();
                    this._$datalist.append($("<option>").attr('value', text).text(text));
                }
            }
        }
    }

    async _checkInput() {
        var match;
        var input = this._$input.val().toLowerCase();
        for (var option of this._options) {
            if (option.getName().toLowerCase() === input) {
                match = option;
                break;
            }
        }
        if (match) {
            this._$input.val('');
            match.setSelected(true);
            await this._update();
            this._$input.blur(); //removes focus - closes datalist dropdown
            this._$input.focus();
        }
        return Promise.resolve();
    }

    async _rerenderSelected() {
        if (this._$list) {
            this._$list.empty();
            if (this._options) {
                var selected = this._options.filter(function (x) { return x.isSelected() });
                for (var sel of selected)
                    this._$list.append(await this._renderSelectedOption(sel));
            }
        }

        if (this._cb) this._cb();
        return Promise.resolve();
    }

    async _renderSelectedOption(option) {
        var id = option.getID();

        var $li = $("<li/>").attr({ 'data-id': id })
            .css({ 'display': 'inline-block' });

        var obj = new CrudObject(this._typeString, option.getData());
        var panel = PanelController.createPanelForObject(obj, this._panelConfig);
        $li.append(await panel.render());

        $li.append($("<button/>")
            .text("Remove")
            .css({ 'display': 'block' })
            .click(async function () {
                for (var option of this._options) {
                    if (option.getID() === id) {
                        option.setSelected(false);
                        break;
                    }
                };
                await this._update();
                return Promise.resolve();
            }.bind(this)));
        return Promise.resolve($li);
    }

    getSelectedOptions() {
        var selectedOptions;
        if (this._options)
            selectedOptions = this._options.filter(function (x) { return x.isSelected() });
        return selectedOptions;
    }

    getSelectedIds() {
        var selected = this.getSelectedOptions();
        return selected.map(function (option) {
            return option.getID();
        });
    }
}