class Application {

    controller;

    _name = 'WING-CMS';

    constructor() {
        this.controller = new Controller(new Model(), new View());
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
        if (!bLoaded)
            this.controller.getView().initView();
        return Promise.resolve();
    }
}

window.onpopstate = function (e) {
    var state;
    if (e.state)
        state = new State(e.state);
    else
        state = State.getStateFromUrl();
    app.controller.loadState(state);
};

$(document).keydown(async function (e) {
    if (e.keyCode == 65 && e.ctrlKey) {
        if (document.activeElement == document.body) {
            e.preventDefault();
            await app.controller.selectAll();
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