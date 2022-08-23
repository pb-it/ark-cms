## (Client) Extensions

Evaluated in the context of the model.

So you can define functions, classes, etc.

Add custom routes, context menu extensions, etc. here.


### Custom (client) route

Example:

```js
var route = {
    "regex": "^test$", // http://localhost:4000/test
    "fn": async function () {
        await app.controller.getView().getCanvas().showPanels([...]); // render anything
        return Promise.resolve();
    }
};
app.controller.getRouteController().addRoute(route);
```


### Prepare data

Manipulate data after receiving.

May be used to calculate inpersistent fields.

Example:

```js
this._prepareDataAction = function(data) {
	... // manipulate form data here
	return data;
}
```


### CRUD dialog actions

Actions available while creating or updating an entry.

Example:

```js
var checkAction = {
    'name': 'Check',
    'fn': async function (data) {
        ... // manipulate form data here
        return Promise.resolve(data);
    }
};
this._crudDialogActions.push(action);
```


### Extend the context menu

Example:

```js
this._contextMenuExtensionAction = function(panel) {
    var entries = [];
	... // add custom entries here
	return entries;
}
```