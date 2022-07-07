class Base64 {

    /**
     * 
     * @param {*} obj File or Blob
     * @returns 
     */
    static encodeObject(obj) {
        return new Promise((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = (e) => resolve(fileReader.result);
            fileReader.readAsDataURL(obj); //converts blob or file to base64 encoded string
            //.readAsText();
        });
    }

    static encodeText(text) {
        return 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(text)));
    }

    /**
     * https://stackoverflow.com/questions/21227078/convert-base64-to-image-in-javascript-jquery
     * @param {*} base64Data 
     * @param {*} contentType 
     * @returns 
     */
    static base64toBlob(base64Data, contentType) {
        contentType = contentType || '';
        var sliceSize = 1024;
        var byteCharacters = atob(base64Data);
        var bytesLength = byteCharacters.length;
        var slicesCount = Math.ceil(bytesLength / sliceSize);
        var byteArrays = new Array(slicesCount);

        for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
            var begin = sliceIndex * sliceSize;
            var end = Math.min(begin + sliceSize, bytesLength);

            var bytes = new Array(end - begin);
            for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
                bytes[i] = byteCharacters[offset].charCodeAt(0);
            }
            byteArrays[sliceIndex] = new Uint8Array(bytes);
        }
        return new Blob(byteArrays, { type: contentType });
    }

    static base64toFile(base64Data, filename) {
        var arr = base64Data.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    }

    static removeMime() {
        img.replace(/^data:image\/(png|jpg);base64,/, "");
    }
}