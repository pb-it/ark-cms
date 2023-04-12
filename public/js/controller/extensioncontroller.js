class ExtensionController {

    _extensions;

    constructor() {
    }

    async init() {
        //var model = app.controller.getModelController().getModel('_extension'); //readAll???
        var res = await app.controller.getDataService().fetchData('_extension');
        this._extensions = [...res];
        for (var ext of this._extensions) {
            if (ext['client-extension']) {
                var module = await loadModule(ext['client-extension']);
                if (module && module.init)
                    module.init();
            }
        }
        $(window).trigger('changed.extension');
        return Promise.resolve();
    }

    getExtensions() {
        return this._extensions;
    }

    getExtension(name) {
        var ext;
        for (var x of this._extensions) {
            if (x['name'] == name) {
                ext = x;
                break;
            }
        }
        return ext;
    }

    async addExtension(file, existing) {
        var res;
        var formData = new FormData();
        //formData.append('name', this.files[0].name);
        formData.append('extension', file);
        //await app.controller.getDataService().request('_extension', 'PUT', null, formData);
        var obj;
        if (existing) {
            obj = new CrudObject('_extension', existing);
            res = await obj.update(formData);
        } else {
            obj = new CrudObject('_extension', formData);
            res = await obj.create();
        }
        if (res) {
            //await this.init(); // messes up sidemenu
            if (existing) {
                var name = res['name'];
                if (name)
                    this._extensions = this._extensions.filter((x) => x['name'] !== name);
            }
            this._extensions.push(res);
            $(window).trigger('changed.extension');
        }
        return Promise.resolve('OK');
    }

    async deleteExtension(name) {
        var res;
        var data = this.getExtension(name);
        if (data) {
            var obj = new CrudObject('_extension', data);
            res = await obj.delete();
        }
        if (res) {
            //await this.init(); // messes up sidemenu
            this._extensions = this._extensions.filter((x) => x['name'] !== name);
            $(window).trigger('changed.extension');
        }
        return Promise.resolve(res);
    }
}