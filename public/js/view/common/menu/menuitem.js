class MenuItem {

    _conf;
    _$div;

    _bActive;
    _subMenuGroup;

    constructor(conf) {
        this._conf = conf;
        this._$div = $('<div/>');
        if (conf.style)
            this._$div.addClass(conf.style);
        else
            this._$div.addClass('default-style');
        this._bActive = false;
    }

    addSubMenuGroup(subMenuGroup) {
        this._subMenuGroup = subMenuGroup;
    }

    renderMenuItem() {
        var $div = this._$div;
        $div.empty();

        $div.addClass('menuitem');

        if (this._conf) {
            if (this._conf.root && this._conf.root == true)
                $div.addClass('root');

            if (this._conf.tooltip)
                $div.prop('title', this._conf.tooltip);

            if (this._conf.icon)
                $div.append(new Icon(this._conf.icon).renderIcon());

            if (this._conf.name) {
                if (this._conf.icon)
                    $div.append(SPACE + SPACE);

                $div.append(this._conf.name);
                if (this._subMenuGroup) {
                    $div.append(SPACE + SPACE);
                    if (this._subMenuGroup.getDirection() === 'down')
                        $div.append(new Icon("caret-down").renderIcon());
                    else
                        $div.append(new Icon("caret-right").renderIcon());
                }
            }

            if (this._conf.click) {
                $div.click(function (event) {
                    this._conf.click(event, this)
                }.bind(this));
            } else if (this._conf.root && this._conf.root == true && this._subMenuGroup) {
                $div.click(function (event) {
                    this._subMenuGroup.toggleSubMenuGroup();
                }.bind(this));

                window.addEventListener('click.menuitem', function (event) {
                    if (event.target != this._$div[0] && event.target.parentNode != this._$div[0] && this._subMenuGroup) {
                        this._subMenuGroup.hideSubMenuGroup();
                    }
                }.bind(this));
            }
        }

        if (this._subMenuGroup) {
            if (this._subMenuGroup.getAlign())
                $div.append(this._subMenuGroup.renderMenu());
        }

        return $div;
    }

    addNotification(text) {
        var $bubble = $('<span/>').addClass('bubble').text(text);
        this._$div.append($bubble);
    }

    getName() {
        var res;
        if (this._conf.name)
            res = this._conf.name;
        return res;
    }

    isActive() {
        return this._bActive;
    }

    setActive() {
        this._bActive = true;
        this._$div.addClass('active');
    }

    setInactive() {
        this._bActive = false;
        this._$div.removeClass('active');
    }
}