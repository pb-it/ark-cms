class List {

    _entries;

    constructor(name) {
        this._name = name;

        this._entries = [];
    }

    addEntry(entry) {
        this._entries.push(entry);
    }

    removeEntry(entry) {
        this._entries = this._entries.filter(function (x) { return x != entry });
    }

    getEntries() {
        return this._entries;
    }
}