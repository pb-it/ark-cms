class TreeNodeVis {

    _treeVis;
    _treeNode;

    _$divTreeNode;
    _$checkbox;

    constructor(treeVis, treeNode) {
        this._treeVis = treeVis;
        this._treeNode = treeNode;
    }

    render() {
        var name = this._treeNode.getTreeNodeName();
        var type = this._treeNode.getTreeNodeType();
        var bNew;
        var $divTreeNode;
        if (this._$divTreeNode) {
            bNew = false;
            $divTreeNode = this._$divTreeNode;
            this._$divTreeNode.empty();
        } else {
            bNew = true;
            $divTreeNode = $('<div/>')
                .addClass('treenode');
            this._$divTreeNode = $divTreeNode;
        }

        if (type && type === "dummyRoot") {
            $divTreeNode.addClass('dummyRoot');

            var $divTreeGroup = $('<div/>')
                .addClass('treegroup')
                .addClass('show');

            var nodeVis;
            var childNodes = this._treeNode.getChildTreeNodes();
            if (childNodes) {
                for (var node of childNodes) {
                    nodeVis = new TreeNodeVis(this._treeVis, node);
                    $divTreeGroup.append(nodeVis.render());
                }
            }

            $divTreeNode.append($divTreeGroup);
        } else if (type && type === "folder") {
            var $icon = new Icon("folder").renderIcon();
            $divTreeNode.append($icon);
            $divTreeNode.append(SPACE + name);

            var $divTreeGroup = $('<div/>')
                .addClass('treegroup');

            var nodeVis;
            var childNodes = this._treeNode.getChildTreeNodes();
            if (childNodes) {
                for (var node of childNodes) {
                    nodeVis = new TreeNodeVis(this._treeVis, node);
                    $divTreeGroup.append(nodeVis.render());
                }
            }

            $divTreeNode.append($divTreeGroup);

            $divTreeNode.on("click.treenode", function (event) {
                if (event.target == this._$divTreeNode[0]) {
                    event.stopPropagation();
                    $divTreeGroup[0].classList.toggle('show');
                }
            }.bind(this));
        } else { //if (type === "node")
            if (this._treeNode.hasCheckBox()) {
                this._$checkbox = $('<input />', { type: 'checkbox', value: name });
                $divTreeNode.append(this._$checkbox);
            }
            $divTreeNode.append(name);
        }

        if (bNew) {
            var actions = this._treeNode.getActions();

            if (actions && actions['clickAction']) {
                $divTreeNode.on("click.treenode", function (event) {
                    event.stopPropagation();
                    actions['clickAction']();
                }.bind(this));
            }

            if (this._treeVis.isEditable()) {
                if (!this._treeNode.isRootTreeNode()) {
                    $divTreeNode.attr({
                        "draggable": "true"
                    });

                    $divTreeNode.on("dragstart.treenode", function (event) {
                        const dT = event.originalEvent.dataTransfer;
                        if (dT)
                            dT.setData("text/plain", JSON.stringify(this._treeNode.getTreeNodeConf()));
                    }.bind(this));
                }

                $divTreeNode.on("dragover.treenode", function (event) {
                    event.preventDefault();
                });

                $divTreeNode.on("dragleave.treenode", function (event) {
                });

                $divTreeNode.on("dragend.treenode", function (event) {
                    event.stopPropagation();
                    this._treeNode.deleteTreeNode();
                    this._treeVis.render();
                }.bind(this));

                $divTreeNode.on("drop.treenode", function (event) {
                    event.stopPropagation();
                    this._treeNode.addChildTreeNode(JSON.parse(event.originalEvent.dataTransfer.getData("text/plain")));
                    //this._treeVis.render(); //TODO: dirty fix - render on dragend because usually this event triggers later
                }.bind(this));

                $divTreeNode.on("contextmenu", async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    const controller = app.getController();
                    try {
                        controller.setLoadingState(true, false);
                        const entries = [];
                        if (type && type === "folder") {
                            entries.push(new ContextMenuEntry("Rename", async function (event, target) {
                                const skeleton = [{
                                    "name": "name",
                                    "dataType": "string"
                                }];
                                const panel = new FormPanel(null, skeleton, { 'name': target._treeNode.getTreeNodeName() });
                                panel.setApplyAction(async function () {
                                    var data = await panel.getForm().readForm();
                                    this._treeNode.setTreeNodeName(data['name']);
                                    panel.dispose();
                                    this.render();
                                    return Promise.resolve();
                                }.bind(target));
                                return app.getController().getModalController().openPanelInModal(panel);
                            }));
                        }
                        if (actions && actions['editAction']) {
                            const editEntry = new ContextMenuEntry("Edit", async function (event, target) {
                                const newConf = await actions['editAction'](target._treeNode.getTreeNodeConf());
                                target._treeNode.setTreeNodeConf(newConf);
                                return Promise.resolve();
                            });
                            editEntry.setIcon(new Icon('pen-to-square'));
                            entries.push(editEntry);
                        }
                        entries.push(new ContextMenuEntry("Delete", async function (event, target) {
                            target._treeNode.deleteTreeNode();
                            target._treeVis.render();
                            return Promise.resolve();
                        }));

                        const contextMenu = new ContextMenu(this);
                        contextMenu.setEntries(entries);
                        await contextMenu.renderContextMenu(event.pageX, event.pageY);
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    return Promise.resolve();
                }.bind(this));
            }
        }

        return $divTreeNode;
    }
}