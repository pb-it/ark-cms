class Modal {

    _panel;
    _bClosing;

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
    }

    getModalDomElement() { // getComponent
        return this._$modal;
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

                try {
                    if (event.target == this._$modal[0])
                        await this._closeOnConfirm();
                } catch (error) {
                    app.controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));

        this._$close.on("click", async function (event) {
            event.stopPropagation();
            return this._closeOnConfirm();
        }.bind(this));

        $content.on("dispose", function (event) {
            if (!this._bClosing)
                this.close();
        }.bind(this));

        this._$modal.show();
    }

    async _closeOnConfirm() {
        if (this._panel && typeof this._panel._hasChanged === "function") {
            var bChanged = await this._panel._hasChanged(false);
            if (bChanged) {
                var bConfirmation = await app.controller.getModalController().openConfirmModal("Discard changes?");
                if (bConfirmation)
                    this.close();
            } else
                this.close();
        } else
            this.close();
        return Promise.resolve();
    }

    close() {
        if (this._panel && !this._bClosing) {
            this._bClosing = true;
            this._panel.dispose();
            this._panel = null;
        }
        this._$modal.remove();
    }

    async waitClosed() {
        return new Promise(async (resolve) => {
            this._$modal.on("remove", function () {
                console.log('modal closed');
                resolve();
            });
        });
    }
}