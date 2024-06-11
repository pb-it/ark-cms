class MenuVis {

    _menu;
    _items;

    _$div;

    constructor(menu) {
        if (menu)
            this._menu = menu;
        else
            this._menu = new Menu();

        this._$div = $('<div/>')
            .addClass('menu');

        const conf = this._menu.getMenuConfig();
        if (conf && conf['class']) {
            if (Array.isArray(conf['class']) && conf['class'].length > 0) {
                for (var c of conf['class']) {
                    this._$div.addClass(c);
                }
            }
        }

        this._items = [];
    }

    addMenuItem(item) {
        const items = this._menu.getItems();
        items.push(item);
    }

    renderMenu() {
        this._$div.empty();

        const items = this._menu.getItems();
        for (var item of items) {
            this._$div.append(new MenuItemVis(item).renderMenuItem());
        }

        return this._$div;
    }
}