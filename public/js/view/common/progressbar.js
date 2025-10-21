class ProgressBar {

    _max;

    _width;
    _$bar;
    _$label;

    constructor(width) {
        if (width)
            this._width = width;
        else
            this._width = '100%';
    }

    async render() {
        const $div = $('<div/>')
            .addClass('progressbar')
            .css({
                'width': this._width,
                'background-color': 'grey'
            });
        /*this._$bar = $('<progress/>')
            .prop('id', 'progress')
            .prop('value', '0')
            .prop('max', '100');*/
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

    setPercentage(percent) {
        this._$bar[0].style.width = percent + '%';
        /*this._$bar.css({
            'width': percent + '%'
        });*/
        //this._$bar[0].value = percent; // for native version
        this._$label[0].innerHTML = percent + '%';
    }

    setMax(max) {
        this._max = max;
    }

    setValue(value) {
        if (this._max) {
            const percent = Math.round((value / max) * 100);
            this._$bar[0].style.width = percent + '%';
            this._$label[0].innerHTML = value + '/' + max;
        } else
            throw new Error('Missing \'max\' value');
    }
}