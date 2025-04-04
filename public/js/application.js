class Application {

    controller;

    _name = 'ARK-CMS';

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
        if (!bLoaded) {
            this.controller.setLoadingState(false);
            this.controller.getView().initView();
        }
        return Promise.resolve();
    }
}

function goodbye(e) {
    const controller = app.getController();
    const cc = controller.getConfigController();
    if (controller.hasConnection() && cc && cc.confirmOnLeave()) {
        if (!e)
            e = window.event;
        e.cancelBubble = true;
        e.returnValue = 'Are you sure you want to leave?';
        if (e.stopPropagation) {
            e.stopPropagation();
            e.preventDefault();
        }
    }
}

window.onload = function () {
};

window.onbeforeunload = goodbye;

$(window).on('beforeunload', function (e) {
    //e.preventDefault();
    //$(window).trigger(...);
    console.log('beforeunload');
});

$(window).on('popstate', async function (e) {
    var bError = false;
    const controller = app.getController();
    if (!controller.hasConnection()) {
        if (!await controller.initController())
            bError = true;
    }

    if (bError) {
        controller.setLoadingState(false);
        controller.getView().initView();
    } else {
        var state;
        if (e.originalEvent.state)
            state = new State(e.originalEvent.state);
        else
            state = State.getStateFromUrl();
        controller.loadState(state);
    }
    return Promise.resolve();
});