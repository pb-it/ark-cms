class ModalController {

    static async changeIds(obj, property, addIds, removeIds) {
        var oldList;
        var data = obj.getData()[property];
        if (data) {
            oldList = data.map(function (x) {
                return x.id;
            });
        } else
            oldList = [];

        var newList;
        var changed = false;
        if (removeIds) {
            newList = [];
            for (var id of oldList) {
                if (removeIds.indexOf(id) == -1)
                    newList.push(id);
                else
                    changed = true;
            }
        } else
            newList = oldList;
        for (var newId of addIds) {
            if (newList.indexOf(newId) == -1) {
                newList.push(newId);
                changed = true;
            }
        }
        if (changed) {
            var data = {};
            data[property] = newList;
            await obj.update(data);
        }
        return Promise.resolve();
    }

    _stack;

    constructor() {
        this._stack = [];
    }

    getModals() {
        return this._stack;
    }

    isModalOpen() {
        return this._stack.length > 0;
    }

    addModal() {
        var modal = new Modal();
        modal.setCloseCallback(function (data) {
            this._stack.pop();
        }.bind(this));
        this._stack.push(modal);
        return modal;
    }

    closeAll() {
        var modal;
        while (this._stack.length > 0) {
            modal = this._stack.pop();
            modal.close();
        }
    }

    async openPanelInModal(panel) {
        app.controller.setLoadingState(true);
        var modal = this.addModal();

        try {
            await modal.openPanel(panel);
        } catch (error) {
            app.controller.showError(error);
        }

        app.controller.setLoadingState(false);
        return Promise.resolve();
    }

    async openCrudObjectInModal(action, obj) {
        return new Promise(async function (resolve, reject) {
            var model = obj.getModel();
            var mpcc = model.getModelPanelConfigController();
            var panelConfig = mpcc.getPanelConfig(action, DetailsEnum.all);

            var panel = PanelController.createPanelForObject(obj, panelConfig);

            panelConfig.crudCallback = async function (data) {
                panel.dispose(); //modal.close();
                resolve(data);
            };

            var modal = app.controller.getModalController().addModal();
            /*modal.setCloseCallback(function () {
                resolve();
            });*/
            await modal.openPanel(panel);
            return Promise.resolve();
        });
    }

    async openConfirmModal(msg) {
        /*var bConfirm = confirm(msg);
        return Promise.resolve(bConfirm);*/

        return new Promise(function (resolve, reject) {
            var modal = app.controller.getModalController().addModal();

            var $d = $('<div/>')
                .html("<br/>" + msg + "<br/><br/>");

            $d.append($('<button/>')
                .text("No")
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                    resolve(false);
                }.bind(this)));

            $d.append(SPACE);

            $d.append($('<button/>')
                .text("Yes")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                    resolve(true);
                }.bind(this)));

            modal.open($d);
        });
    }

    async openErrorModal(error, msg) {
        return new Promise(function (resolve, reject) {
            var modal = app.controller.getModalController().addModal();

            var $d = $('<div/>')
                .html("<br/>ERROR:\n" + msg + "<br/><br/>")
                .addClass('pre');

            $d.append($('<button/>')
                .text("Send E-Mail")
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    var str = JSON.stringify(flatten(error), null, '\t'); //ReferenceError must be flattened to retrieve stack trace
                    window.location.href = 'mailto:support@pb-it.at?subject=' + encodeURIComponent(error.toString()) + '&body=' + encodeURIComponent(str);
                }.bind(this)));

            $d.append(SPACE);

            $d.append($('<button/>')
                .text("OK")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                    resolve();
                }.bind(this)));

            modal.open($d);
        });
    }

    async openDiffJsonModal(oldobj, newObj) {
        return new Promise(async function (resolve, reject) {
            var modal = app.controller.getModalController().addModal();

            var $div = $('<div/>');

            var panel = new DiffJsonPanel(oldobj, newObj);
            $div.append(await panel.render());

            $div.append($('<button/>')
                .text("Abort")
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                    resolve(false);
                }.bind(this)));

            $div.append($('<button/>')
                .text("OK")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                    resolve(true);
                }.bind(this)));

            modal.open($div);
            return Promise.resolve();
        });
    }

    async openEditJsonModal(obj) {
        return new Promise(async function (resolve, reject) {
            var modal = app.controller.getModalController().addModal();

            var $div = $('<div/>');

            var $textarea = $('<textarea/>')
                .attr('rows', 5)
                .attr('cols', 80)
                .val(JSON.stringify(obj, null, '\t'));
            $div.append($textarea);

            $div.append('<br/>');

            $div.append($('<button/>')
                .text("Abort")
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                    reject();
                }.bind(this)));

            $div.append($('<button/>')
                .text("Change")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                    resolve(JSON.parse($textarea.val()));
                }.bind(this)));

            modal.open($div);
            return Promise.resolve();
        });
    }
}