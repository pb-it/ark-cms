class MediaPanel extends CrudPanel {

    _media;

    _thumbnail;
    _fileSelect;

    constructor(config, obj) {
        super(config, obj);
    }

    getClass() {
        return MediaPanel;
    }

    async _init() {
        this._media = new Media(this._obj);
        this._thumbnail = new Thumbnail(this._config, this._media, this._bLazy);
        return super._init();
    }

    async _renderContent() {
        var $div = $('<div/>');
        this._fileSelect = undefined;
        if ((this._config.action == ActionEnum.create || this._config.action == ActionEnum.update) && !this._media.getThumbnail())
            $div.append(this._renderFileSelect());
        else
            $div.append(await this._thumbnail.renderThumbnail());

        var $d = await super._renderContent();
        if ($d) {
            if (this._config.action != ActionEnum.create && this._config.details == DetailsEnum.title)
                $d.css({
                    "clear": "left",
                    "width": this._config.width,
                    "overflow": "hidden",
                    "white-space": "nowrap",
                    "text-align": "center",
                    "text-overflow": "ellipsis"
                });
            else
                $d.css({ 'display': 'inline-block' });
            $div.append($d);

            $d = $('<div/>').addClass('clear'); // if form shorter than thumbnail
            $div.append($d);
        }
        return Promise.resolve($div);
    }

    _renderFileSelect() {
        this._fileSelect = new FileSelect();
        var $fileSelect = this._fileSelect.renderFileSelect();
        $fileSelect.css({
            "float": "left",
            "max-width": "40%"
        });
        return $fileSelect;
    }

    async _readData(bValidate) {
        var data = await super._readData(bValidate);
        if (this._fileSelect) {
            data = await this._addSelectedFile(data);
        }
        return Promise.resolve(data);
    }

    async _addSelectedFile(data) {
        var file = await this._fileSelect.getSelectedFile();
        if (file) {
            var prop;
            var model = this._obj.getModel();
            var p = model.getModelDefaultsController().getDefaultThumbnailProperty();
            var bUrl = false;
            var bConvert = true;
            if (p) {
                var mac = model.getModelAttributesController();
                if (file.startsWith("http")) {
                    bUrl = true;
                    if (p.indexOf(';') == -1) {
                        var attr = mac.getAttribute(p);
                        if (attr && attr['dataType'] === "url")
                            prop = p;
                    } else {
                        var attr;
                        var name;
                        var parts = p.split(';');
                        for (var i = parts.length - 1; i >= 0; i--) {
                            name = parts[i];
                            attr = mac.getAttribute(name);
                            if (attr && attr['dataType'] === "url") {
                                prop = name;
                                break;
                            }
                        }
                    }
                }
                if (file.startsWith("data:") || (bUrl && !prop)) {
                    bConvert = true;
                    if (p.indexOf(';') == -1) {
                        var attr = mac.getAttribute(p);
                        if (attr && attr['dataType'] === "base64")
                            prop = p;
                    } else {
                        var attr;
                        var name;
                        var parts = p.split(';');
                        for (var i = parts.length - 1; i >= 0; i--) {
                            name = parts[i];
                            attr = mac.getAttribute(name);
                            if (attr && attr['dataType'] === "base64") {
                                prop = name;
                                break;
                            }
                        }
                    }
                }
            }
            if (prop) {
                if (bConvert)
                    data[prop] = await File.readUrlBase64(file);
                else
                    data[prop] = file;
            } else
                throw new Error("no matching thumbnail attribute defined");
        }
        return Promise.resolve(data);
    }

    _dblclick() {
        this.openThumbnail();
    }

    async openThumbnail() {
        app.controller.setLoadingState(true);

        var thumbnail = new Thumbnail({}, this._media);
        thumbnail.setFile(this._thumbnail.getFile());
        var $thumbnail = await thumbnail.renderThumbnail();

        var modal = app.controller.getModalController().addModal();
        modal.open($thumbnail);

        app.controller.setLoadingState(false);
        return Promise.resolve();
    }

    getThumbnail() {
        return this._thumbnail;
    }
}