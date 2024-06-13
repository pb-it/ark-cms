class NavigationPanel extends Panel {

    _form;
    _$form;

    constructor() {
        super();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const skeleton = [{ id: 'path', name: 'path', dataType: 'string' }];
        const data = { 'path': window.location.pathname + window.location.search + window.location.hash };
        this._form = new Form(skeleton, data);
        this._$form = await this._form.renderForm();
        this._$form.on('submit', async function () {
            const controller = app.getController();
            try {
                const fdata = await this._form.readForm();
                await controller.navigate(fdata['path']);
                this.dispose();
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));
        $div.append(this._$form);

        const $load = $('<button>')
            .text('Load')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                this._$form.submit();

                return Promise.resolve();
            }.bind(this));
        $div.append($load);

        $div.append('<br>');

        $div.append('<h3>Sitemap</h3>');

        const routes = app.getController().getRouteController().getAllRoutes();
        if (routes && routes.length > 0) {
            var $ul = $('<ul/>');
            var $li;
            for (let route of routes) {
                $li = $('<li/>');
                let regex = route['regex'];
                if (regex.startsWith('^') && regex.endsWith('$'))
                    regex = regex.substring(1, regex.length - 1);
                $li.append($('<button/>')
                    .text(regex)
                    .click(regex, async function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        try {
                            this._form.setFormData({ 'path': regex });
                            await this._form.renderForm();
                        } catch (error) {
                            controller.showError(error);
                        }

                        return Promise.resolve();
                    }.bind(this)));
                $ul.append($li);
            }
            $div.append($ul);
        }

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}