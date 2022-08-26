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
        var definition = this._model.getDefinition();
        if (bAddOptions) {
            attributes = [];
            if (definition['options']['increments'])
                attributes.push({ 'name': 'id', 'dataType': 'integer', 'readonly': true });
            if (definition['options']['timestamps']) {
                attributes.push({ 'name': 'created_at', 'dataType': 'timestamp', 'readonly': true });
                attributes.push({ 'name': 'updated_at', 'dataType': 'timestamp', 'readonly': true });
            }
            var other = definition[ModelAttributesController.ATTRIBUTES_IDENT];
            if (other)
                attributes = attributes.concat(other);
        } else
            attributes = definition[ModelAttributesController.ATTRIBUTES_IDENT];
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