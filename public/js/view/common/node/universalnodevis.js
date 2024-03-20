class UniversalNodeVis {

    _id;
    _parent;
    _node;
    _name;

    _$div;

    constructor(id, parent, node) {
        const name = node.getName();
        if (id)
            this._id = id;
        else if (name)
            this._id = name + Date.now();
        else
            this._id = Date.now();
        this._parent = parent;
        this._node = node;
        this._name = name;

        this._$div = $('<div/>')
            .addClass('node');
    }

    getParent() {
        return this._parent;
    }

    getNode() {
        return this._node;
    }

    renderNode() {
        this._$div.empty();
        this._$div.append(this._name);

        const options = this._node.getOptions();
        if (options) {
            var entries;
            if (options['cmEntries'])
                entries = [...options['cmEntries']];
            else
                entries = [];
            if (this._parent) {
                if (options['bRearrangeable']) {
                    const moveUp = new ContextMenuEntry("Up", async function (event, target) {
                        const vis = target.getParent();
                        const list = vis.getList();
                        const entries = list.getEntries();
                        const node = target.getNode();
                        const index = entries.indexOf(node);
                        if (index > 0) {
                            var tmp = entries[index - 1];
                            entries[index - 1] = node;
                            entries[index] = tmp;
                            list.setEntries(entries);
                            vis.init();
                            vis.renderList();
                        }
                        return Promise.resolve();
                    });
                    moveUp.setEnabledFunction(async function (target) {
                        const vis = target.getParent();
                        const list = vis.getList();
                        const entries = list.getEntries();
                        const node = target.getNode();
                        const index = entries.indexOf(node);
                        return Promise.resolve(index > 0);
                    });
                    moveUp.setIcon(new Icon('arrow-up'));

                    const moveDown = new ContextMenuEntry("Down", async function (event, target) {
                        const vis = target.getParent();
                        const list = vis.getList();
                        const entries = list.getEntries();
                        const node = target.getNode();
                        const index = entries.indexOf(node);
                        if (index < entries.length - 1) {
                            var tmp = entries[index + 1];
                            entries[index + 1] = node;
                            entries[index] = tmp;
                            list.setEntries(entries);
                            vis.init();
                            vis.renderList();
                        }
                        return Promise.resolve();
                    });
                    moveDown.setEnabledFunction(async function (target) {
                        const vis = target.getParent();
                        const list = vis.getList();
                        const entries = list.getEntries();
                        const node = target.getNode();
                        const index = entries.indexOf(node);
                        return Promise.resolve(index < entries.length - 1);
                    });
                    moveDown.setIcon(new Icon('arrow-down'));
                    entries.push(new ContextMenuEntry("Move", null, [moveUp, moveDown]));
                }
                if (options['bRemovable']) {
                    const removeEntry = new ContextMenuEntry("Delete", async function (event, target) {
                        if (options.hasOwnProperty('cbRemove') && typeof options.cbRemove == 'function')
                            options.cbRemove(target.getNode());
                        const vis = target.getParent();
                        const list = vis.getList();
                        list.removeEntry(target.getNode());
                        vis.init();
                        vis.renderList();
                        return Promise.resolve();
                    });
                    removeEntry.setIcon(new Icon('trash'));
                    entries.push(removeEntry);
                }
            }
            const contextMenu = new ContextMenu(this);
            contextMenu.setEntries(entries);
            this._$div.on("contextmenu", async function (event) {
                event.preventDefault();
                event.stopPropagation();

                const controller = app.getController();
                try {
                    controller.setLoadingState(true, false);
                    await contextMenu.renderContextMenu(event.pageX, event.pageY);
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        }

        return this._$div;
    }
}