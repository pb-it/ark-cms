class AddRelatedItemPanel extends Panel {

    _objs;
    _attr;
    _cb;

    _attrName;
    _modelName;

    _id;
    _data;

    _addSelect;
    _removeSelect;

    constructor(objs, attr, cb) {
        super();

        this._objs = objs;
        this._attr = attr;
        this._cb = cb;

        this._attrName = this._attr['name'];
        this._modelName = this._attr['model'];

        if (this._attr['via'] && this._objs.length == 1) {
            this._id = this._objs[0].getData()['id'];
            this._data = {};
            this._data[this._attr['via']] = this._id;
        }
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append("Add the following '" + this._modelName + "' to '" + this._attrName + "':<br/><br/>");

        this._addSelect = new Select(this._attrName, this._modelName);
        if (this._data)
            this._addSelect.setCreateData(this._data);
        await this._addSelect.initSelect();
        $div.append(await this._addSelect.render());

        $div.append("<br/><br/><br/>");

        if (!this._data) {
            $div.append("Remove the following '" + this._modelName + "' from '" + this._attrName + "':<br/><br/>");

            this._removeSelect = new Select(this._attrName, this._modelName);
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

                        if (this._data) {
                            var bUpdate;
                            var data;
                            var prop;
                            var selected = this._addSelect.getSelectedOptions();
                            for (var opt of selected) {
                                bUpdate = true;
                                data = opt.getData();
                                prop = data[this._attr['via']];
                                if (prop) {
                                    if (Number.isInteger(prop))
                                        bUpdate = (prop != this._id);
                                    else
                                        bUpdate = (prop['id'] != this._id);
                                }
                                if (bUpdate)
                                    await new CrudObject(this._modelName, data).update(this._data);
                            }
                        } else {
                            for (var obj of this._objs)
                                await ModalController.changeIds(obj, this._attrName, add, remove);
                        }

                        if (this._cb)
                            await this._cb();

                        app.controller.setLoadingState(false);

                        this.dispose();
                    } else
                        alert("nothing to do");
                } catch (error) {
                    app.controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this))
        );
        return Promise.resolve($div);
    }

    _hasChanged() {
        var add = this._addSelect.getSelectedIds();
        var remove;
        if (this._removeSelect)
            remove = this._removeSelect.getSelectedIds();
        return add.length > 0 || (remove && remove.length > 0);
    }
}