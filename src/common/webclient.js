const request = require('request');

module.exports.curl = async function (url) {
    if (url) {
        return new Promise((resolve, reject) => {
            var options = {
                "url": url,
                "rejectUnauthorized": false,
                "headers": {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3750.0 Iron Safari/537.36'
                }
            };
            request.get(options, (err, res, body) => {
                resolve(body);
            });
        });
    }
    return Promise.resolve();
}