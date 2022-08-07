class ManageBookmarkPanel extends TabPanel {

    _$managePanel;
    _tree;

    _$jsonPanel;
    _jsonForm;

    constructor(config) {
        super(config);
    }

    async _init() {
        await super._init();

        this._$managePanel = await this._createManagePanel();
        this._panels.push(this._$managePanel);

        if (app.controller.isInDebugMode()) {
            this._$jsonPanel = await this._createJsonPanel();
            this._panels.push(this._$jsonPanel);
        }

        await this.openTab(this._$managePanel);

        return Promise.resolve();
    }

    async _createManagePanel() {
        var panel = new Panel({ 'title': 'Manage' });
        panel._renderContent = async function () {
            var $div = $('<div/>');

            if (!this._tree) {
                var bookmarks = app.controller.getBookmarkController().getBookmarks();
                if (bookmarks) {
                    var treeNodes = Tree.getAllTreeNodes(bookmarks);
                    for (let node of treeNodes) {
                        if (!node['type'] || node['type'] === 'node') {
                            node.click = function (event) {
                                app.controller.loadState(new State(this), true);
                            }.bind(node);
                        }
                    }

                } else
                    bookmarks = [];

                this._tree = new Tree(bookmarks);
            }
            if (this._tree) {
                var treeVisConf = { 'editable': false };
                var treeVis = new TreeVis(treeVisConf, this._tree);
                $div.append(treeVis.render());
                $div.append("<br>");
            }

            $div.append($('<button/>')
                .text('new')
                .click(async function (event) {
                    event.stopPropagation();

                    app.controller.getView().getSideNavigationBar().close();

                    var panel = new CrudStatePanel(ActionEnum.create);
                    return app.controller.getModalController().openPanelInModal(panel);
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
                        this.addTreeNode(data.name);
                        panel.dispose();
                        return Promise.resolve();
                    }.bind(this._tree));
                    return app.controller.getModalController().openPanelInModal(panel);
                }.bind(this))
            );

            $div.append($('<button/>')
                .text('save')
                .click(this._tree, async function (event) {
                    try {
                        if (event.data)
                            ;//TODO: app.controller.getModelController().getModel(...).getModelStateController().updateStates(event.data.getTreeConf().nodes);
                    } catch (error) {
                        app.controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this))
            );

            return Promise.resolve($div);
        }.bind(this);

        return Promise.resolve(panel);
    }

    async _createJsonPanel() {
        var panel = new Dialog({ 'title': 'JSON' });
        panel._renderDialog = async function () {
            var $div = $('<div/>')
                .css({ 'padding': '10' });

            var skeleton = [
                { name: "json", dataType: "json" }
            ];
            var data = { "json": JSON.stringify(this._tree.getTreeConf().nodes, null, '\t') };

            this._jsonForm = new Form(skeleton, data);
            var $form = await this._jsonForm.renderForm();

            $div.append($form);
            return Promise.resolve($div);
        }.bind(this);
        panel.setApplyAction(async function () {
            var fData = await this._jsonForm.readForm();
            await app.controller.getBookmarkController().setBookmarks(JSON.parse(fData['json']));

            this.dispose();
            return Promise.resolve(true);
        }.bind(this));

        return Promise.resolve(panel);
    }
}