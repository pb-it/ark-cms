class Ajax {

    /**
     * fetch simple JSON
     * @param {*} url 
     */
    static async fetch(url) {
        var obj;
        var str = await Ajax.request("GET", url);
        if (str)
            obj = JSON.parse(str);
        return Promise.resolve(obj);
    }

    /**
     * Test with delay - did not work
     * @param {*} method 
     * @param {*} url 
     * @param {*} obj 
     */
    static _request(method, url, obj) {
        if (method == "GET") {
            return Ajax._request(method, url, obj);
        } else {
            console.log(obj);
            setTimeout(() => {
                return Promise.resolve();
            }, 10000);
        }
    }

    static request(method, url, data) {
        var debugConfig = app.controller.getConfigController().getDebugConfig();
        //if (debugConfig && debugConfig['bDebug'])
        app.controller.getLogger().log("[" + method + "] " + url);
        if (debugConfig && debugConfig.ajax && debugConfig.ajax.skip)
            return Promise.resolve();
        else
            return new Promise(function (resolve, reject) {
                var xhr;
                if (window.XMLHttpRequest) {
                    xhr = new XMLHttpRequest();
                }
                else {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }

                xhr.onload = function () {
                    if (this.readyState == 4) {
                        if (this.status >= 200 && this.status < 300) {
                            var debugConfig = app.controller.getConfigController().getDebugConfig();
                            if (debugConfig && debugConfig.ajax && debugConfig.ajax.delay > 0)
                                setTimeout(() => { resolve(xhr.response); }, debugConfig.ajax.delay);
                            else
                                resolve(xhr.response);
                        } else {
                            var err = {
                                status: xhr.status,
                                statusText: xhr.statusText
                            };
                            if (xhr.response)
                                err.response = xhr.response;
                            reject(err);
                        }
                    }
                };

                xhr.onerror = function () {
                    var err = {
                        status: xhr.status,
                        statusText: xhr.statusText
                    };
                    if (xhr.response)
                        err.response = xhr.response;
                    reject(err);
                };

                xhr.ontimeout = function () {
                    alert("time out");
                    var err = {
                        status: xhr.status,
                        statusText: xhr.statusText
                    };
                    if (xhr.response)
                        err.response = xhr.response;
                    reject(err);
                }

                xhr.open(method, url); // 3rd parameter `false` would make the request synchronous
                xhr.timeout = 0;
                //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                var params;
                if (data) {
                    //xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    //params = urlEncode(data);

                    xhr.setRequestHeader("Content-type", "application/json");
                    if (typeof data === 'object')
                        params = JSON.stringify(data, function (k, v) { return v === undefined ? null : v; });
                    else
                        params = data;
                }
                xhr.send(params);
            });
    }

    /*static urlEncode(data) {
        var urlEncodedDataPairs = [];
        for (name in data) {
            urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
        }
    
        return urlEncodedDataPairs.join('&').replace(/%20/g, '+');
    }*/

    /*static ajax() {
        $.ajax({
            url: url,
            type: 'GET',
            //async: false,
            //contentType: 'text/plain',
            //dataType: 'jsonp',
            //data:person,
    
            crossDomain: true, //failed
            //headers: {  'Access-Control-Allow-Origin': '*' },
            //header('Access-Control-Allow-Origin: *');
            //header('Access-Control-Allow-Methods: GET, POST');
    
            beforeSend: function (xhr) {
                //res.header("Access-Control-Allow-Origin", req.headers["origin"]);
                //res.header("Access-Control-Allow-Credentials", "true");
                //xhr.setRequestHeader("Authorization", "Bearer 6QXNMEMFHNY4FJ5ELNFMP5KRW52WFXN5")
            }, success: function (data) {
                alert(data);
                //process the JSON data etc
            },
            error: function (xhr, textStatus, errorThrown) {
                console.log('Error Something');
            }
        });
    }*/
}