class Modal {

    _panel;

    _$modal;
    _$close;
    _$modalContent;

    _bIsOpen;
    _closeCallback;

    constructor() {
        this._$modal = $(document.createElement('div'))
            .addClass('modal')
            .appendTo(document.body);

        this._$modalContent = $(document.createElement('div'))
            .addClass('modal-content');

        this._$close = $("<span/>")
            .addClass("close")
            .html("&times;");

        this._$modalContent.append(this._$close);
        this._$modalContent.append($('<div>')
            .addClass('clear'));

        this._$modal.append(this._$modalContent);

        this._bIsOpen = false;
    }

    setCloseCallback(cb) {
        this._closeCallback = cb;
    }

    isOpen() {
        return this._bIsOpen;
    }

    async openPanel(panel) {
        this._panel = panel;
        this.open(await panel.render());
        return Promise.resolve();
    }

    open($content) {
        this._$modalContent.append($content);

        this._$modal.click(async function (event) {
            try {
                if (event.target == this._$modal[0])
                    await this.closeOnConfirm();
            } catch (error) {
                app.controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));

        this._$close.on("click", async function () {
            return this.closeOnConfirm();
        }.bind(this));

        $content.on("dispose", function () {
            this.close();
        }.bind(this));

        this._$modal.show();
        this._bIsOpen = true;
    }

    async closeOnConfirm() {
        if (this._panel && typeof this._panel._getChanges === "function") {
            var changes = await this._panel._getChanges(false);
            if (changes) {
                app.controller.getModalController().openConfirmModal("Discard changes?", async function (confirm) {
                    if (confirm)
                        this.close();
                }.bind(this));
            } else
                this.close();
        } else
            this.close();
        return Promise.resolve();
    }

    close() {
        this._$modal.remove();
        if (this._closeCallback)
            this._closeCallback();
        this._bIsOpen = false;
    }
}