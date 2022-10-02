class NotePanel extends CrudPanel {

    _$note;

    constructor(config, obj) {
        super(config, obj);
    }

    getClass() {
        return NotePanel;
    }

    async _renderContent() {
        var $div;
        switch (this._config.details) {
            case DetailsEnum.all:
                $div = await super._renderContent();
                break;
            case DetailsEnum.title:
                $div = this._renderNote();
                break;
            case DetailsEnum.none:
        }
        return Promise.resolve($div);
    }

    _renderNote() {
        this._$note = $('<div/>')
            .addClass('note')
            //.attr("data-id", obj.getData().id)
            .dblclick(function () {
                if (!this._$note.hasClass("cellEditing")) {
                    this._edit(true);
                }
            }.bind(this))
            .after("<br />")
            .bind('_close', this._close.bind(this))
            .bind('_abort', this._abort.bind(this));
        this._edit(false);
        return this._$note;
    }

    _edit(edit) {
        var note = this._obj.getData()['note'];
        if (edit) {
            if (note === undefined || note === null)
                note = '';
            this._$note.addClass("cellEditing");
            //this.$note.html("<p name='note' contenteditable>" + encodeText(originalContent) + "</p>");
            this._$note.html("<textarea name='note'>" + note + "</textarea>"); //cols='40' rows='5'
            this._$note.children().first().focus();
        } else {
            this._$note.removeClass("cellEditing");
            var html;
            if (note)
                html = encodeText(note)
            else
                html = "";
            this._$note.html(html);
        }
    }

    async _abort() {
        return this.render();
    }

    async _close() {
        app.controller.setLoadingState(true);

        var newContent = this._$note.children().first().val();
        try {
            if (this._obj.getId()) {
                await this._obj.update({ 'note': newContent });
                this._edit(false);
            } else {
                await this._obj.create({ 'note': newContent });

                var state = new State();
                state['typeString'] = this._obj.getTypeString();
                state['id'] = this._obj.getId();
                app.controller.loadState(state, true);
            }
        } catch (e) {
            console.log(e);
        } finally {
            app.controller.setLoadingState(false);
        }

        return Promise.resolve();
    }
}

$(document).keyup(function (e) {
    var action;
    if ((e.keyCode == 83 || e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) { // strg+s(not working) or strg+enter
        action = '_close';
    } else if ((e.keyCode == 88 && e.ctrlKey) || e.keyCode == 27) { // strg+x or esc
        action = '_abort';
    }
    if (action) {
        var $note = $(e.target.parentElement);
        if ($note && $note.hasClass("note") && $note.hasClass("cellEditing")) {
            $note.trigger(action);
        }
    }
});