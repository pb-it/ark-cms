class DashPanel extends Panel {

    constructor(config) {
        config['float'] = 'left';
        config['css'] = {
            'margin': '5px'
        }
        super(config);
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({
                'width': '180px',
                'height': '180px',
                'background': '#e9e9e9',
                'margin': '10px'
            });

        $div.append(this._renderMenu(this._config['menu']));

        var icon;
        var $icon;
        if (this._config['icon'])
            icon = this._config['icon'];
        else
            icon = new Icon('rectangle-xmark');
        if (icon)
            $icon = icon.renderIcon();
        else
            $icon = $('<i/>').css({ 'width': '16px' });
        $icon.css({ 'display': 'inline-block', 'padding': '60px 0px 15px 65px', 'font-size': '50' });
        $div.append($icon);

        var $p = $('<p/>')
            .html(encodeText(this._config['name']))
            .css({
                'margin': '0px',
                'overflow': 'hidden',
                'white-space': 'nowrap',
                'text-overflow': 'ellipsis',
                'text-align': 'center',
                'font-weight': 'bold'
            });
        var $name = $('<div/>').append($p);
        $div.append($name);

        if (this._config['click']) {
            this._$panel.click(async function (event) {
                const controller = app.getController();
                try {
                    await this._config['click'](event);
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        }

        if (this._config['dblclick']) {
            this._$panel.on('dblclick', async function (event) {
                const controller = app.getController();
                try {
                    await this._config['dblclick'](event);
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        }

        /*if (this._config['menu']) {
            var entries = [];
            var entry;
            for (let item of this._config['menu']) {
                entry = new ContextMenuEntry(item['name'], async function (event, target) {
                    event.stopPropagation();

                    try {
                        await item['click']();
                    } catch (error) {
                        app.getController().showError(error);
                    }
                    return Promise.resolve();
                });
                if (item['icon'])
                    entry.setIcon(new Icon(item['icon']));
                entries.push(entry);
            }
            const contextMenu = new ContextMenu(this);
            contextMenu.setEntries(entries);

            this._$panel.on('contextmenu', async function (event) {
                event.preventDefault();
                event.stopPropagation();

                const controller = app.getController();
                try {
                    controller.setLoadingState(true, false);
                    await contextMenu.renderContextMenu(event.pageX, event.pageY);
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        }*/

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    _renderMenu(menu) {
        var conf = {
            'icon': new Icon('ellipsis'), // ellipsis-vertical
            'root': true
        };
        const menuItem = new MenuItem(conf);

        const menuItems = [];

        if (menu && menu.length > 0) {
            for (let item of menu) {
                conf = {
                    'name': item['name'],
                    'icon': item['icon'],
                    'click': async function (event, target) {
                        //event.stopPropagation();

                        try {
                            await item['click']();
                        } catch (error) {
                            app.getController().showError(error);
                        }
                        return Promise.resolve();
                    }
                }
                menuItems.push(new MenuItem(conf));
            }
        }

        conf = {
            'direction': 'down',
            'alignment': 'left'
        }
        const subMenu = new Menu(conf);
        subMenu.setItems(menuItems);

        menuItem.setSubMenu(subMenu);

        const $div = new MenuItemVis(menuItem).renderMenuItem();
        $div.css({
            'width': 18,
            'position': 'absolute',
            'top': '5px',
            'right': '5px',
            'z-index': 1,
            'padding': '12px',
            'background-color': '#d7d7d7'
        });

        return $div;
    }
}