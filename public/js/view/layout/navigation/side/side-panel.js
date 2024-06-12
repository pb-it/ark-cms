class SidePanel {

    _$div;
    _$content;

    constructor() {
        this._$div = $('<div/>')
            .prop('id', 'sidepanel');
    }

    renderSidePanel() {
        this._$div.empty();
        return this._$div;
    }

    show(content) {
        if (this._$content)
            this._$content.detach();
        this._$content = content;
        this._$div.append(this._$content);
        this._$div[0].style.width = 'auto';
    }

    hideSidePanel() {
        this._$div[0].style.width = '0px';
    }
}