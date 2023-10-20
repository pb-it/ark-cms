class AuthController {

    _controller;

    _$username;
    _$password;

    constructor() {
        this._controller = app.getController();
    }

    async showLoginDialog() {
        var panel = new Panel();

        var $d = $('<div/>')
            .css({ 'padding': '10' });

        $d.append("<h3>Login:</h3><br/>");

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
                    if (error && error.status == 401) {
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