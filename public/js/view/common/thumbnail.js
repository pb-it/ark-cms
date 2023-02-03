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

    static renderThumbnailClip(file, config, bLazy) {
        var autoplay;
        if (config['autoplay'])
            autoplay = config['autoplay'];
        else
            autoplay = false;
        var $video = $('<video/>')
            .attr({
                //"data-src": file,
                'autoplay': autoplay,
                'loop': true,
                'controls': true
            })
            .prop('muted', true);
        if (bLazy) {
            $video.addClass('lazy')
                .attr({
                    'data-poster': window.location.origin + "/public/images/missing_image.png",
                    'data-preload': 'auto', //auto|metadata|none
                });
        }

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
        if (!this._file)
            this._file = this._media.getThumbnail();
        var $thumbnail;

        var mediaType = this._media.getMediaType();
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
                        if (isImage(this._file))
                            $thumbnail = Thumbnail.renderThumbnailImage(this._file, this._config, this._bLazy);
                        break;
                    case 'clip':
                        if (isVideo(this._file))
                            $thumbnail = Thumbnail.renderThumbnailClip(this._file, this._config, this._bLazy);
                        break;
                    case 'video':
                        if (isImage(this._file))
                            $thumbnail = Thumbnail.renderThumbnailImage(this._file, this._config, this._bLazy);
                        break;
                    case 'file':
                        if (this._file.endsWith('.pdf'))
                            $thumbnail = Thumbnail.renderThumbnailImage(window.location.origin + "/public/images/application_pdf.png", this._config, this._bLazy);
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
                        $thumbnail = Thumbnail.renderThumbnailImage(file, this._config, this._bLazy);
                } else if (file.startsWith("data")) {
                    if (file.startsWith("data:image/"))
                        $thumbnail = Thumbnail.renderThumbnailImage(file, this._config, this._bLazy);
                }
            }
        }
        if ($thumbnail)
            this._$thumbnail.append($thumbnail);
        else
            this._$thumbnail.append(Thumbnail.renderThumbnailImage(window.location.origin + "/public/images/missing_image.png", this._config, this._bLazy));

        if (mediaType && mediaType === 'video') {
            var $hint = $(document.createElement('img'))
                .attr({
                    "src": window.location.origin + "/public/images/video_file.png",
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

    setFile(file) {
        this._file = file;
    }

    getFile() {
        return this._file;
    }

    playVideo() {
        app.controller.clearSelected();
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