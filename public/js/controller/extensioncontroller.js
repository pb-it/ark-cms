class ExtensionController {

    _extensions;
    _info;

    constructor() {
    }

    async initExtensionController() {
        const controller = app.getController();
        const ac = controller.getApiController();
        const info = ac.getApiInfo();
        if (info['extensions'])
            this._info = { ...info['extensions'] };
        else
            this._info = {};
        this._extensions = [];
        //var model = controller.getModelController().getModel('_extension'); //readAll???
        const res = await controller.getDataService().fetchData('_extension', null, null, null, null, null, null, true);
        if (res.length > 0) {
            var name;
            for (var extension of res) {
                name = extension['name'];
                if (this._info[name])
                    await this._initExtension(extension);
                else
                    this._info[name] = {};
            }
        }
        $(window).trigger('changed.extension');
        return Promise.resolve();
    }

    async _initExtension(extension) {
        const controller = app.getController();
        const ext = { ...extension };
        const name = ext['name'];
        if (ext['client-extension']) {
            try {
                const module = await loadModule(ext['client-extension']);
                if (module) {
                    ext['module'] = module;
                    if (module.init)
                        await module.init();
                }
            } catch (error) {
                console.error(error);
                controller.showErrorMessage("Loading extension '" + name + "' failed!");
            }
        }
        this._extensions = this._extensions.filter((x) => x['name'] !== name);
        this._extensions.push(ext);
        return Promise.resolve();
    }

    getExtensionsInfo() {
        return this._info;
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
            const controller = app.getController();
            await controller.getProfileController().init();
            await controller.getModelController().init();
            await this._initExtension(res);
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