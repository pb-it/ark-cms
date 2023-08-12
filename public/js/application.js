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

$(document).bind("click", async function (e) {
    if (e.target == document.body) {
        e.preventDefault();
        await app.controller.clearSelected();
    }
    return Promise.resolve();
}.bind(this));