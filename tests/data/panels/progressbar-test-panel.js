class TestPanel extends Panel {

    _progressBar;
    _percent;

    constructor() {
        super();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        this._progressBar = new ProgressBar();
        this._percent = 0;
        $div.append(await this._progressBar.render());
        this._run();

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async _run() {
        do {
            await sleep(1000);
            this._percent += 10;
            this._progressBar.set(this._percent);
        } while (this._percent < 100)
        /*var id = setInterval(update.bind(this), 1000);
        function update() {
            if (this._percent >= 100) {
                clearInterval(id);
            } else {
                this._percent += 10;
                this._progressBar.set(this._percent);
            }
        }*/
        return Promise.resolve();
    }
}