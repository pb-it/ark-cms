class ManageFilterTreePanel extends Panel {

    _state;
    _tree;

    constructor(state) {
        super();
        this._state = state;

        $(window).on("changed.model", function (event, data) {
            if (!data || (data['name'] === this._state.typeString)) {
                this._tree = null;
                this.render();
            }
        }.bind(this));
    }

    getTree() {
        return this._tree;
    }

    async _renderContent() {
        var $div = $('<div/>');

        var model = app.controller.getModelController().getModel(this._state.typeString);
        var mfc = model.getModelFilterController();
        var nodes;
        var tree = mfc.getFilterTree();
        if (tree)
            nodes = JSON.parse(JSON.stringify(tree));
        if (!this._tree)
            this._tree = new Tree(nodes);
        if (this._tree) {
            var treeConf = this._tree.getTreeConf();
            if (treeConf) {
                var treeNodes = Tree.getAllTreeNodes(treeConf);
                for (let node of treeNodes) {
                    if (!node['type'] || node['type'] === 'node') {
                        node['actions'] = {};

                        node['actions']['editAction'] = async function (state) {
                            var panel = new CreateFilterPanel(model, node);
                            app.controller.getModalController().openPanelInModal(panel);
                            return Promise.resolve(node);
                        }.bind(node);
                    }
                }

                var treeVisConf = { 'editable': true };
                var treeVis = new TreeVis(treeVisConf, this._tree);
                var $tree = treeVis.render();
                $div.append($tree);
                $div.append("<br>");
            }

            $div.append($('<button/>')
                .text('new')
                .prop("disabled", true) //TODO:
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    try {
                        var bChanged;
                        const conf = this._tree.getTreeConf();
                        //TODO: check if changed

                        if (!bChanged) {
                            await controller.getModalController().openPanelInModal(new CreateFilterPanel(controller.getStateController().getState().getModel()));
                            //this._tree.setTreeConf(...);
                            this.render();
                        }
                    } catch (error) {
                        if (error)
                            controller.showError(error);
                    }

                    return Promise.resolve();
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('add folder')
                .click(async function (event) {
                    event.stopPropagation();

                    var skeleton = [{
                        "name": "name",
                        "dataType": "string"
                    }];
                    var panel = new FormPanel(null, skeleton);
                    panel.setApplyAction(async function () {
                        var data = await panel.getForm().readForm();
                        this._tree.addTreeNode(data.name);
                        panel.dispose();
                        this.render();
                        return Promise.resolve();
                    }.bind(this));
                    return app.controller.getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            if (app.controller.isInDebugMode()) {
                $div.append($('<button/>')
                    .text('edit json')
                    .click(async function (event) {
                        event.stopPropagation();
                        var changed;
                        const controller = app.getController();
                        try {
                            const conf = this._tree.getTreeConf();
                            changed = await controller.getModalController().openEditJsonModal(conf);
                            this._tree.setTreeConf(changed);
                        } catch (error) {
                            if (error)
                                controller.showError(error);
                        }
                        if (changed)
                            this.render();
                        return Promise.resolve();
                    }.bind(this))
                );
            };

            $div.append($('<button/>')
                .text('save')
                .click(this._tree, async function (event) {
                    event.preventDefault();

                    const controller = app.getController();
                    controller.setLoadingState(true);
                    try {
                        const mfc = controller.getModelController().getModel(this._state.typeString).getModelFilterController();
                        const newFilters = event.data.getTreeConf(true);
                        const oldFilters = mfc.getFilterTree();
                        const bChanged = !isEqualJson(oldFilters, newFilters);
                        if (bChanged) {
                            var bSave = false;
                            if (controller.getConfigController().confirmOnApply())
                                bSave = await controller.getModalController().openDiffJsonModal(oldFilters, newFilters);
                            else
                                bSave = true;

                            if (bSave) {
                                await mfc.updateFilters(newFilters);
                                alert('Saved successfully');
                            }
                        } else
                            alert('Nothing changed');

                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );
        }
        return Promise.resolve($div);
    }
}