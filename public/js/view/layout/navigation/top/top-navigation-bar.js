class TopNavigationBar {

    _$topNavigationBar;

    _breadcrumb;

    _searchForm;
    _$searchForm;
    _$searchContainer;

    _$menu;

    constructor() {
        this._$topNavigationBar = $('div#topnav');

        this._breadcrumb = new Breadcrumb();
        this._$topNavigationBar.append(this._breadcrumb.initBreadcrumb());

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

    renderTopNavigationBar() {
        this._breadcrumb.renderBreadcrumb();


        var state = app.controller.getStateController().getState();
        if (state && state.getModel()) {
            if (this._$searchContainer.children().length == 0)
                this._$searchContainer.append(this._$searchForm);
            this._searchForm.renderSearchForm();
        } else
            this._$searchContainer.empty();

        this._renderMenu();
    }

    _renderMenu() {
        var conf = {
            'icon': "bars",
            'root': true
        };
        var menuItem = new MenuItem(conf);

        var subMenuGroup = new SubMenuGroup('down', 'right');

        conf = {
            'icon': "user",
            'name': "User"
        };
        subMenuGroup.addMenuItem(new MenuItem(conf));

        conf = {
            'icon': "globe",
            'name': "About"
        };
        subMenuGroup.addMenuItem(new MenuItem(conf));

        conf = {
            'icon': "envelope",
            'name': "Contact"
        };
        subMenuGroup.addMenuItem(new MenuItem(conf));

        conf = {
            'icon': "info-circle",
            'name': "Info"
        };
        subMenuGroup.addMenuItem(new MenuItem(conf));

        conf = {
            'icon': "question-circle",
            'name': "FAQ"
        };
        subMenuGroup.addMenuItem(new MenuItem(conf));

        menuItem.addSubMenuGroup(subMenuGroup);

        this._$menu.empty();
        this._$menu.append(menuItem.renderMenuItem());
    }
}