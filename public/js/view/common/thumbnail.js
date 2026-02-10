class Thumbnail {

    static renderThumbnailImage(file, config, bLazy) {
        var $img = $('<img/>')
            .attr({
                'alt': file,
                'decoding': 'async',
                'referrerpolicy': 'no-referrer',
                'draggable': false
            });
        if (bLazy) {
            $img.addClass('lazy')
                .attr({
                    'src': window.location.origin + "/public/images/loading_icon.gif",
                    'data-src': file,
                })
        } else {
            $img.attr({
                'src': file
            })
        }
        if (config.width) {
            $img.css({
                'max-width': config.width
            });
        }
        if (config.height) {
            $img.css({
                'max-height': config.height
            });
        }
        return $img;
    }

    static renderThumbnailClip(file, poster, config, bLazy) {
        var autoplay;
        if (config['autoplay'])
            autoplay = config['autoplay'];
        else
            autoplay = false;
        var attributes = {
            //"data-src": file,
            'autoplay': autoplay,
            'loop': true,
            'controls': true
        };
        if (!poster)
            poster = window.location.origin + "/public/images/missing_image.png";
        if (bLazy) {
            attributes['data-poster'] = poster;
            attributes['preload'] = 'metadata'; //auto|metadata|none
        } else {
            attributes['poster'] = poster;
            attributes['preload'] = 'none';
        }
        var $video = $('<video/>')
            .attr(attributes)
            .prop('muted', true);
        if (bLazy)
            $video.addClass('lazy')

        if (config.width) {
            $video.css('max-width', config.width);
        }
        if (config.height) {
            $video.height(config.height);
        }
        var type = file.substr(file.lastIndexOf('.') + 1);
        if (bLazy) {
            $video.append("<source data-src='" + file + "' type='video/" + type + "'>");
        } else {
            $video.append("<source src='" + file + "' type='video/" + type + "'>");
        }
        return $video;
    }

    _config;
    _media;
    _bLazy;

    _mediaType;
    _file;

    _$thumbnail;
    _$video;

    constructor(config, media, bLazy) {
        this._config = config;
        this._media = media;
        this._bLazy = bLazy;

        this._$thumbnail = $('<div/>')
            .addClass('thumbnail');

        if (this._config.width) {
            this._$thumbnail.css({
                "width": this._config.width
            });
        }
        if (this._config.height) {
            this._$thumbnail.css({
                "height": this._config.height
            });
        }
    }

    async renderThumbnail(bForce) {
        this._$thumbnail.empty();

        var $thumb;
        var mediaType;
        if (this._media) {
            if (!this._file)
                this._file = this._media.getThumbnail();
            mediaType = this._media.getMediaType();
        }
        if (this._file) {
            if (bForce && this._file.startsWith("http")) {
                //await fetch(this._file, { cache: 'reload', mode: 'no-cors' });
                var index = this._file.indexOf('?');
                if (index > -1)
                    this._file += "&t=" + (new Date()).getTime();
                else
                    this._file += "?t=" + (new Date()).getTime();
            }

            if (mediaType) {
                switch (mediaType) {
                    case 'image':
                        const ext = getFileExtensionFromUrl(this._file).toLowerCase();
                        if (ext === 'tiff')
                            $thumb = Thumbnail.renderThumbnailImage(window.location.origin + "/public/images/unknown_icon.png", this._config, this._bLazy);
                        else if (isImage(ext))
                            $thumb = Thumbnail.renderThumbnailImage(this._file, this._config, this._bLazy);
                        break;
                    case 'clip':
                        if (isVideo(this._file))
                            $thumb = Thumbnail.renderThumbnailClip(this._file, null, this._config, this._bLazy);
                        else if (isImage(this._file)) {
                            var file;
                            if (this._media)
                                file = this._media.getFile();
                            $thumb = Thumbnail.renderThumbnailClip(file, this._file, this._config, false);
                        }
                        break;
                    case 'video':
                        if (isImage(this._file))
                            $thumb = Thumbnail.renderThumbnailImage(this._file, this._config, this._bLazy);
                        break;
                    case 'audio':
                        if (isAudio(this._file))
                            $thumb = Thumbnail.renderThumbnailImage(window.location.origin + "/public/images/audio_icon.png", this._config, this._bLazy);
                        break;
                    case 'file':
                        if (this._file.endsWith('.pdf'))
                            $thumb = Thumbnail.renderThumbnailImage(window.location.origin + "/public/images/pdf_icon.png", this._config, this._bLazy);
                        break;
                    default:
                        //TODO: improve visualization of rendering errors
                        console.log("Unknown media type '" + mediaType + "'");
                }
            } else {
                var file;
                if (typeof this._file == 'string')
                    file = this._file;
                else if (this._file['url'])
                    file = this._file['url'];
                else if (this._file['base64'])
                    file = this._file['base64'];
                if (file.startsWith("http")) {
                    if (isImage(file))
                        $thumb = Thumbnail.renderThumbnailImage(file, this._config, this._bLazy);
                } else if (file.startsWith("data")) {
                    if (file.startsWith("data:image/"))
                        $thumb = Thumbnail.renderThumbnailImage(file, this._config, this._bLazy);
                }
            }
        }
        if ($thumb)
            this._$thumbnail.append($thumb);
        else
            this._$thumbnail.append(Thumbnail.renderThumbnailImage(window.location.origin + "/public/images/missing_image.png", this._config, this._bLazy));

        if (mediaType && mediaType === 'video') {
            var $hint = $(document.createElement('img'))
                .attr({
                    "src": window.location.origin + "/public/images/video_icon.png",
                })
                .css({
                    "width": 30,
                    "position": "absolute",
                    "right": "5px"
                });
            this._$thumbnail.append($hint);
        }

        this._bLazy = false;

        return Promise.resolve(this._$thumbnail);
    }

    getMedia() {
        return this._media;
    }

    playVideo() {
        var sc = app.getController().getSelectionController();
        if (sc)
            sc.clearSelected();
        this._$thumbnail.empty();

        this._$video = $('<video/>', {
            //id: 'video',
            src: this._media.getFile(),
            type: 'video/mp4',
            autoplay: true,
            controls: true
        })
            .css({
                "max-width": this._config.width,
                "max-height": this._config.height
            });
        /*video.on("loadedmetadata", function () {
            var id = $(this.parentElement.parentElement).data("id");
            currentVideo = id;
        });*/

        this._$thumbnail.append(this._$video);
    }
}