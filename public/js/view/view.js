class View {

    _sideNavigationBar;
    _topNavigationBar;
    _canvas;

    constructor() {
        this._sideNavigationBar = new SideNavigationBar();
        this._topNavigationBar = new TopNavigationBar();
    }

    init() {
        $("body").scrollTop(0);

        this._sideNavigationBar.renderSideNavigationBar();
        this._topNavigationBar.renderTopNavigationBar();

        this._canvas = new Canvas();
        this._canvas.init();
    }

    getSideNavigationBar() {
        return this._sideNavigationBar;
    }

    getCanvas() {
        return this._canvas;
    }
}