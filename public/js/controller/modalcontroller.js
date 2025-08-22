class ModalController {

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
            if (arguments[0].currentTarget == this._stack[this._stack.length - 1]._$modal[0]) //TODO: case where not the topmost removed?
                this._stack.pop();
            return true;
        }.bind(this));
        this._stack.push(modal);
        return modal;
    }

    closeAll() {
        var modal;
        for (var i = this._stack.length - 1; i >= 0; i--) {
            modal = this._stack[i]; // remove/pop will be done in remove action
            modal.close();
        }
    }

    async openPanelInModal(panel) {
        const controller = app.getController();
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

            var $d = $('<div/>');
            $d.append("<h2>ERROR</h2>");
            $d.append($('<div/>')
                .html(msg)
                .addClass('pre'));
            $d.append("<br/><br/>");
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
            const $div = $('<div/>')
                .css({ 'padding': '10' });

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

            const panel = new Panel();
            const $div = $('<div/>')
                .css({ 'padding': '10' });

            const $textarea = $('<textarea/>')
                .attr('rows', 20)
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

                    try {
                        const obj = JSON.parse($textarea.val());
                        modal.close();
                        resolve(obj);
                    } catch (error) {
                        app.getController().showError(error);
                    }
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

            panel.setContent($div);
            modal.openPanel(panel);
            return Promise.resolve();
        });
    }
}