class Menu {

    _$div;

    _items;
    _activeItem;

    constructor() {
        this._$div = $('<div/>')
            .addClass('menu');

        this._items = [];
    }

    addMenuItem(item, active) {
        this._items.push(item);
        if (active)
            this._activeItem = item;
    }

    renderMenu() {
        this._$div.empty();

        if (this._activeItem) {
            for (var item of this._items) {
                this._$div.append(item.renderMenuItem(item, this._activeItem == item));
            }
        } else {
            for (var item of this._items) {
                this._$div.append(item.renderMenuItem(item));
            }
        }

        return this._$div;
    }

    getActiveItem() {
        return this._activeItem;
    }

    activateItem(item) {
        this._activeItem = item;
        if (this._activeItem) {
            for (var i of this._items) {
                if (i == this._activeItem) {
                    i.setActive();
                } else {
                    i.setInactive();
                }
            }
        } else {
            for (var i of this._items)
                i.setInactive();
        }
    }
}