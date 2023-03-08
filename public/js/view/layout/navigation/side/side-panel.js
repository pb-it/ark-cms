class SidePanel {

    _$div;
    _$content;

    _extensionSelect;
    _modelSelect;
    _stateSelect;
    _filterSelect;

    constructor() {
        this._$div = $('<div/>')
            .prop('id', 'sidepanel');

        this._extensionSelect = new ExtensionSelect();
        this._modelSelect = new ModelSelect();
        this._stateSelect = new StateSelect();
    }

    renderSidePanel() {
        this._$div.empty();
        return this._$div;
    }

    async showExtensionSelect() {
        if (this._$content)
            this._$content.detach();
        this._$content = this._extensionSelect.renderExtensionSelect();
        this._$div.append(this._$content);
        this._$div[0].style.width = 'auto';
        return Promise.resolve();
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