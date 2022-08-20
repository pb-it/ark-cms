class FileFormEntry extends FormEntry {

    _$inputFilename;
    _$inputUrl;
    _$inputFile;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        this._value = value;
        var $div = $('<div/>').addClass('value');

        var size;
        if (this._attribute.size)
            size = this._attribute.size;
        else
            size = "100";

        if (value) {
            if (value.length > size)
                $div.append(value.substr(0, size) + "...<br/>");
            else
                $div.append(value + "<br/>");
        }

        $div.append('filename: ');
        this._$inputFilename = $('<input/>')
            .attr('type', 'text')
            .attr('size', size);
        $div.append(this._$inputFilename);
        $div.append("<br/>");

        $div.append('URL: ');
        this._$inputUrl = $('<input/>')
            .attr('type', 'text')
            .attr('size', size)
            .on('input', function () {
                var pathname = new URL(this._$inputUrl.val()).pathname;
                var index = pathname.lastIndexOf('/');
                if (index !== -1)
                    this._$inputFilename.val(pathname.substring(index + 1));
            }.bind(this));
        $div.append(this._$inputUrl);
        $div.append("<br/>");

        this._$inputFile = $('<input/>').attr({ 'type': 'file', 'id': this._id, 'name': this._attribute.name, 'value': '', 'multiple': false })
            .on('change', function () {
                var file;
                var input = this._$inputFile[0];
                if (input.files && input.files.length > 0)
                    file = input.files[0];
                if (file)
                    this._$inputFilename.val(file.name);
            }.bind(this));
        $div.append(this._$inputFile);

        return Promise.resolve($div);
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