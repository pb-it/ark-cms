class Logger {

    _entries;

    constructor() {
        this._entries = [];
    }

    log(msg) {
        this._entries.push(new Date().toUTCString() + " [WebClient] " + msg);
    }

    getAllEntries() {
        return this._entries;
    }
}