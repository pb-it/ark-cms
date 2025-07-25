class AuthController {

    _controller;

    _$username;
    _$password;

    _user;
    _bAdministrator;

    constructor() {
        this._controller = app.getController();
    }

    async initAuthController() {
        this._user = null;
        this._bAdministrator = false;
        try {
            const session = await this._controller.getApiController().fetchSessionInfo();
            if (session) {
                if (session['auth']) {
                    this._user = session['user'];
                    if (this._user && this._user['roles']) {
                        for (var role of this._user['roles']) {
                            if (role == 'administrator') {
                                this._bAdministrator = true;
                                break;
                            }
                        }
                    }
                } else
                    this._bAdministrator = true;
            }
        } catch (error) {
            if (error instanceof HttpError && error['response'] && error['response']['status'] == 404)
                this._bAdministrator = true;
            else
                throw error;
        }
        return Promise.resolve();
    }

    getUser() {
        return this._user;
    }

    async getUserSettings() {
        var settings;

        /*var tmp = await this._controller.getDataService().fetchData('_user', this._user['id']);
        if (tmp)
            settings = tmp['settings'];

        const apiClient = this._controller.getApiController().getApiClient();
        tmp = await apiClient.request('GET', apiClient.getDataPath() + '_user?id=' + this._user['id']);
        if (tmp) {
            tmp = JSON.parse(tmp);
            if (tmp['data'] && tmp['data'].length == 1)
                settings = tmp['data'][0]['settings'];
        }*/

        const obj = new CrudObject('_user', { 'id': this._user['id'] });
        await obj.read();
        settings = obj.getData()['settings'];

        return Promise.resolve(settings);
    }

    async setUserSettings(settings) {
        const obj = new CrudObject('_user', { 'id': this._user['id'] });
        return obj.update({ 'settings': settings });
    }

    isAdministrator() {
        return this._bAdministrator;
    }

    async showLoginDialog() {
        const panel = new Panel();

        const $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append("<h2>Login</h2>");

        const $form = $('<form/>')
            .prop('target', '_blank')
            .submit(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                var data = { 'user': this._$username.val(), 'pass': this._$password.val() };
                try {
                    this._controller.setLoadingState(true);
                    await this._controller.getApiController().getApiClient().request('POST', "/sys/auth/login", { 'headers': { 'Content-type': 'application/x-www-form-urlencoded' } }, HttpClient.urlEncode(data));
                    panel.dispose();
                    this._controller.reloadApplication();
                } catch (error) {
                    this._controller.setLoadingState(false);
                    if (error instanceof HttpError && error['response'] && error['response']['status'] == 401) {
                        alert('Login failed');
                        this._$password.val('');
                        this._$password.focus();
                    } else
                        this._controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));

        var $entry = $('<div/>');
        var $label = $('<label/>')
            .attr('for', 'username')
            .text('Username: ');
        $entry.append($label);
        $entry.append('<br/>');
        this._$username = $('<input/>')
            .prop('id', 'username')
            .prop('type', 'text');
        $entry.append(this._$username);
        $form.append($entry);

        $entry = $('<div/>')
            .css({
                'margin-top': '10px'
            });
        $label = $('<label/>')
            .attr('for', 'password')
            .text('Password: ');
        $entry.append($label);
        $entry.append('<br/>');
        this._$password = $('<input/>')
            .prop('id', 'password')
            .prop('type', 'password');
        $entry.append(this._$password);
        $form.append($entry);
        $form.append('<br/>');

        const $login = $('<button>')
            .text('Login')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                return $form.submit();
            }.bind(this));
        $form.append($login);

        $div.append($form);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        panel.setContent($div);

        await this._controller.getModalController().openPanelInModal(panel);

        this._$username.focus();

        return Promise.resolve();
    }

    async logout() {
        try {
            await this._controller.getApiController().getApiClient().request('GET', "/sys/auth/logout");
            this._controller.reloadApplication();
        } catch (error) {
            this._controller.showError(error, "Logout failed");
        }
        return Promise.resolve();
    }
}