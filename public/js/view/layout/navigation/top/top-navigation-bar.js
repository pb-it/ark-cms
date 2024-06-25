class TopNavigationBar {

    _$topNavigationBar;

    _breadcrumb;
    _$breadcrumb;

    _searchForm;
    _$searchForm;
    _$searchContainer;

    _$menu;

    constructor() {
        this._$topNavigationBar = $('div#topnav');
        this._$topNavigationBar.empty();

        this._breadcrumb = new Breadcrumb();
        this._$breadcrumb = this._breadcrumb.initBreadcrumb();
        this._$topNavigationBar.append(this._$breadcrumb);

        this._$menu = $('<div/>')
            .css({ 'float': 'right' });
        this._$topNavigationBar.append(this._$menu);

        this._searchForm = new SearchForm();
        this._$searchForm = this._searchForm.initSearchForm();

        this._$searchContainer = $('<div/>')
            .prop('id', 'searchContainer');
        //this._$searchContainer.css({ 'float': 'right' });

        this._$topNavigationBar.append(this._$searchContainer);
    }

    getSearchForm() {
        return this._searchForm;
    }

    renderTopNavigationBar() {
        const controller = app.getController();
        if (controller && controller.hasConnection()) {
            const sc = controller.getStateController();
            if (sc) {
                this._breadcrumb.renderBreadcrumb();

                const state = sc.getState();
                if (state && state.getModel() && (!state['action'] || state['action'] === ActionEnum.read)) {
                    if (this._$searchContainer.children().length == 0)
                        this._$searchContainer.append(this._$searchForm);
                    this._searchForm.renderSearchForm();
                } else {
                    this._$searchForm.detach();
                    this._$searchContainer.empty();
                }
            }
        } else {
            this._$breadcrumb.empty();
            this._$searchContainer.empty();
        }

        this._renderMenu();
    }

    _renderMenu() {
        var conf = {
            'icon': new Icon('bars'),
            'root': true
        };
        const rootMenuItem = new MenuItem(conf);

        const menuItems = [];

        conf = {
            'icon': new Icon('user'),
            'name': 'User',
            'click': async function (event, item) {
                event.stopPropagation();
                return app.getController().getAuthController().logout();
            }.bind(this)
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('globe'),
            'name': 'About'
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('envelope'),
            'name': 'Contact'
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('info-circle'),
            'name': 'Info'
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'icon': new Icon('question-circle'),
            'name': 'FAQ'
        };
        menuItems.push(new MenuItem(conf));

        conf = {
            'direction': 'down',
            'alignment': 'right'
        }
        const subMenu = new Menu(conf);
        subMenu.setItems(menuItems);

        rootMenuItem.setSubMenu(subMenu);

        this._$menu.empty();
        this._$menu.append(new MenuItemVis(rootMenuItem).renderMenuItem());
    }
}