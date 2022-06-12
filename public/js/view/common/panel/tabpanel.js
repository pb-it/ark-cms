class TabPanel extends Panel {

    _panels;
    _$tabSelect;
    _$tabContent;

    _openTab;
    _tabSwitchCallback;

    constructor(config) {
        super(config);

        this._panels = [];
    }

    getClass() {
        return TabPanel;
    }

    addPanel(panel) {
        this._panels.push(panel);
    }

    setTabSwitchCallback(cb) {
        this._tabSwitchCallback = cb;
    }

    getOpenTab() {
        return this._openTab;
    }

    async openTab(panel) {
        if (this._tabSwitchCallback)
            await this._tabSwitchCallback(this._openTab, panel);

        this._openTab = panel;

        if (this._$tabSelect) {
            await this._renderTabSelect();
            await this._renderTabContent();
        }
        return Promise.resolve();
    }

    async _renderContent() {
        var $div = $('<div/>');
        this._$tabSelect = $('<div/>')
            .addClass('tab');
        $div.append(this._$tabSelect);

        this._$tabContent = $('<div/>');
        $div.append(this._$tabContent);

        if (this._apply) {
            $div.append($('<button/>')
                .html("Apply and Close")
                .css({ 'float': 'right' })
                .click(async function (event) {
                    event.stopPropagation();

                    await this._apply();

                    return Promise.resolve();
                }.bind(this))
            );
        }

        await this._renderTabSelect();
        await this._renderTabContent()
        return Promise.resolve($div);
    }

    async _renderTabSelect() {
        this._$tabSelect.empty();
        var config;
        var title;
        var $button;
        for (let panel of this._panels) {
            config = panel.getConfig();
            if (config && config.title)
                title = config.title
            else
                title = 'undefined';
            $button = $('<button/>')
                .text(title)
                .click(panel, async function (event) {
                    this.openTab(panel);
                }.bind(this));
            if (panel == this._openTab)
                $button.addClass('active');
            this._$tabSelect.append($button);
        }
        return Promise.resolve();
    }

    async _renderTabContent() {
        this._$tabContent.empty();
        if (this._openTab)
            this._$tabContent.append(await this._openTab.render());
        return Promise.resolve();
    }
}