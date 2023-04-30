class StorageController {

    constructor() {
    }

    storeLocal(key, value) {
        if (window.localStorage)
            window.localStorage.setItem(key, value);
        else
            throw new Error('Local storage not available');
    }

    loadLocal(key) {
        var value;
        if (window.localStorage)
            value = window.localStorage.getItem(key);
        else
            throw new Error('Local storage not available');
        return value;
    }

    removeItem(key) {
        var value;
        if (window.localStorage)
            value = window.localStorage.removeItem(key);
        else
            throw new Error('Local storage not available');
        return value;
    }
}