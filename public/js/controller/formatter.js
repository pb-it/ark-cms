class Formatter {

    _style;

    constructor() {
    }

    setStyle(language, style) {
        if (!this._style)
            this._style = {};
        this._style[language] = style;
    }

    isSupported(language) {
        return (language === 'json' || language === 'javascript' ||
            this._style && Object.keys(this._style).includes(language));
    }

    async formatText(code, language) {
        if (this._style && this._style[language])
            code = await this._style[language](code);
        else
            code = await formatCode(code, language);
        return Promise.resolve(code);
    }
}