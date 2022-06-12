class DataView {

    static _encode(text) {
        var res = "";
        var index;
        var arr = text.split('<html>');
        res += DataView._convertToHtml(arr[0]);
        for (var i = 1; i < arr.length; i++) {
            index = arr[i].indexOf('</html>');
            if (index >= 0) {
                index += 7;
                res += arr[i].substring(0, index)
                res += DataView._convertToHtml(arr[i].substring(index));
            }
        }
        return res;
    }

    static _convertToHtml(text) {
        //return text.replace(/<link>([A-ZÄÖÜa-zäöüß@µ§$%!?0-9_\s\/\\\=\:\.\'\"\;\,\#\&\|\-\+\~\*\>]*)<\/link>/g, '<a href="$1">$1</a>');
        text = text.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
        return replaceLineBreak(replaceApostrophe(text));
    }

    static async renderData(skeleton, data) {
        var $div = $(document.createElement('div'))
            .addClass('details');

        if (skeleton) {
            var field;
            var name;
            var value;

            var $name;
            var $value;
            for (var i = 0; i < skeleton.length; i++) {
                field = skeleton[i];
                if (!field.hidden || field.hidden == false) {
                    name = field.name;

                    $name = $('<div/>').addClass('name').html(name + ":");
                    $value = $('<div/>').addClass('value');

                    if (field['dataType']) {
                        switch (field['dataType']) {
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
                            case "text":
                            case "enumeration":
                            case "json":
                                if (data && data[name]) {
                                    if (typeof data[name] === 'string' || data[name] instanceof String)
                                        value = DataView._encode(data[name]);
                                    else
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
                                    if (field.cdn)
                                        value = CrudObject._buildUrl(field.cdn, data[name]);
                                    else
                                        value = data[name];
                                    $value.html("<a href='" + value + "' target='_blank'>" + data[name] + "</a><br>");
                                }
                                break;
                            case "relation":
                                if (data && data[name]) {
                                    var $list = $('<ul/>').addClass('select');
                                    var $li;
                                    var model = app.controller.getModelController().getModel(field.model);
                                    var mpcc = model.getModelPanelConfigController();
                                    var panelConfig = mpcc.getPanelConfig();
                                    var panel;
                                    if (field.multiple && Array.isArray(data[name])) {
                                        var ids = data[name].map(function (x) { return x.id });
                                        var objs = [];
                                        var add;
                                        for (var j = 0; j < Math.ceil(ids.length / 100); j++) {
                                            add = await app.controller.getDataService().fetchObjectById(field.model, ids.slice(j * 100, (j + 1) * 100));
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
                                        var obj = await app.controller.getDataService().fetchObjectById(field.model, data[name].id);
                                        $li = $("<li/>").attr({ 'data-id': obj.getData().id })
                                            .css({ 'clear': 'left' });
                                        panel = PanelController.createPanelForObject(obj, panelConfig);
                                        $li.append(await panel.render());
                                        $list.append($li);
                                    }
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
                                $value.html("&lt;" + field['dataType'] + "&gt;");
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
}