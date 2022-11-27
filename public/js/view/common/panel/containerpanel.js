class ContainerPanel extends CrudPanel {

    _panels;
    _$list;

    constructor(config, obj) {
        super(config, obj);

        this._$panel.addClass('collection');
    }

    getClass() {
        return ContainerPanel;
    }

    async _renderContent() {
        var $div;
        switch (this._config.details) {
            case DetailsEnum.all:
                $div = await super._renderContent();
                break;
            case DetailsEnum.title:
                $div = await super._renderContent();
                if (!this._config.action || this._config.action == ActionEnum.read)
                    $div.append(await this._renderList());
                break;
            case DetailsEnum.none:
        }
        return Promise.resolve($div);
    }

    async _renderList() {
        this._$list = $('<ul/>');
        var panel;
        for (var i = 0; i < this._panels.length; i++) {
            panel = this._panels[i];
            await this._renderPanel(panel);
        }

        return Promise.resolve(this._$list);
    }

    async _renderPanel(panel) {
        var $panel = await panel.render();
        var $li = $('<li/>')
            .css({ 'display': 'inline-block' })
            .append($panel);
        this._$list.append($li);
        Promise.resolve();
    }

    /**
     * dont propagate selecting to parent container, but propagate to window for closing menus
     * therefore event gets overwitten
     */
    _initClickEvents() {
        this._$panel.on("click.panel", async function (event) {
            if (event.target == this._$panel[0])
                await app.controller.clearSelected();
            return Promise.resolve();
        }.bind(this));
    }

    addItems(item) {
        this._obj.addItems(item);
        this.render();
    }

    deleteItem(item) {
        this._obj.deleteItem(item);
        this.render();
    }
}