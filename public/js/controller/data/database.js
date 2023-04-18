class Database {

    static VERSION_IDENT = 'IndexedDB_version';

    static async _open(name, callback) {
        return new Promise(function (resolve, reject) {
            const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
            var sc = app.getController().getStorageController();
            var version;
            var str = sc.loadLocal(Database.VERSION_IDENT);
            if (str)
                version = parseInt(str);
            if (version && callback)
                version++;
            const request = indexedDB.open(name, version);

            var timeout = setTimeout(function () {
                timeout = null;
                if (confirm('Request timeout!\n\nThe database might be blocked by another tab.\nClosing the tab or resetting its connection might resolve the problem.\n\nIf the problem remains and you have already loaded data you can continue progress, but futher changes will not be cached in database until successfull reconnect.\nContinue without database connection?')) {
                    reject(new Error(`Database error: blocked`));
                }
            }, 1000);

            request.onerror = (event) => {
                clearTimeout(timeout);
                reject(new Error(`Database error: ${event.target.errorCode}`));
            };
            request.onsuccess = (event) => {
                clearTimeout(timeout);
                resolve(event.target.result);
            };
            request.onupgradeneeded = (event) => {
                clearTimeout(timeout);
                var db = event.target.result;
                if (callback)
                    callback(db);
                app.getController().getStorageController().storeLocal(Database.VERSION_IDENT, event.newVersion);
                resolve(db);
            };


        });
    }

    static async _deleteDatabase(name) {
        return new Promise(function (resolve, reject) {
            const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = resolve;
            request.onerror = (event) => {
                reject(new Error(`Database error: ${event.target.errorCode}`));
            };
            request.onblocked = (event) => {
                reject(new Error(`Database error: ${event.type}`));
            };
        });
    }

    static async _getAll(db, storeName) {
        return new Promise((resolve, reject) => {
            var items = [];
            const trx = db.transaction(storeName, IDBTransaction.READ_ONLY);
            const store = trx.objectStore(storeName);

            trx.onerror = reject;
            trx.oncomplete = () => resolve(items);

            var cursorRequest = store.openCursor();
            cursorRequest.onerror = function (error) {
                //console.error(error);
                reject(error);
            };
            cursorRequest.onsuccess = function (evt) {
                var cursor = evt.target.result;
                if (cursor) {
                    items.push(cursor.value);
                    cursor.continue();
                }
            };
        });
    }

    static async _put(db, storeName, items) {
        return new Promise((resolve, reject) => {
            const trx = db.transaction(storeName, "readwrite", { durability: "relaxed" });
            const store = trx.objectStore(storeName);

            trx.onerror = reject;
            trx.oncomplete = () => resolve();

            if (Array.isArray(items)) {
                for (var item of items)
                    store.put(item);
            } else
                store.put(items);

            trx.commit();
        });
    }

    static async _delete(db, storeName, id) {
        return new Promise((resolve, reject) => {
            const trx = db.transaction(storeName, "readwrite", { durability: "relaxed" });
            const store = trx.objectStore(storeName);

            trx.onerror = reject;
            trx.oncomplete = () => resolve();

            store.delete(id);

            trx.commit();
        });
    }

    _controller;

    _name;
    _db;

    constructor(name) {
        this._controller = app.getController();

        this._name = name;
    }

    async initDatabase(callback) {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
        if (callback) {
            var db = await Database._open(this._name, callback);
            db.close();
        }
        this._db = await Database._open(this._name);
        this._db.onerror = (event) => {
            console.error(`Database error: ${event.target.errorCode}`);
        };
        return Promise.resolve();
    }

    async deleteDatabase() {
        this._db.close();
        return Database._deleteDatabase(this._name);
    }

    async initObjectStore(name) {
        if (this._db && !this._db.objectStoreNames.contains(name)) {
            await this.initDatabase(function (db) {
                db.createObjectStore(name, { 'keyPath': 'id', autoIncrement: false });
            });
        }
        return Promise.resolve();
    }

    async deleteObjectStore(name) {
        if (this._db && this._db.objectStoreNames.contains(name)) {
            await this.initDatabase(function (db) {
                db.deleteObjectStore(name);
            });
        }
        return Promise.resolve();
    }

    async getAll(storeName) {
        var result;
        if (this._db.objectStoreNames.contains(storeName))
            result = await Database._getAll(this._db, storeName);
        return Promise.resolve(result);
    }

    async put(storeName, items) {
        return Database._put(this._db, storeName, items);
    }

    async delete(storeName, id) {
        return Database._delete(this._db, storeName, id);
    }

    /*async clear(storeName) {
        //TODO:
    }*/
}