class BookmarkController {

    static CONFIG_BOKKMARK_IDENT = 'bookmarks';

    _url;
    //_obj;

    _bookmarks;

    constructor() {
    }

    async init() {
        /*var bookmarkModel = app.controller.getModelController().getModel('_bookmark');
        if (bookmarkModel) {
            this._obj = new CrudObject("_bookmark", { 'id': 1 });
            try {
                await this._obj.read();
            } catch (error) {
                if (error.response && error.response === 'EmptyResponse') {
                    var data = this._obj.getData();
                    data['json'] = '[]';
                    await this._obj.create();
                } else throw error;
            }
        } else {
            var bError = false;
            app.controller.setLoadingState(true);
            try {
                var data = {
                    'name': '_bookmark',
                    'options': {
                        'increments': true,
                        'timestamps': true
                    },
                    'attributes': [
                        {
                            'name': 'json',
                            'dataType': 'json'
                        }
                    ]
                };
                var model = new XModel(data);
                await model.uploadData();
            } catch (error) {
                bError = true;
                app.controller.setLoadingState(false);
                app.controller.showError(error);
            }
            if (!bError) {
                try {
                    await app.controller.getApiController().reloadModels();
                    app.controller.reloadApplication();
                } catch (error) {
                    app.controller.setLoadingState(false);
                    app.controller.showError(error, "Automatic reloading of models failed. Please restart your backend manually!");
                }
                app.controller.setLoadingState(false);
            }
        }*/

        this._url = app.controller.getConfigController().getApiOrigin() + "/bookmarks";
        this._bookmarks = await WebClient.fetchJson(this._url);

        return Promise.resolve();
    }

    getBookmarks() {
        return this._bookmarks;
    }

    async setBookmarks(bookmarks) {
        this._bookmarks = bookmarks;
        return WebClient.request("PUT", this._url, this._bookmarks);
    }

    async addBookmark(state) {
        this._bookmarks.push(state);
        return this.setBookmarks(this._bookmarks);
    }
}