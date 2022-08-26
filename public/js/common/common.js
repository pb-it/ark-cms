const SPACE = "&nbsp;";

function isEqualJson(obj1, obj2) {
    var str1 = JSON.stringify(obj1);
    var str2 = JSON.stringify(obj2);
    return str1 === str2;
}

/**
 * 
 * @param {*} value 
 * @returns 
 */
function isEmpty(value) {
    var newValue = shrink(value);
    if (newValue)
        return Object.keys(newValue).length === 0;
    else
        return true;
}

/**
 * removes empty properties - null / undefined / '' / []
 * @param {*} value 
 * @param {*} bRemoveZeroLength 
 * @returns 
 */
function shrink(value, bRemoveZeroLength = true) {
    var newValue;
    if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
            value.forEach((x) => {
                var val = shrink(x);
                if (val !== undefined) {
                    if (!newValue)
                        newValue = [];
                    newValue.push(x);
                }
            });
            if (!bRemoveZeroLength && !newValue)
                newValue = [];
        } else if (typeof (value) === 'object') {
            //Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);

            Object.keys(value).forEach((key) => {
                var val = shrink(value[key]);
                if (val !== undefined) {
                    if (!newValue)
                        newValue = {};
                    newValue[key] = val;
                }
            });
        } else if (typeof (value) === 'string' || (value) instanceof String) {
            if (value.length > 0 || !bRemoveZeroLength)
                newValue = value;
        } else
            newValue = value;
    }
    return newValue;
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
 * copies inherited poperties to new object prototype-free object
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