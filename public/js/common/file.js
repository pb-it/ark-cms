class File {

    static readFileBase64(file) {
        return new Promise((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = (e) => resolve(fileReader.result);
            fileReader.readAsDataURL(file);
        });
    }

    static async readUrlBase64(url) {
        const data = await fetch(url);
        const blob = await data.blob();
        if (!blob.type || !blob.type.startsWith("image"))
            throw new Error("unsupported datatype");
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                resolve(base64data);
            }
        });
    }

    static createFromBase64(data, filename) {
        var arr = data.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    }

    static download(files) {
        alert("NotImplementedException");
        /*for (var i = 0; i < files.length; i++) {
            var iframe = $('<iframe style="visibility: collapse;"></iframe>');
            $('body').append(iframe);
            var content = iframe[0].contentDocument;
            var form = '<form action="' + files[i] + '" method="GET"></form>';
            content.write(form);
            $('form', content).submit();
            setTimeout((function (iframe) {
                return function () {
                    iframe.remove();
                }
            })(iframe), 2000);
        }*/
    }

    static createPlaylist(objects) {
        if (objects) {
            var text = "#EXTM3U\n";
            for (var i = 0; i < objects.length; i++) {
                text += "#EXTINF:-1," + objects[i].getAttributeValue("title") + "\n";
                text += objects[i].getAttributeValue("file") + "\n";
            }
            File.create("playlist.m3u", text);
        }
    }

    static create(filename, content) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: "text/plain" });
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);

        //a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        //a.setAttribute('download', filename);
    }

    static getDateTime() {
        const date = new Date(); //new Date().toUTCString(); //new Date().toLocaleTimeString()
        const seconds = `${date.getSeconds()}`.padStart(2, '0');
        const minutes = `${date.getMinutes()}`.padStart(2, '0');
        const hours = `${date.getHours()}`.padStart(2, '0');
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${hours}-${minutes}-${seconds}_${day}-${month}-${year}`;
    }
}