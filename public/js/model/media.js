class Media {

    static MEDIA_TYPE_PROPERTY = 'mediaType';

    _obj;
    _data;

    _mediaType;
    _thumbnailUrl;
    _prop;
    _value;

    constructor(obj) {
        this.parse(obj);
    }

    parse(obj) {
        if (obj) {
            if (this._obj != obj)
                this._obj = obj;
            var data = obj.getData();
            if (this._data != data) {
                this._data = data;
                this._mediaType = null;
                this._thumbnailUrl = null;
                this._prop = null;
                this._value = null;
                var data = this._obj.getData();
                if (data) {
                    this._mediaType = data[Media.MEDIA_TYPE_PROPERTY];

                    var model = this._obj.getModel();
                    var path = model.getModelDefaultsController().getDefaultThumbnailProperty();
                    if (path)
                        this._determineThumbnailMulti(model, data, path);
                }
            }
        }
    }

    _determineThumbnailMulti(model, data, path) {
        if (path.indexOf(';') >= 0) {
            var parts = path.split(';');
            for (var part of parts) {
                this._determineThumbnailSingle(model, data, part);
                if (this._thumbnailUrl)
                    break;
            }
        } else
            this._determineThumbnailSingle(model, data, path);
    }

    _determineThumbnailSingle(model, data, name) {
        if (name.indexOf('.') >= 0) {
            var parts = name.split('.');
            if (parts.length == 2) {
                var prop = parts[0];
                if (data[prop]) {
                    var attr = model.getModelAttributesController().getAttribute(prop);
                    if (attr['dataType'] === "relation") {
                        var relModel = app.controller.getModelController().getModel(attr.model);
                        this._determineThumbnailMulti(relModel, data[prop], parts[1]);
                        if (this._thumbnailUrl) {
                            this._prop = prop;
                            this._value = data[prop];
                        }
                    }
                }
            }
        } else {
            if (data[name]) {
                var attr = model.getModelAttributesController().getAttribute(name);
                if (attr['dataType'] === "relation") {
                    var relModel = app.controller.getModelController().getModel(attr.model);
                    var relPath = relModel.getModelDefaultsController().getDefaultThumbnailProperty();
                    if (relPath) {
                        this._determineThumbnailMulti(relModel, data[name], relPath);
                        if (this._thumbnailUrl) {
                            this._prop = name;
                            this._value = data[name];
                        }
                    }
                } else if (attr['dataType'] === "url") {
                    if (attr.cdn)
                        this._thumbnailUrl = CrudObject._buildUrl(attr.cdn, data[name]);
                    else
                        this._thumbnailUrl = data[name];
                    this._mediaType = data[Media.MEDIA_TYPE_PROPERTY];
                    this._prop = name;
                    this._value = data[name];
                } else if (attr['dataType'] === "file") {
                    if (typeof data[name] === 'string' || data[name] instanceof String) {
                        if (attr.cdn)
                            this._thumbnailUrl = CrudObject._buildUrl(attr.cdn, data[name]);
                        else
                            this._thumbnailUrl = data[name];
                    } else if (data[name]['base64'])
                        this._thumbnailUrl = data[name]['base64'];
                    else if (data[name]['url'])
                        this._thumbnailUrl = data[name]['url'];
                    this._mediaType = data[Media.MEDIA_TYPE_PROPERTY];
                    this._prop = name;
                    this._value = data[name];
                }
            }
        }
    }

    getMediaType() {
        return this._mediaType;
    }

    getFile() {
        if (this._obj.getTypeString() === 'contents')
            return this._obj.getAttributeValue("file");
        else
            return this._thumbnailUrl;
    }

    getThumbnail() {
        return this._thumbnailUrl;
    }
}