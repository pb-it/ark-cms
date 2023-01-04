const ActionEnum = Object.freeze({ "create": 1, "read": 2, "update": 3, "delete": 4 });

class CrudObject {

    /**
     * 
     * @param {*} skeleton 
     * @param {*} olddata - has to be at least an empty object
     * @param {*} newdata - in contrast to full objects of olddata the releations only consist of the ids
     * @returns 
     */
    static getChanges(skeleton, olddata, newdata, bIncludeHidden) {
        var relevant;
        if (skeleton && newdata) {
            relevant = {};
            var property;
            for (var field of skeleton) {
                if (!field['hidden'] || bIncludeHidden) {
                    property = field.name;
                    if (newdata[property] === null || newdata[property] === undefined) {
                        if (olddata && olddata[property] !== null && olddata[property] !== undefined)
                            relevant[property] = null;
                    } else {
                        if (field['dataType']) {
                            switch (field['dataType']) {
                                case "boolean":
                                    if (olddata && olddata[property] !== null && olddata[property] !== undefined) {
                                        if (olddata[property] !== newdata[property]) {
                                            if (olddata[property] === true || olddata[property] === 1) {
                                                if (newdata[property] !== true && newdata[property] !== 1)
                                                    relevant[property] = newdata[property];
                                            } else if (olddata[property] === false || olddata[property] === 0) {
                                                if (newdata[property] !== false && newdata[property] !== 0)
                                                    relevant[property] = newdata[property];
                                            }
                                        }
                                    } else
                                        relevant[property] = newdata[property];
                                    break;
                                case "date":
                                    if (olddata && olddata[property] !== null && olddata[property] !== undefined) {
                                        if (newdata[property].indexOf('T') >= 0) {
                                            if (olddata[property] !== newdata[property])
                                                relevant[property] = newdata[property];
                                        } else {
                                            var index = olddata[property].indexOf('T');
                                            if (olddata[property].substring(0, index) !== newdata[property])
                                                relevant[property] = newdata[property];
                                        }
                                    } else
                                        relevant[property] = newdata[property];
                                    break;
                                case "json":
                                    if (olddata && olddata[property] !== null && olddata[property] !== undefined) {
                                        if (!isEqualJson(olddata[property], newdata[property]))
                                            relevant[property] = JSON.stringify(newdata[property]);
                                    } else
                                        relevant[property] = JSON.stringify(newdata[property]);
                                    break;
                                case "relation":
                                    if (field['multiple']) {
                                        if (Array.isArray(newdata[property])) {
                                            var newIds = [];
                                            for (var item of newdata[property]) {
                                                if (isNaN(item)) {
                                                    if (item['id'])
                                                        newIds.push(item['id']);
                                                } else
                                                    newIds.push(item);
                                            }

                                            if (olddata && olddata[property] && olddata[property].length > 0) {
                                                if (newIds.length == olddata[property].length) {
                                                    var oldIds = olddata[property].map(function (data) {
                                                        return data['id'];
                                                    });

                                                    for (var id of oldIds) {
                                                        if (newIds.indexOf(id) == -1) {
                                                            relevant[property] = newIds;
                                                            break;
                                                        }
                                                    }
                                                } else
                                                    relevant[property] = newIds;
                                            } else {
                                                if (newIds.length > 0)
                                                    relevant[property] = newIds;
                                            }
                                        } else
                                            throw new Error("An unexpected error occurred");
                                    } else {
                                        var id;
                                        if (Number.isInteger(newdata[property]))
                                            id = newdata[property];
                                        else if (newdata[property]['id'])
                                            id = newdata[property]['id'];
                                        if (!olddata || !olddata[property] || (olddata[property]['id'] != id)) {
                                            relevant[property] = id;
                                        }
                                    }
                                    break;
                                default:
                                    if (!olddata || (newdata[property] !== olddata[property]))
                                        relevant[property] = newdata[property];
                            }
                        }
                    }
                }
            }
            if (Object.keys(relevant).length == 0)
                relevant = null;
        }
        return relevant;
    }

    static _getValue(attr, data) {
        var val;
        var tmp = data[attr['name']];
        if (tmp) {
            if (attr['dataType'] === "url" || attr['dataType'] === "file") {
                if (attr['cdn'])
                    val = CrudObject._buildUrl(attr['cdn'], tmp);
                else
                    val = tmp;
            } else
                val = tmp;
        }
        return val;
    }

    static _buildUrl(cdn, val) {
        if (cdn.startsWith('/')) {
            var api = app.controller.getApiController().getApiOrigin();
            var url = new URL(api);
            cdn = "http://" + url.hostname + cdn;
        }
        if (!cdn.endsWith('/'))
            cdn += "/";
        return cdn + val;
    }

    static getTitle(typeString, data) {
        var title;

        var model = app.controller.getModelController().getModel(typeString);
        var property = model.getModelDefaultsController().getDefaultTitleProperty();
        if (property) {
            if (data[property])
                title = data[property];
            else
                title = "<undefined>";
        } else {
            if (model.getDefinition()['options']['increments'])
                title = "<id:" + data['id'] + ">";
            else {
                var attributes = model.getModelAttributesController().getAttributes();
                var name;
                var prime = [];
                for (var attr of attributes) {
                    if (attr['primary']) {
                        name = attr['name'];
                        prime.push(name + ": " + data[name]);
                    }
                }
                title = '<' + prime.join('; ') + '>';
            }
        }
        return title;
    }

    _typeString;
    _model;
    _skeleton;
    _data;
    _title;

    _bIncomplete; //TODO: unused

    constructor(typeString, data) {
        this._typeString = typeString;
        this._model = app.controller.getModelController().getModel(this._typeString);
        this.setData(data);
    }

    getTypeString() {
        return this._typeString;
    }

    getModel() {
        return this._model;
    }

    getSkeleton(bAddOptions) {
        var skeleton;
        if (this._skeleton)
            skeleton = this._skeleton;
        else
            skeleton = this._model.getModelAttributesController().getAttributes(bAddOptions);
        return skeleton;
    }

    setSkeleton(skeleton) {
        this._skeleton = skeleton;
    }

    getData() {
        return this._data;
    }

    setData(data, bPrepare = true) {
        if (!data)
            data = {};

        var prepare;
        if (bPrepare)
            prepare = this._model.getPrepareDataAction();
        if (prepare)
            this._data = prepare(data);
        else
            this._data = data;

        this._setTitle();
    }

    getAttributeValue(name) {
        var attr = this._model.getModelAttributesController().getAttribute(name);
        return CrudObject._getValue(attr, this._data);
    }

    getId() {
        var id;
        if (this._data)
            id = this._data['id'];
        return id;
    }

    getTitle() {
        return this._title;
    }

    _setTitle() {
        if (this._data)
            this._title = CrudObject.getTitle(this._typeString, this._data);
        if (!this._title)
            this._title = '<n/a>';
    }

    getUrl(action) {
        var url = window.location.origin + "/data/" + this.getTypeString();
        switch (action) {
            case ActionEnum.create:
                url = "/new"
                break;
            case ActionEnum.read:
                if (this._data.id)
                    url += "/" + this._data.id;
                break;
            case ActionEnum.update:
                if (this._data.id)
                    url += "/" + this._data.id + "/edit";
                break;
            case ActionEnum.delete:
                //TODO:
                break;
            default:
        }
        return url;
    }

    async create(data) {
        if (!data)
            data = this._data;
        data = await this.request(ActionEnum.create, data);
        this.setData(data);
        return Promise.resolve(data);
    }

    async read() {
        var data = await this.request(ActionEnum.read);
        this.setData(data);
        return Promise.resolve(data);
    }

    async update(data) {
        if (!data)
            data = this._data;
        data = await this.request(ActionEnum.update, data);
        this.setData(data);
        return Promise.resolve(data);
    }

    async delete() {
        await this.request(ActionEnum.delete);
        this.setData(null);
        return Promise.resolve();
    }

    async request(action, data) {
        var id;
        if (this._model.getDefinition()['options']['increments']) {
            if (this._data && this._data['id'])
                id = this._data['id'];
        } else {
            var name;
            for (var attr of this._model.getModelAttributesController().getAttributes()) {
                if (attr['primary']) {
                    name = attr['name'];
                    if (this._data[name]) {
                        if (!data)
                            data = {};
                        data[name] = this._data[name];
                    }
                }
            }
        }
        return await app.controller.getDataService().request(this.getTypeString(), action, id, data);
    }
}