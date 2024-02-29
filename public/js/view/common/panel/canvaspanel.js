/**
 * Panel for usage in container (canvas, select, etc.)
 */
class CanvasPanel extends Panel {

    _title;

    _bSelectable;
    _bSelected = false;
    _clicks = 0;
    _timer;

    _bContextMenu;

    _bLazy = false;

    constructor(config) {
        super(config);
    }

    getClass() {
        return CanvasPanel;
    }

    async _init() {
        await super._init();

        if (this._title) {
            this._$panel.attr('title', this._title);
        } else {
            this._$panel.removeAttr('title');
        }

        if (this._config.hasOwnProperty('bSelectable') && this._config['bSelectable'] != undefined)
            this._bSelectable = this._config['bSelectable'];
        if (this._bSelectable) {
            this._$panel.addClass('selectable');
            if (this._bSelected)
                this._$panel.addClass('selected');
            else
                this._$panel.removeClass('selected');
        } else {
            this._$panel.removeClass('selected');
            this._$panel.removeClass('selectable');
        }

        if (this._config.hasOwnProperty('bContextMenu') && this._config['bContextMenu'] != undefined)
            this._bContextMenu = this._config['bContextMenu'];

        if (!this._bRendered) {
            if (this._bSelectable) {
                this._initClickEvents();
                this._initDrag();
                this._initDrop();
            } else {
                $(document).on('keydown.panel', function (event) {
                    if (event.keyCode == 17) { // e.ctrlKey
                        const e = event || window.event;
                        const target = e.target || e.srcElement;
                        if (target === $('body')[0])
                            this._initDrag();
                    }
                }.bind(this));
                $(document).on('keyup.panel', function (event) {
                    if (event.keyCode == 17) {
                        const e = event || window.event;
                        const target = e.target || e.srcElement;
                        if (target === $('body')[0])
                            this._initDrag(false);
                    }
                }.bind(this));
            }
            this._initContextMenu();
        }
        return Promise.resolve();
    }

    /**
     * dont propagate selecting to parent container, but propagate to window for closing menus
     * therefore event gets overwitten in container
     */
    _initClickEvents() {
        this._$panel.on("click.panel", async function (event) {
            event.preventDefault();
            event.stopPropagation();
            window.getSelection()?.removeAllRanges(); //TODO: close side navigation bar

            //if (event.target == this._$panel[0]) {
            await app.getController().select(event.ctrlKey, event.shiftKey, this);
            this._clicks++;
            if (this._clicks == 1) {
                this._timer = setTimeout(function () {
                    this._clicks = 0;
                }.bind(this), 180);
            } else {
                clearTimeout(this._timer);
                this._dblclick();
                this._clicks = 0;
            }
            return Promise.resolve();
        }.bind(this));

        this._$panel.on("dblclick.panel", function (event) {
            event.preventDefault();
        }.bind(this));
    }

    _dblclick() {
    }

    _initContextMenu() {
        this._$panel.on("contextmenu.panel", async function (event) {
            if (this._bContextMenu || event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation(); // stop propagation to container

                const controller = app.getController();
                try {
                    controller.setLoadingState(true, false);
                    if (!this._bSelected)
                        await app.getController().select(event.ctrlKey, event.shiftKey, this);
                    await ContextMenuController.renderContextMenu(event.pageX, event.pageY, this);
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
            }
            return Promise.resolve();
        }.bind(this));
    }

    _initDrag(bDraggable = true) {
        /*this._$panel.draggable({
            disabled: !bDraggable
        });*/

        if (bDraggable) {
            this._$panel.attr({
                'draggable': 'true'
            });
            this._$panel.on('dragstart.panel', this._drag.bind(this));
            if (!this._bContextMenu)
                this._$panel.on('dragend.panel', this._initDrag.bind(this, false));
        } else {
            this._$panel.removeAttr('draggable');
            this._$panel.off('dragstart.panel');
            this._$panel.off('dragend.panel');
        }
    }

    async _drag(event) {
        event.stopPropagation(); // prevent draging parent container
        if (!this._bSelected)
            await app.getController().select(event.ctrlKey, event.shiftKey, this);
        return Promise.resolve();
    }

    _initDrop() {
        this._$panel.on("dragover.panel", function (event) {
            event.preventDefault();
        });
        this._$panel.on("dragleave.panel", function () {
        });
        this._$panel.on("drop.panel", this._drop.bind(this));
    }

    async _drop(event) {
        event.preventDefault();
        event.stopPropagation();
        return Promise.resolve();
    }

    setLazy(bLazy) {
        this._bLazy = bLazy;
    }

    async _teardown() {
        this._bLazy = false;
        return super._teardown();
    }

    async select(bSelect) {
        if (this._bSelectable) {
            if (this._bSelected != bSelect) {
                this._bSelected = bSelect;
                if (this._bRendered) {
                    if (this._bSelected)
                        this._$panel.addClass('selected');
                    else
                        this._$panel.removeClass('selected');
                }
            }
        }
        return Promise.resolve();
    }

    isSelected() {
        return this._bSelected;
    }
}