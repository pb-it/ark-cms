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

    isAdministrator() {
        return this._bAdministrator;
    }

    async showLoginDialog() {
        var panel = new Panel();

        var $d = $('<div/>')
            .css({ 'padding': '10' });

        $d.append("<h2>Login</h2><br/>");

        var $form = $('<form/>')
            .prop('target', '_blank')
            .submit(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                var data = { 'user': this._$username.val(), 'pass': this._$password.val() };
                try {
                    await this._controller.getApiController().getApiClient().request('POST', "/sys/auth/login", HttpClient.urlEncode(data));
                    panel.dispose();
                    this._controller.reloadApplication();
                } catch (error) {
                    if (error instanceof HttpError && error['response'] && error['response']['status'] == 401) {
                        alert('Login failed');
                        this._$password.val('');
                        this._$password.focus();
                    } else
                        this._controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        var $label = $('<label/>')
            .attr('for', 'username')
            .text('Username: ');
        $form.append($label);
        $form.append('<br/>');
        this._$username = $('<input/>')
            .prop('id', 'username')
            .prop('type', 'text');
        $form.append(this._$username);
        $form.append('<br/>');

        $label = $('<label/>')
            .attr('for', 'password')
            .text('Password: ');
        $form.append($label);
        $form.append('<br/>');
        this._$password = $('<input/>')
            .prop('id', 'password')
            .prop('type', 'password');
        $form.append(this._$password);
        $form.append('<br/><br/>');

        var $login = $('<button>')
            .text('Login')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                return $form.submit();
            }.bind(this));
        $form.append($login);

        $d.append($form);

        var $footer = $('<div/>')
            .addClass('clear');
        $d.append($footer);

        panel.setContent($d);

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