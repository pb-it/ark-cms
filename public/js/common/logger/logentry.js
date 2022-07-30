const SeverityEnum = Object.freeze({ INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR' });

class LogEntry {

    _date;
    _severity;
    _section;
    _msg;

    constructor(msg, severity, section) {
        this._date = new Date();
        this._msg = msg;
        if (severity)
            this._severity = severity;
        if (section)
            this._section = section;
    }

    toString() {
        var str = this._date.toUTCString();
        if (this._severity)
            str += " [" + this._severity + "]";
        if (this._section)
            str += " [" + this._section + "]";
        str += " " + this._msg;
        return str;
    }
}