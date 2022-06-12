class Application {

    controller;

    _name = 'XCMS';
    _appVersion = '0.1.0-beta';

    constructor() {
        this.controller = new Controller(new Model(), new View());
    }

    getName() {
        return this._name;
    }

    getAppVersion() {
        return this._appVersion;
    }

    async run() {
        try {
            if (await this.controller.initController()) {
                VersionController.checkVersion();

                var state;
                try {
                    state = State.getStateFromUrl();
                } catch (err) {
                    this.controller.showError(error, "404: Not Found");
                }

                if (state)
                    await this.controller.loadState(state);
            }
        } catch (err) {
            console.log(err);
        }
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

$(document).keydown(function (e) {
    if (e.keyCode == 65 && e.ctrlKey) {
        if (document.activeElement == document.body) {
            e.preventDefault();
            app.controller.selectAll();
        }
    }
});

$(document).bind("click", function (e) {
    if (e.target == document.body) {
        e.preventDefault();
        app.controller.clearSelected();
    }
}.bind(this));