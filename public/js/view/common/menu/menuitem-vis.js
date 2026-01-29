class MenuItemVis {

    _menuItem;

    _$div;

    constructor(menuItem) {
        this._menuItem = menuItem;
        this._$div = $('<div/>');
        const conf = this._menuItem.getMenuItemConfig();
        if (conf['style'])
            this._$div.addClass(conf['style']);
        else
            this._$div.addClass('default-style');
    }

    getMenuItem() {
        return this._menuItem;
    }

    renderMenuItem() {
        const $div = this._$div;
        $div.empty();
        $div.unbind('click');

        $div.addClass('menuitem');
        if (this._menuItem.isActive())
            $div.addClass('active');
        else
            $div.removeClass('active');

        const conf = this._menuItem.getMenuItemConfig();
        if (conf) {
            var subMenuGroup;
            const subMenu = this._menuItem.getSubMenu();
            if (subMenu) {
                var tmp = subMenu.getMenuConfig();
                if (tmp) {
                    const items = subMenu.getItems();
                    if (items && items.length > 0) {
                        subMenuGroup = new SubMenuGroup(tmp['direction'], tmp['alignment']);
                        for (var item of items) {
                            subMenuGroup.addMenuItem(item);
                        }
                    }
                }
            }

            if (conf['root'] && conf['root'] == true)
                $div.addClass('root');

            if (conf['tooltip'])
                $div.prop('title', conf['tooltip']);

            var $icon;
            if (conf['icon']) {
                $icon = conf['icon'].renderIcon();
                $div.append($icon);
            }

            if (conf['name']) {
                if ($icon)
                    $icon.css({
                        'min-width': '16px',
                        'margin-right': '8px',
                        'text-align': 'center'
                    });

                $div.append(conf['name']);
                if (subMenu) {
                    $div.append(SPACE + SPACE);
                    if (subMenuGroup && subMenuGroup.getDirection() === 'down')
                        $div.append(new Icon("caret-down").renderIcon());
                    else
                        $div.append(new Icon("caret-right").renderIcon());
                }
            }

            if (conf.hasOwnProperty('click') && typeof conf['click'] === 'function') {
                $div.click(function (event) {
                    conf.click(event, this)
                }.bind(this));
            } else if (conf['root'] && conf['root'] == true && subMenuGroup) {
                $div.click(function (event) {
                    subMenuGroup.toggleSubMenuGroup();
                }.bind(this));

                window.addEventListener('click', function (event) {
                    if (event.target != this._$div[0] && event.target.parentNode != this._$div[0] && subMenuGroup) {
                        subMenuGroup.hideSubMenuGroup();
                    }
                }.bind(this));
            } else {
                $div.addClass('unknown');
                $div.click(function (event) {
                    event.stopPropagation();
                }.bind(this));
            }

            const notification = this._menuItem.getNotification();
            if (notification)
                this.addNotification(notification);

            if (subMenuGroup)
                $div.append(subMenuGroup.renderMenu());
        }
        return $div;
    }

    addNotification(text, top) {
        const $bubble = $('<span/>').addClass('bubble').text(text);
        if (top)
            $bubble.addClass('top');
        this._$div.append($bubble);
    }

    getName() {
        return this._menuItem.getName();
    }

    isActive() {
        return this._menuItem.isActive();
    }

    setActive() {
        this._menuItem.setActive();
        this._$div.addClass('active');
    }

    setInactive() {
        this._menuItem.setInactive();
        this._$div.removeClass('active');
    }
}