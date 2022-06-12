class List {

    _entries;

    constructor(name) {
        this._name = name;

        this._entries = [];
    }

    addEntry(entry) {
        this._entries.push(entry);
    }

    getEntries() {
        return this._entries;
    }
}