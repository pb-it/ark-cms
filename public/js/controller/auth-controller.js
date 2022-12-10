class AuthController {

    constructor() {
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
                    await WebClient.request('POST', app.getController().getApiController().getApiOrigin() + "/login", WebClient.urlEncode(data));
                    panel.dispose();
                    app.getController().reloadApplication();
                } catch (error) {
                    app.getController().showError(error, "Login failed");
                }

                return Promise.resolve();
            }.bind(this));
        $d.append($continue);

        panel.setContent($d);

        await app.getController().getModalController().openPanelInModal(panel);
        return Promise.resolve();
    }

    async logout() {
        var controller = app.getController();
        try {
            await WebClient.request('GET', controller.getApiController().getApiOrigin() + "/logout");
            controller.reloadApplication();
        } catch (error) {
            controller.showError(error, "Logout failed");
        }
        return Promise.resolve();
    }
}