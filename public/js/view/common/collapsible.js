class Collapsible {

    id;
    name;
    openCallback;

    active = false;
    $button;
    $content;
    content;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    render() {
        var $d = $('<div>')
            .attr('id', this.id);

        this.$button = $('<button/>')
            .text(this.name)
            .addClass("collapsible")
            .click(this._toggle.bind(this));

        this.$content = $('<div>')
            .addClass("collapsible-content");

        $d.append(this.$button);
        $d.append(this.$content);

        return $d;
    }

    async _toggle() {
        this.active = !this.active;
        if (this.active)
            this.$button.addClass('active');
        else
            this.$button.removeClass('active');
        if (this.openCallback)
            await this.openCallback();
        this.updateHeight();
    }

    setContent(content) {
        this.content = content;
        this.$content.empty();
        if (this.content)
            this.$content.append(content);
        this.updateHeight();
    }

    setOpenCallback(callback) {
        this.openCallback = callback;
    }

    updateHeight() {
        if (this.content) {
            var maxHeight;
            if (this.active) {
                maxHeight = this.$content.prop('scrollHeight') + 100;
            } else
                maxHeight = 0;
            this.$content.css({ 'maxHeight': maxHeight + "px" });
        }
    }
}