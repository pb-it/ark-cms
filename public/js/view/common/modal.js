class Modal {

    _panel;
    _closeCallback;
    _selectionController;

    _$modal;
    _$close;
    _$modalContent;

    constructor() {
        this._$modal = $('<div/>')
            .addClass('modal')
            .appendTo(document.body);

        this._$modalContent = $('<div/>')
            .addClass('modal-content');

        this._$close = $("<span/>")
            .addClass("close")
            .html("&times;");

        this._$modalContent.append(this._$close);
        this._$modalContent.append($('<div/>')
            .addClass('clear'));

        this._$modal.append(this._$modalContent);

        this._selectionController = new SelectionController();
    }

    setCloseCallback(cb) {
        this._closeCallback = cb;
    }

    getModalDomElement() { // getComponent
        return this._$modal;
    }

    getSelectionController() {
        return this._selectionController;
    }

    async openPanel(panel) {
        this._panel = panel;
        this.open(await panel.render());
        return Promise.resolve();
    }

    getPanel() {
        return this._panel;
    }

    open($content) {
        this._$modalContent.append($content);

        this._$modal
            .on('mousedown', function (event) {
                if (this._$modal && event.target == this._$modal[0])
                    event.preventDefault(); // prevent focus change of underlying panel
            })
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                try {
                    if (event.target == this._$modal[0])
                        await this._closeOnConfirm();
                    else {
                        const sc = controller.getSelectionController();
                        if (sc)
                            await sc.clearSelected();
                    }
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));

        this._$close.on("click", async function (event) {
            event.stopPropagation();
            return this._closeOnConfirm();
        }.bind(this));

        $content.on("dispose", function (event) {
            this.close(true);
        }.bind(this));

        this._$modal.show();
    }

    async _closeOnConfirm() {
        if (this._panel && typeof this._panel._hasChanged === "function") {
            const controller = app.getController();
            try {
                const bChanged = await this._panel._hasChanged(false);
                if (bChanged) {
                    var bConfirmation = await controller.getModalController().openConfirmModal("Discard changes?");
                    if (bConfirmation)
                        this.close();
                } else
                    this.close();
            } catch (error) {
                await controller.showError(error);
                var bConfirmation = await controller.getModalController().openConfirmModal("Discard changes?");
                if (bConfirmation)
                    this.close();
            }
        } else
            this.close();
        return Promise.resolve();
    }

    close(bDisposed) {
        if (this._panel) {
            if (this._$modal && !bDisposed)
                this._panel.dispose();
            this._panel = null;
        }
        if (this._$modal) {
            this._$modal.remove();
            this._$modal = null;
        }
        if (this._closeCallback)
            this._closeCallback();
    }

    async waitClosed() {
        if (!this._$modal)
            return Promise.resolve();
        else {
            return new Promise(async (resolve) => {
                this._$modal.on("remove", function () {
                    console.log('modal closed');
                    resolve();
                });
            });
        }
    }
}