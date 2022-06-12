class Select {

    _name;
    _id;

    _typeString;
    _createData;

    _cb;

    _options;

    _$div;
    _$select;
    _$input;
    _$datalist;
    _$list;

    constructor(name, typeString, cb) {
        this._name = name;
        this._id = name.toLowerCase() + Date.now() + Math.floor(Math.random() * 100);

        this._typeString = typeString;

        this._cb = cb;
    }

    setCreateData(createData) {
        this._createData = createData;
    }

    async initSelect(optData, selected) {
        this._options = [];
        if (!optData)
            optData = await app.controller.getDataService().fetchData(this._typeString);

        if (selected && selected.length > 0) {
            var ids;
            if (selected.some(isNaN)) {
                var ids = selected.map(function (data) {
                    return data.id;
                });
            } else
                ids = selected;

            for (var data of optData) {
                if (Number.isInteger(data))
                    data = await app.controller.getDataService().fetchData(this._typeString, data);
                this._options.push(new Option(CrudObject.getTitle(this._typeString, data), data, ids.indexOf(data.id) >= 0));
            }
        } else {
            for (var data of optData)
                this._options.push(new Option(CrudObject.getTitle(this._typeString, data), data));
        }
    }

    setSelected(id, bValue) {
        for (var option in this._options) {
            if (option.getID() == id) {
                option.setSelected(bValue);
                break;
            }
        }
    }

    async render() {
        this._$div = $('<div/>').addClass('select');
        return this._rerender();
    }

    async _rerender() {
        this._$div.empty();

        this._$datalist = $('<datalist/>').attr({ id: this._id });
        this._updateDatalist();

        this._$input = $('<input/>').attr(
            {
                list: this._id,
                autoComplete: "off",
                size: 80
            }
        )
            .on('input', function (e) {
                e.preventDefault();
                if (e.originalEvent.inputType === "insertReplacementText")
                    this._checkInput();
                //"insertText","deleteContentBackward",...
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

        var $button = $("<button/>")
            .text("create")
            .click(function (event) {
                event.preventDefault();
                event.stopPropagation();
                var panel = PanelController.createPanel(this._typeString, this._createData, ActionEnum.create);
                panel._config.crudCallback = async function (data) {
                    this._options.push(new Option(CrudObject.getTitle(this._typeString, data), data, true));
                    await this._rerenderSelected();
                    return Promise.resolve(true);
                }.bind(this);
                return app.controller.getModalController().openPanelInModal(panel);
            }.bind(this));
        this._$div.append($button);

        this._$list = $('<ul/>');
        this._$div.append(this._$list);

        await this._rerenderSelected();
        return Promise.resolve(this._$div);
    }

    _updateDatalist() {
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
            match.setSelected(true);
            this._updateDatalist();
            this._$input.val('');
            this._$input.blur(); //removes focus - closes datalist dropdown
            this._$input.focus();
            await this._rerenderSelected();
        }
        return Promise.resolve();
    }

    async _rerenderSelected() {
        this._$list.empty();
        var selected = this._options.filter(function (x) { return x.isSelected() });
        for (var sel of selected)
            this._$list.append(await this._renderSelectedOption(sel));

        if (this._cb) this._cb();
        return Promise.resolve();
    }

    async _renderSelectedOption(option) {
        var id = option.getID();

        var $li = $("<li/>").attr({ 'data-id': id })
            .css({ 'display': 'inline-block' });

        var panel = PanelController.createPanel(this._typeString, option.getData());
        delete panel._config.display;
        delete panel._config.float;
        $li.append(await panel.render());

        $li.append($("<button/>")
            .text("Remove")
            .css({ 'display': 'block' })
            .click(function () {
                for (var option of this._options) {
                    if (option.getID() === id) {
                        option.setSelected(false);
                        break;
                    }
                };
                this._updateDatalist();
                this._rerenderSelected();
            }.bind(this)));
        return Promise.resolve($li);
    }

    getSelectedOptions() {
        return this._options.filter(function (x) { return x.isSelected() });
    }

    getSelectedIds() {
        var selected = this.getSelectedOptions();
        return selected.map(function (option) {
            return option.getID();
        });
    }
}