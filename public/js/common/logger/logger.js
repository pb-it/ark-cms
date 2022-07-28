class Logger {

    _entries;

    constructor() {
        this._entries = [];
    }

    addLogEntry(entry) {
        this._entries.push(entry);
    }

    getAllLogEntries() {
        return this._entries;
    }
}