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

        const $searchDiv = $('<div/>');

        this._$searchField = $('<input/>')
            .prop('id', 'searchField')
            .prop('type', 'text')
            .prop('placeholder', 'Search..');

        const $iconBox = $('<div/>')
            .addClass('iconBox');
        const $clearIcon = $('<div/>')
            .addClass(['btn', 'icon'])
            .append("<i class='fa fa-xmark'></i>") // '&times;'
            .click(function (event) {
                event.preventDefault();

                const controller = app.getController();
                try {
                    const state = controller.getStateController().getState();
                    delete state['search'];
                    controller.loadState(state, true, true);
                } catch (error) {
                    controller.showError(error);
                }
            });
        $iconBox.append($clearIcon);
        const $configIcon = $('<div/>')
            .addClass(['btn', 'icon'])
            .append("<i class='fa fa-sliders'></i>")
            .click(function (event) {
                event.preventDefault();

                const controller = app.getController();
                try {
                    const model = controller.getStateController().getState().getModel();
                    controller.getModalController().openPanelInModal(new EditSearchPanel(null, model));
                } catch (error) {
                    controller.showError(error);
                }
            });
        $iconBox.append($configIcon);

        const $button = $('<button/>')
            .prop('id', 'searchButton')
            .prop('type', 'submit')
            .append("<i class='fa fa-search'></i>");

        $searchDiv.append(this._$searchField);
        $searchDiv.append($iconBox);

        this._$searchForm.append($searchDiv);
        this._$searchForm.append($button);

        return this._$searchForm;
    }

    renderSearchForm() {
        const controller = app.getController();
        const state = controller.getStateController().getState();
        if (state && state['search'])
            this._$searchField.val(state['search']);
        else
            this._$searchField.val('');

        this._$searchField.off('input');
        this._$searchField.on('input', async function (e) {
            if (this._timer)
                clearTimeout(this._timer);
            this._timer = setTimeout(async function () {
                try {
                    await this._applySearch(false);
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this), 1200);
        }.bind(this));

        this._$searchForm.off('submit');
        this._$searchForm.on('submit', function (event) {
            event.preventDefault();
            this._applySearch(true);
        }.bind(this));
    }

    async _applySearch(bPush) {
        const controller = app.getController();
        const state = controller.getStateController().getState();
        if (!bPush && !state['search'])
            bPush = true;
        state['search'] = this._$searchField.val();
        return controller.loadState(state, bPush, true);
    }
}