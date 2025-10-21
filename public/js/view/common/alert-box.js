const AlertEnum = Object.freeze({ ERROR: 'ERROR', SUCCESS: 'SUCCESS', WARNING: 'WARNING', NOTICE: 'NOTICE' });

class AlertBox {

    static renderAlertBox(type, msg) {
        var clazz;
        var symbol;
        var text;
        switch (type) {
            case AlertEnum.ERROR:
                clazz = 'error';
                symbol = 'fa-circle-xmark';
                text = 'error: ';
                break;
            case AlertEnum.SUCCESS:
                clazz = 'success';
                symbol = 'fa-circle-check';
                text = 'success: ';
                break;
            case AlertEnum.WARNING:
                clazz = 'warning';
                symbol = 'fa-triangle-exclamation'; // fa-exclamation-circle
                text = 'warning: ';
                break;
            case AlertEnum.NOTICE:
                clazz = 'notice';
                symbol = 'fa-circle-info';
                text = 'info: ';
                break;
        }
        const $div = $('<div/>')
            .addClass('alert-box')
            .addClass(clazz);
        $div.append($('<span/>')
            .addClass('fas')
            .addClass(symbol)
            .text((text))
        );
        $div.append($('<div/>')
            .html(encodeText(msg)));
        return $div;
    }
}