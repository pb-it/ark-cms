async function exec(cmd) {
    return new Promise((resolve, reject) => {
        require("child_process").exec(cmd, function (err, stdout, stderr) {
            if (err)
                reject(err);
            else {
                resolve(stdout);
            }
        });
    });
}

module.exports = { exec };