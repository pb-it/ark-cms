class AddRelatedItemPanel extends Panel {

    static async changeIds(obj, property, addIds, removeIds) {
        var oldList;
        var data = obj.getData();
        if (data && data[property]) {
            oldList = data[property].map(function (item) {
                if (isNaN(item))
                    return item['id'];
                else
                    return item;
            });
        } else
            oldList = [];

        var newList;
        var changed = false;
        if (removeIds && removeIds.length > 0) {
            newList = [];
            for (var id of oldList) {
                if (removeIds.indexOf(id) == -1)
                    newList.push(id);
                else
                    changed = true;
            }
        } else
            newList = oldList;
        if (addIds && addIds.length > 0) {
            for (var newId of addIds) {
                if (newList.indexOf(newId) == -1) {
                    newList.push(newId);
                    changed = true;
                }
            }
        }
        if (changed) {
            if (obj.getId()) {
                var change = {};
                change[property] = newList;
                await obj.update(change);
            } else
                data[property] = newList;
        }
        return Promise.resolve();
    }

    _objs;
    _attr;
    _cb;

    _attrName;
    _modelName;

    _id;
    _data;

    _addSelect;
    _$removeAll;
    _removeSelect;

    constructor(objs, attr, data, cb) {
        super();

        this._objs = objs;
        this._attr = attr;
        this._data = data;
        this._cb = cb;

        this._attrName = this._attr['name'];
        this._modelName = this._attr['model'];
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append("Add the following '" + this._modelName + "' to '" + this._attrName + "':<br/><br/>");

        this._addSelect = new Select(this._attrName, this._modelName, -1);
        if (this._data && Object.keys(this._data).length > 0)
            this._addSelect.setCreateData(this._data);
        await this._addSelect.initSelect();
        $div.append(await this._addSelect.render());

        $div.append("<br/><br/><br/>");

        if (!this._attr['via']) {
            var id = 'remove-all';
            this._$removeAll = $('<input />', { type: 'checkbox', 'id': id });
            $div.append(this._$removeAll);
            var $label = $('<label/>')
                .attr('for', id)
                .text('Remove all other');
            $div.append($label);
            $div.append('<br/><br/>');

            $div.append("Remove the following '" + this._modelName + "' from '" + this._attrName + "':<br/><br/>");

            this._removeSelect = new Select(this._attrName, this._modelName, -1);
            await this._removeSelect.initSelect();
            $div.append(await this._removeSelect.render());

            $div.append("<br/><br/><br/>");
        }

        $div.append($('<button/>')
            .html("Add")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                try {
                    var add = this._addSelect.getSelectedIds();
                    var remove;
                    if (this._removeSelect)
                        remove = this._removeSelect.getSelectedIds();
                    if (add || remove) {
                        app.controller.setLoadingState(true);

                        var backlink = this._attr['via'];
                        if (backlink) {
                            var id;
                            if (Number.isInteger(this._data[backlink]))
                                id = this._data[backlink];
                            else
                                id = this._data[backlink]['id'];
                            var update = {};
                            update[backlink] = id;
                            var bMatch;
                            var data;
                            var prop;
                            var selected = this._addSelect.getSelectedOptions();
                            for (var opt of selected) {
                                bMatch = false;
                                data = opt.getData();
                                prop = data[backlink];
                                if (prop) {
                                    if (Number.isInteger(prop))
                                        bMatch = (prop == id);
                                    else
                                        bMatch = (prop['id'] == id);
                                }
                                if (!bMatch)
                                    await new CrudObject(this._modelName, data).update(update);
                            }
                        } else {
                            if (this._$removeAll && this._$removeAll.is(':checked')) {
                                for (var obj of this._objs) {
                                    var change = {};
                                    change[this._attrName] = add;
                                    await obj.update(change);
                                }
                            } else {
                                for (var obj of this._objs)
                                    await AddRelatedItemPanel.changeIds(obj, this._attrName, add, remove);
                            }
                        }

                        if (this._cb)
                            await this._cb();

                        app.controller.setLoadingState(false);

                        this.dispose();
                    } else
                        alert("nothing to do");
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this))
        );
        return Promise.resolve($div);
    }

    async _hasChanged() {
        var add = this._addSelect.getSelectedIds();
        var remove;
        if (this._removeSelect)
            remove = this._removeSelect.getSelectedIds();
        return Promise.resolve(add.length > 0 || (remove && remove.length > 0));
    }
}