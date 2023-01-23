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

        var createGroup = [];
        var showGroup = [];
        var addGroup = [];
        var setGroup = [];

        ContextMenuController.addEntriesForAllAttributes(panel, showGroup, setGroup, addGroup);

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
                }.bind(panel));
                createGroup.push(createPlaylistEntry);
            }

            var createCsvEntry = new ContextMenuEntry("CSV", async function () {
                return app.controller.getModalController().openPanelInModal(new CreateCsvPanel(model, this._obj.getAllItems()));
            }.bind(panel));
            createGroup.push(createCsvEntry);

            entries.push(new ContextMenuEntry("Save", async function () {
                try {
                    await this._obj.save();
                } catch (error) {
                    app.controller.showError(error);
                }
            }.bind(panel)));
        } else {
            var createCopyEntry = new ContextMenuEntry("Copy", async function () {
                var items = app.controller.getSelected();
                if (!items || (items.length == 1 && items[0] == this)) {
                    var data = { ...this._obj.getData() };

                    var skeleton = this._obj.getSkeleton();
                    delete data['id'];
                    delete data['created_at'];
                    delete data['updated_at'];
                    for (var attr of skeleton) {
                        if (attr['hidden'] || attr['readonly'])
                            delete data[attr['name']];
                    }

                    var panel = PanelController.createPanel(this._obj.getTypeString(), data, ActionEnum.create);

                    await app.controller.getModalController().openPanelInModal(panel);
                }
                return Promise.resolve();
            }.bind(panel));
            createGroup.push(createCopyEntry);

            var createCsvEntry = new ContextMenuEntry("CSV", async function () {
                var items = app.controller.getSelectedObjects();
                if (!items)
                    items = [this._obj];
                return app.controller.getModalController().openPanelInModal(new CreateCsvPanel(model, items));
            }.bind(panel));
            createGroup.push(createCsvEntry);
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
            var selected = app.controller.getSelectedObjects();
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

                            if (attr.multiple) {
                                if (attr.via)
                                    backLink = attr.via;
                            }

                            if (!backLink) {
                                var relModel = app.controller.getModelController().getModel(attr.model);
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
                            if (false && backLink) { //TODO: disabled while API does not support necessary filter
                                for (var i = 0; i < objs.length; i++) {
                                    data = objs[i].getData();
                                    params.push(backLink + ".id=" + data['id']);
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
                                if (ids.length > 0) {
                                    for (var id of ids) {
                                        params.push("id=" + id);
                                    }
                                }
                            }

                            if (params.length > 0) {
                                state = new State();
                                var str = typeString + ":" + objs.map(function (x) { return x.getTitle() }).join(' || ');
                                if (str.length < 70)
                                    state.name = str;
                                else
                                    state.name = str.substring(0, 70) + '...';
                                state.typeString = attr.model;
                                state.where = params.join('&');

                                entry = new ContextMenuEntry(attr['name'], async function () {
                                    await app.controller.loadState(this, true);
                                }.bind(state));
                                showGroup.push(entry);
                            }

                            if (attr['multiple'] && !attr['readonly']) {
                                if (!attr['via'] || objs.length == 1) {
                                    if (attr['hidden'] && backLink) {
                                        var data = {};
                                        data[backLink] = [objs[0].getData()];
                                        entry = new ContextMenuEntry(attr['name'], function () {
                                            var panel = PanelController.createPanel(attr['model'], this, ActionEnum.create);
                                            return app.controller.getModalController().openPanelInModal(panel);
                                        }.bind(data));
                                        addGroup.push(entry);
                                    } else {
                                        var addPanel = new AddRelatedItemPanel(objs, attr, async function () {
                                            await this.getObject().read();
                                            await this.render();
                                            return Promise.resolve(true);
                                        }.bind(panel));

                                        entry = new ContextMenuEntry(attr.name, async function () {
                                            return app.controller.getModalController().openPanelInModal(this);
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
                        var skeleton = [attr];
                        var panel = new FormPanel(null, skeleton);
                        panel.setApplyAction(async function (p) {
                            app.controller.setLoadingState(true);

                            try {
                                var data = await p.getForm().readForm();

                                for (var obj of objs)
                                    await obj.update(data);

                                app.controller.setLoadingState(false);
                            } catch (error) {
                                app.controller.setLoadingState(false);
                                app.controller.showError(error);
                            }

                            return Promise.resolve(true);
                        });
                        return app.controller.getModalController().openPanelInModal(panel);
                    }.bind(panel));
                    setGroup.push(entry);
                }
            }
        }
    }

    static appendCrudContextMenuEntries(panel, entries) {
        var openGroup = [];
        var openInNewTabEntry = new ContextMenuEntry("Open in new Tab", function () {
            var items = app.controller.getSelected();
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
        }.bind(panel));
        openGroup.push(openInNewTabEntry);

        if (panel.getClass() == MediaPanel) {
            var openThumbnailEntry = new ContextMenuEntry("Open Thumbnail", function () {
                this.openThumbnail();
            }.bind(panel));
            openGroup.push(openThumbnailEntry);
        }

        entries.push(new ContextMenuEntry("Open >", function () {
            var items = app.controller.getSelected();
            if (!items || (items.length == 1 && items[0] == this)) {
                var state = new State();
                state.typeString = this._obj.getTypeString();
                state.id = this._obj.getData().id;

                app.controller.loadState(state, true);
            } else {
                var objs = items.map(function (panel) {
                    return panel.getObject();
                });
                var url = DataService.getUrlForObjects(objs);
                var state = State.getStateFromUrl(new URL(url));
                app.controller.loadState(state, true);
            }
        }.bind(panel), openGroup));

        entries.push(new ContextMenuEntry("Details", function () {
            this.openInModal(ActionEnum.read);
        }.bind(panel)));

        entries.push(new ContextMenuEntry("Edit", function () {
            this.openInModal(ActionEnum.update);
        }.bind(panel)));

        entries.push(new ContextMenuEntry("Delete", async function () {
            var selected = app.controller.getSelected();
            if (!selected || selected.length == 0 || (selected.length == 1 && selected[0] == this))
                this.openInModal(ActionEnum.delete);
            else {
                var bConfirmation = await app.controller.getModalController().openConfirmModal("Delete all selected items?");
                if (bConfirmation) {
                    app.controller.setLoadingState(true);

                    try {
                        for (var i = 0; i < selected.length; i++) {
                            await selected[i].getObject().delete();
                        }

                        app.controller.setLoadingState(false);
                    } catch (error) {
                        app.controller.setLoadingState(false);
                        app.controller.showError(error);
                    }

                    app.controller.reloadState();
                }
            }
            return Promise.resolve();
        }.bind(panel)));

        if (app.controller.isInDebugMode()) {
            var debugGroup = [];
            var jsonEntry = new ContextMenuEntry("JSON", function () {
                return app.controller.getModalController().openPanelInModal(new JsonPanel(this.getObject().getData()));
            }.bind(panel));
            debugGroup.push(jsonEntry);

            entries.push(new ContextMenuEntry("Debug >", null, debugGroup));
        }
        return entries;
    }
}