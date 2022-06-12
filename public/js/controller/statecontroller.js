class StateController {

    _state;

    constructor() {

    }

    getState() {
        return this._state;
    }

    setState(state, push, replace) {
        this._state = state;
        var url = State.getUrlFromState(state);
        var title = app.getName();
        if (url && url !== "/") {
            title += " - " + url;
        }
        if (push) {
            var s;
            if (state['panelConfig']) {
                s = { ...state };
                s['panelConfig'] = { ...state['panelConfig'] };
                delete s['panelConfig']['_model'];
                delete s['panelConfig']['_panelClass'];
            } else
                s = state;
            window.history.pushState(s, null, url);
        } else if (replace) {
            var s;
            if (state['panelConfig']) {
                s = { ...state };
                s['panelConfig'] = { ...state['panelConfig'] };
                delete s['panelConfig']['_model'];
                delete s['panelConfig']['_panelClass'];
            } else
                s = state;
            window.history.replaceState(s, null, url);
        }
        document.title = title;
    }
}