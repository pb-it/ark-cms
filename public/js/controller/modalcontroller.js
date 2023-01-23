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
        app.controller.setLoadingState(true);
        var modal = this.addModal();

        try {
            await modal.openPanel(panel);
        } catch (error) {
            app.controller.showError(error);
        }

        app.controller.setLoadingState(false);
        return Promise.resolve(modal);
    }

    async openCrudObjectInModal(action, obj) {
        return new Promise(async function (resolve, reject) {
            var model = obj.getModel();
            var mpcc = model.getModelPanelConfigController();
            var panelConfig = mpcc.getPanelConfig(action, DetailsEnum.all);

            var panel = PanelController.createPanelForObject(obj, panelConfig);

            var res;
            panelConfig.crudCallback = async function (data) {
                res = data;
                panel.dispose();
            };

            var modal = app.controller.getModalController().addModal();
            var $modal = modal.getModalDomElement();
            $modal.on("remove", function () {
                if (res)
                    resolve(res);
                else
                    reject();
            });
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
                .on('mousedown', function (event) {
                    event.preventDefault(); // prevent focus change of underlying panel
                })
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
            app.controller.setLoadingState(true);
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
            app.controller.setLoadingState(false);
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
            $textarea.keydown(function (e) {
                e.stopPropagation(); //https://www.rockyourcode.com/assertion-failed-input-argument-is-not-an-htmlinputelement/
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

                    $textarea.val(JSON.stringify(JSON.parse($textarea.val()), null, '\t'));
                    /*if (typeof prettier === 'undefined') {
                        var buildUrl = "https://unpkg.com/prettier@2.7.1/";
                        var p1 = loadScript(buildUrl + "standalone.js");
                        //var p2 = loadScript(buildUrl + "parser-html.js");
                        var p2 = loadScript(buildUrl + "parser-babel.js");
                        await Promise.all([p1, p2]);
                    }
                    data['snippet'] = prettier.format(data['snippet'], {
                        parser: 'json', // parser: 'babel'
                        plugins: prettierPlugins,
                        tabWidth: 3
                    });*/
                }.bind(this)));

            modal.open($div);
            return Promise.resolve();
        });
    }
}