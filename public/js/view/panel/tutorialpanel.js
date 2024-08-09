class TutorialPanel extends Panel {

    _page;

    constructor() {
        super();

        this._page = 1;
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });
        switch (this._page) {
            case 1:
                $div.append("<h2>Welcome</h2>");
                $div.append("This tutorial with guide you through the basics.<br/><br/>");

                var $skip = $('<button>')
                    .text('Skip')
                    .click(async function (event) {
                        event.stopPropagation();

                        this.dispose();
                    }.bind(this));
                $div.append($skip);
                var $continue = $('<button>')
                    .text('Start')
                    .css({ 'float': 'right' })
                    .click(async function (event) {
                        event.stopPropagation();
                        this._page = 2;
                        this.render();
                    }.bind(this));
                $div.append($continue);
                break;
            case 2:
                $div.append(`<img src=\"https://img.freepik.com/free-vector/construction-with-black-yellow-stripes_1017-30755.jpg\"
    alt=\"under construction - coming soon ...\"/>
<br/>
<div style=\"float: right;\">Designed by <a href=\"www.freepik.com\">Freepik</a></div>
<br/>
<br/>`);

                var $continue = $('<button>')
                    .text('Close')
                    .css({ 'float': 'right' })
                    .click(async function (event) {
                        event.stopPropagation();

                        this.dispose();
                    }.bind(this));
                $div.append($continue);
        }
        return Promise.resolve($div);
    }
}