class ProgressBar {

    _$bar;
    _$label;

    constructor() {
    }

    async render() {
        const $div = $('<div/>')
            .addClass('progressbar')
            .css({
                'width': '100%',
                'background-color': 'grey'
            });
        this._$bar = $('<div/>')
            .css({
                'width': '0%',
                'height': '30px',
                'background-color': '#04AA6D'
            });
        $div.append(this._$bar);
        this._$label = $('<div/>')
            .css({
                'float': 'right'
            })
            .append('0%');
        $div.append(this._$label);

        return Promise.resolve($div);
    }

    set(percent) {
        this._$bar[0].style.width = percent + "%";
        this._$label[0].innerHTML = percent + "%";
        /*this._$bar.css({
            'width': percent + '%'
        });*/
    }
}