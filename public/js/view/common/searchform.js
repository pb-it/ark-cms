class SearchForm {

    _$searchForm;
    _$searchField;
    _timer;

    constructor() {
    }

    getSearchField() {
        return this._$searchField;
    }

    initSearchForm() {
        this._$searchForm = $('<form/>')
            .prop('id', 'searchForm');

        this._$searchField = $('<input/>')
            .prop('id', 'searchField')
            .prop('type', 'text')
            .prop('placeholder', 'Search..');

        var $button = $('<button/>')
            .prop('id', 'searchButton')
            .prop('type', 'submit')
            .append("<i class='fa fa-search'></i>");

        this._$searchForm.append(this._$searchField);
        this._$searchForm.append($button);

        return this._$searchForm;
    }

    renderSearchForm() {
        var state = app.controller.getStateController().getState();
        if (state && state.search)
            this._$searchField.val(state.search);
        else
            this._$searchField.val('');

        this._$searchField.off('input');
        this._$searchField.on('input', async function (e) {
            if (this._timer)
                clearTimeout(this._timer);
            this._timer = setTimeout(async function () {
                this._applySearch(false);
            }.bind(this), 1200);
        }.bind(this));

        this._$searchForm.off('submit');
        this._$searchForm.on('submit', function (event) {
            event.preventDefault();
            this._applySearch(true);
        }.bind(this));
    }

    _applySearch(bPush) {
        var state = app.controller.getStateController().getState();
        if (!bPush && !state.search)
            bPush = true;
        state.search = this._$searchField.val();
        app.controller.loadState(state, bPush, true);
    }
}