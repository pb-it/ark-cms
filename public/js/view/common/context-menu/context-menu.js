class ContextMenu {

    _entries;
    _$menu;

    constructor(entries) {
        this._entries = entries;
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
        var $li = $("<li>", { text: entry.name });
        parent.append($li);
        $li.click(debounce(function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (entry.cb) {
                this._remove();
                entry.cb(e);
            }
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

    _remove() {
        this._$menu.remove();
        $(document).unbind("mousedown.menu");
    }
}