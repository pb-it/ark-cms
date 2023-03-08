class ExtensionController {

    _extensions;

    constructor() {
    }

    async init() {
        //var model = app.controller.getModelController().getModel('_extension'); //readAll???
        this._extensions = await app.controller.getDataService().fetchData('_extension');
        $(window).trigger('changed.extension');
        return Promise.resolve();
    }

    getExtensions() {
        return this._extensions;
    }

    async addExtension(file) {
        var res;
        var formData = new FormData();
        //formData.append('name', this.files[0].name);
        formData.append('extension', file);
        //await app.controller.getDataService().request('_extension', 'PUT', null, formData);
        var obj = new CrudObject('_extension', formData);
        res = await obj.create();
        await this.init();
        return Promise.resolve('OK');
    }

    async deleteExtension(name) {
        var res;
        var data = this._extensions.filter(function (x) { return x['name'] == name });
        if (data && data.length == 1) {
            var obj = new CrudObject('_extension', data[0]);
            res = await obj.delete();
        }
        await this.init();
        return Promise.resolve(res);
    }
}