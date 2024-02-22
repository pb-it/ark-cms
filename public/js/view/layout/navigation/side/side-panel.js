class SidePanel {

    _$div;
    _$content;

    _extensionSelect;
    _modelSelect;
    _stateSelect;
    _filterSelect;

    constructor() {
        this._$div = $('<div/>')
            .prop('id', 'sidepanel');

        this._extensionSelect = new ExtensionSelect();
        this._modelSelect = new ModelSelect();
        this._stateSelect = new StateSelect();
    }

    renderSidePanel() {
        this._$div.empty();
        return this._$div;
    }

    async showExtensionSelect() {
        if (this._$content)
            this._$content.detach();
        this._$content = this._extensionSelect.renderExtensionSelect();
        this._$div.append(this._$content);
        this._$div[0].style.width = 'auto';
        return Promise.resolve();
    }

    async showModelSelect() {
        if (this._$content)
            this._$content.detach();
        this._$content = this._modelSelect.renderModelSelect();
        this._$div.append(this._$content);
        this._$div[0].style.width = 'auto';
        return Promise.resolve();
    }

    async showStateSelect() {
        if (this._$content)
            this._$content.detach();
        this._$content = await this._stateSelect.renderStateSelect();
        this._$div.append(this._$content);
        this._$div[0].style.width = 'auto';

        this._$content.on('contextmenu', async function (event) {
            event.preventDefault();
            event.stopPropagation();

            const entries = [];
            entries.push(new ContextMenuEntry('Edit', async function (event, target) {
                var data;
                var bExists;
                const controller = app.getController();
                var tmp = await controller.getDataService().fetchData('_registry', null, 'key=profiles');
                if (tmp) {
                    if (tmp.length == 0)
                        data = { 'key': 'profiles', 'value': '{"available":[]}' };
                    else if (tmp.length == 1) {
                        bExists = true;
                        data = tmp[0];
                    }
                }
                if (data) {
                    const obj = new CrudObject('_registry', data);
                    const model = obj.getModel();
                    const mpcc = model.getModelPanelConfigController();
                    const panelConfig = mpcc.getPanelConfig(ActionEnum.delete);
                    const panel = PanelController.createPanelForObject(obj, panelConfig);
                    const modal = await panel.openInModal(bExists ? ActionEnum.update : ActionEnum.create);
                }
                return Promise.resolve(true);
            }));

            const contextMenu = new ContextMenu(this);
            contextMenu.setEntries(entries);
            contextMenu.renderMenu(event.pageX, event.pageY);

            return Promise.resolve();
        }.bind(this));

        return Promise.resolve();
    }

    hideSidePanel() {
        this._$div[0].style.width = '0px';
    }
}