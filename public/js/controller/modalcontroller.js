class ModalController {

    static async changeIds(obj, property, addIds, removeIds) {
        var oldList;
        var data = obj.getData();
        if (data && data[property]) {
            oldList = data[property].map(function (item) {
                if (isNaN(item))
                    return item['id'];
                else
                    return item;
            });
        } else
            oldList = [];

        var newList;
        var changed = false;
        if (removeIds && removeIds.length > 0) {
            newList = [];
            for (var id of oldList) {
                if (removeIds.indexOf(id) == -1)
                    newList.push(id);
                else
                    changed = true;
            }
        } else
            newList = oldList;
        if (addIds && addIds.length > 0) {
            for (var newId of addIds) {
                if (newList.indexOf(newId) == -1) {
                    newList.push(newId);
                    changed = true;
                }
            }
        }
        if (changed) {
            if (obj.getId()) {
                var change = {};
                change[property] = newList;
                await obj.update(change);
            } else
                data[property] = newList;
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
        var $modal = modal.getModalDomElement();
        $modal.on("remove.stack", function () {
            this._stack.pop(); //TODO: case where not the topmost removed?
            return true;
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
        var controller = app.getController();
        var bLoading = controller.getLoadingState();
        controller.setLoadingState(true);

        var modal = this.addModal();

        try {
            await modal.openPanel(panel);
        } catch (error) {
            controller.showError(error);
        }

        controller.setLoadingState(bLoading);
        return Promise.resolve(modal);
    }

    async openCrudObjectInModal(action, obj) {
        return new Promise(async function (resolve, reject) {
            const controller = app.getController();
            const bLoading = controller.getLoadingState();
            var bError;
            var modal;
            var panel;
            try {
                controller.setLoadingState(true);

                const model = obj.getModel();
                const mpcc = model.getModelPanelConfigController();
                const panelConfig = mpcc.getPanelConfig(action, DetailsEnum.all);

                panel = PanelController.createPanelForObject(obj, panelConfig);

                var res;
                panelConfig.crudCallback = async function (data) {
                    res = data;
                    panel.dispose();
                };

                modal = controller.getModalController().addModal();
                const $modal = modal.getModalDomElement();
                $modal.on("remove", function () {
                    if (!bError) {
                        controller.setLoadingState(bLoading);
                        if (res)
                            resolve(res);
                        else
                            reject();
                    }
                });
                await modal.openPanel(panel);
                controller.setLoadingState(false);
            } catch (error) {
                bError = true;
                if (modal && (!panel || !panel.isRendered()))
                    modal.close();
                controller.setLoadingState(false);
                reject(error);
            }
            return Promise.resolve();
        });
    }

    async openConfirmModal(msg) {
        /*var bConfirm = confirm(msg);
        return Promise.resolve(bConfirm);*/

        return new Promise(function (resolve, reject) {
            const controller = app.getController();
            const modal = controller.getModalController().addModal();
            var bConfirm;
            modal.setCloseCallback(function () {
                resolve(bConfirm);
            });
            const panel = new Panel();

            const $d = $('<div/>')
                .html(msg + "<br/><br/>");

            $d.append($('<button/>')
                .text("No")
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                }.bind(this)));

            $d.append($('<button/>')
                .text("Yes")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    bConfirm = true;
                    modal.close();
                }.bind(this)));

            panel.setContent($d);
            modal.openPanel(panel);
        });
    }

    async openErrorModal(error, msg) {
        return new Promise(function (resolve, reject) {
            const controller = app.getController();
            const modal = controller.getModalController().addModal();
            modal.setCloseCallback(function () {
                resolve();
            });
            const panel = new Panel();

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

            $d.append($('<button/>')
                .text("OK")
                .css({ 'float': 'right' })
                .on('mousedown', function (event) {
                    event.preventDefault(); // prevent focus change of underlying panel
                })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    modal.close();
                }.bind(this)));

            panel.setContent($d);
            modal.openPanel(panel);
        });
    }

    async openDiffJsonModal(oldobj, newObj) {
        return new Promise(async function (resolve, reject) {
            const controller = app.getController();
            controller.setLoadingState(true);
            const modal = controller.getModalController().addModal();

            const panel = new Panel();
            const $div = $('<div/>');

            const diff = new DiffJsonPanel(oldobj, newObj);
            $div.append(await diff.render());

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

            panel.setContent($div);
            modal.openPanel(panel);
            controller.setLoadingState(false);
            return Promise.resolve();
        });
    }

    async openEditJsonModal(obj) {
        return new Promise(async function (resolve, reject) {
            const controller = app.getController();
            const modal = controller.getModalController().addModal();

            const $div = $('<div/>');

            const $textarea = $('<textarea/>')
                .attr('rows', 5)
                .attr('cols', 80)
                .val(JSON.stringify(obj, null, '\t'));
            $textarea.keydown(function (e) {
                if (e.keyCode == 9) { // TAB
                    e.preventDefault();
                    //TODO: ident selection
                    var input = this[0];
                    if (input.selectionStart != undefined && input.selectionStart >= '0') {
                        var cursorPosition = input.selectionStart;
                        var txt = this.val();
                        this.val(txt.slice(0, cursorPosition) + '\t' + txt.slice(cursorPosition));
                        cursorPosition++;
                        input.selectionStart = cursorPosition;
                        input.selectionEnd = cursorPosition;
                        input.focus();
                    }
                    return false;
                } else if (e.keyCode == 13) { // ENTER
                    e.stopPropagation(); //https://www.rockyourcode.com/assertion-failed-input-argument-is-not-an-htmlinputelement/
                }
            }.bind($textarea));
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

            $div.append($('<button/>')
                .text("Format")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    var text = await formatCode($textarea.val(), 'json');
                    $textarea.val(text);
                    return Promise.resolve();
                }.bind(this)));

            modal.open($div);
            return Promise.resolve();
        });
    }
}