class CmdPanel extends Panel {

    _form;
    _observer;

    constructor() {
        super();
    }

    async _init() {
        await super._init();

        if (typeof AlertBox === 'undefined')
            await loadScript('/public/js/view/common/alert-box.js');

        const onMutationsObserved = function (mutations) {
            var bAdded;
            for (var mutation of mutations) {
                if (mutation.addedNodes.length) {
                    for (var element of mutation.addedNodes) {
                        if (element === this._$panel[0]) {
                            bAdded = true;
                            break;
                        }
                    }
                }
                if (bAdded)
                    break;
            }
            if (bAdded) {
                this._form.getFormEntry('cmd').getInput().focus();
                if (this._observer) {
                    this._observer.disconnect();
                    this._observer = null;
                }
            }
        }.bind(this);
        const target = $('body')[0];
        const config = { childList: true, subtree: true };
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        this._observer = new MutationObserver(onMutationsObserved);
        this._observer.observe(target, config);

        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        var msg = `** Work in Progress **

The instruction set, syntax and semantic are subject to change, including but not limited to breaking changes without prior notice!`;
        $div.append(AlertBox.renderAlertBox(AlertEnum.WARNING, msg));

        const skeleton = [{ id: 'cmd', name: 'cmd', dataType: 'string' }];
        const data = {};
        this._form = new Form(skeleton, data);
        this._$form = await this._form.renderForm();
        this._$form.on('submit', async function () {
            const controller = app.getController();
            try {
                const fdata = await this._form.readForm();
                const cmd = fdata['cmd'];
                if (cmd === 'exit')
                    this.dispose();
                else if (cmd === 'help' || cmd === '?') {
                    const mc = app.getController().getModalController();
                    await mc.openPanelInModal(new HelpPanel());
                } else if (cmd === 'reload') {
                    controller.reloadApplication();
                } else if (cmd.startsWith('/')) {
                    await controller.navigate(cmd);
                } else if (cmd.startsWith('cms:')) {
                    var parts = cmd.split(/\s+/);
                    if (parts.length === 1) {
                        parts = parts[0].split(':');
                        if (parts.length === 2 && parts[1] === 'restart') {
                            var url = window.location.origin + '/cms/restart';
                            var win = window.open(url, '_blank');
                            win.focus();
                        }
                    }
                } else if (cmd.startsWith('api:')) {
                    var parts = cmd.split(/\s+/);
                    if (parts.length === 1) {
                        parts = parts[0].split(':');
                        if (parts.length === 2 && parts[1] === 'restart') {
                            /*const ac = controller.getApiController();
                            await ac.restartApi();*/
                            var url = controller.getApiController().getApiOrigin() + '/sys/restart';
                            var win = window.open(url, '_blank');
                            win.focus();
                        }
                    }
                } else if (cmd.startsWith('model:')) {
                    var parts = cmd.split(/\s+/);
                    if (parts.length === 1) {
                        parts = parts[0].split(':');
                        if (parts.length === 2) {
                            await controller.navigate('/data/' + parts[1]);
                        }
                    }
                } else
                    alert('Unknown command \'' + cmd + '\'');
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));
        $div.append(this._$form);
        //this._form.getFormEntry('cmd').getInput().prop('autofocus', true);

        const $run = $('<button>')
            .text('Run')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                this._$form.submit();

                return Promise.resolve();
            }.bind(this));
        $div.append($run);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}