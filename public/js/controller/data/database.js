class Database {

    static VERSION_IDENT = 'IndexedDB_version';
    static META_IDENT = 'IndexedDB_meta';

    static _parseError(event) {
        var msg;
        if (event.target.error) {
            if (event.target.error.name)
                msg = event.target.error.name
            else
                msg = 'IndexedDB error';
            if (event.target.error.message)
                msg += ': ' + event.target.error.message;
        } else if (event.target.errorCode)
            msg = 'IndexedDB error: ' + event.target.errorCode;
        else
            msg = 'IndexedDB error';
        return new Error(msg);
    }

    static async _databaseExists(name) {
        return new Promise(async function (resolve, reject) {
            if (navigator.userAgent.includes('Chrome')) {
                var exists = false;
                const databases = await window.indexedDB.databases();
                if (databases)
                    exists = databases.map(db => db.name).includes(name);
                resolve(exists);
            } else {
                const request = indexedDB.open(name);
                var exists = true;
                var timeout = setTimeout(function () {
                    timeout = null;
                    if (confirm('Request timeout!\n\nThe database might be blocked by another tab.\nClosing the tab or resetting its connection might resolve the problem.\n\nIf the problem remains and you have already loaded data you can continue progress, but futher changes will not be cached in database until successfull reconnect.\nContinue without database connection?')) {
                        reject(new Error(`Database error: blocked`));
                    }
                }, 1000);
                request.onerror = (event) => {
                    clearTimeout(timeout);
                    const bAborted = (event.target.error.name == 'AbortError' && event.target.error.code == 20);
                    if (bAborted && !exists)
                        resolve(exists);
                    else
                        reject(Database._parseError(event));
                };
                request.onsuccess = function (event) {
                    clearTimeout(timeout);
                    const db = event.target.result;
                    if (db) {
                        db.close();
                        if (!exists)
                            indexedDB.deleteDatabase(name);
                    }
                    resolve(exists);
                }
                request.onupgradeneeded = function (event) {
                    event.target.transaction.abort();
                    exists = false;
                }
            }
        });
    }

    static async _open(name, callback) {
        return new Promise(function (resolve, reject) {
            const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
            const sc = app.getController().getStorageController();
            var version;
            const str = sc.loadLocal(Database.VERSION_IDENT);
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
                reject(Database._parseError(event));
            };
            request.onsuccess = (event) => {
                clearTimeout(timeout);
                resolve(event.target.result);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (callback)
                    callback(db);
                app.getController().getStorageController().storeLocal(Database.VERSION_IDENT, event.newVersion);
            };
        });
    }

    static async _deleteDatabase(name) {
        return new Promise(function (resolve, reject) {
            const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = resolve;
            request.onerror = (event) => {
                reject(Database._parseError(event));
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

    static async _clear(db, storeName) {
        return new Promise((resolve, reject) => {
            const trx = db.transaction(storeName, "readwrite", { durability: "relaxed" });
            const store = trx.objectStore(storeName);

            trx.onerror = reject;
            trx.oncomplete = () => resolve();

            store.clear();

            trx.commit();
        });
    }

    static async _count(db, storeName) {
        return new Promise((resolve, reject) => {
            var store = db.transaction(storeName).objectStore(storeName);

            var count = store.count();

            count.onerror = reject;
            count.onsuccess = function () {
                resolve(count.result);
            }
        });
    }

    _controller;

    _name;
    _db;

    _meta;

    constructor(name) {
        this._controller = app.getController();

        this._name = name;

        const sc = this._controller.getStorageController();
        const meta = sc.loadLocal(Database.META_IDENT);
        if (meta)
            this._meta = JSON.parse(meta);
        else
            this._meta = {};
    }

    isConnected() {
        return this._db !== undefined && this._db !== null;
    }

    getMetaData() {
        return this._meta;
    }

    async initDatabase(callback, bDelete) {
        const sc = app.getController().getStorageController();
        const version = sc.loadLocal(Database.VERSION_IDENT);
        if (!version || bDelete) {
            if (await Database._databaseExists(this._name))
                await this.deleteDatabase();
        }
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
            var msg = 'Database error';
            if (event.target.errorCode)
                msg += ': ' + event.target.errorCode;
            console.error(msg);
        };
        return Promise.resolve();
    }

    async deleteDatabase() {
        if (this._db)
            this._db.close();
        this._db = null;
        await Database._deleteDatabase(this._name);
        const sc = app.getController().getStorageController();
        sc.removeItem(Database.VERSION_IDENT);
        sc.removeItem(Database.META_IDENT);
        this._meta = {};
        return Promise.resolve();
    }

    getObjectStoreNames() {
        var names;
        if (this._db)
            names = this._db.objectStoreNames;
        return names;
    }

    async initObjectStore(name, data, id) {
        if (this._db) {
            if (this._db.objectStoreNames.contains(name))
                await this.clearObjectStore(name);
            else {
                await this.initDatabase(function (db) {
                    db.createObjectStore(name, { 'keyPath': 'id', autoIncrement: false });
                });
            }
            await this.put(name, data);
            this._meta[name] = id;
            const sc = app.getController().getStorageController();
            sc.storeLocal(Database.META_IDENT, JSON.stringify(this._meta));
        }
        return Promise.resolve();
    }

    async deleteObjectStore(name) {
        if (this._db && this._db.objectStoreNames.contains(name)) {
            await this.initDatabase(function (db) {
                db.deleteObjectStore(name);
            });
        }
        delete this._meta[name];
        const sc = app.getController().getStorageController();
        sc.storeLocal(Database.META_IDENT, JSON.stringify(this._meta));
        return Promise.resolve();
    }

    async getAll(storeName) {
        var result;
        if (this._db && this._db.objectStoreNames.contains(storeName))
            result = await Database._getAll(this._db, storeName);
        return Promise.resolve(result);
    }

    async put(storeName, items) {
        return Database._put(this._db, storeName, items);
    }

    async delete(storeName, id) {
        return Database._delete(this._db, storeName, id);
    }

    async count(storeName) {
        return Database._count(this._db, storeName);
    }

    async clearObjectStore(storeName) {
        await Database._clear(this._db, storeName);
        this._meta[storeName] = null;
        return Promise.resolve();
    }

    async updateDatabase(changes) {
        var id;
        const cache = await app.getController().getDataService().getCache();
        if (!changes) {
            id = this.getChangeId();
            if (id)
                changes = await cache.getChanges(id);
        }
        if (changes) {
            id = await cache.applyChanges(changes);
            this.setChangeId(null, id);
        }
        return Promise.resolve(id);
    }

    getChangeId(name) {
        var id;
        if (name)
            id = this._meta[name];
        else {
            if (Object.keys(this._meta).length > 0) {
                for (var x in this._meta) {
                    if (this._meta[x]) {
                        if (id) {
                            if (this._meta[x] < id)
                                id = this._meta[x];
                        } else
                            id = this._meta[x];
                    }
                }
            }
        }
        return id;
    }

    setChangeId(name, id) {
        if (name)
            this._meta[name] = id;
        else {
            for (var x in this._meta) {
                this._meta[x] = id;
            }
        }
        const sc = app.getController().getStorageController();
        sc.storeLocal(Database.META_IDENT, JSON.stringify(this._meta));
    }
}