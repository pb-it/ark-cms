class View {

    _sideNavigationBar;
    _topNavigationBar;
    _canvas;

    _selectStatePanelClass;
    _crudStatePanelClass;
    _selectFilterPanelClass;

    constructor() {
        this._sideNavigationBar = new SideNavigationBar();
        this._topNavigationBar = new TopNavigationBar();

        this._selectStatePanelClass = SelectStatePanel;
        this._crudStatePanelClass = CrudStatePanel;
        this._selectFilterPanelClass = SelectFilterPanel;
        this._createFilterPanelClass = CreateFilterPanel;
    }

    initView() {
        $("body").scrollTop(0);

        this._sideNavigationBar.renderSideNavigationBar();
        this._topNavigationBar.renderTopNavigationBar();

        this._canvas = new Canvas();
        this._canvas.init();
    }

    getSideNavigationBar() {
        return this._sideNavigationBar;
    }

    getTopNavigationBar() {
        return this._topNavigationBar;
    }

    getCanvas() {
        return this._canvas;
    }

    getSelectStatePanelClass() {
        return this._selectStatePanelClass;
    }

    setSelectStatePanelClass(clazz) {
        this._selectStatePanelClass = clazz;
    }

    getCrudStatePanelClass() {
        return this._crudStatePanelClass;
    }

    setCrudStatePanelClass(clazz) {
        this._crudStatePanelClass = clazz;
    }

    getSelectFilterPanelClass() {
        return this._selectFilterPanelClass;
    }

    setSelectFilterPanelClass(clazz) {
        this._selectFilterPanelClass = clazz;
    }

    getCreateFilterPanelClass() {
        return this._createFilterPanelClass;
    }

    setCreateFilterPanelClass(clazz) {
        this._createFilterPanelClass = clazz;
    }
}