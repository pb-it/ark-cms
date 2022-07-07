class FileFormEntry extends FormEntry {

    _$input;
    _value;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        this._value = value;
        var $div = $('<div/>').addClass('value');
        if (value) {
            if (value.length > 50)
                $div.append(value.substr(0, 50) + "...<br>");
            else
                $div.append(value + "<br>");
        }
        this._$input = $('<input/>').attr({ 'type': 'file', 'id': this._id, 'name': this._attribute.name, 'value': '', 'multiple': false });
        $div.append(this._$input);
        return Promise.resolve($div);
    }

    async readValue() {
        var data;
        var file;
        if (this._$input) {
            var input = this._$input[0];
            if (input.files && input.files.length > 0)
                file = input.files[0];

        }
        if (file) {
            if (this._attribute['dataType'] === "blob") {
                data = [new Uint8Array(await file.arrayBuffer())];
                //const fileToBlob = async (file) => new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type });
                //data[name] = await fileToBlob(value);
            } else if (this._attribute['dataType'] === "base64") {
                data = await Base64.encodeObject(file);
            }
        } else
            data = this._value;
        return Promise.resolve(data);
    }
}