class Overlay {
    static open() {
        document.getElementById("overlay").style.display = "block";
    }

    static close() {
        document.getElementById("overlay").style.display = "none";
    }
}