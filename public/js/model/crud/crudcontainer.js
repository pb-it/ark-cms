class CrudContainer extends CrudObject {

    _collType;
    _items;

    constructor(typeString, data) {
        super(typeString, data);

        this._items;
    }

    async initContainer(bCheck = true) {
        if (!this._collType) {
            if (this._data) {
                var mdc = this.getModel().getModelDefaultsController();
                this._collType = mdc.getDefaultCollectionModel();
                if (!this._collType) {
                    var modelProp = mdc.getDefaultCollectionModelProperty();
                    if (modelProp)
                        this._collType = this._data[modelProp];
                }
                var prop = mdc.getDefaultCollectionProperty();
                if (prop) {
                    var list = this._data[prop];
                    if (list) {
                        if (this._collType) {
                            var arr = $.map(list.split(','), Number);
                            this._items = [];
                            if (bCheck) {
                                var unordered = await app.controller.getDataService().fetchObjectById(this._collType, arr);
                                if (unordered) {
                                    var bFound;
                                    var iData;
                                    var failedArr = [];
                                    for (var i of arr) {
                                        bFound = false;
                                        for (var item of unordered) {
                                            iData = item.getData();
                                            if (iData && iData.id == i) {
                                                this._items.push(item);
                                                bFound = true;
                                                break;
                                            }
                                        }
                                        if (!bFound)
                                            failedArr.push(i);
                                    }

                                    if (failedArr.length > 0)
                                        throw new Error("Could not resolve following IDs:\n" + failedArr.join(', '));
                                } else
                                    throw new Error("unexpected error");
                            } else {
                                for (var i of arr) {
                                    this._items.push(new CrudObject(this._collType, { 'id': i }));
                                }
                            }
                        } else
                            throw new Error("missing collection type definition");
                    }
                }
            }
        }
        return Promise.resolve();
    }

    getCollectionType() {
        return this._collType;
    }

    setItems(items) {
        this._items = items;
    }

    getAllItems() {
        return this._items;
    }

    addItems(items) {
        if (Array.isArray(items)) {
            if (this._items) {
                var id;
                var exists;
                for (var item of items) {
                    id = item['id'];
                    exists = false;
                    for (var i = 0; i < this._items.length; i++) {
                        if (this._items[i].getData()['id'] === id) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        this._items.push(item);
                    }
                }
            } else
                this._items = items;
        } else {
            if (this._items) {
                var id = items['id'];
                var exists = false;
                for (var i = 0; i < this._items.length; i++) {
                    if (this._items[i].getData()['id'] === id) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    this._items.push(items);
                }
            } else
                this._items = [items];
        }
    }

    deleteItem(item) {
        if (this._items) {
            var id = item['id'];
            for (var i = 0; i < this._items.length; i++) {
                if (this._items[i].getData()['id'] === id) {
                    this._items.splice(i, 1);
                    break;
                }
            }
        }
    }

    async save() {
        var arr = [];
        if (this._items) {
            for (var i = 0; i < this._items.length; i++) {
                arr.push(this._items[i].getData()['id']);
            }
        }
        var list = arr.join(",");
        var prop = this.getModel().getModelDefaultsController().getDefaultCollectionProperty();
        if (prop) {
            var foo = {};
            foo[prop] = list;
            await this.update(foo);
        }
        return Promise.resolve();
    }
}