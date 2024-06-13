class HelpPanel extends Panel {

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append('<h3 id="keyboard-shortcuts-hotkeys">Keyboard Shortcuts / Hotkeys</h3>\
        <ul>\
        <li>Help: <kbd>Shift</kbd> + <kbd>?</kbd></li>\
        <li>Hard Refresh: <kbd>Ctrl</kbd> + <kbd>R</kbd></li>\
        <li>Search: <kbd>Ctrl</kbd> + <kbd>K</kbd></li>\
        </ul>');

        $div.append('<br/><br/>');

        var $button = $('<button>')
            .text('Show extended help text on GitHub')
            .click(async function (event) {
                event.stopPropagation();

                window.open('https://github.com/pb-it/ark-cms/blob/main/docs/help.md');
            }.bind(this));
        $div.append($button);

        return Promise.resolve($div);
    }
}