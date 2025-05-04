class TestPanel extends Panel {

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const controller = app.getController();
        var data = await controller.getDataService().fetchData('movie');

        var select = new Select('mSelect', 'movie');
        //select.setSelectedValues(value);
        await select.initSelect(data.slice(0, 4));
        $div.append(await select.render());

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}