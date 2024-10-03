class Menu {

    _conf;

    _items;
    _activeItem;

    constructor(conf) {
        this._conf = conf;
        this._items = [];
    }

    getMenuConfig() {
        return this._conf;
    }

    setMenuConfig(conf) {
        this._conf = conf;
    }

    addItem(item) {
        this._items.push(item);
        item.setMenu(this);
    }

    removeItem(item) {
        this._items = this._items.filter(function (x) { return x != item });
    }

    getItems() {
        return this._items;
    }

    setItems(items) {
        this._items = [];
        for (var item of items) {
            if (item instanceof MenuItem) {
                this._items.push(item);
                item.setMenu(this);
            } else
                console.error('Invalid MenuItem');
        }
    }

    getActiveItem() {
        var item;
        for (var i of this._items) {
            if (i.isActive()) {
                item = i;
                break;
            }
        }
        return item;
    }

    setActiveItem(item) {
        if (item) {
            for (var i of this._items) {
                if (i === item)
                    i.setActive();
                else
                    i.setInactive();
            }
        } else {
            for (var i of this._items) {
                i.setInactive();
            }
        }
    }
}