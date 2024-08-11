const ActionEnum = Object.freeze({ "create": 1, "read": 2, "update": 3, "delete": 4 });

class CrudObject {

    static collapse(skeleton, data) {
        var res;
        if (skeleton && data) {
            res = {};
            var property;
            for (var field of skeleton) {
                property = field['name'];
                if (data[property]) {
                    if (field['dataType'] == 'relation') {
                        if (field['multiple']) {
                            if (Array.isArray(data[property])) {
                                if (data[property].length > 0) {
                                    var ids = [];
                                    for (var item of data[property]) {
                                        if (isNaN(item)) {
                                            if (item['id'])
                                                ids.push(item['id']);
                                        } else
                                            ids.push(item);
                                    }
                                    res[property] = ids;
                                }
                            } else
                                throw new Error("An unexpected error occurred");
                        } else {
                            var id;
                            if (Number.isInteger(data[property]))
                                id = data[property];
                            else if (data[property]['id'])
                                id = data[property]['id'];
                            res[property] = id;
                        }
                    } else if (field['dataType'] == 'file') {
                        if (field['storage'] == 'filesystem') {
                            if (typeof data[property] === 'string' || data[property] instanceof String) {
                                res[property] = data[property];
                            } else {
                                if (data[property]['base64']) {
                                    res[property] = { ...data[property] };
                                    res[property]['base64'] = data[property]['base64'].substring(0, 80) + '...';
                                } else if (data[property]['url'])
                                    res[property] = data[property];
                                else if (data[property]['filename'])
                                    res[property] = data[property]['filename'];
                            }
                        }
                    } else
                        res[property] = data[property];
                }
            }
        }
        return res;
    }

    /**
     * 
     * @param {*} skeleton 
     * @param {*} olddata - has to be at least an empty object
     * @param {*} newdata - in contrast to full objects of olddata the releations only consist of the ids
     * @returns 
     */
    static async getChanges(skeleton, olddata, newdata, bIncludeHidden = true, bIncludeReadonly = true) {
        var relevant;
        if (skeleton && newdata) {
            relevant = {};
            var property;
            for (var field of skeleton) {
                if ((!field['hidden'] || bIncludeHidden) && (!field['readonly'] || bIncludeReadonly)) {
                    property = field.name;
                    if (newdata[property] === null || newdata[property] === undefined) {
                        if (olddata && olddata[property] !== null && olddata[property] !== undefined) {
                            if (field['dataType'] === 'string' || field['dataType'] === 'text' || field['dataType'] === 'json') {
                                if (olddata[property] !== '')
                                    relevant[property] = null;
                            } else
                                relevant[property] = null;
                        }
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
                                case "decimal":
                                case "double":
                                    if (olddata && olddata[property] !== null && olddata[property] !== undefined) {
                                        var oldValue;
                                        if (typeof olddata[property] === 'string' || olddata[property] instanceof String)
                                            oldValue = parseFloat(olddata[property]);
                                        else
                                            oldValue = olddata[property];
                                        if (oldValue !== newdata[property])
                                            relevant[property] = newdata[property];
                                    } else
                                        relevant[property] = newdata[property];
                                    break;
                                case "date":
                                case "datetime":
                                case "timestamp":
                                    if (olddata && olddata[property] !== null && olddata[property] !== undefined) {
                                        if (olddata[property] !== newdata[property]) {
                                            // ignore missmatch within millisecond range because the form entry cuts them off
                                            if (Math.floor(new Date(olddata[property]).getTime() / 1000) - Math.floor(new Date(newdata[property]).getTime() / 1000) !== 0)
                                                relevant[property] = newdata[property];
                                        }
                                    } else
                                        relevant[property] = newdata[property];
                                    break;
                                case "json":
                                case "list":
                                    if (olddata && olddata[property] !== null && olddata[property] !== undefined) {
                                        if (!isEqualJson(olddata[property], newdata[property]))
                                            relevant[property] = JSON.stringify(newdata[property]);
                                    } else
                                        relevant[property] = JSON.stringify(newdata[property]);
                                    break;
                                case "relation":
                                    if (field['multiple']) {
                                        if (Array.isArray(newdata[property])) {
                                            var newIds = newdata[property].map(function (item) {
                                                if (isNaN(item))
                                                    return item['id'];
                                                else
                                                    return item;
                                            });
                                            if (olddata && olddata[property] && olddata[property].length > 0) {
                                                if (newIds.length == olddata[property].length) {
                                                    var oldIds = olddata[property].map(function (item) {
                                                        if (isNaN(item))
                                                            return item['id'];
                                                        else
                                                            return item;
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
                                        if (!olddata || !olddata[property] || (olddata[property] != id && olddata[property]['id'] != id)) {
                                            relevant[property] = id;
                                        }
                                    }
                                    break;
                                case 'file':
                                    var newValue = newdata[property];
                                    if (olddata && olddata[property]) {
                                        var oldValue = olddata[property];
                                        if (field['storage'] == 'filesystem') {
                                            if (typeof oldValue === 'string' || oldValue instanceof String) {
                                                if ((newValue['filename'] || oldValue) && newValue['filename'] != oldValue) {
                                                    relevant[property] = newValue;
                                                    continue;
                                                }

                                                if (newValue['base64']) {
                                                    relevant[property] = newValue;
                                                    continue;
                                                }
                                            } else {
                                                if ((newValue['filename'] || oldValue['filename']) && newValue['filename'] != oldValue['filename']) {
                                                    relevant[property] = newValue;
                                                    continue;
                                                }
                                            }
                                        } else if (field['storage'] == 'base64') {
                                            if (typeof oldValue === 'string' || oldValue instanceof String) {
                                                if (newValue['base64'] != oldValue) {
                                                    relevant[property] = newValue;
                                                    continue;
                                                }
                                            } else {
                                                if (newValue['base64'] != oldValue['base64']) {
                                                    relevant[property] = newValue;
                                                    continue;
                                                }
                                            }
                                        }
                                    } else {
                                        if (newValue['filename'] || newValue['base64']) {
                                            relevant[property] = newValue;
                                            continue;
                                        }
                                    }
                                    if (newValue['url'] && (!field['url_prop'] || (olddata && olddata[field['url_prop']] != newValue['url'])))
                                        relevant[property] = newValue;
                                    break;
                                default:
                                    var funcHasChanged;
                                    const dtc = app.getController().getDataTypeController();
                                    var dt = dtc.getDataType(field['dataType']);
                                    if (dt)
                                        funcHasChanged = dt.getHasChangedFunction();
                                    else
                                        funcHasChanged = null;
                                    if (funcHasChanged) {
                                        if (await funcHasChanged(field, olddata, newdata))
                                            relevant[property] = newdata[property];
                                    } else {
                                        if (!olddata || (newdata[property] !== olddata[property]))
                                            relevant[property] = newdata[property];
                                    }
                            }
                        }
                    }
                }
            }
            if (Object.keys(relevant).length == 0)
                relevant = null;
        }
        return Promise.resolve(relevant);
    }

    static getChangedRelations(model, oldData, newData) {
        var data = {};
        var ac = model.getModelAttributesController();
        var attribute;
        var model;
        var changed;
        if (oldData && Object.keys(oldData).length > 0) {
            if (newData) {
                var bFound;
                for (const [key, value] of Object.entries(newData)) {
                    attribute = ac.getAttribute(key);
                    if (attribute && attribute['dataType'] === 'relation') {
                        if (attribute['multiple']) {
                            changed = [];
                            var ids = null;
                            if (value.some(isNaN))
                                ids = value.map(function (x) { return x['id'] });
                            else
                                ids = value;
                            if (oldData[key] && Array.isArray(oldData[key])) {
                                if (ids) {
                                    for (var item of oldData[key]) {
                                        bFound = false;
                                        for (var x of ids) {
                                            if (item['id'] == x) {
                                                bFound = true;
                                                break;
                                            }
                                        }
                                        if (!bFound)
                                            changed.push(item['id']);
                                    }
                                    for (var item of ids) {
                                        bFound = false;
                                        for (var x of oldData[key]) {
                                            if (item == x['id']) {
                                                bFound = true;
                                                break;
                                            }
                                        }
                                        if (!bFound)
                                            changed.push(item);
                                    }
                                } else
                                    changed = oldData[key].map(function (x) { return x['id'] });
                            } else if (ids)
                                changed = ids;
                        } else {
                            changed = null;
                            var id = null;
                            if (value) {
                                if (Number.isInteger(value))
                                    id = value;
                                else if (value['id'])
                                    id = value['id'];
                            }
                            if (oldData[key] && Object.keys(oldData[key]).length > 0) {
                                if (id) {
                                    if (oldData[key]['id'] != id)
                                        changed = [oldData[key]['id'], id];
                                } else
                                    changed = [oldData[key]['id']];
                            } else if (id)
                                changed = [id];
                        }
                        if (changed && (!Array.isArray(changed) || changed.length > 0)) {
                            if (data[attribute['model']])
                                data[attribute['model']] = data[attribute['model']].concat(changed);
                            else
                                data[attribute['model']] = changed;
                        }
                    }
                }
            } else {
                for (const [key, value] of Object.entries(oldData)) {
                    attribute = ac.getAttribute(key);
                    if (attribute && attribute['dataType'] === 'relation' && value) {
                        changed = null;
                        if (attribute['multiple']) {
                            if (Array.isArray(value) && value.length > 0) {
                                if (value.some(isNaN))
                                    changed = value.map(function (x) { return x['id'] });
                                else
                                    changed = value;
                            }
                        } else {
                            if (Number.isInteger(value))
                                changed = [value];
                            else if (value['id'])
                                changed = [value['id']];
                        }
                        if (changed) {
                            if (data[attribute['model']])
                                data[attribute['model']] = data[attribute['model']].concat(changed);
                            else
                                data[attribute['model']] = changed;
                        }
                    }
                }
            }
        } else {
            for (const [key, value] of Object.entries(newData)) {
                attribute = ac.getAttribute(key);
                if (attribute && attribute['dataType'] === 'relation' && value) {
                    changed = null;
                    if (attribute['multiple']) {
                        if (Array.isArray(value) && value.length > 0) {
                            if (value.some(isNaN))
                                changed = value.map(function (x) { return x['id'] });
                            else
                                changed = value;
                        }
                    } else {
                        if (Number.isInteger(value))
                            changed = [value];
                        else if (value['id'])
                            changed = [value['id']];
                    }
                    if (changed) {
                        if (data[attribute['model']])
                            data[attribute['model']] = data[attribute['model']].concat(changed);
                        else
                            data[attribute['model']] = changed;
                    }
                }
            }
        }
        return data;
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
        if (cdn.startsWith('/'))
            cdn = app.getController().getApiController().getApiOrigin() + cdn;
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
    _bDeleted;

    constructor(typeString, data) {
        this._typeString = typeString;
        const model = app.getController().getModelController().getModel(this._typeString);
        if (model) {
            this._model = model;
            this.setData(data);
        } else
            throw new Error('Unknown model \'' + this._typeString + '\'');
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
        if (bPrepare && this._model)
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
                if (this._model.getDefinition()['options']['increments']) {
                    if (this._data['id'])
                        url += "/" + this._data['id'];
                } else {
                    var attributes = this._model.getModelAttributesController().getAttributes();
                    var prime = [];
                    for (var attr of attributes) {
                        if (attr['primary'])
                            prime.push(attr['name']);
                    }
                    if (prime.length == 1) {
                        var key = prime[0];
                        url += "?" + key + "=" + this._data[key];
                    } else
                        throw new Error('Failed to determine primary key!');
                }
                break;
            case ActionEnum.update:
                if (this._model.getDefinition()['options']['increments']) {
                    if (this._data['id'])
                        url += "/" + this._data['id'] + "/edit";
                }
                break;
            case ActionEnum.delete:
                //TODO:
                break;
            default:
        }
        return url;
    }

    isDeleted() {
        return this._bDeleted;
    }

    async create(data) {
        if (!data)
            data = this._data;
        return this.request(ActionEnum.create, data);
    }

    async read() {
        return this.request(ActionEnum.read);
    }

    async update(data) {
        if (this._data['id'] || !this._model.getDefinition()['options']['increments'])
            data = await this.request(ActionEnum.update, data);
        else {
            for (const [key, value] of Object.entries(data)) {
                if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length == 0))
                    delete this._data[key];
                else
                    this._data[key] = value;
            }
            data = this._data;
        }
        return Promise.resolve(data);
    }

    async delete() {
        return this.request(ActionEnum.delete);
    }

    async _updateCache(oldData, newData) {
        const controller = app.getController();
        const cache = await controller.getDataService().getCache();
        const ds = controller.getDataService();
        const promises = [];
        if (newData) {
            const changed = CrudObject.getChangedRelations(this._model, oldData, newData);
            if (Object.keys(changed).length > 0) {
                var mCache;
                for (const [key, value] of Object.entries(changed)) {
                    mCache = cache.getModelCache(key);
                    if (mCache)
                        promises.push(ds.fetchData(key, value, null, null, null, null, null, true));
                }
            }
        } else {
            const name = this._model.getName();
            const models = controller.getModelController().getModels();
            var definition;
            var mc;
            var data;
            var ids;
            var tmp;
            for (var m of models) {
                definition = m.getDefinition();
                mc = cache.getModelCache(definition['name']);
                if (mc) {
                    data = await mc.getCompleteRecordSet();
                    if (data) {
                        if (definition['attributes']) {
                            ids = [];
                            for (var attr of definition['attributes']) {
                                if (attr['dataType'] == 'relation' && attr['model'] == name) {
                                    if (attr['multiple']) {
                                        if (!attr['via']) {
                                            for (var d of data) {
                                                tmp = d[attr['name']];
                                                if (tmp && tmp.length > 0) {
                                                    tmp = tmp.map(x => x['id']);
                                                    if (tmp.includes(oldData['id'])) {
                                                        if (!ids.includes(d['id']))
                                                            ids.push(d['id']);
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        for (var d of data) {
                                            tmp = d[attr['name']];
                                            if (tmp && tmp['id'] == oldData['id']) {
                                                if (!ids.includes(d['id']))
                                                    ids.push(d['id']);
                                            }
                                        }
                                    }
                                }
                            }
                            if (ids.length > 0)
                                promises.push(ds.fetchData(definition['name'], ids, null, null, null, null, null, true));
                        }
                    }
                }
            }
        }
        if (promises.length > 0)
            await Promise.all(promises);

        const db = controller.getDatabase();
        if (db) {
            const id = db.getChangeId();
            if (id) {
                const changes = await cache.getChanges(id);
                if (changes) {
                    const data = changes['data'];
                    if (data && data.length == 1) {
                        const user = controller.getAuthController().getUser();
                        if (data[0]['model'] == this._typeString && data[0]['record_id'] == this._data['id'] &&
                            ((!user && !data[0]['user']) || data[0]['user']['id'] == user['id']))
                            db.setChangeId(null, data[0]['id']);
                    }
                }
            }
        }
        return Promise.resolve();
    }

    async request(action, data) {
        const oldData = this._data;

        var id;
        if (this._model.getDefinition()['options']['increments']) {
            if (this._data && this._data['id'])
                id = this._data['id'];
            if (!id && action != ActionEnum.create)
                throw new Error('Missing ID');
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
        const controller = app.getController();
        const res = await controller.getDataService().request(this.getTypeString(), action, id, data);
        if (action == ActionEnum.delete) {
            //this.setData(null);
            this._bDeleted = true;
        } else
            this.setData(res);
        if (action != ActionEnum.read && controller.getConfigController().automaticUpdateCache() && !controller._bOfflineMode) {
            switch (action) {
                case ActionEnum.create:
                    await this._updateCache(null, res);
                    break;
                case ActionEnum.update:
                    await this._updateCache(oldData, res);
                    break;
                case ActionEnum.delete:
                    await this._updateCache(oldData, null);
                    break;
            }
        }
        return Promise.resolve(res);
    }
}