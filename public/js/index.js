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

async function loadScript(url) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;

        script.onload = () => resolve();
        script.onerror = function (err) {
            alert("Error while loading '" + url + "'");
            //console.error(err);
            reject(err);
        }
        //script.onreadystatechange

        document.head.append(script);
    });
}

async function loadStyle(url) {
    return new Promise(function (resolve, reject) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.media = 'all';
        link.href = url;

        link.onload = () => resolve();
        link.onerror = () => reject(new Error("Error while loading '" + url + "'"));

        document.head.append(link);
    });
}

function loadCode(code) {
    var script = document.createElement('script');
    script.type = 'text/javascript'; //'module'
    script.innerHTML = code;
    (document.head || document.getElementsByTagName('head')[0]).appendChild(script);
    //document.body.appendChild(s);
}

async function loadModule(code) {
    var module;
    var objectURL = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try {
        module = await import(objectURL);
    } catch (error) {
        console.error(error);
        module = null;
        URL.revokeObjectURL(objectURL);
        objectURL = null;
    }
    return Promise.resolve(module);
}

$(document).ready(async function () {
    if (featureDetection()) {
        app = new Application();
        await app.run();
    } else
        alert('ECMAScript 2016 not fully supported! Use an modern browser to access this website!');
    return Promise.resolve();
});