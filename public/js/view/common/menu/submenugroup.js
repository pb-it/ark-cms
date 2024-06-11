class SubMenuGroup extends MenuVis {

    _direction;
    _align;

    constructor(direction, align) {
        super();

        if (direction)
            this._direction = direction;

        if (align)
            this._align = align;

        this._$div.addClass('submenugroup');

        if (direction && align) {
            if (direction === 'down') {
                if (align === 'right')
                    this._$div.addClass('downalignright');
                else if (align === 'left')
                    this._$div.addClass('downalignleft');
            } else if (direction === 'left') {
                if (align === 'top')
                    this._$div.addClass('leftaligntop');
            } else if (direction === 'right') {
                if (align === 'top')
                    this._$div.addClass('rightaligntop');
            }
        } else
            this._$div.addClass('float');
    }

    getDirection() {
        return this._direction;
    }

    getAlign() {
        return this._align;
    }

    toggleSubMenuGroup() {
        this._$div[0].classList.toggle('show');
    }

    showSubMenuGroup() {
        this._$div.addClass('show');
    }

    hideSubMenuGroup() {
        this._$div.removeClass('show');
    }
}