async function curl(url) {
    return Ajax.request("POST", "/curl", { "url": url });
}