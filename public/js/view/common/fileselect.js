class FileSelect {

    _$div;
    _$box;
    _$select;

    constructor() {
        this._$div = $('<div/>')
            .addClass('file-select');
    }

    renderFileSelect() {
        this._$div.empty();

        this._$box = $('<div/>')
            .addClass('box')
            .attr({
                contenteditable: true
            })
            .css({
                "text-align": "center"
            });
        /*.bind('DOMNodeInserted', function (event) {
            if (event.originalEvent && event.originalEvent.target) {
                //var target = $(event.originalEvent.target);
                //now you can check what has been moved
            }
        });*/
        this._$div.append(this._$box);

        var $rf = $('<input/>').attr({ type: 'hidden', id: 'realfile', name: 'realfile', value: '' });
        this._$div.append($rf);

        this._$select = $('<input/>').attr({ type: 'file', id: 'userfile', name: 'userfile', value: '', multiple: '' });
        //this._$select.attr({ accept: 'image/*' });
        this._$div.append(this._$select);

        if (window.File && window.FileReader && window.FileList && window.Blob) {
            this._$select[0].addEventListener('change', async function (event) {
                var files = event.target.files;
                if (files) {
                    var source;
                    for (var i = 0, f; f = files[i]; i++) {
                        if (f.type.match('image.*')) {
                            source = await Base64.encodeObject(f); // 'data:image/png;base64,...'
                            this._$box.append("<img src='" + source + "' alt=''>");
                        }
                    }
                }
            }.bind(this), false);
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }

        return this._$div;
    }

    async getSelectedFile() {
        var file;
        if (this._$select[0].files[0]) {
            file = await Base64.encodeObject(this._$select[0].files[0]);
        } else {
            file = this._readImageFromBox();
        }
        return Promise.resolve(file);
    }

    /**
     * 
     * @returns string - link(starts with 'http') or data(starts with 'data:')
     */
    _readImageFromBox() {
        var file;
        if (this._$box) {
            var $img = this._$box.find("img");
            if ($img) {
                file = $img.attr('src');
            } else {
                //TODO: needed???
                var html = this._$box.html();
                if (html) {
                    var sources = html.split("src=\"");
                    if (sources) {
                        var index;
                        for (var i = 1, s; s = sources[i]; i++) {
                            if ((index = s.indexOf("\"")) >= 0) {
                                s = s.substring(0, index);
                                file = s;
                            }
                        }
                    }
                }
            }
        }
        return file;
    }

    /*post() {
        let formData = new FormData(); //enctype="multipart/form-data"
        formData.append("file", this._$select[0].files[0]);
        fetch('/upload/file', { method: "POST", body: formData });
    }*/
}