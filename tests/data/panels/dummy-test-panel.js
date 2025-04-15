class TestPanel extends Panel {

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append('<h2>Test</h2>');

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}