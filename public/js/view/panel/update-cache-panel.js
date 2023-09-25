class UpdateCachePanel extends Panel {

    _changes;

    constructor(changes) {
        super();

        this._changes = changes;
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append("Your cache is out of date. Do you want to update it now?<br/><br/>");

        var $skip = $('<button>')
            .text('Skip')
            .click(async function (event) {
                event.stopPropagation();

                this.dispose();
            }.bind(this));
        $div.append($skip);
        var $update = $('<button>')
            .text('Update')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                var controller = app.getController();
                try {
                    controller.setLoadingState(true);
                    var db = controller.getDatabase();
                    if (db)
                        await db.updateDatabase(this._changes);
                    else
                        await controller.getDataService().getCache().applyChanges(this._changes);
                    alert('Updated successfully!');
                    this.dispose();
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
            }.bind(this));
        $div.append($update);

        return Promise.resolve($div);
    }
}