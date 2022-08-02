class DataView {

    static _parseText(text) {
        var res = "";
        var index;
        var arr = text.split('<html>');
        res += encodeText(arr[0]);
        for (var i = 1; i < arr.length; i++) {
            index = arr[i].indexOf('</html>');
            if (index >= 0) {
                index += 7;
                res += '<div>' + arr[i].substring(0, index).replace(/\n/g, "")
                    .replace(/[\t ]+\</g, "<")
                    .replace(/\>[\t ]+\</g, "><")
                    .replace(/\>[\t ]+$/g, ">") + '</div>';
                res += encodeText(arr[i].substring(index));
            }
        }
        return res;
    }

    static async renderData(skeleton, data) {
        var $div = $(document.createElement('div'))
            .addClass('details');

        if (skeleton) {
            var attribute;
            var name;
            var view;
            var value;

            var $name;
            var $value;
            for (var i = 0; i < skeleton.length; i++) {
                attribute = skeleton[i];
                if (!attribute['hidden'] || attribute['hidden'] == false) {
                    name = attribute['name'];

                    $name = $('<div/>').addClass('name').html(name + ":");
                    $value = $('<div/>').addClass('value');

                    if (attribute['dataType']) {
                        switch (attribute['dataType']) {
                            case "boolean":
                                if (data && (data[name] == 0 || data[name] == 1 || data[name] == false || data[name] == true)) {
                                    value = data[name];
                                    if (data[name] == 1 || data[name] == true)
                                        $value.html("true");
                                    else
                                        $value.html("false");
                                } else
                                    $value.html("");
                                break;
                            case "integer":
                            case "decimal":
                            case "double":
                            case "string":
                            case "enumeration":
                            case "text":
                            case "json":
                                if (data && data[name]) {
                                    if (typeof data[name] === 'string' || data[name] instanceof String) {
                                        view = attribute['view'];
                                        if (view) {
                                            switch (view) {
                                                case 'plain': //preformatted / WYSIWYG
                                                    $value.addClass('pre');
                                                    value = encodeText(data[name]);
                                                    break;
                                                case 'html':
                                                    value = data[name];
                                                    break;
                                                case 'markdown':
                                                    value = data[name]; //TODO:
                                                    break;
                                                case 'combined':
                                                default:
                                                    $value.addClass('pre');
                                                    value = DataView._parseText(data[name]);
                                            }
                                        } else {
                                            $value.addClass('pre');
                                            value = DataView._parseText(data[name]);
                                        }
                                    } else
                                        value = data[name];
                                } else
                                    value = "";
                                $value.html(value);
                                break;
                            case "time":
                                if (data && data[name]) {
                                    value = data[name];
                                } else
                                    value = "";
                                $value.html(value);
                                break;
                            case "date":
                                if (data && data[name]) {
                                    let date = new Date(data[name]);
                                    /*var dd = date.getDate();
                                    var mm = date.getMonth() + 1;
                                    var yyyy = date.getFullYear();
                                    if (dd < 10) {
                                        dd = '0' + dd;
                                    }
                                    if (mm < 10) {
                                        mm = '0' + mm;
                                    }
                                    value = dd + '.' + mm + '.' + yyyy;*/
                                    value = date.toLocaleDateString("de-DE");
                                } else
                                    value = "";
                                $value.html(value);
                                break;
                            case "datetime":
                            case "timestamp":
                                if (data && data[name]) {
                                    let date = new Date(data[name]);

                                    //value = date.toDateString();
                                    value = date.toLocaleString("de-DE");
                                    //value = date.toLocaleDateString("de-DE");
                                    //value = date.toUTCString(),
                                    //value = date.toISOString()
                                } else
                                    value = "";
                                $value.html(value);
                                break;
                            case "url":
                                if (data && data[name]) {
                                    if (attribute['cdn'])
                                        value = CrudObject._buildUrl(attribute['cdn'], data[name]);
                                    else
                                        value = data[name];
                                    $value.html("<a href='" + value + "' target='_blank'>" + data[name] + "</a><br>");
                                }
                                break;
                            case "relation":
                                if (data && data[name]) {
                                    var $list = await DataView.renderRelation(attribute, data[name]);
                                    $value.append($list);
                                }
                                break;
                            case "blob":
                                if (data && data[name]) {
                                    var $button = $("<button/>")
                                        .text("download")
                                        .click(function (event) {
                                            event.stopPropagation();
                                            const a = document.createElement('a');
                                            //const file = new Blob(data[name].data, { type: "text/plain" });
                                            const file = new Blob(data[name].data, { type: data[name].type });
                                            //const file = new File(data[name], 'hello_world.txt', { type: 'text/plain' });
                                            a.href = URL.createObjectURL(file);
                                            a.download = 'hello_world.txt';
                                            a.click();
                                            URL.revokeObjectURL(a.href);
                                        });
                                    $value.append($button);
                                } else
                                    $value.html("");
                                break;
                            case "base64":
                                if (data && data[name]) {
                                    var $button = $("<button/>")
                                        .text("download")
                                        .click(function (event) {
                                            event.stopPropagation();
                                            const a = document.createElement('a');
                                            a.href = data[name];
                                            a.download = 'hello_world.png';
                                            a.click();
                                            URL.revokeObjectURL(a.href);
                                        });
                                    $value.append($button);
                                } else
                                    $value.html("");
                                break;
                            default:
                                $value.html("&lt;" + attribute['dataType'] + "&gt;");
                        }
                    }
                    $div.append($name);
                    $div.append($value);
                    $div.append('<br>');
                }
            }
        }
        return Promise.resolve($div);
    }

    static async renderRelation(attribute, data) {
        var modelName = attribute['model'];
        var $list = $('<ul/>').addClass('select');
        var $li;
        var model = app.controller.getModelController().getModel(modelName);
        var mpcc = model.getModelPanelConfigController();
        var panelConfig = mpcc.getPanelConfig();
        var panel;
        if (attribute['multiple'] && Array.isArray(data)) {
            var ids = data.map(function (x) { return x['id'] });
            var objs = [];
            var add;
            for (var j = 0; j < Math.ceil(ids.length / 100); j++) {
                add = await app.controller.getDataService().fetchObjectById(modelName, ids.slice(j * 100, (j + 1) * 100));
                objs.push(...add);
            }
            for (var obj of objs) {
                $li = $("<li/>").attr({ 'data-id': obj.getData().id })
                    .css({ 'clear': 'left' });
                panel = PanelController.createPanelForObject(obj, panelConfig);
                $li.append(await panel.render());
                $list.append($li);
            }
        } else {
            var id = data['id'];
            if (id) {
                var obj = await app.controller.getDataService().fetchObjectById(modelName, id);
                if (obj) {
                    $li = $("<li/>").attr({ 'data-id': obj.getData()['id'] })
                        .css({ 'clear': 'left' });
                    panel = PanelController.createPanelForObject(obj, panelConfig);
                    $li.append(await panel.render());
                    $list.append($li);
                }
            }
        }
        return Promise.resolve($list);
    }
}