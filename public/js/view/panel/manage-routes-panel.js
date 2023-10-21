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
            var regex;
            for (var route of routes) {
                $li = $('<li/>');
                regex = route['regex'];
                if (regex.startsWith('^') && regex.endsWith('$'))
                    regex = regex.substring(1, regex.length - 1);
                if (regex.indexOf('.') == -1 && regex.indexOf('[') == -1) {
                    $li.append($('<button/>')
                        .text(regex)
                        .click(async function (event) {
                            event.preventDefault();
                            event.stopPropagation();

                            return app.getController().navigate(this);
                        }.bind(regex)));
                } else
                    $li.append(regex);
                $ul.append($li);
            }
            $div.append($ul);
        }

        return Promise.resolve($div);
    }
}