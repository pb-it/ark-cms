class AuthController {

    _controller;

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

                var data = { 'user': $username.val(), 'pass': $password.val() };
                try {
                    await this._controller.getApiController().getApiClient().request('POST', "/sys/auth/login", HttpClient.urlEncode(data));
                    panel.dispose();
                    this._controller.reloadApplication();
                } catch (error) {
                    this._controller.showError(error, "Login failed");
                }

                return Promise.resolve();
            }.bind(this));
        var $label = $('<label/>')
            .attr('for', 'username')
            .text('Username: ');
        $form.append($label);
        $form.append('<br/>');
        var $username = $('<input/>')
            .prop('id', 'username')
            .prop('type', 'text');
        $form.append($username);
        $form.append('<br/>');

        $label = $('<label/>')
            .attr('for', 'password')
            .text('Password: ');
        $form.append($label);
        $form.append('<br/>');
        var $password = $('<input/>')
            .prop('id', 'password')
            .prop('type', 'password');
        $form.append($password);
        $form.append('<br/><br/>');

        var $login = $('<button>')
            .text('Login')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                return $form.submit();
            }.bind(this));
        $form.append($login);

        $d.append($form);

        var $footer = $('<div/>')
            .addClass('clear');
        $d.append($footer);

        panel.setContent($d);

        await app.getController().getModalController().openPanelInModal(panel);

        $username.focus();

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