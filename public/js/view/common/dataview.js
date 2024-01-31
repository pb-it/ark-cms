class DataView {

    static getSyntax(str) {
        var res;
        var match = /^data:text\/(.*?);charset=utf-8(,.*)?$/sig.exec(str); //regex
        if (match)
            res = match[1];
        return res;
    }

    static async parseMarkdown(text) {
        text = text.replace(/\[([^\]\r\n]*)\]\((\/(data|ext)\/(\([^()]*\)|.)*?)\)/gm, function (match, c1, c2) {
            return "<a href='" + c2 + "' onclick='app.getController().navigate(\"" + c2 + "\");return false;'>" + c1 + "</a>";
        });
        if (typeof showdown === 'undefined') {
            var buildUrl = "https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/";
            await loadScript(buildUrl + "showdown.min.js");
        }
        const converter = new showdown.Converter({ tables: true });
        text = converter.makeHtml(text);
        return Promise.resolve(text);
    }

    static async highlightBlock(block) {
        if (typeof hljs === 'undefined') {
            var buildUrl = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/";
            await loadStyle(buildUrl + "styles/default.min.css");
            await loadScript(buildUrl + "highlight.min.js");
        }
        block.querySelectorAll('code').forEach(elem => { // 'pre code:not(.hljs)'
            hljs.highlightElement(elem);
        });
        return Promise.resolve();
    }

    static async highlightCode(code, language) {
        if (typeof hljs === 'undefined') {
            var buildUrl = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/";
            await loadStyle(buildUrl + "styles/default.min.css");
            await loadScript(buildUrl + "highlight.min.js");
        }
        var res;
        if (language)
            res = hljs.highlight(code, { 'language': language }).value
        else
            res = hljs.highlightAuto(code).value
        return Promise.resolve(res);
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
            for (var i = 0; i < skeleton.length; i++) {
                await DataView._renderAttribute($div, skeleton[i], data);
            }
        }
        return Promise.resolve($div);
    }

    static async _renderAttribute($div, attribute, data) {
        if (!attribute['hidden'] || attribute['hidden'] == false) {
            $div.append(DataView._renderLabel(attribute));
            $div.append(await DataView._renderValue(attribute, data));
            $div.append('<br>');
        }
        return Promise.resolve();
    }

    static _renderLabel(attribute) {
        var label = attribute['label'];
        if (!label)
            label = attribute['name'];
        return $('<div/>').addClass('name').html(label + ":");
    }

    static async _renderValue(attribute, data) {
        var $value = $('<div/>').addClass('value');
        if (attribute['dataType']) {
            var name = attribute['name'];
            var value;
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
                    $value.addClass('text')
                        .addClass('pre');
                    if (data && data[name]) {
                        if (typeof data[name] === 'string' || data[name] instanceof String)
                            value = encodeText(data[name]);
                        else
                            value = encodeText(JSON.stringify(data[name], null, '\t'));
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
                            var fileName;
                            var x = data[name];
                            value = null;
                            if (typeof (x) === 'string' || (x) instanceof String)
                                fileName = x;
                            else {
                                if (x['filename'])
                                    fileName = x['filename'];
                                else if (x['url']) {
                                    fileName = x['url'];
                                    value = x['url'];
                                }
                            }
                            if (!value) {
                                if (attribute['cdn'])
                                    value = CrudObject._buildUrl(attribute['cdn'], fileName);
                                else
                                    value = fileName;
                            }
                            $value.html("<a href='" + value + "' target='_blank'>" + fileName + "</a><br>");
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
                    const dtc = app.getController().getDataTypeController();
                    var dt = dtc.getDataType(attribute['dataType']);
                    var bRendered = false;
                    if (dt) {
                        if (dt.renderView) {
                            await dt.renderView($value, attribute, data);
                            bRendered = true;
                        } else {
                            const bdt = dt.getBaseDataType();
                            if (bdt) {
                                var attr = { ...bdt };
                                attr['name'] = attribute['name'];
                                $value = await DataView._renderValue(attr, data);
                                bRendered = true;
                            }
                        }
                    }
                    if (!bRendered)
                        $value.html("&lt;" + attribute['dataType'] + "&gt;");
            }
        }
        return Promise.resolve($value);
    }

    static async renderRelation(attribute, data) {
        var modelName = attribute['model'];
        var $list = $('<ul/>').addClass('select');
        var $li;
        var model = app.controller.getModelController().getModel(modelName);
        var mpcc = model.getModelPanelConfigController();
        var panelConfig = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.title);
        var panel;
        if (data) {
            if (attribute['multiple'] && Array.isArray(data)) {
                var ids = data.map(function (x) {
                    if (isNaN(x))
                        return x['id'];
                    else
                        return x;
                });
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
                var obj;
                if (id)
                    obj = await app.controller.getDataService().fetchObjectById(modelName, id);
                else
                    obj = new CrudObject(modelName, data);
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
        return Promise.resolve($list);
    }
}