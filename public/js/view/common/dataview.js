class DataView {

    static getSyntax(str) {
        return /^data:text\/(.*?);charset=utf-8$/ig.exec(str)[1]; //regex
    }

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
            var label;
            var view;
            var value;

            var index;

            var $name;
            var $value;
            for (var i = 0; i < skeleton.length; i++) {
                attribute = skeleton[i];
                if (!attribute['hidden'] || attribute['hidden'] == false) {
                    name = attribute['name'];
                    label = attribute['label'];
                    if (!label)
                        label = name;

                    $name = $('<div/>').addClass('name').html(label + ":");
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
                            case "list":
                                if (data && data[name]) {
                                    if (typeof data[name] === 'string' || data[name] instanceof String)
                                        value = encodeText(data[name]);
                                    else
                                        value = data[name];
                                } else
                                    value = "";
                                $value.html(value);
                                break;
                            case "text":
                            case "json":
                                $value.addClass('text');
                                if (data && data[name]) {
                                    if (typeof data[name] === 'string' || data[name] instanceof String) {
                                        value = data[name];
                                        if (attribute['bSyntaxPrefix']) {
                                            index = value.indexOf(','); //data:text/plain;charset=utf-8,
                                            if (index > -1) {
                                                view = DataView.getSyntax(value.substr(0, index));
                                                value = value.substr(index + 1);
                                            }
                                        } else
                                            view = attribute['view'];
                                        if (view) {
                                            switch (view) {
                                                case 'html':
                                                    break;
                                                case 'plain+html':
                                                    $value.addClass('pre');
                                                    value = DataView._parseText(value);
                                                    break;
                                                case 'markdown':
                                                    $value.addClass('markdown');
                                                    value = value.replace(/\[([^\]\r\n]*)\]\((\/data\/.*?)\)/gm, function (match, c1, c2) {
                                                        return "<a href='" + c1 + "' onclick='app.getController().navigate(\"" + c2 + "\");return false;'>" + c1 + "</a>";
                                                    });
                                                    if (typeof showdown === 'undefined') {
                                                        var buildUrl = "https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/";
                                                        await loadScript(buildUrl + "showdown.min.js");
                                                    }
                                                    const converter = new showdown.Converter({ tables: true });
                                                    value = converter.makeHtml(value);
                                                    break;
                                                case 'csv':
                                                case 'xml':
                                                case 'plain': //preformatted / WYSIWYG
                                                default:
                                                    $value.addClass('pre');
                                                    value = encodeText(value);
                                            }
                                        } else {
                                            $value.addClass('pre');
                                            value = encodeText(value);
                                        }
                                    } else {
                                        $value.addClass('pre');
                                        value = encodeText(JSON.stringify(data[name], null, '\t'));
                                    }
                                } else
                                    value = "";
                                $value.html(value);
                                if (view && view === 'markdown') {
                                    if (typeof hljs === 'undefined') {
                                        var buildUrl = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.6.0/build/";
                                        await loadStyle(buildUrl + "styles/default.min.css");
                                        await loadScript(buildUrl + "highlight.min.js");
                                    }
                                    $value[0].querySelectorAll('code').forEach(el => {
                                        hljs.highlightElement(el);
                                    });
                                }
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

                                    if (attribute['timeZone'])
                                        value = date.toLocaleString(app.getController().getLocale(), { timeZone: attribute['timeZone'] });
                                    else
                                        value = date.toLocaleString(app.getController().getLocale());
                                } else
                                    value = "";
                                $value.html(value);
                                break;
                            case "datetime":
                            case "timestamp":
                                if (data && data[name]) {
                                    let date = new Date(data[name]);

                                    if (attribute['timeZone'])
                                        value = date.toLocaleString(app.getController().getLocale(), { timeZone: attribute['timeZone'] });
                                    else
                                        value = date.toLocaleString(app.getController().getLocale());
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
                            case "file":
                                if (data && data[name]) {
                                    if (attribute['storage'] == 'filesystem') {
                                        if (attribute['cdn'])
                                            value = CrudObject._buildUrl(attribute['cdn'], data[name]);
                                        else
                                            value = data[name];
                                        $value.html("<a href='" + value + "' target='_blank'>" + data[name] + "</a><br>");
                                    } else if (attribute['storage'] == 'base64') {
                                        var filename;
                                        if (attribute['filename_prop'] && data[attribute['filename_prop']])
                                            filename = data[attribute['filename_prop']];
                                        else
                                            filename = 'undefined';
                                        var $button = $("<button/>")
                                            .text("download")
                                            .click(function (event) {
                                                event.stopPropagation();
                                                const a = document.createElement('a');
                                                a.href = data[name];
                                                a.download = filename;
                                                a.click();
                                                URL.revokeObjectURL(a.href);
                                            });
                                        $value.append($button);
                                    } else if (attribute['storage'] == 'blob') {
                                        var filename;
                                        if (attribute['filename_prop'] && data[attribute['filename_prop']])
                                            filename = data[attribute['filename_prop']];
                                        else
                                            filename = 'undefined';
                                        var $button = $("<button/>")
                                            .text("download")
                                            .click(function (event) {
                                                event.stopPropagation();
                                                const a = document.createElement('a');
                                                //const file = new Blob(data[name].data, { type: "text/plain" });
                                                const file = new Blob(data[name].data, { type: data[name].type });
                                                //const file = new File(data[name], 'hello_world.txt', { type: 'text/plain' });
                                                a.href = URL.createObjectURL(file);
                                                a.download = filename;
                                                a.click();
                                                URL.revokeObjectURL(a.href);
                                            });
                                        $value.append($button);
                                    } else
                                        $value.html("");
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
        if (panelConfig['details'] != DetailsEnum.none)
            delete panelConfig['details'];
        var panel;
        if (data) {
            if (attribute['multiple'] && Array.isArray(data)) {
                var ids = data.map(function (x) { return x['id'] });
                var objs = [];
                var add;
                for (var j = 0; j < Math.ceil(ids.length / 100); j++) {
                    add = await app.controller.getDataService().fetchObjectById(modelName, ids.slice(j * 100, (j + 1) * 100));
                    objs.push(...add);
                }
                for (var obj of objs) {
                    $li = $("<li/>")
                        .attr({ 'data-id': obj.getData().id })
                        .css({ 'display': 'inline-block' });
                    panel = PanelController.createPanelForObject(obj, panelConfig);
                    $li.append(await panel.render());
                    $list.append($li);
                }
            } else {
                var id = data['id'];
                if (id) {
                    var obj = await app.controller.getDataService().fetchObjectById(modelName, id);
                    if (obj) {
                        $li = $("<li/>")
                            .attr({ 'data-id': obj.getData()['id'] })
                            .css({ 'display': 'inline-block' });
                        panel = PanelController.createPanelForObject(obj, panelConfig);
                        $li.append(await panel.render());
                        $list.append($li);
                    }
                }
            }
        }
        return Promise.resolve($list);
    }
}