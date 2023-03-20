var app;

function featureDetection() {
    var bSupported = false;
    try {
        bSupported = (typeof Array.prototype.includes === "function");
    } catch (error) {
        console.log(error);
    }
    return bSupported;
}

function goodbye(e) {
    var bWarning = true;
    if (bWarning) {
        if (!e)
            e = window.event;
        e.cancelBubble = true;
        e.returnValue = 'You sure you want to leave?';
        if (e.stopPropagation) {
            e.stopPropagation();
            e.preventDefault();
        }
    }
}

window.onload = function () {
};

window.onbeforeunload = goodbye;

$(document).ready(async function () {
    if (featureDetection()) {
        app = new Application();
        await app.run();
    } else
        alert('ECMAScript 2016 not fully supported! Use an modern browser to access this website!');
    return Promise.resolve();
});