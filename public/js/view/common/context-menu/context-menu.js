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

    renderMenu(x, y) {
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
            this._renderEntry(this._$menu, this._entries[i]);
        }

        $(document).bind("mousedown.menu", function (e) {
            var parents = $(e.target).parents("ul.contextmenu");
            if (!parents || parents.length == 0) {
                this._remove();
            };
        }.bind(this));
    }

    _renderEntry(parent, entry) {
        if (entry.isVisible(this._target)) {
            var $li = $("<li>", { text: entry.getName() });
            parent.append($li);
            $li.click(debounce(function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (entry.click(e, this._target))
                    this._remove();
            }.bind(this), 250, true));
            if (entry.entries) {
                var $d = $("<div/>")
                var $menu = $("<ul>").addClass('contextmenu');
                for (var e of entry.entries) {
                    this._renderEntry($menu, e);
                }
                $d.append($menu);
                $li.append($d);
            }
        }
    }

    _remove() {
        this._$menu.remove();
        $(document).unbind("mousedown.menu");
    }
}