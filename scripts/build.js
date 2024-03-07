const os = require('os');

var cmd;
if (os.type() === 'Linux' || os.type() === 'Darwin')
    cmd = `find ./public -regextype posix-extended -regex ".*\.(js|html|css|txt|gif|png)" -exec cp --parents {} dist ";"`;
else if (os.type() === 'Windows_NT')
    cmd = 'for %e in (js html css txt gif png) do XCOPY public\\\*.%e dist\\public /C /S /I /F /H';
if (cmd) {
    require('child_process').exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(stdout);
    });
} else
    process.exit(1);