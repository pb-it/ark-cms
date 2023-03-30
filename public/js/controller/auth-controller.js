class AuthController {

    _controller;
    _apiClient;

    constructor() {
        this._controller = app.getController();
        this._apiClient = this._controller.getApiController().getApiClient();
    }

    async showLoginDialog() {
        var panel = new Panel();

        var $d = $('<div/>')
            .css({ 'padding': '10' });

        $d.append("<h3>Login:</h3><br/>");

        var $label = $('<label/>')
            .attr('for', 'username')
            .text('Username: ');
        $d.append($label);
        $d.append('<br/>');
        var $username = $('<input/>')
            .prop('id', 'username')
            .prop('type', 'text');
        $d.append($username);
        $d.append('<br/>');

        $label = $('<label/>')
            .attr('for', 'password')
            .text('Password: ');
        $d.append($label);
        $d.append('<br/>');
        var $password = $('<input/>')
            .prop('id', 'password')
            .prop('type', 'password');
        $d.append($password);
        $d.append('<br/>');

        $d.append('<br/>');

        var $continue = $('<button>')
            .text('Login')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                var data = { 'user': $username.val(), 'pass': $password.val() };
                try {
                    await this._apiClient.request('POST', "/sys/auth/login", HttpClient.urlEncode(data));
                    panel.dispose();
                    this._controller.reloadApplication();
                } catch (error) {
                    this._controller.showError(error, "Login failed");
                }

                return Promise.resolve();
            }.bind(this));
        $d.append($continue);

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
            await this._apiClient.request('GET', "/sys/auth/logout");
            this._controller.reloadApplication();
        } catch (error) {
            this._controller.showError(error, "Logout failed");
        }
        return Promise.resolve();
    }
}