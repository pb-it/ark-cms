class ModelAttributesController {

    static ATTRIBUTES_IDENT = "attributes";

    _model;

    constructor(model) {
        this._model = model;

        this._init();
    }

    _init() {
    }

    getAttributes(bAddOptions) {
        var attributes;
        if (bAddOptions) {
            attributes = [
                { 'name': 'id', 'dataType': 'integer', 'readonly': true },
                { 'name': 'created_at', 'dataType': 'timestamp', 'readonly': true },
                { 'name': 'updated_at', 'dataType': 'timestamp', 'readonly': true }
            ];
            var other = this._model.getDefinition()[ModelAttributesController.ATTRIBUTES_IDENT];
            if (other)
                attributes = attributes.concat(other);
        } else
            attributes = this._model.getDefinition()[ModelAttributesController.ATTRIBUTES_IDENT];
        return attributes;
    }

    getAttribute(name) {
        return this.getAttributes(true).filter(function (x) { return x.name === name })[0];
    }

    async setAttributes(attributes) {
        var data = this._model.getDefinition();
        if (attributes)
            data[ModelAttributesController.ATTRIBUTES_IDENT] = attributes;
        await this._model.setDefinition(data);
        return Promise.resolve();
    }
}