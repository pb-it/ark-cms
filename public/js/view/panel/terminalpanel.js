class TerminalPanel extends Panel {

    static async _loadPrettifier() {
        var buildUrl = "https://unpkg.com/prettier@2.7.1/";
        var p1 = loadScript(buildUrl + "standalone.js");
        var p2 = loadScript(buildUrl + "parser-html.js");
        var p3 = loadScript(buildUrl + "parser-babel.js");
        return Promise.all([p1, p2, p3]);
    }

    static async _format(response, format) {
        if (typeof response === 'string' || response instanceof String) {
            if (format) {
                switch (format) {
                    case 'json':
                        response = JSON.stringify(JSON.parse(response), null, '\t');
                        break;
                    case 'html':
                        if (typeof prettier === 'undefined')
                            await TerminalPanel._loadPrettifier();
                        response = prettier.format(response, {
                            parser: 'html',
                            plugins: prettierPlugins,
                            tabWidth: 3
                        });
                        break;
                    default:
                }
            }
        } else
            response = JSON.stringify(response, null, '\t');
        return Promise.resolve(response);
    }

    _snippets;

    _$name;
    _$input;
    _$output;
    _$oFormat;

    constructor() {
        super();

        var snippets = app.getController().getStorageController().loadLocal('snippets');
        if (snippets)
            this._snippets = JSON.parse(snippets);
        else
            this._snippets = {};
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var $loadDiv = $('<div/>');
        var $input = $('<select/>');
        var $option = $('<option/>', { value: '' }).text('undefined');
        //$option.prop('selected', true);
        $input.append($option);
        for (const [key, value] of Object.entries(this._snippets)) {
            $option = $('<option/>', { 'value': value }).text(key);
            $input.append($option);
        }
        $input.on("change", function (event) {
            var select = event.target;
            var index = select['selectedIndex'];
            var options = select['options'];
            var name = options[index]['text'];
            this._$name.val(name);
            this._$input.val(select.value);
        }.bind(this));
        $loadDiv.append($input);
        this._$name = $('<input/>')
            .attr('type', 'text')
            .attr('size', 40);
        $loadDiv.append(this._$name);
        var $save = $('<button>')
            .text('Save')
            .click(async function (event) {
                event.stopPropagation();

                //TODO:
                //alert("NotImplementedException");

                var name = this._$name.val();
                if (name) {
                    if (!this._snippets[name] || confirm('Override \'' + name + '\'?')) {
                        this._snippets[name] = this._$input.val();
                        var str = JSON.stringify(this._snippets);
                        console.log(str);
                        app.getController().getStorageController().storeLocal('snippets', str);
                        alert('Saved!');
                    }
                } else
                    alert('Name required!');

                return Promise.resolve();
            }.bind(this));
        $loadDiv.append($save);
        $div.append($loadDiv);

        var $leftDiv = $('<div/>')
            .css({ display: 'inline-block' });
        this._$input = $('<textarea/>')
            .attr('rows', 40)
            .attr('cols', 100)
            .val('await sleep(1000);\nreturn \'123\';');
        $leftDiv.append(this._$input);
        $leftDiv.append('<br />');

        var $run = $('<button>')
            .text('Run')
            .click(async function (event) {
                event.stopPropagation();

                try {
                    app.controller.setLoadingState(true);
                    var code = this._$input.val();
                    //eval(code);

                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    var response = await new AsyncFunction(code)();
                    if (response) {
                        var oFormat = this._$oFormat.val();
                        response = await TerminalPanel._format(response, oFormat);
                    }
                    this._$output.val(response);
                    app.controller.setLoadingState(false);
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $leftDiv.append($run);

        var $format = $('<button>')
            .text('Format')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                if (typeof prettier === 'undefined')
                    await TerminalPanel._loadPrettifier();
                var pretty = prettier.format(this._$input.val(), {
                    parser: 'babel',
                    plugins: prettierPlugins,
                    tabWidth: 3
                });
                this._$input.val(pretty);

                return Promise.resolve();
            }.bind(this));
        $leftDiv.append($format);
        $div.append($leftDiv);

        var $rightDiv = $('<div/>')
            .css({
                'display': 'inline-block',
                'vertical-align': 'top'
            });
        this._$oFormat = $('<select/>');
        var options = ['json', 'html'];
        var $option = $('<option/>', { value: '' }).text('undefined');
        //$option.prop('selected', true);
        this._$oFormat.append($option);
        for (var option of options) {
            $option = $('<option/>', { value: option }).text(option);
            this._$oFormat.append($option);
        }
        this._$oFormat.on("change", async function (event) {
            try {
                app.controller.setLoadingState(true);
                var output = this._$output.val();
                output = await TerminalPanel._format(output, event.target.value);
                this._$output.val(output);
                app.controller.setLoadingState(false);
            } catch (error) {
                app.controller.setLoadingState(false);
                app.controller.showError(error);
            }
            return Promise.resolve();
        }.bind(this));
        $rightDiv.append(this._$oFormat);
        $rightDiv.append('<br />');

        this._$output = $('<textarea/>')
            .attr('rows', 35)
            .attr('cols', 100)
            .prop("disabled", true);
        $rightDiv.append(this._$output);
        $rightDiv.append('<br />');

        var $copy = $('<button>')
            .text('Copy Result to Clipboard')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                navigator.clipboard.writeText(this._$output.val());

                return Promise.resolve();
            }.bind(this));
        $rightDiv.append($copy);

        var $saveFile = $('<button>')
            .text('Save to File')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                FileCreator.createFileFromText('output.txt', this._$output.val());

                return Promise.resolve();
            }.bind(this));
        $rightDiv.append($saveFile);

        $div.append($rightDiv);

        var $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}