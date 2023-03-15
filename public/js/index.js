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

window.onload = function () {
};

$(document).ready(async function () {
    if (featureDetection()) {
        app = new Application();
        await app.run();
    } else
        alert('ECMAScript 2016 not fully supported! Use an modern browser to access this website!');
    return Promise.resolve();
});