class ModelDefaultsController {

    static DEFAULTS_IDENT = "defaults";
    static SORT_IDENT = "sort";
    static TITLE_IDENT = "title";
    static MEDIA_TYPE_IDENT = "mediaType";
    static FILE_IDENT = "file";
    static THUMBNAIL_IDENT = "thumbnail";
    static COLLECTION_MODEL_IDENT = "collectionModel";
    static COLLECTION_MODEL_PROPERTY_IDENT = "collectionModelProperty";
    static COLLECTION_IDENT = "collection";
    static PANEL_TYPE_IDENT = 'panelType';
    static VIEW_IDENT = 'view';
    static FETCH_IDENT = 'fetch';

    _apiClient;
    _model;

    constructor(model) {
        this._apiClient = app.getController().getApiController().getApiClient();
        this._model = model;
    }

    async setDefaults(defaults) {
        const data = this._model.getDefinition();
        data[ModelDefaultsController.DEFAULTS_IDENT] = defaults;
        await this._model.setDefinition(data);
        return Promise.resolve();
    }

    _getDefaultProperty(property) {
        var res;
        const defaults = this._model.getDefinition()[ModelDefaultsController.DEFAULTS_IDENT];
        if (defaults)
            res = defaults[property];
        return res;
    }

    getDefaultSort() {
        return this._getDefaultProperty(ModelDefaultsController.SORT_IDENT);
    }

    async setDefaultSort(sort) {
        var data = this._model.getDefinition();
        var defaults = data[ModelDefaultsController.DEFAULTS_IDENT];
        if (!defaults) {
            defaults = {};
            data[ModelDefaultsController.DEFAULTS_IDENT] = defaults;
        }
        defaults[ModelDefaultsController.SORT_IDENT] = sort;
        await this._model.setDefinition(data, false);
        return this._apiClient.requestData("PUT", "_model/" + this._model.getId() + "/defaults/sort", null, sort);
    }

    getDefaultTitleProperty(bFallback = true) {
        var res = this._getDefaultProperty(ModelDefaultsController.TITLE_IDENT);
        if (!res && bFallback) {
            var name;
            var str;
            var attributes = this._model.getModelAttributesController().getAttributes();
            if (attributes) {
                for (var attr of attributes) {
                    name = attr['name'];
                    str = name.toLowerCase();
                    if (str == 'name' || str == 'title') {
                        res = name;
                        break;
                    }
                }
            }
        }
        return res;
    }

    getDefaultMediaTypeProperty() {
        return this._getDefaultProperty(ModelDefaultsController.MEDIA_TYPE_IDENT);
    }

    getDefaultFileProperty() {
        return this._getDefaultProperty(ModelDefaultsController.FILE_IDENT);
    }

    getDefaultThumbnailProperty() {
        return this._getDefaultProperty(ModelDefaultsController.THUMBNAIL_IDENT);
    }

    getDefaultCollectionModel() {
        return this._getDefaultProperty(ModelDefaultsController.COLLECTION_MODEL_IDENT);
    }

    getDefaultCollectionModelProperty() {
        return this._getDefaultProperty(ModelDefaultsController.COLLECTION_MODEL_PROPERTY_IDENT);
    }

    getDefaultCollectionProperty() {
        return this._getDefaultProperty(ModelDefaultsController.COLLECTION_IDENT);
    }

    getDefaultPanelConfig() {
        return this._getDefaultProperty(ModelDefaultsController.VIEW_IDENT);
    }

    getDefaultFetchConfig() {
        return this._getDefaultProperty(ModelDefaultsController.FETCH_IDENT);
    }

    async setDefaultPanelConfig(config) {
        var data = this._model.getDefinition();
        var defaults = data[ModelDefaultsController.DEFAULTS_IDENT];
        if (!defaults) {
            defaults = {};
            data[ModelDefaultsController.DEFAULTS_IDENT] = defaults;
        }
        defaults[ModelDefaultsController.VIEW_IDENT] = config;
        await this._model.setDefinition(data, false);
        return this._apiClient.requestData("PUT", "_model/" + this._model.getId() + "/defaults/view", null, config);
    }
}