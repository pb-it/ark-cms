class CreateCsvPanel extends Panel {

    _model;
    _objs;

    _listVis;

    constructor(model, objs) {
        super();

        this._model = model;
        this._objs = objs;
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var list = new List();
        for (var attribute of this._model.getModelAttributesController().getAttributes(true)) {
            list.addEntry(new SelectableListEntry(attribute['name'], attribute, true));
        }

        var vListConfig = {
            alignment: 'vertical',
            selectButtons: true,
        }
        this._listVis = new SelectableListVis(vListConfig, 'attributes', list);
        this._listVis.init();
        $div.append(this._listVis.renderList());

        $div.append('<br/>');

        $div.append($('<button/>')
            .html("Create")
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                var list = this._listVis.getList();
                var selectedEntries = list.getEntries().filter(function (x) { return x.isSelected() });
                var selectedAttributes = selectedEntries.map(function (x) { return x.getData() });

                var text;
                var line;
                var val;
                var value;
                var data;
                if (selectedAttributes.length > 0) {
                    line = "";
                    for (var attribute of selectedAttributes) {
                        if (line.length > 0)
                            line += ",";
                        line += attribute['name'];
                    }
                    text = line;

                    for (var i = 0; i < this._objs.length; i++) {
                        line = "";
                        data = this._objs[i].getData();
                        for (var attribute of selectedAttributes) {
                            value = "";

                            val = data[attribute['name']];
                            switch (attribute['dataType']) {
                                case 'string':
                                case 'text':
                                case 'url':
                                case 'enumeration':
                                    if (val)
                                        value = "\"" + val.replace(/"/g, '\\\"') + "\"";
                                    break;
                                case 'relation':
                                    if (val) {
                                        var ids = val.map(function (x) { return x['id'] });
                                        value = "[" + ids.join(',') + "]";
                                    }
                                    break;
                                default:
                                    if (val)
                                        value = data[attribute['name']];
                            }

                            if (line.length > 0)
                                line += ",";
                            line += value;
                        }

                        text += "\n" + line;
                    }
                    FileCreator.createFileFromText("data.csv", text);
                    this.dispose();
                } else
                    alert("Select at least one attribute");
                return Promise.resolve();
            }.bind(this))
        );
        return Promise.resolve($div);
    }
}