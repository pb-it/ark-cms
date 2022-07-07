class XModel {

    _data;

    constructor(data) {
        this._data = data;
    }

    getData() {
        return this._data;
    }

    async setData(data, bUpload = true) {
        this._data = data;
        if (bUpload)
            await this.uploadData();
        return Promise.resolve();
    }

    getName() {
        return this._data['name'];
    }

    async uploadData() {
        var api = app.controller.getConfigController().getApi();
        var url = api.substring(0, api.length - 3) + "models";
        return WebClient.request("PUT", url, this._data);
    }

    getModelAttributesController() {
        return new ModelAttributesController(this);
    }

    getModelDefaultsController() {
        return new ModelDefaultsController(this);
    }

    getModelPanelConfigController() {
        return new ModelPanelConfigController(this);
    }

    getModelStateController() {
        return new ModelStateController(this);
    }

    getModelFilterController() {
        return new ModelFilterController(this);
    }

    isCollection() {
        if (this.getModelDefaultsController().getDefaultCollectionModel())
            return true;
        else if (this.getModelDefaultsController().getDefaultCollectionModelProperty())
            return true;
        else
            return false;
    }
}