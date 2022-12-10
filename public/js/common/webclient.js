class WebClient {

    static async checkImageExists(imageSrc) {
        return new Promise(async (resolve, reject) => {
            var img = new Image();
            img.onload = () => { resolve(true); };
            img.onerror = () => { reject(); };
            img.src = imageSrc;
        });
    }

    static async request(method, url, data) {
        var logger = app.controller.getLogger();
        var msg = method + " " + url;
        logger.addLogEntry(new LogEntry(msg, SeverityEnum.INFO, 'WebClient'));

        return new Promise(function (resolve, reject) {
            var xhr;

            function error(event) { // or use xhr direct instead of event
                var err;
                if (event.status && event.statusText) {
                    err = {
                        status: event.status,
                        statusText: event.statusText
                    };
                    if (event.response)
                        err.response = event.response;
                }
                reject(err);
            }

            if (window.XMLHttpRequest) {
                xhr = new XMLHttpRequest();
            }
            else {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }

            xhr.onload = function () {
                if (this.readyState == 4) {
                    if (this.status >= 200 && this.status < 300)
                        resolve(xhr.response);
                    else
                        error(this);
                }
            };

            xhr.onerror = error;

            xhr.ontimeout = function () {
                alert("time out");
                error(this);
            }

            xhr.open(method, url); //3rd parameter 'false' would make the request synchronous
            xhr.timeout = 0;
            //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

            xhr.withCredentials = true;

            var params;
            if (data) {
                if (typeof data === 'object') {
                    xhr.setRequestHeader("Content-type", "application/json");
                    params = JSON.stringify(data, function (k, v) { return v === undefined ? null : v; });
                } else {
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    params = data; //urlEncode(data);
                }
            }
            xhr.send(params);
        });
    }

    static urlEncode(data) {
        var urlEncodedDataPairs = [];
        for (name in data) {
            urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
        }

        return urlEncodedDataPairs.join('&').replace(/%20/g, '+');
    }

    static async curl(url, bVerbose) {
        var data;
        var response = await WebClient.request('POST', '/system/curl', { 'url': url });
        if (typeof Flatted === 'undefined')
            await loadScript("https://unpkg.com/flatted@3.2.7/min.js");
        var obj = Flatted.parse(response);
        if (bVerbose)
            data = obj;
        else
            data = obj['data'];
        return data;
    }

    /**
     * fetch simple JSON
     * @param {*} url 
     */
    static async fetchJson(url) {
        var obj;
        var str = await WebClient.request("GET", url);
        if (str)
            obj = JSON.parse(str);
        return Promise.resolve(obj);
    }

    static async fetchBlob(url) {
        return new Promise((resolve) => {
            var xhr = new XMLHttpRequest();
            //xhr.onreadystatechange = func;
            xhr.onload = (e) => resolve(xhr.response);
            xhr.open('GET', url);

            xhr.responseType = 'blob'; //text, document, json, blob, ...
            //xhr.setRequestHeader('Content-type', 'application/json');
            //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

            xhr.send();
        });
    }

    static async fetchFile(url) {
        return new Promise((resolve) => {
            var xhr = new XMLHttpRequest();
            //xhr.onreadystatechange = func;
            //xhr.onload = (e) => resolve(xhr.response);
            xhr.onload = function () {
                const mime = this.getResponseHeader('content-type'); //image/png
                const disposition = this.getResponseHeader('content-disposition'); //inline; filename="d50c83cc0c6523b4d3f6085295c953e0.png"

                console.log(mime);
                console.log(disposition);

                var filename;
                if (disposition)
                    filename = disposition.match(/filename="(.*?)"/)[1]; //regex

                var file = new File([this.response], filename, { type: mime, lastModified: new Date().getTime() })
                resolve(file);
            };
            xhr.open('GET', url);

            xhr.responseType = 'blob'; //text, document, json, blob, ...
            //xhr.setRequestHeader('Content-type', 'application/json');
            //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

            xhr.send();
        });

        /*//const response = await fetch(url);
        const response = await fetch(url, {
            method: "GET",
            mode: 'cors',
            headers: {}
        });
        return response.blob(); //response.json()*/
    }
}