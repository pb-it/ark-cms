class SelectFilterPanel extends Dialog {

    _modelName;

    _timer;
    _$search;
    _$searchField;

    _available;
    _$available;

    _selected;
    _$selected;

    constructor(name) {
        super();
        this._modelName = name;
        this._available = [];
        this._selected = [];
    }

    getSelected() {
        return this._selected;
    }

    async _renderDialog() {
        var $div = $('<div/>');

        var mfc = app.controller.getModelController().getModel(this._modelName).getModelFilterController();
        this._available = mfc.getAllFiltersAlphabetical();

        var $button = $('<button/>')
            .text('New')
            .click(async function (event) {
                return app.controller.getModalController().openPanelInModal(new CreateFilterPanel(app.controller.getStateController().getState().getModel()));
            }.bind(this));
        $div.append($button);

        $button = $('<button/>')
            .text('Manage')
            .click(async function (event) {
                return app.controller.getModalController().openPanelInModal(new ManageFilterTreePanel(app.controller.getStateController().getState()));
            }.bind(this));
        $div.append($button);

        $div.append('<br/><br/>');

        this._renderSearchField();
        $div.append(this._$search);

        this._renderAvailable();
        $div.append(this._$available);

        this._renderSelected();
        $div.append(this._$selected);

        return Promise.resolve($div);
    }

    _renderSearchField() {
        this._$search = $('<div/>');

        this._$searchField = $('<input/>')
            .prop('type', 'text')
            .prop('placeholder', 'Search..')
            .on('input', async function (e) {
                this._timer = setTimeout(async function () {
                    this._renderAvailable();
                }.bind(this), 1200);
            }.bind(this));

        this._$search.append(this._$searchField);
    }

    _renderAvailable() {
        if (this._$available)
            this._$available.empty();
        else
            this._$available = $('<div/>')
                .css({
                    'display': 'inline-block',
                    'min-width': '100px',
                    'max-width': '500px',
                    'border': '2px dashed #7f7f7f'
                });

        if (this._available) {
            var $d;
            var $button;
            var search = this._$searchField.val().toLowerCase();
            if (search) {
                for (let item of this._available) {
                    if (item.name.toLowerCase().indexOf(search) >= 0) {
                        $d = $('<div/>').css({
                            'display': 'inline-block'
                        });
                        $button = $("<button/>")
                            .text(item.name)
                            .click(item, function (event) {
                                this._select(event.data);
                            }.bind(this));
                        $d.append($button);
                        this._$available.append($d);
                    }
                }
            } else {
                for (let item of this._available) {
                    $d = $('<div/>').css({
                        'display': 'inline-block'
                    });
                    $button = $("<button/>")
                        .text(item.name)
                        .click(item, function (event) {
                            this._select(event.data);
                        }.bind(this));
                    $d.append($button);
                    this._$available.append($d);
                }
            }
        }
    }

    _renderSelected() {
        if (this._$selected)
            this._$selected.empty();
        else
            this._$selected = $('<div/>')
                .css({
                    'display': 'block',
                    'float': 'right',
                    'min-width': '100px',
                    'max-width': '500px',
                    'border': '2px dashed #7f7f7f'
                });

        var $d;
        var $button;
        for (let item of this._selected) {
            $d = $('<div/>')
                .css({
                    'display': 'inline-block'
                });
            $button = $("<button/>")
                .text(item.name)
                .click(item, function (event) {
                    this._deselect(event.data);
                }.bind(this));
            $d.append($button);
            this._$selected.append($d);
        }
    }

    _select(item) {
        this._selected.push(item);
        this._available.splice(this._available.indexOf(item), 1);
        this._rerenderAllocation();
    }

    _deselect(item) {
        this._available.push(item);
        this._selected.splice(this._selected.indexOf(item), 1);
        this._rerenderAllocation();
    }

    _rerenderAllocation() {
        this._renderAvailable();
        this._renderSelected();
    }
}