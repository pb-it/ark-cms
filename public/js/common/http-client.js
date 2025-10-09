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

            if (response.body) {
                var bHtml;
                var headers = response['headers'];
                if (headers) {
                    var type = headers[Object.keys(headers).find(key => key.toLowerCase() === 'content-type')];
                    bHtml = (type && (type == 'text/html; charset=UTF-8'));
                }
                if (bHtml || response.body.startsWith('<!DOCTYPE html>') || response.body.endsWith('</html>'))
                    message += '\n\nResponse:\n' + encodeText(response.body);
                else
                    message += '\n\nResponse:\n' + response.body;
            }
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
        var logger;
        if (typeof app !== 'undefined' && typeof app.getController == 'function') {
            const controller = app.getController();
            if (controller && typeof controller.getLogger == 'function')
                logger = controller.getLogger();
        }
        if (logger) {
            const msg = method + " " + url;
            logger.addLogEntry(new LogEntry(msg, SeverityEnum.INFO, 'HttpClient'));
        }

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
                        //xhr.setRequestHeader('Content-type', 'multipart/form-data');
                        body = data;
                    } else {
                        xhr.setRequestHeader('Content-type', 'application/json');
                        body = JSON.stringify(data, function (k, v) { return v === undefined ? null : v; });
                    }
                } else if (typeof data === 'string' || data instanceof String) {
                    var type;
                    if (options && options['headers'])
                        type = options['headers']['Content-type']
                    if (!type)
                        type = 'text/plain';
                    xhr.setRequestHeader('Content-type', type);
                    body = data;
                } else
                    throw new Error('Type of data not supported');
            }

            //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

            xhr.send(body);
        });
    }
}