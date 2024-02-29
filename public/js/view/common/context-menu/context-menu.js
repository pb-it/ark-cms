class ContextMenu {

    _target;
    _entries;

    _$menu;

    constructor(target) {
        this._target = target;
    }

    getTarget() {
        return this._target;
    }

    setEntries(entries) {
        this._entries = entries;
    }

    getEntries() {
        return this._entries;
    }

    async renderContextMenu(x, y) {
        if (this._$menu)
            this._remove();
        this._$menu = $("<ul>")
            .addClass('contextmenu')
            .css({
                top: y + "px",
                left: x + "px"
            })
            .appendTo($("body"));

        for (var i = 0; i < this._entries.length; i++) {
            await this._renderEntry(this._$menu, this._entries[i]);
        }

        $(document).bind("mousedown.menu", function (e) {
            var parents = $(e.target).parents("ul.contextmenu");
            if (!parents || parents.length == 0) {
                this._remove();
            };
        }.bind(this));
        return Promise.resolve();
    }

    async _renderEntry(parent, entry) {
        if (await entry.isVisible(this._target)) {
            const bEnabled = await entry.isEnabled();
            const $li = $('<li/>');
            const style = { 'display': 'inline-block', 'width': '100%' };
            if (!bEnabled) {
                style['font-style'] = 'italic';
                style['color'] = 'gray';
            }
            const $entry = $('<div/>').css(style);
            const icon = entry.getIcon();
            var $icon;
            if (icon)
                $icon = icon.renderIcon();
            else
                $icon = $('<i/>').css({ 'width': '16px' });
            $icon.css({ 'display': 'inline-block', 'padding-right': '8px' });
            $entry.append($icon);
            //$entry.append($('<span/>', { text: entry.getName() }).css({ 'float': 'left' }));
            $entry.append(entry.getName());
            if (entry.entries)
                $icon = new Icon('angle-right').renderIcon();
            else
                $icon = null; //$icon = $('<i/>').css({ 'width': '8px' });
            if ($icon) {
                $icon.css({ 'float': 'right', 'padding-left': '8px' });
                $entry.append($icon);
            }
            const shortcut = entry.getShortcut();
            if (shortcut)
                $entry.prop('title', shortcut);
            $li.append($entry);
            if (bEnabled) {
                $li.click(debounce(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (entry.click(e, this._target))
                        this._remove();
                }.bind(this), 250, true));
                if (entry.entries) {
                    var $d = $('<div/>').addClass('contextmenu');
                    var $menu = $('<ul/>').addClass('contextmenu');
                    for (var e of entry.entries) {
                        this._renderEntry($menu, e);
                    }
                    $d.append($menu);
                    $li.append($d);
                }
            }
            parent.append($li);
        }
        return Promise.resolve();
    }

    _remove() {
        this._$menu.remove();
        $(document).unbind("mousedown.menu");
    }
}