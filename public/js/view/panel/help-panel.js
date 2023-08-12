class HelpPanel extends Panel {

    constructor() {
        super();
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append('<h3 id="keyboard-shortcuts-hotkeys">keyboard shortcuts / hotkeys</h3>\
        <ul>\
        <li>hard refresh: <kbd>Ctrl</kbd> + <kbd>R</kbd></li>\
        </ul>');

        $div.append('<br/><br/>');

        var $button = $('<button>')
            .text('Show extended help text on GitHub')
            .click(async function (event) {
                event.stopPropagation();

                window.open('https://github.com/pb-it/wing-cms/blob/main/docs/help.md');
            }.bind(this));
        $div.append($button);

        return Promise.resolve($div);
    }
}