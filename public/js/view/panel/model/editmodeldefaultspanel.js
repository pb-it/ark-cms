class EditModelDefaultsPanel extends Panel {

    _model;

    _sortForm;
    _titleForm;
    _thumbnailForm;
    _collectionForm;
    _thumbnailViewForm;
    _panelViewForm;

    constructor(model) {
        super({ 'title': 'Defaults' });

        this._model = model;
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var mdc = this._model.getModelDefaultsController();
        var mac = this._model.getModelAttributesController();
        var stringAttrNames;
        var attributes = mac.getAttributes();
        if (attributes) {
            var stringAttr = attributes.filter(function (x) { return (x['dataType'] === 'string' || x['dataType'] === 'text' || x['dataType'] === 'enumeration' || x['dataType'] === 'url') });
            stringAttrNames = stringAttr.map(function (x) { return { 'value': x['name'] } });
        } else
            stringAttrNames = [];

        var panelConfig = { ...mdc.getDefaultPanelConfig() };

        this._panelViewForm = EditViewPanel.getPanelViewForm(this._model, panelConfig);
        var $form = await this._panelViewForm.renderForm();
        $div.append($form);
        $div.append('</br>');

        var skeleton = [
            {
                name: 'title',
                tooltip: '**Fallback**: If left undefined the app will use properties with name \'title\' or \'name\' as default!',
                dataType: 'enumeration',
                options: stringAttrNames,
                view: 'select'
            }
        ];
        var title = mdc.getDefaultTitleProperty(false);
        var data = { 'title': title };
        this._titleForm = new Form(skeleton, data);
        $form = await this._titleForm.renderForm();
        $div.append($form);
        $div.append('</br>');

        this._sortForm = EditSortPanel.getSortForm(this._model, mdc.getDefaultSort());
        $form = await this._sortForm.renderForm();
        $div.append($form);
        $div.append('</br>');

        await this._appendCollectionForm($div);
        $div.append('</br>');

        skeleton = [
            {
                name: ModelDefaultsController.MEDIA_TYPE_IDENT,
                dataType: 'string'
            },
            {
                name: ModelDefaultsController.FILE_IDENT,
                dataType: 'string'
            },
            {
                name: ModelDefaultsController.THUMBNAIL_IDENT,
                dataType: 'string'
            }];
        var mediaType = mdc.getDefaultMediaTypeProperty();
        var file = mdc.getDefaultFileProperty();
        var thumbnail = mdc.getDefaultThumbnailProperty();
        data = {};
        data[ModelDefaultsController.MEDIA_TYPE_IDENT] = mediaType;
        data[ModelDefaultsController.FILE_IDENT] = file;
        data[ModelDefaultsController.THUMBNAIL_IDENT] = thumbnail;
        this._thumbnailForm = new Form(skeleton, data);
        $form = await this._thumbnailForm.renderForm();
        $div.append($form);
        $div.append('</br>');

        this._thumbnailViewForm = EditViewPanel.getThumbnailViewForm(panelConfig);
        $form = await this._thumbnailViewForm.renderForm();
        $div.append($form);
        $div.append('</br>');

        return Promise.resolve($div);
    }

    async _appendCollectionForm($div) {
        var data = {};

        var mdc = this._model.getModelDefaultsController();
        var mac = this._model.getModelAttributesController();

        var models = app.controller.getModelController().getModels();
        var names = models.map(function (model) {
            return model.getDefinition()['name'];
        });
        var mName = this._model.getName();
        var mOptions = names.filter(function (x) { return x !== mName }).map(function (x) { return { 'value': x } });
        var sOptions;
        var aOptions;
        var attributes = mac.getAttributes();
        if (attributes) {
            var stringAttr = attributes.filter(function (x) { return x['dataType'] === 'string' });
            sOptions = stringAttr.map(function (x) { return { 'value': x['name'] } });

            var stringOrEnumAttr = attributes.filter(function (x) { return (x['dataType'] === 'string' || x['dataType'] === 'enumeration') });
            aOptions = stringOrEnumAttr.map(function (x) { return { 'value': x['name'] } });
        } else {
            sOptions = [];
            aOptions = [];
        }

        var collectionModel = mdc.getDefaultCollectionModel();
        if (collectionModel)
            data[ModelDefaultsController.COLLECTION_MODEL_IDENT] = collectionModel;

        var collectionModelProp = mdc.getDefaultCollectionModelProperty();
        if (collectionModelProp)
            data[ModelDefaultsController.COLLECTION_MODEL_PROPERTY_IDENT] = collectionModelProp;

        var collection = mdc.getDefaultCollectionProperty();
        if (collection)
            data['collection'] = collection;

        var skeleton = [
            { name: ModelDefaultsController.COLLECTION_MODEL_IDENT, dataType: 'enumeration', options: mOptions, view: 'select' },
            {
                name: ModelDefaultsController.COLLECTION_MODEL_PROPERTY_IDENT,
                label: 'collModelProp',
                tooltip: 'string or enumeration attribute which defines the model which the collection can hold',
                dataType: 'enumeration',
                options: aOptions,
                view: 'select'
            },
            { name: 'collection', dataType: 'enumeration', options: sOptions, view: 'select' }
        ];

        this._collectionForm = new Form(skeleton, data);
        var $form = await this._collectionForm.renderForm();
        $div.append($form);
        return Promise.resolve();
    }

    async getData() {
        var defaults;
        if (this._bRendered) {
            defaults = {
                ...await this._titleForm.readForm(), ...await this._thumbnailForm.readForm(),
                ...await this._collectionForm.readForm()
            };

            var sortData = await this._sortForm.readForm();
            if (sortData['sortCriteria'])
                defaults['sort'] = sortData['sortCriteria'] + ":" + sortData['sort'];

            var data = { ...await this._panelViewForm.readForm(), ...await this._thumbnailViewForm.readForm() };

            delete data['bContextMenu'];
            delete data['searchFields'];

            defaults[ModelDefaultsController.VIEW_IDENT] = data;
        }

        return Promise.resolve(defaults);
    }

    getTitleForm() {
        return this._titleForm;
    }
}