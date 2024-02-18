const os = require('os');

var cmd;
if (os.type() === 'Linux' || os.type() === 'Darwin')
    cmd = 'rm -R types && rm -R dist/public';
else if (os.type() === 'Windows_NT')
    cmd = 'rd /s /q types && rd /s /q dist/public';
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
}