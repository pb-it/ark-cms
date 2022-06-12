class ExportModelPanel extends Panel {

    _listVis;

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var list = new List();
        var models = app.controller.getModelController().getModels();
        if (models && models.length > 0) {
            var sorted;
            if (models.length > 1)
                sorted = models.sort((a, b) => a.getName().localeCompare(b.getName()));
            else
                sorted = models;
            for (var model of sorted) {
                list.addEntry(new SelectableListEntry(model.getName(), model, true));
            }
        }

        var vListConfig = {
            alignment: 'vertical',
            selectButtons: true,
        }
        this._listVis = new SelectableListVis(vListConfig, 'models', list);
        this._listVis.init();
        $div.append(this._listVis.renderList());

        $div.append('<br/>');

        var $abortButton = $('<button/>')
            .text("Abort")
            .click(async function (event) {
                event.preventDefault();
                this.dispose();
                return Promise.resolve();
            }.bind(this));
        $div.append($abortButton);

        var $exportButton = $('<button/>')
            .text("Export")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();

                try {
                    var list = this._listVis.getList();
                    var selectedEntries = list.getEntries().filter(function (x) { return x.isSelected() });
                    var selectedModels = selectedEntries.map(function (x) { return x.getData() });

                    if (selectedModels && selectedModels.length > 0) {
                        await app.controller.getConfigController().export(selectedModels);

                        this.dispose();
                    } else
                        alert('select at least one model');
                } catch (error) {
                    app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($exportButton);

        return Promise.resolve($div);
    }
}