class Media {

    static parse(obj) {
        var media;
        const model = obj.getModel();
        const data = obj.getData();
        const path = model.getModelDefaultsController().getDefaultThumbnailProperty();
        if (path)
            media = Media._determineThumbnailMulti(model, data, path);
        const propName = model.getModelDefaultsController().getDefaultFileProperty();
        if (!media && propName)
            media = new Media();
        if (media) {
            if (propName) {
                const attr = model.getModelAttributesController().getAttribute(propName);
                if (attr['dataType'] === 'url' || attr['dataType'] === 'file')
                    media.setFile(obj.getAttributeValue(propName));
                else {
                    if (attr['cdn'])
                        media.setFile(CrudObject._buildUrl(attr['cdn'], data[propName]));
                    else
                        media.setFile(data[propName]);
                }
            }
            if (!media.getMediaType()) {
                const propName = model.getModelDefaultsController().getDefaultMediaTypeProperty();
                if (propName)
                    media.setMediaType(data[propName]);
                else {
                    var file = media.getFile();
                    if (file) {
                        if (isImage(file))
                            media.setMediaType('image');
                        else if (isVideo(file))
                            media.setMediaType('video');
                    }
                }
            }
        }
        return media;
    }

    static _determineThumbnailMulti(model, data, path) {
        var media;
        if (path.indexOf(';') >= 0) {
            var parts = path.split(';');
            for (var part of parts) {
                media = Media._determineThumbnailSingle(model, data, part);
                if (media && media.getThumbnail())
                    break;
            }
        } else
            media = Media._determineThumbnailSingle(model, data, path);
        return media;
    }

    static _determineThumbnailSingle(model, data, name) {
        var media;
        if (name.indexOf('.') >= 0) {
            var parts = name.split('.');
            if (parts.length == 2) {
                var prop = parts[0];
                if (data[prop]) {
                    var attr = model.getModelAttributesController().getAttribute(prop);
                    if (attr['dataType'] === "relation") {
                        var relModel = app.getController().getModelController().getModel(attr['model']);
                        media = Media._determineThumbnailMulti(relModel, data[prop], parts[1]);
                        if (media && media.getThumbnail())
                            media.setProperty(name);
                    }
                }
            }
        } else {
            if (data[name]) {
                var attr = model.getModelAttributesController().getAttribute(name);
                if (attr['dataType'] === "relation") {
                    var relModel = app.getController().getModelController().getModel(attr['model']);
                    var relPath = relModel.getModelDefaultsController().getDefaultThumbnailProperty();
                    if (relPath) {
                        media = Media._determineThumbnailMulti(relModel, data[name], relPath);
                        if (media && media.getThumbnail())
                            media.setProperty(name);
                    }
                } else if (attr['dataType'] === "url") {
                    if (attr['cdn'])
                        media.setThumbnail(CrudObject._buildUrl(attr.cdn, data[name]));
                    else
                        media.setThumbnail(data[name]);
                    media.setProperty(name);
                    const propName = model.getModelDefaultsController().getDefaultMediaTypeProperty();
                    if (propName)
                        media.setMediaType(data[propName]);
                } else if (attr['dataType'] === "file") {
                    media = new Media();
                    if (typeof data[name] === 'string' || data[name] instanceof String) {
                        if (attr['cdn'])
                            media.setThumbnail(CrudObject._buildUrl(attr.cdn, data[name]));
                        else
                            media.setThumbnail(data[name]);
                    } else if (data[name]['base64'])
                        media.setThumbnail(data[name]['base64']);
                    else if (data[name]['url'])
                        media.setThumbnail(data[name]['url']);
                    media.setProperty(name);
                    const propName = model.getModelDefaultsController().getDefaultMediaTypeProperty();
                    if (propName)
                        media.setMediaType(data[propName]);
                } else {
                    if (typeof data[name] === 'string' || data[name] instanceof String) {
                        media = new Media();
                        if (attr['cdn'])
                            media.setThumbnail(CrudObject._buildUrl(attr['cdn'], data[name]));
                        else if (data[name].startsWith('http') || data[name].startsWith('data'))
                            media.setThumbnail(data[name]);
                        media.setProperty(name);
                        const propName = model.getModelDefaultsController().getDefaultMediaTypeProperty();
                        if (propName)
                            media.setMediaType(data[propName]);
                    }
                }
            } else
                media = new Media();
        }
        return media;
    }

    _mediaType;
    _file;
    _thumbnail;
    _prop;

    constructor() {
    }

    setMediaType(mediaType) {
        this._mediaType = mediaType;
    }

    getMediaType() {
        return this._mediaType;
    }

    setProperty(prop) {
        this._prop = prop;
    }

    setFile(file) {
        this._file = file;
    }

    getFile() {
        return this._file;
    }

    setThumbnail(thumbnail) {
        this._thumbnail = thumbnail;
    }

    getThumbnail() {
        return this._thumbnail;
    }
}