async function configure() {
    const controller = app.getController();
    const ds = controller.getDataService();
    const skeleton = [
        { name: 'code', dataType: 'text', required: true }
    ];
    var data;
    const panel = new FormPanel(null, skeleton, data);
    panel.setApplyAction(async function () {
        try {
            controller.setLoadingState(true);

            const fData = await panel.getForm().readForm();
            const ac = app.getController().getApiController();
            const client = ac.getApiClient();
            const response = await client.request('POST', '/api/ext/panelExt/configure', null, fData);
            if (response && response == 'OK') {
                const msg = 'Reload website for the changes to take effect!';
                alert('Changes applied successfully.\n' + msg);
            }

            panel.dispose();
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    });
    return controller.getModalController().openPanelInModal(panel);
}

async function init() {
    const controller = app.getController();

    const scripts = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/panelExt/public";
    if (typeof TestPanel === 'undefined')
        scripts.push(loadScript(publicDir + "/test-panel.js"));
    await Promise.all(scripts);

    const route = {
        "regex": "^/test-panel$",
        "fn": async function () {
            try {
                const controller = app.getController();
                const panel = new TestPanel();
                //const modal = await controller.getModalController().openPanelInModal(panel);
                await controller.getView().getCanvas().showPanels([panel]);
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    return Promise.resolve();
}

export { configure, init };