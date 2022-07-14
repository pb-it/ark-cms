const SPACE = "&nbsp;";

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