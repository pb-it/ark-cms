class DataType {

    _tag;
    _baseDataType;

    constructor() {
        if (new.target === DataType) {
            throw new TypeError("Cannot create an instance of abstract class");
        }
    }

    getTag() {
        return this._tag;
    }

    getBaseDataType() {
        return this._baseDataType;
    }

    getSkeleton() {
        throw new Error("Abstract method!");
    }

    getFormEntryClass() {
        throw new Error("Abstract method!");
    }

    async renderView() {
        throw new Error("Abstract method!");
    }

    getSortFunction() {
        return function (arr, criteria) {
            if (criteria === "asc")
                arr.sort(function (a, b) {
                    if (a[prop] === "" || a[prop] === null) return 1;
                    if (b[prop] === "" || b[prop] === null) return -1;
                    if (a[prop] === b[prop]) return 0;
                    return a[prop].localeCompare(b[prop]);
                });
            else if (criteria === "desc")
                arr.sort(function (a, b) {
                    if (a[prop] === "" || a[prop] === null) return 1;
                    if (b[prop] === "" || b[prop] === null) return -1;
                    if (a[prop] === b[prop]) return 0;
                    return b[prop].localeCompare(a[prop]);
                });
        }
    }

    getFilterFunction() {
        return function (items, template, property) {
            return Filter.filterString(items, template, property, FilterEnum.contains);
        }
    }

    getHasChangedFunction() {
        return null;
    }
}