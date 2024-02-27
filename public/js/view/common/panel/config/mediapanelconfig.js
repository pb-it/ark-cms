const DetailsEnum = Object.freeze({ "none": 1, "title": 2, "all": 3 });

class MediaPanelConfig extends PanelConfig {

    _model;
    _panelClass;

    panelType;
    action;
    details;
    detailsAttr;

    bSelectable;
    bContextMenu;

    thumbnail;
    autoplay;

    constructor() {
        super();

        this.thumbnail = {};
    }

    initPanelConfig(model, act, config) {
        this._model = model;

        if (config && config[ModelDefaultsController.PANEL_TYPE_IDENT])
            this.panelType = config[ModelDefaultsController.PANEL_TYPE_IDENT];

        if (!this.panelType)
            this.panelType = 'CrudPanel';
        this._panelClass = app.getController().getPanelController().getPanelClass(this.panelType);

        if (act)
            this.action = act;

        if (config) {
            if (!act && config['action'])
                this.action = config['action'];

            if (config['detailsAttr'])
                this.detailsAttr = config['detailsAttr'];

            this.format = config.format;
            this.width = config.width;
            this.height = config.height;
            if (config.details && isNaN(config.details)) {
                switch (config.details) {
                    case "none":
                        this.details = DetailsEnum.none;
                        break;
                    case "title":
                        this.details = DetailsEnum.title;
                        break;
                    case "all":
                        this.details = DetailsEnum.all;
                        break;
                    default:
                }
            } else
                this.details = config.details;

            this.display = config.display;
            if (config.float)
                this.float = config.float;
            else if (this._panelClass && this._panelClass == MediaPanel)
                this.float = 'left';

            if (config['paging'])
                this.paging = config['paging'];

            if (config['bSelectable'])
                this.bSelectable = config['bSelectable'];

            if (config['bContextMenu'])
                this.bContextMenu = config['bContextMenu'];

            if (config['searchFields'])
                this.searchFields = config['searchFields'];

            switch (config.format) {
                case "16/9":
                    if (config.height && !config.width)
                        this.width = config.height / 9 * 16;
                    else if (config.width)
                        this.height = config.width / 16 * 9;
                    break;
                case "4/3":
                    if (config.height && !config.width)
                        this.width = config.height / 3 * 4;
                    else if (config.width)
                        this.height = config.width / 4 * 3;
                    break;
                default:
            }

            if (config['autoplay'])
                this.autoplay = config['autoplay'];
        } else {
            this.details = DetailsEnum.title;
            this.format = "16/9";
            this.width = 320;
            this.height = 240;
        }
    }

    getPanelClass() {
        return this._panelClass;
    }
}