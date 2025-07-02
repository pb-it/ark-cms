class NotificationController {

    _notifications;

    constructor() {
        this._notifications = [];
    }

    addNotifiction(notifiction) {
        this._notifications.push(notifiction);
    }

    getNotifications() {
        return this._notifications;
    }
}