class SidePanel {

    _$div;
    _$content;

    _modelSelect;
    _stateSelect;
    _filterSelect;

    constructor() {
        this._$div = $('<div/>')
            .prop('id', 'sidepanel');

        this._modelSelect = new ModelSelect();
        this._stateSelect = new StateSelect();
    }

    renderSidePanel() {
        this._$div.empty();
        return this._$div;
    }

    async showModelSelect() {
        if (this._$content)
            this._$content.detach();
        this._$content = this._modelSelect.renderModelSelect();
        this._$div.append(this._$content);
        this._$div[0].style.width = 'auto';
        return Promise.resolve();
    }

    async showStateSelect() {
        if (this._$content)
            this._$content.detach();
        this._$content = await this._stateSelect.renderStateSelect();
        this._$div.append(this._$content);
        this._$div[0].style.width = 'auto';
        return Promise.resolve();
    }

    hideSidePanel() {
        this._$div[0].style.width = '0px';
    }
}