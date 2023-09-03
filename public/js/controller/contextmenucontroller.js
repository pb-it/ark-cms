class ContextMenuController {

    static renderMenu(xPos, yPos, panel) {
        var contextMenu = new ContextMenu(ContextMenuController.getContextMenuEntries(panel));
        var entries = contextMenu.getEntries();
        var parentPanel = panel.parent;
        if (parentPanel && parentPanel.getClass() == CollectionPanel) {
            entries.push(new ContextMenuEntry("Remove", function () {
                this.parent.deleteItem(this._obj.getData());
            }.bind(panel)));

            var parentObject = parentPanel.getObject()
            var parentModel = parentObject.getModel();
            var thumbnailProperty = parentModel.getModelDefaultsController().getDefaultThumbnailProperty();
            if (thumbnailProperty) {
                if (thumbnailProperty.indexOf(';') == -1) {
                    var attribute = parentModel.getModelAttributesController().getAttribute(thumbnailProperty);
                    if (attribute && attribute['dataType'] === 'relation' && attribute['model'] === panel.getObject().getModel().getName()) {
                        entries.push(new ContextMenuEntry("Set as Thumbnail", async function () {
                            var obj = new Object();
                            obj[thumbnailProperty] = panel.getObject().getData()['id'];
                            await parentObject.update(obj);
                            //this.render();
                            return Promise.resolve();
                        }.bind(panel)));
                    }
                }
            }
        }

        var obj = panel.getObject();
        var model = obj.getModel();
        var thumbnailProperty = model.getModelDefaultsController().getDefaultThumbnailProperty();
        if (thumbnailProperty) {
            var thumbGroup = [];
            if (thumbnailProperty.indexOf(';') == -1) {
                var attribute = model.getModelAttributesController().getAttribute(thumbnailProperty);
                if (attribute && obj.getData()[attribute['name']]) {
                    thumbGroup.push(new ContextMenuEntry("Remove", async function () {
                        if (confirm("Remove thumbnail?")) {
                            var data = {};
                            data[attribute['name']] = null;
                            var obj = this.getObject();
                            await obj.update(data);
                            this.render();
                        }
                        return Promise.resolve();
                    }.bind(panel)));
                }
            }
            entries.push(new ContextMenuEntry("Thumbnail >", null, thumbGroup));
        }

        contextMenu.setEntries(ContextMenuController.appendCrudContextMenuEntries(panel, entries));
        contextMenu.renderMenu(xPos, yPos);
    }

    static getContextMenuEntries(panel) {
        var entries = [];
        var obj = panel.getObject();
        var model = obj.getModel();
        var controller = app.getController();

        entries.push(new ContextMenuEntry("Reload", async function () {
            controller.setLoadingState(true);
            var objs = controller.getSelectedObjects();
            if (!objs)
                objs = [this._obj];
            var typeString = objs[0].getTypeString();
            var ids = objs.map(function (x) { return x.getData()['id'] });
            await controller.getDataService().fetchData(typeString, ids, null, null, null, null, null, true);

            var state = controller.getStateController().getState();
            controller.loadState(state);
        }.bind(panel)));

        entries.push(new ContextMenuEntry("Copy", async function () {
            try {
                await controller.copy();
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        }.bind(panel)));

        var createGroup = [];
        var showGroup = [];
        var addGroup = [];
        var setGroup = [];

        ContextMenuController.addEntriesForAllAttributes(panel, showGroup, setGroup, addGroup);
        /*if (controller.isInDebugMode()) {
            //showGroup.add(...); //TODO: Add entry for model '_changes'
        }*/

        var createCopyEntry = new ContextMenuEntry("Copy", async function () {
            var items = controller.getSelected();
            if (!items || (items.length == 1 && items[0] == this)) {
                var data = { ...this._obj.getData() };

                var skeleton = this._obj.getSkeleton();
                delete data['id'];
                delete data['created_at'];
                delete data['updated_at'];
                for (var attr of skeleton) {
                    if (attr['hidden'] || attr['readonly'] || attr['unique'])
                        delete data[attr['name']];
                }

                var panel = PanelController.createPanel(this._obj.getTypeString(), data, ActionEnum.create);

                await controller.getModalController().openPanelInModal(panel);
            }
            return Promise.resolve();
        }.bind(panel));
        createGroup.push(createCopyEntry);

        var createCsvEntry = new ContextMenuEntry("CSV", async function () {
            var items;
            if (model.isCollection())
                items = this._obj.getAllItems();
            else {
                items = controller.getSelectedObjects();
                if (!items)
                    items = [this._obj];
            }
            return controller.getModalController().openPanelInModal(new CreateCsvPanel(model, items));
        }.bind(panel));
        createGroup.push(createCsvEntry);

        if (model.isCollection()) {
            var data = obj.getData();
            if (data.subtype && data.subtype == "playlist") {
                var createPlaylistEntry = new ContextMenuEntry("Playlist File", async function () {
                    var objects = this._obj.getAllItems();
                    if (objects) {
                        var text = "#EXTM3U\n";
                        for (var i = 0; i < objects.length; i++) {
                            text += "#EXTINF:-1," + objects[i].getAttributeValue("title") + "\n";
                            text += objects[i].getAttributeValue("file") + "\n";
                        }
                        FileCreator.createFileFromText("playlist.m3u", text);
                    }
                    return Promise.resolve();
                }.bind(panel));
                createGroup.push(createPlaylistEntry);
            }

            entries.push(new ContextMenuEntry("Paste", async function (e) {
                try {
                    var text;
                    if (window.location.protocol == 'https:' || window.location.hostname == 'localhost') {
                        if (navigator && navigator.clipboard && navigator.clipboard.readText)
                            text = await navigator.clipboard.readText();
                        else
                            controller.showErrorMessage('The Clipboard API is not available!');
                    } else if (false && document.queryCommandSupported('paste')) {//TODO:
                        var div = document.createElement('div');
                        div.contentEditable = true;
                        var elem = document.activeElement.appendChild(div).parentNode;
                        div.focus();
                        document.execCommand('paste', null, null);
                        text = div.innerText;
                        elem.removeChild(div);
                    } else
                        controller.showErrorMessage('Paste operation failed!');
                    if (text) {
                        if (text.startsWith('http')) {
                            var url = new URL(text);
                            var state = State.getStateFromUrl(url);
                            if (state) {
                                var droptype = state['typeString'];
                                if (droptype === this._obj.getCollectionType()) {
                                    try {
                                        controller.setLoadingState(true);
                                        var items;
                                        var data = await controller.getDataService().fetchDataByState(state);
                                        if (data) {
                                            if (Array.isArray(data)) {
                                                if (data.length > 0) {
                                                    var items = [];
                                                    for (var x of data) {
                                                        items.push(new CrudObject(droptype, x));
                                                    }
                                                    await this.addItems(items);
                                                }
                                            } else
                                                await this.addItems(new CrudObject(droptype, data));
                                        }
                                        controller.setLoadingState(false);
                                    } catch (error) {
                                        controller.setLoadingState(false);
                                        controller.showError(error);
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(panel)));

            entries.push(new ContextMenuEntry("Save", async function () {
                try {
                    await this._obj.save();
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(panel)));
        }

        var contextMenuExtensions = model.getContextMenuExtensionAction();
        if (contextMenuExtensions)
            entries.push(...contextMenuExtensions(panel));

        if (createGroup.length > 0)
            entries.push(new ContextMenuEntry("Create >", null, createGroup));
        if (showGroup.length > 0)
            entries.push(new ContextMenuEntry("Show >", null, showGroup));
        if (setGroup.length > 0)
            entries.push(new ContextMenuEntry("Set >", null, setGroup));
        if (addGroup.length > 0)
            entries.push(new ContextMenuEntry("Add >", null, addGroup));

        return entries;
    }

    static addEntriesForAllAttributes(panel, showGroup, setGroup, addGroup) {
        var obj = panel.getObject();
        var typeString = obj.getTypeString();
        var model = obj.getModel();
        var attributes = model.getModelAttributesController().getAttributes();
        if (attributes) {
            var sorted = [...attributes].sort((a, b) => a.name.localeCompare(b.name));

            var objs;
            var selected = app.getController().getSelectedObjects();
            if (selected && selected.length > 0)
                objs = selected;
            else
                objs = [panel.getObject()];

            var entry;
            var state;

            var backLink;
            var data;
            var relData
            var params;
            var bAddSetEntry;
            for (let attr of sorted) {
                bAddSetEntry = true;
                switch (attr['dataType']) {
                    case "relation":
                        if (attr['model']) {
                            backLink = null;

                            if (attr['multiple']) {
                                if (attr['via'])
                                    backLink = attr['via'];
                            }

                            if (!backLink) {
                                var relModel = app.getController().getModelController().getModel(attr.model);
                                var relAttributes = relModel.getModelAttributesController().getAttributes();
                                if (relAttributes) {
                                    for (var relAttr of relAttributes) {
                                        if (relAttr['dataType'] === "relation" && relAttr['model'] === typeString && relAttr['multiple'] && !relAttr['via']) {
                                            backLink = relAttr.name;
                                            break;
                                        }
                                    }
                                }
                            }

                            params = [];
                            if (backLink) {
                                if (attr['via'] && objs.length == 1)
                                    params.push(backLink + "=" + objs[0].getData()['id']);
                                else {
                                    var ids = objs.map(function (x) { return x.getData()['id'] });
                                    params.push(backLink + "_any=" + ids.join(','));
                                }
                            } else {
                                var map = new Map();
                                for (var i = 0; i < objs.length; i++) {
                                    data = objs[i].getData();
                                    if (data) {
                                        relData = data[attr.name];
                                        if (relData) {
                                            if (Array.isArray(relData)) {
                                                for (var item of relData) {
                                                    if (item['id']) {
                                                        if (!map.has(item['id']))
                                                            map.set(item['id'], item);
                                                    }
                                                }
                                            } else {
                                                if (relData['id']) {
                                                    if (!map.has(relData['id']))
                                                        map.set(relData['id'], relData);
                                                }
                                            }
                                        }
                                    }
                                }
                                var ids = Array.from(map.keys());
                                if (ids.length > 0)
                                    params.push("id_in=" + ids.join(','));
                            }

                            if (params.length > 0) {
                                state = new State();
                                var str = typeString + ":" + objs.map(function (x) { return x.getTitle() }).join(' || ');
                                if (str.length < 70)
                                    state.name = str;
                                else
                                    state.name = str.substring(0, 70) + '...';
                                state.typeString = attr.model;
                                state.setQuery(params);

                                entry = new ContextMenuEntry(attr['name'], async function () {
                                    var controller = app.getController();
                                    var current = controller.getStateController().getState();
                                    var name = attr['name'];
                                    var scope;
                                    if (current['query']) {
                                        for (var part of current['query']) {
                                            if (part.startsWith(name + '_any')) {
                                                scope = part;
                                                break;
                                            }
                                        }
                                    }
                                    if (scope && controller.getConfigController().experimentalFeaturesEnabled() && confirm('Keep current filter on \'' + name + '\'?')) {
                                        this.where = `id_in=${scope.substring(scope.indexOf('=') + 1)}&${this.where}`;
                                    }
                                    await controller.loadState(this, true);
                                }.bind(state));
                                showGroup.push(entry);
                            }

                            if (attr['multiple'] && !attr['readonly']) {
                                if (!attr['via'] || objs.length == 1) {
                                    var data = {};
                                    if (backLink) {
                                        if (attr['via'])
                                            data[backLink] = objs[0].getId();
                                        else
                                            data[backLink] = objs.map(x => x.getId());
                                    }
                                    if (attr['hidden'] && backLink) {
                                        entry = new ContextMenuEntry(attr['name'], function () {
                                            var panel = PanelController.createPanel(attr['model'], this, ActionEnum.create);
                                            return app.getController().getModalController().openPanelInModal(panel);
                                        }.bind(data));
                                        addGroup.push(entry);
                                    } else {
                                        var addPanel = new AddRelatedItemPanel(objs, attr, data, async function () {
                                            var obj = this.getObject();
                                            if (obj.getId())
                                                await obj.read();
                                            await this.render();
                                            return Promise.resolve();
                                        }.bind(panel));

                                        entry = new ContextMenuEntry(attr.name, async function () {
                                            return app.getController().getModalController().openPanelInModal(this);
                                        }.bind(addPanel));
                                        addGroup.push(entry);
                                    }
                                }
                                bAddSetEntry = false;
                            }
                        }
                        break;
                    default:
                }
                if (bAddSetEntry && !attr['readonly']) {
                    entry = new ContextMenuEntry(attr['name'], function () {
                        var skeleton;
                        if (attr['hidden']) {
                            var copy = { ...attr };
                            delete copy['hidden'];
                            skeleton = [copy];
                        } else
                            skeleton = [attr];
                        var panel = new FormPanel(null, skeleton);
                        panel.setApplyAction(async function (p) {
                            var controller = app.getController();
                            controller.setLoadingState(true);
                            try {
                                var data = await p.getForm().readForm(false);

                                for (var obj of objs) {
                                    if (obj.getId())
                                        await obj.update(data);
                                    else
                                        obj.getData()[attr['name']] = data[attr['name']];
                                }

                                controller.setLoadingState(false);
                            } catch (error) {
                                controller.setLoadingState(false);
                                controller.showError(error);
                            }
                            return Promise.resolve(true);
                        });
                        return app.getController().getModalController().openPanelInModal(panel);
                    }.bind(panel));
                    setGroup.push(entry);
                }
            }
        }
    }

    static appendCrudContextMenuEntries(panel, entries) {
        var openGroup = [];
        var openInNewTabEntry = new ContextMenuEntry("Open in new Tab", function () {
            var items = app.getController().getSelected();
            if (!items || (items.length == 1 && items[0] == this)) {
                this.openInNewTab(ActionEnum.read);
            } else {
                var objs = items.map(function (panel) {
                    return panel.getObject();
                });
                var url = DataService.getUrlForObjects(objs);
                var win = window.open(url, '_blank');
                win.focus();
            }
            return Promise.resolve();
        }.bind(panel));
        openGroup.push(openInNewTabEntry);

        if (panel.getClass() == MediaPanel) {
            var openThumbnailEntry = new ContextMenuEntry("Open Thumbnail", async function () {
                return this.openThumbnail();
            }.bind(panel));
            openGroup.push(openThumbnailEntry);
        }

        entries.push(new ContextMenuEntry("Open >", async function () {
            var controller = app.getController();
            var items = controller.getSelected();
            var state = new State();
            if (!items || (items.length == 1 && items[0] == this)) {
                state.typeString = this._obj.getTypeString();
                state.id = this._obj.getData().id;
            } else {
                var ids = items.map(function (panel) {
                    return panel.getObject().getId();
                });
                state.typeString = items[0].getObject().getTypeString();
                state.id = ids;
            }
            return controller.loadState(state, true);
        }.bind(panel), openGroup));

        entries.push(new ContextMenuEntry("Details", async function () {
            return this.openInModal(ActionEnum.read);
        }.bind(panel)));

        entries.push(new ContextMenuEntry("Edit", async function () {
            return this.openInModal(ActionEnum.update);
        }.bind(panel)));

        entries.push(new ContextMenuEntry("Delete", async function () {
            var controller = app.getController();
            var selected = controller.getSelected();
            if (!selected || selected.length == 0 || (selected.length == 1 && selected[0] == this)) {
                var parentPanel = this.parent;
                if (parentPanel && parentPanel.getClass() == CollectionPanel) {
                    var obj = this.getObject();
                    var oData = obj.getData();

                    var model = obj.getModel();
                    var mpcc = model.getModelPanelConfigController();
                    var panelConfig = mpcc.getPanelConfig(ActionEnum.delete);
                    var panel = PanelController.createPanelForObject(obj, panelConfig);
                    panelConfig.crudCallback = async function (data) {
                        if (obj.isDeleted()) {
                            var cObj = parentPanel.getObject();
                            cObj.deleteItem(oData);
                            if (cObj.getId())
                                await cObj.save();
                        }
                        return Promise.resolve(true);
                    };
                    var modal = await controller.getModalController().openPanelInModal(panel);
                } else
                    this.openInModal(ActionEnum.delete)
            } else {
                var bConfirmation = await controller.getModalController().openConfirmModal("Delete all selected items?");
                if (bConfirmation) {
                    controller.setLoadingState(true);

                    try {
                        var parentPanel = this.parent;
                        if (parentPanel && parentPanel.getClass() == CollectionPanel) {
                            var cObj = parentPanel.getObject();
                            var obj;
                            for (var i = 0; i < selected.length; i++) {
                                obj = selected[i].getObject();
                                cObj.deleteItem(obj.getData());
                                await obj.delete();
                            }
                            if (cObj.getId())
                                await cObj.save();
                        } else {
                            for (var i = 0; i < selected.length; i++) {
                                await selected[i].getObject().delete();
                            }
                        }

                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }

                    controller.reloadState();
                }
            }
            return Promise.resolve();
        }.bind(panel)));

        if (app.getController().isInDebugMode()) {
            var debugGroup = [];
            var jsonEntry = new ContextMenuEntry("JSON", function () {
                return app.getController().getModalController().openPanelInModal(new JsonPanel(this.getObject().getData()));
            }.bind(panel));
            debugGroup.push(jsonEntry);

            entries.push(new ContextMenuEntry("Debug >", null, debugGroup));
        }
        return entries;
    }
}