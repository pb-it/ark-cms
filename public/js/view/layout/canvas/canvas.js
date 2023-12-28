class Canvas {

    _$canvas;
    _$list;
    _$counter;
    _$corner;

    _panels;
    _loaded;
    _loadInterval;
    _loading;

    _max_scroll_height;

    _myLazyLoad;

    constructor() {
        this._panels = [];
        this._loaded = 0;
        this._loadInterval = -1;
        this._loading = false;

        /*this._lazy_list = [];
        this._bLazy_flag = 0;
        this._lazy_interval;*/
    }

    init() {
        var main = $("main");
        main.empty();
        this._$canvas = $('<div/>', { id: 'canvas' })
            .appendTo(main);
        this._$list = $('<ul></ul>');
        this._$canvas.append(this._$list);

        this._$canvas.append($('<div>')
            .addClass('clear'));

        this._$corner = $('<div/>', { id: 'corner' })
            .hide()
            .appendTo(this._$canvas);
        $('<button/>')
            .attr('id', "top")
            .click(function () { $("body").scrollTop(0); })
            .append(new Icon('chevron-up').renderIcon())
            .appendTo(this._$corner);
        this._$counter = $('<div/>', { id: 'counter' })
            .appendTo(this._$canvas);
        this._$corner.append(this._$counter);

        this._panels = [];
        this._loaded = 0;

        this._calculateMaxHeight();
        $(window).off('scroll.canvas');
        $(window).on('scroll.canvas', async function () {
            if (!this._loading) {
                var y_scroll_pos = window.pageYOffset;
                var has_reached_bottom_of_page = this._max_scroll_height <= y_scroll_pos;
                if (has_reached_bottom_of_page) {
                    if (this._loaded < this._panels.length) {
                        await this._load();
                    }
                }
            }
        }.bind(this));

        $(window).off('click.canvas');
        $(window).on('click.canvas', async function (event) {
            if (!app.controller.getModalController().isModalOpen()) {
                try {
                    if (!(event.ctrlKey || event.shiftKey))
                        await app.controller.clearSelected();
                } catch (error) {
                    console.log(error);
                }
            }
            return Promise.resolve();
        }.bind(this));

        this._myLazyLoad = new LazyLoad({
            elements_selector: ".lazy"
            /*threshold: 100, // default is 300 pixels
            unobserve_entered: true,
            callback_enter: function (element) {
                console.log('entered');
            },
            callback_loaded: this._delayedLoad.bind(this),
            callback_error: this._delayedLoad.bind(this)
            callback_exit: function (element) {
                ;//element.removeAttribute("class");
            }*/
        });
    }

    /*_delayedLoad(el) {
        this._lazy_list.push(el);
        if (this._bLazy_flag == 0) {
            this._bLazy_flag = 1;
            this._bLazy_interval = setInterval(function () {
                console.log('interval');
                var el = this._lazy_list.shift();
                if (!el) {
                    clearInterval(this._bLazy_interval);
                    this._bLazy_flag = 0;
                    return;
                };
                el.classList.add("visible");
            }.bind(this), 1000);
        }
    }*/

    showContent(content) {
        this._$list.empty();
        this._$list.append(content);
        this._renderCorner();
    }

    async showData(data, typeString, action) {
        if (typeString) {
            var items;
            var model = app.controller.getModelController().getModel(typeString);
            var C;
            if (model.isCollection())
                C = CrudContainer;
            else
                C = CrudObject;

            if (data) {
                if (Array.isArray(data)) {
                    items = [];
                    for (var i = 0; i < data.length; i++) {
                        items.push(new C(typeString, data[i]));
                    }
                } else
                    items = [new C(typeString, data)];
            } else if (action == ActionEnum.create) {
                items = [new C(typeString, {})];
            }
            await this.showObjects(items, typeString, action);
        }
        return Promise.resolve();
    }

    async showObjects(items, typeString, action) {
        var panels = [];
        if (items && items.length > 0) {
            if (!typeString)
                typeString = items[0].getTypeString(); //TODO: parse not first but every single item?

            var model = app.controller.getModelController().getModel(typeString);
            var mpcc = model.getModelPanelConfigController();

            var panelConfig;
            var state = app.controller.getStateController().getState();
            if (state.panelConfig)
                panelConfig = state.panelConfig;
            else
                panelConfig = mpcc.getPanelConfig(action);
            var Cp = panelConfig.getPanelClass();

            if (action == ActionEnum.create || action == ActionEnum.update) {
                panelConfig.crudCallback = async function (data) {
                    var state = new State();
                    state.typeString = typeString;
                    if (data)
                        state.id = data.id;

                    app.controller.loadState(state, true);
                    return Promise.resolve(true);
                };
            }

            if (!panelConfig['paging'] || panelConfig['paging'] === 'default') {
                if (panelConfig.details == DetailsEnum.all)
                    this._loadInterval = 10;
                else if (Cp == MediaPanel)
                    this._loadInterval = 100;
                else if (model.isCollection())
                    this._loadInterval = 10;
                else
                    this._loadInterval = -1;
            } else
                this._loadInterval = -1; // none/unlimited

            if (Cp == MediaPanel || Cp == CollectionPanel) {
                var panel;
                for (var i = 0; i < items.length; i++) {
                    panel = new Cp(panelConfig, items[i]);
                    panel.setLazy(true);
                    panels.push(panel);
                }
            } else {
                for (var i = 0; i < items.length; i++) {
                    panels.push(new Cp(panelConfig, items[i]));
                }
            }
        }
        await this.showPanels(panels);
        return Promise.resolve();
    }

    async showPanels(panels) {
        if (panels)
            this._panels = panels;
        this._loaded = 0;
        this._$list.empty();
        await this._load();
        this._renderCorner();
        return Promise.resolve();
    }

    _renderCorner() {
        var state = app.controller.getStateController().getState();
        if (state && state.getModel())
            this._$corner.show();
        else
            this._$corner.hide();
    }

    async _load() {
        this._loading = true;
        if (this._loaded < this._panels.length) {
            var loadTo;
            if (this._loadInterval > 0)
                loadTo = Math.min(this._panels.length, this._loaded + this._loadInterval);
            else
                loadTo = this._panels.length;
            var panel;
            for (var i = this._loaded; i < loadTo; i++) {
                panel = this._panels[i];
                try {
                    await this._renderPanel(panel);
                } catch (error) {
                    //TODO: improve visualization of rendering errors
                    var id;
                    if (panel instanceof CrudPanel) {
                        const obj = panel.getObject();
                        if (obj) {
                            const data = obj.getData();
                            if (data)
                                id = data['id'];
                        }
                    }
                    const controller = app.getController();
                    if (id)
                        controller.showError(error, "Error while rendering <id:" + id + ">");
                    else
                        controller.showError(error, "Error while rendering '" + panel.constructor.name + "'");
                }
            }
            this._loaded = loadTo;
            this._myLazyLoad.update();
        }

        this._calculateMaxHeight();
        this._$counter.html(this._loaded + "/" + this._panels.length);
        this._loading = false;
        return Promise.resolve();
    }

    _calculateMaxHeight() {
        var win = $(window).height();
        var screen = window.screen.height;
        this._max_scroll_height = win - screen;
    }

    async _renderPanel(panel) {
        var $panel = await panel.render();
        var $li = $('<li></li>')
            .append($panel);
        this._$list.append($li);
        Promise.resolve();
    }

    getPanels() {
        return this._panels;
    }

    isLoading() {
        return this._loading;
    }
}