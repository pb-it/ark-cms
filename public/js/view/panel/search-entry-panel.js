class SearchEntryPanel extends Panel {

    _select;
    _bExclusive;
    _modelName;
    _iUpperBound;
    _optData;

    _filter;
    _search;

    _$search;

    constructor(select) {
        super();

        this._select = select;
        this._modelName = this._select.getModelName();
        this._iUpperBound = this._select.getUpperBound();
        this._optData = this._select.getOptions().map(function (x) {
            return x.getData();
        })
        this._filter = [];
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const controller = app.getController();

        var options = this._optData;
        if (this._filter.length > 0) {
            if (options && options.length > 0) {
                for (var filter of this._filter) {
                    if (typeof filter.query === 'string' || filter.query instanceof String) {
                        if (filter.query === '[Object]')
                            alert("cannot restore [Object] filter");
                        else if (filter.query.startsWith('{')) {
                            Filter.filterObj(options, new CrudObject(typeString, JSON.parse(filter.query)));
                        } else
                            options = Filter.filterStr(this._modelName, options, filter.query);
                    } else {
                        options = Filter.filterObj(options, new CrudObject(typeString, filter.query));
                    }
                }
            }

            var $button;
            for (let filter of this._filter) {
                $button = $('<button/>')
                    .text(filter['name'])
                    .css({ 'margin': '0 1 0 1' })
                    .click(async function (event) {
                        event.stopPropagation();

                        this._filter = this._filter.filter(function (x) {
                            return x != filter;
                        });

                        await this.render();
                        return Promise.resolve();
                    }.bind(this));
                $div.append($button);
            }
        }

        $div.append($('<button/>')
            .text("Apply Filter")
            .click(async function (event) {
                var panel = new SelectFilterPanel(this._modelName);
                panel.setApplyAction(async function (data) {
                    var filters = panel.getSelected();
                    if (filters) {
                        for (var filter of filters) {
                            this._filter.push(filter);
                        }
                    }
                    panel.dispose();
                    await this.render();
                    return Promise.resolve();
                }.bind(this));
                return app.getController().getModalController().openPanelInModal(panel);
            }.bind(this)));
        $div.append('<br>');

        this._$search = $('<input/>');
        if (this._search) {
            this._$search.val(this._search);
            options = Filter.filterStr(this._modelName, options, this._search);
        }
        $div.append(this._$search);

        $div.append("&nbsp;");

        $div.append($('<button/>')
            .text("Search")
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                this._search = this._$search.val();
                await this.render();
                return Promise.resolve();
            }.bind(this)));
        $div.append('<br>');

        $div.append('<br>');

        if (options && options.length > 0) {
            var model = controller.getModelController().getModel(this._modelName);
            var mpcc = model.getModelPanelConfigController();
            var panelConfig = mpcc.getPanelConfig();

            var opt;
            if (options.length > 10)
                opt = [...options].splice(0, 10);
            else
                opt = options;

            var $list = $('<ul/>');
            var obj, $li, $d, panel;
            for (let data of opt) {
                $li = $('<li/>')
                    .css({
                        'display': 'inline-block'
                    });
                $d = $('<div/>')
                    .css({
                        'display': 'block',
                        'float': 'left'
                    });
                obj = new CrudObject(this._modelName, data);
                panel = PanelController.createPanelForObject(obj, panelConfig);
                $d.append(await panel.render());

                $li.append($d);
                $list.append($li);
            }
            $div.append($list);

            if (options.length > 10)
                $div.append('Only first 10 of ' + options.length + ' options shown!<br>');
        }

        $div.append($('<button/>')
            .html("Add Selected")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                var sc = app.getController().getSelectionController();
                if (sc) {
                    selected = sc.getSelected();
                    if (selected && selected.length > 0) {
                        if (this._iUpperBound == -1 || selected.length <= this._iUpperBound) {
                            var data = selected.map(function (panel) {
                                return panel.getObject().getData();
                            });
                            await this._select.addSelectedValues(data);
                            this.dispose();
                        } else
                            alert("The number of items is limited to " + this._iUpperBound + "!")
                    }
                }
                return Promise.resolve();
            }.bind(this))
        );

        var $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        $div.bind("click", async function (e) {
            if (e.target == $div[0]) {
                e.preventDefault();
                var sc = app.getController().getSelectionController();
                if (sc)
                    await sc.clearSelected();
            }
            return Promise.resolve();
        }.bind(this));

        return Promise.resolve($div);
    }
}