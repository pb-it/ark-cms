async function curl(url) {
    return Ajax.request("POST", "/system/curl", { "url": url });
}