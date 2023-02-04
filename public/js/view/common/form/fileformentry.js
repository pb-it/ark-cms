class FileFormEntry extends FormEntry {

    _$div;

    _$inputFilename;
    _$inputUrl;
    _$inputFile;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        this._value = value;
        if (!this._$div)
            this._$div = $('<div/>').addClass('value');
        else
            this._$div.empty();

        var size;
        if (this._attribute.size)
            size = this._attribute.size;
        else
            size = "100";

        if (value) {
            var str;
            if (typeof value === 'string' || value instanceof String)
                str = value;
            else if (value['base64'])
                str = value['base64'];
            if (str) {
                if (str.length > size)
                    this._$div.append(str.substr(0, size) + "...<br/>");
                else
                    this._$div.append(str + "<br/>");
            }
        }

        this._$div.append('filename: ');
        this._$inputFilename = $('<input/>')
            .attr('type', 'text')
            .attr('size', size);
        if (value && value['filename'])
            this._$inputFilename.val(value['filename']);
        this._$div.append(this._$inputFilename);
        this._$div.append("<br/>");

        this._$div.append('URL: ');
        this._$inputUrl = $('<input/>')
            .attr('type', 'text')
            .attr('size', size)
            .on('input', function () {
                var pathname = new URL(this._$inputUrl.val()).pathname;
                var index = pathname.lastIndexOf('/');
                if (index !== -1)
                    this._$inputFilename.val(pathname.substring(index + 1));
            }.bind(this));
        if (value && value['url'])
            this._$inputUrl.val(value['url']);
        this._$div.append(this._$inputUrl);
        this._$div.append("<br/>");

        this._$inputFile = $('<input/>').attr({ 'type': 'file', 'id': this._id, 'name': this._attribute.name, 'value': '', 'multiple': false })
            .on('change', function () {
                var file;
                var input = this._$inputFile[0];
                if (input.files && input.files.length > 0)
                    file = input.files[0];
                if (file)
                    this._$inputFilename.val(file.name);
            }.bind(this));
        this._$div.append(this._$inputFile);

        if (this._value) {
            this._$div.append("<br/>");

            var $clear = $('<button>')
                .text('Clear')
                .click(async function (event) {
                    event.stopPropagation();

                    await this.renderValue(null);

                    return Promise.resolve();
                }.bind(this));
            this._$div.append($clear);
        }

        return Promise.resolve(this._$div);
    }

    async readValue() {
        var data;

        var filename;
        var url;
        var file;

        if (this._$inputFilename)
            filename = this._$inputFilename.val();

        if (this._$inputUrl)
            url = this._$inputUrl.val();
        if (!url && this._$inputFile) {
            var input = this._$inputFile[0];
            if (input.files && input.files.length > 0)
                file = input.files[0];
        }

        if (url) {
            data = {};
            if (filename)
                data['filename'] = filename;
            data['url'] = url;
        } else if (file) {
            /*if (!filename)
                filename = file.name;*/

            data = {};
            if (filename)
                data['filename'] = filename;
            if (this._attribute['dataType'] === "blob") {
                data['blob'] = [new Uint8Array(await file.arrayBuffer())];
                //const fileToBlob = async (file) => new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type });
                //data[name] = await fileToBlob(value);
            } else if (this._attribute['dataType'] === "base64" || this._attribute['dataType'] === "file") {
                data['base64'] = await Base64.encodeObject(file);
            }
        } else
            data = this._value;
        return Promise.resolve(data);
    }
}