class ManageRoutesPanel extends Panel {

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>');

        var routes = app.getController().getRouteController().getAllRoutes();
        if (routes && routes.length > 0) {
            var $ul = $('<ul/>');
            var $li;
            for (var route of routes) {
                $li = $('<li/>');
                $li.append(route['regex']);
                $ul.append($li);
            }
            $div.append($ul);
        }

        return Promise.resolve($div);
    }
}