const SPACE = "&nbsp;";

function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    else if (Array.isArray(value))
        return value.every(isEmpty);
    else if (typeof (value) === 'object')
        return Object.values(value).every(isEmpty);
    else
        return false;
}

function shrink(obj) {
    var newObj;
    if (typeof (obj) === 'object') {
        //Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);

        newObj = null;
        Object.keys(obj).forEach((key) => {
            var value = shrink(obj[key]);
            if (value) {
                if (!newObj)
                    newObj = {};
                newObj[key] = value;
            }
        });
    } else
        newObj = obj;
    return newObj;
}

function getAllPropertyNames(obj) {
    var props = [];
    do {
        Object.getOwnPropertyNames(obj).forEach((prop) => {
            if (props.indexOf(prop) === -1)
                props.push(prop);
        });
    } while ((obj = Object.getPrototypeOf(obj)));
    return props;
};

/**
 * https://stackoverflow.com/questions/8779249/how-to-stringify-inherited-objects-to-json
 * @param {*} obj 
 * @returns 
 */
function flatten(obj) {
    var newObj = {};
    var props = getAllPropertyNames(obj);
    props.forEach((prop) => {
        newObj[prop] = obj[prop];
    });
    return newObj;
}

function getPrettyJSON(obj) {
    return JSON.stringify(obj, function (key, value) { return isEmpty(value) ? undefined : value; }, '\t');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * encode for HTML / prevent interpretation of tags: '<meta>' -> '&lt;meta;&gt;'
 * @param {*} text 
 * @returns 
 */
function encodeText(text) {
    //return text.replace(/<link>([A-ZÄÖÜa-zäöüß@µ§$%!?0-9_\s\/\\\=\:\.\'\"\;\,\#\&\|\-\+\~\*\>]*)<\/link>/g, '<a href="$1">$1</a>');
    text = text.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
        return '&#' + i.charCodeAt(0) + ';';
    });
    return replaceLineBreak(replaceApostrophe(text));
}

function replaceApostrophe(str) {
    return (str + '').replace(/'/g, '&apos;');
}

function replaceLineBreak(str) {
    return (str + '').replace(/(?:\r\n|\r|\n)/g, '<br>');
}

function addSlashes(str) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function getFileExtensionFromUrl(url) {
    var index = url.indexOf('?');
    if (index >= 0) {
        url = url.substring(0, index);
    }
    index = url.lastIndexOf('/');
    if (index >= 0) {
        url = url.substring(index + 1);
    }
    index = url.lastIndexOf('.');
    if (index >= 0) {
        url = url.substring(index + 1);
    }
    return url;
}

function isImage(url) {
    var ext = getFileExtensionFromUrl(url).toLowerCase();
    return (ext === "png" || ext === "jpg" || ext === "jpeg" ||
        ext === "tiff" || ext === "tif" ||
        ext === "gif" || ext === "webp" || ext === "svg" || ext === "avif");
}

function isVideo(url) {
    var ext = getFileExtensionFromUrl(url).toLowerCase();
    return (ext === "mp4" || ext === "avi" || ext === "webm" || ext === "mkv" || ext === "vid");
}