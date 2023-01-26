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

                    try {
                        var bChanged;
                        var nodes;
                        var conf = this._tree.getTreeConf();
                        if (conf)
                            nodes = conf.nodes;
                        //TODO: check if changed

                        if (!bChanged) {
                            await app.controller.getModalController().openPanelInModal(new CreateFilterPanel(app.controller.getStateController().getState().getModel()));
                            //this._tree.setTreeConf(...);
                            this.render();
                        }
                    } catch (error) {
                        if (error)
                            app.controller.showError(error);
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
                        try {
                            var nodes;
                            var conf = this._tree.getTreeConf();
                            if (conf)
                                nodes = conf.nodes;
                            changed = await app.controller.getModalController().openEditJsonModal(nodes);
                            this._tree.setTreeConf(changed);
                        } catch (error) {
                            if (error)
                                app.controller.showError(error);
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

                    app.controller.setLoadingState(true);
                    try {
                        var mfc = app.controller.getModelController().getModel(this._state.typeString).getModelFilterController();
                        var conf = event.data.getTreeConf(true);
                        if (conf) {
                            var newFilters = conf.nodes;
                            var oldFilters = mfc.getFilterTree();
                            var bChanged = !isEqualJson(oldFilters, newFilters);
                            if (bChanged) {
                                var bSave = false;
                                if (app.controller.getConfigController().confirmOnApply())
                                    bSave = await app.controller.getModalController().openDiffJsonModal(oldFilters, newFilters);
                                else
                                    bSave = true;

                                if (bSave) {
                                    await mfc.updateFilters(newFilters);
                                    alert('Saved successfully');
                                }
                            } else
                                alert('Nothing changed');

                            app.controller.setLoadingState(false);
                        }
                    } catch (error) {
                        app.controller.setLoadingState(false);
                        app.controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );
        }
        return Promise.resolve($div);
    }
}