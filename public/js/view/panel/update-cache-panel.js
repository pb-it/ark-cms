class UpdateCachePanel extends Panel {

    _changes;

    constructor(changes) {
        super();

        this._changes = changes;
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append('<h2>Cache</h2>');
        $div.append('Your cache is out of date. Do you want to update it now?<br/><br/>');

        const $remember = $('<input/>')
            .attr('type', 'checkbox');
        const $label = $('<label/>');
        $label.append($remember);
        $label.append('Remember decision for all future visits(only applies for choice \'Update\')<br/><br/>');
        $div.append($label);

        const $skip = $('<button>')
            .text('Skip')
            .click(async function (event) {
                event.stopPropagation();

                this.dispose();
            }.bind(this));
        $div.append($skip);
        const $update = $('<button>')
            .text('Update')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                try {
                    controller.setLoadingState(true);
                    if ($remember.is(':checked'))
                        controller.getStorageController().storeLocal('bAutomaticUpdateIndexedDB', true);
                    const db = controller.getDatabase();
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