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
            var ext;
            for (var extension of res) {
                name = extension['name'];
                if (this._info[name])
                    await this._initExtension(extension);
                else {
                    ext = { ...extension };
                    this._extensions = this._extensions.filter((x) => x['name'] !== name);
                    this._extensions.push(ext);
                    this._info[name] = {};
                }
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

    async openExtensionUpload() {
        return new Promise(function (resolve, reject) {
            const controller = app.getController();
            const $input = $('<input/>')
                .prop('type', 'file')
                .prop('accept', 'application/zip')
                .prop('multiple', true)
                .css({ 'visibility': 'hidden' })
                .bind("click", function (e) {
                    //this.remove();
                })
                .on("change", async function () {
                    if (this.files.length > 0) {
                        try {
                            controller.setLoadingState(true);
                            var name;
                            var existing;
                            var res;
                            var msg;
                            var extensions = controller.getExtensionController().getExtensions();
                            var tmp;
                            for (var file of this.files) {
                                if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
                                    msg = null;
                                    tmp = file.name.indexOf('@');
                                    if (tmp != -1)
                                        name = file.name.substring(0, tmp);
                                    else if (file.name.endsWith('.zip'))
                                        name = file.name.substring(0, file.name.length - 4);
                                    else
                                        throw new Error('Filename does not comply specification');
                                    existing = null;
                                    for (var x of extensions) {
                                        if (x['name'] == name) {
                                            existing = x;
                                            break;
                                        }
                                    }
                                    if (!existing)
                                        res = await controller.getExtensionController().addExtension(file);
                                    else if (confirm('An extension with name \'' + name + '\' already exists!\nDo you want to override it?'))
                                        res = await controller.getExtensionController().addExtension(file, existing);
                                    else
                                        msg = 'Aborted';

                                    if (!msg) {
                                        if (res == 'OK') {
                                            msg = 'Uploaded \'' + name + '\' successfully!';
                                            var bRestart;
                                            var ac = controller.getApiController();
                                            var info = await ac.fetchApiInfo();
                                            if (info)
                                                bRestart = info['state'] === 'openRestartRequest';
                                            if (bRestart) {
                                                msg += '\nAPI server application needs to be restarted for the changes to take effect!';
                                                //controller.getView().initView(); // shows notification, but clears canvas
                                                //await reloadState();
                                                //controller.getView().getSideNavigationBar().updateSideNavigationBar(); // not updating notification
                                                controller.getView().getSideNavigationBar().renderSideNavigationBar();
                                            } else {
                                                controller.getView().getSideNavigationBar().close();
                                                msg += '\nReload website for the changes to take effect!';
                                            }
                                        } else
                                            msg = 'Something went wrong!';
                                    }
                                } else
                                    msg = 'An extension has to be provided as zip archive!\nSkipping \'' + name + '\'';
                                alert(msg);
                            }
                            controller.setLoadingState(false);
                        } catch (error) {
                            controller.setLoadingState(false);
                            if (error instanceof HttpError && error['response']) {
                                if (error['response']['status'] == 422 && error['response']['body'])
                                    controller.showErrorMessage(error['response']['body']);
                                else
                                    controller.showErrorMessage(error['message']);
                            } else
                                controller.showError(error);
                            reject();
                        }
                        resolve();
                    } else
                        reject();

                });
            $input.click();
        });
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
        const controller = app.getController();
        try {
            const ext = this.getExtension(name);
            const module = ext['module'];

            var bConfirm;
            if (module && typeof module['teardown'] == 'function')
                bConfirm = await module.teardown();
            else
                bConfirm = confirm("Delete extension '" + name + "'?");
            if (bConfirm) {
                controller.setLoadingState(true);
                var res = await this._deleteExtension(name);
                controller.setLoadingState(false);

                if (res == 'OK') {
                    var msg = 'Deleted extension successfully!';
                    var bRestart;
                    var ac = controller.getApiController();
                    var info = await ac.fetchApiInfo();
                    if (info)
                        bRestart = info['state'] === 'openRestartRequest';
                    if (bRestart) {
                        msg += '\nAPI server application needs to be restarted for the changes to take effect!';
                        controller.getView().getSideNavigationBar().renderSideNavigationBar();
                    } else {
                        controller.getView().getSideNavigationBar().close();
                        msg += '\nReload website for the changes to take effect!';
                    }
                    alert(msg);
                } else
                    alert('Something went wrong!');
            }
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    }

    async _deleteExtension(name) {
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