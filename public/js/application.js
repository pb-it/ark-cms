class Application {

    controller;

    _name = 'WING-CMS';

    constructor() {
        this.controller = new Controller(new Model(), new View());

        window.addEventListener('load', async () => {
            try {
                //await loadScript('/public/js/test.js');
            } catch (error) {
                alert(error);
            }
            return Promise.resolve();
        });
    }

    getName() {
        return this._name;
    }

    getController() {
        return this.controller;
    }

    async run() {
        var bLoaded = false;
        try {
            if (await this.controller.initController()) {
                var bError = false;
                var state;
                try {
                    state = State.getStateFromUrl();
                } catch (error) {
                    bError = true;
                    this.controller.showError(error, "404: Not Found");
                }

                if (state) {
                    await this.controller.loadState(state);
                    bLoaded = true;
                } else if (!bError) {
                    this.controller.showError(null, "404: Not Found");
                }
            }
        } catch (err) {
            console.log(err);
        }
        if (!bLoaded) {
            this.controller.setLoadingState(false);
            this.controller.getView().initView();
        }
        return Promise.resolve();
    }
}

window.onpopstate = async function (e) {
    var bError = false;
    var controller = app.getController();
    if (!controller.hasConnection()) {
        if (!await controller.initController())
            bError = true;
    }

    if (bError) {
        controller.setLoadingState(false);
        controller.getView().initView();
    } else {
        var state;
        if (e.state)
            state = new State(e.state);
        else
            state = State.getStateFromUrl();
        controller.loadState(state);
    }
};

$(document).keydown(async function (e) { // window.addEventListener('keydown', function() { ... });
    if (app) {
        var controller = app.getController();
        if (controller) {
            if (e.ctrlKey) {
                if (e.keyCode == 82) { // STRG + R
                    e.preventDefault();
                    e.stopPropagation();

                    try {
                        await controller.getDataService().getCache().deleteModelCache();
                        var modal;
                        var mc = controller.getModalController();
                        var modals = mc.getModals();
                        if (modals) {
                            var length = modals.length;
                            if (length > 0)
                                modal = modals[length - 1];
                        }
                        if (modal)
                            await modal.getPanel().render();
                        else
                            await controller.reloadState(true);
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                } else if (e.keyCode == 65) { // STRG + A
                    if (document.activeElement == document.body) {
                        e.preventDefault();
                        e.stopPropagation();

                        await controller.selectAll();
                    }
                }
            } else {
                if (e.keyCode == 27) { // ESC
                    if (controller.getLoadingState()) {
                        if (confirm('Abort loading?'))
                            controller.setLoadingState(false);
                    }
                } // else if (e.keyCode === 116) { // F5
            }
        }
    }
    return Promise.resolve();
});

$(document).bind("click", async function (e) {
    if (e.target == document.body) {
        e.preventDefault();
        await app.controller.clearSelected();
    }
    return Promise.resolve();
}.bind(this));