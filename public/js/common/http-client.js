class HttpError extends Error {

    response;

    constructor(message, response) {
        if (!message && response) {
            if (response.status) {
                message = response.status;
                if (response.statusText)
                    message += ': ' + response.statusText;
            } else
                message = 'ERR_CONNECTION_REFUSED';
            if (response.url)
                message += ' - ' + response.url;
        }
        super(message);
        this.name = this.constructor.name;
        this.response = response;
    }
}

class HttpClient {

    static urlEncode(data) {
        var urlEncodedDataPairs = [];
        for (var key in data) {
            urlEncodedDataPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        return urlEncodedDataPairs.join('&').replace(/%20/g, '+');
    }

    static async request(method, url, options, data) {
        var logger = app.getController().getLogger();
        var msg = method + " " + url;
        logger.addLogEntry(new LogEntry(msg, SeverityEnum.INFO, 'HttpClient'));

        return new Promise(function (resolve, reject) {
            var xhr;

            function error(event, bTimeout) { // or use xhr direct instead of event parameter
                var request;
                if (event instanceof XMLHttpRequest)
                    request = event;
                else if (event['target'] && event['target'] instanceof XMLHttpRequest)
                    request = event['target'];
                var response;
                if (request) {
                    response = { 'url': url };
                    if (bTimeout)
                        response['timeout'] = true;
                    if (request['status'] != undefined)
                        response['status'] = request['status'];
                    if (request['statusText'] != undefined)
                        response['statusText'] = request['statusText'];
                    if (request['response'] != undefined)
                        response['body'] = request['response'];
                }
                var err = new HttpError(null, response);
                reject(err);
            }

            if (window.XMLHttpRequest)
                xhr = new XMLHttpRequest();
            else
                xhr = new ActiveXObject("Microsoft.XMLHTTP");

            //xhr.onreadystatechange = func;
            //xhr.onload = (e) => resolve(xhr.response);
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
                //alert("time out");
                error(this, true);
            }

            xhr.open(method, url); //3rd parameter 'false' would make the request synchronous
            if (options && options['responseType'])
                xhr.responseType = options['responseType']; //text, document, json, blob, ...
            if (options && options['timeout'])
                xhr.timeout = options['timeout'];
            else
                xhr.timeout = 0;

            if (options && options['withCredentials'] === true)
                xhr.withCredentials = true;

            var body;
            if (data) {
                if (typeof data === 'object') {
                    if (data instanceof FormData) {
                        body = data;
                    } else {
                        xhr.setRequestHeader("Content-type", "application/json");
                        body = JSON.stringify(data, function (k, v) { return v === undefined ? null : v; });
                    }
                } else {
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    body = data; //urlEncode(data);
                }
            }

            //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

            xhr.send(body);
        });
    }
}