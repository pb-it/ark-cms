class LogEntry {

    _date;
    _section;
    _msg;

    constructor(msg, section) {
        this._date = new Date();
        this._msg = msg;
        if (section)
            this._section = section;
    }

    toString() {
        var str = this._date.toUTCString();
        if (this._section)
            str += " [" + this._section + "]";
        str += " " + this._msg;
        return str;
    }
}