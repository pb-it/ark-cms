class ContextMenuController {

    static renderMenu(xPos, yPos, panel) {
        const contextMenu = new ContextMenu(panel);
        const obj = panel.getObject();
        const model = obj.getModel();
        const entries = model.getContextMenuEntries();
        contextMenu.setEntries(entries);
        contextMenu.renderMenu(xPos, yPos);
    }

    static getContextMenuEntries(model) {
        const entries = [];
        const controller = app.getController();

        entries.push(new ContextMenuEntry("Reload", async function (event, target) {
            try {
                controller.setLoadingState(true);
                var objs = controller.getSelectedObjects();
                if (!objs)
                    objs = [target._obj];
                var typeString = objs[0].getTypeString();
                var ids = objs.map(function (x) { return x.getData()['id'] });
                await controller.getDataService().fetchData(typeString, ids, null, null, null, null, null, true);

                var state = controller.getStateController().getState();
                controller.loadState(state);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        }));

        const removeEntry = new ContextMenuEntry("Remove", function (event, target) {
            target.parent.deleteItem(target._obj.getData());
        });
        removeEntry.setVisibilityFunction(function (target) {
            const parentPanel = target.parent;
            return parentPanel && parentPanel.getClass() == CollectionPanel;
        });
        entries.push(removeEntry);

        const fileProperty = model.getModelDefaultsController().getDefaultFileProperty();
        if (fileProperty) {
            if (fileProperty.indexOf(';') == -1) {
                const playEntry = new ContextMenuEntry("Play", async function (event, target) {
                    target.getThumbnail().playVideo();
                    return Promise.resolve();
                });
                playEntry.setVisibilityFunction(function (target) {
                    var file;
                    if (target.getClass() == MediaPanel) {
                        const thumb = target.getThumbnail();
                        if (thumb)
                            file = thumb.getMedia().getFile();
                    }
                    /*const attribute = model.getModelAttributesController().getAttribute(fileProperty);
                    if (attribute)
                        file = target.getObject().getData()[attribute['name']];*/
                    return file && isVideo(file);
                });
                entries.push(playEntry);
            }
        }

        const setThumbEntry = new ContextMenuEntry("Set as Thumbnail", async function (event, target) {
            var obj = new Object();
            obj[thumbnailProperty] = target.getObject().getData()['id'];
            await parentObject.update(obj);
            //target.render();
            return Promise.resolve();
        });
        setThumbEntry.setVisibilityFunction(function (target) {
            var bVis = false;
            var parentPanel = target.parent;
            if (parentPanel && parentPanel.getClass() == CollectionPanel) {
                var parentObject = parentPanel.getObject()
                var parentModel = parentObject.getModel();
                var thumbnailProperty = parentModel.getModelDefaultsController().getDefaultThumbnailProperty();
                if (thumbnailProperty) {
                    if (thumbnailProperty.indexOf(';') == -1) {
                        var attribute = parentModel.getModelAttributesController().getAttribute(thumbnailProperty);
                        bVis = attribute && attribute['dataType'] === 'relation' && attribute['model'] === target.getObject().getModel().getName();
                    }
                }
            }
            return bVis;
        });
        entries.push(setThumbEntry);

        const thumbnailProperty = model.getModelDefaultsController().getDefaultThumbnailProperty();
        if (thumbnailProperty) {
            const thumbGroup = [];
            if (thumbnailProperty.indexOf(';') == -1) {
                const removeThumbEntry = new ContextMenuEntry("Remove", async function (event, target) {
                    if (confirm("Remove thumbnail?")) {
                        const data = {};
                        const attribute = model.getModelAttributesController().getAttribute(thumbnailProperty);
                        data[attribute['name']] = null;
                        const obj = target.getObject();
                        await obj.update(data);
                        target.render();
                    }
                    return Promise.resolve();
                });
                removeThumbEntry.setVisibilityFunction(function (target) {
                    const attribute = model.getModelAttributesController().getAttribute(thumbnailProperty);
                    return attribute && target.getObject().getData()[attribute['name']];
                });
                thumbGroup.push(removeThumbEntry);
            }
            entries.push(new ContextMenuEntry("Thumbnail >", null, thumbGroup));
        }

        entries.push(new ContextMenuEntry("Copy", async function () {
            try {
                await controller.copy();
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        }));

        const createGroup = [];
        const showGroup = [];
        const addGroup = [];
        const setGroup = [];

        ContextMenuController.addEntriesForAllAttributes(model, showGroup, setGroup, addGroup);
        /*if (controller.isInDebugMode()) {
            //showGroup.add(...); //TODO: Add entry for model '_changes'
        }*/

        const createCopyEntry = new ContextMenuEntry("Copy", async function (event, target) {
            controller.setLoadingState(true);
            try {
                var items = controller.getSelected();
                if (!items || (items.length == 1 && items[0] == target)) {
                    var data = { ...target._obj.getData() };

                    var skeleton = target._obj.getSkeleton();
                    delete data['id'];
                    delete data['created_at'];
                    delete data['updated_at'];
                    for (var attr of skeleton) {
                        if (attr['hidden'] || attr['readonly'] || attr['unique'])
                            delete data[attr['name']];
                    }

                    var panel = PanelController.createPanel(target._obj.getTypeString(), data, ActionEnum.create);

                    await controller.getModalController().openPanelInModal(panel);
                    controller.setLoadingState(false);
                } else
                    throw new Error('Copy only supports one item at a time');
            } catch (error) {
                controller.setLoadingState(false);
                if (error)
                    controller.showError(error);
            }
            return Promise.resolve();
        });
        createGroup.push(createCopyEntry);

        const createCsvEntry = new ContextMenuEntry("CSV", async function (event, target) {
            var items;
            if (model.isCollection())
                items = target._obj.getAllItems();
            else {
                items = controller.getSelectedObjects();
                if (!items)
                    items = [target._obj];
            }
            return controller.getModalController().openPanelInModal(new CreateCsvPanel(model, items));
        });
        createGroup.push(createCsvEntry);

        const createPlaylistEntry = new ContextMenuEntry("Playlist File", async function (event, target) {
            try {
                const obj = target.getObject();
                const model = obj.getModel();
                var objects;
                if (model.isCollection())
                    objects = obj.getAllItems();
                else {
                    const selected = app.getController().getSelectedObjects();
                    if (selected && selected.length > 0)
                        objects = selected;
                    else
                        objects = [obj];
                }
                if (objects) {
                    const playlistEntries = [];
                    var media;
                    var file;
                    var title;
                    for (var object of objects) {
                        media = model.getMedia(object);
                        if (media)
                            file = media.getFile();
                        else
                            file = null;
                        if (file) {
                            title = object.getAttributeValue('title');
                            if (!title)
                                title = 'unknown';
                            playlistEntries.push({ 'title': title, 'file': file });
                        } else
                            throw new Error('Missing file');
                    }
                    FileCreator.createPlaylist(playlistEntries);
                }
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        });
        createPlaylistEntry.setVisibilityFunction(function (target) {
            var bVisible;
            const obj = target.getObject();
            const model = obj.getModel();
            if (model.isCollection()) {
                const data = obj.getData();
                bVisible = data.subtype && data.subtype == "playlist";
            } else {
                var file;
                if (target.getClass() == MediaPanel) {
                    const thumb = target.getThumbnail();
                    if (thumb)
                        file = thumb.getMedia().getFile();
                }
                bVisible = file && isVideo(file);
            }
            return bVisible;
        });
        createGroup.push(createPlaylistEntry);

        if (model.isCollection()) {
            entries.push(new ContextMenuEntry("Paste", async function (event, target) {
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
                                if (droptype === target._obj.getCollectionType()) {
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
                                                    await target.addItems(items);
                                                }
                                            } else
                                                await target.addItems(new CrudObject(droptype, data));
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
            }));

            entries.push(new ContextMenuEntry("Save", async function (event, target) {
                try {
                    await target._obj.save();
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }));
        }

        if (createGroup.length > 0)
            entries.push(new ContextMenuEntry("Create >", null, createGroup));
        if (showGroup.length > 0)
            entries.push(new ContextMenuEntry("Show >", null, showGroup));
        if (setGroup.length > 0)
            entries.push(new ContextMenuEntry("Set >", null, setGroup));
        if (addGroup.length > 0)
            entries.push(new ContextMenuEntry("Add >", null, addGroup));

        const openGroup = [];
        const openInNewTabEntry = new ContextMenuEntry("Open in new Tab", function (event, target) {
            var items = app.getController().getSelected();
            if (!items || (items.length == 1 && items[0] == target)) {
                target.openInNewTab(ActionEnum.read);
            } else {
                var objs = items.map(function (panel) {
                    return panel.getObject();
                });
                var url = DataService.getUrlForObjects(objs);
                var win = window.open(url, '_blank');
                win.focus();
            }
            return Promise.resolve();
        });
        openGroup.push(openInNewTabEntry);

        const openThumbnailEntry = new ContextMenuEntry("Open Thumbnail", async function (event, target) {
            return target.openThumbnail();
        });
        openThumbnailEntry.setVisibilityFunction(function (target) {
            return target.getClass() == MediaPanel;
        });
        openGroup.push(openThumbnailEntry);

        entries.push(new ContextMenuEntry("Open >", async function (event, target) {
            const controller = app.getController();
            try {
                var items = controller.getSelected();
                var typeString;
                var model;
                var def;
                var id;
                var where;
                if (!items || (items.length == 1 && items[0] == target)) {
                    typeString = target._obj.getTypeString();
                    model = target._obj.getModel();
                    def = model.getDefinition();
                    if (def['options']['increments'])
                        id = target._obj.getData()['id'];
                    else {
                        var attributes = model.getModelAttributesController().getAttributes();
                        var prime = [];
                        for (var attr of attributes) {
                            if (attr['primary'])
                                prime.push(attr['name']);
                        }
                        if (prime.length == 1) {
                            var key = prime[0];
                            where = key + "=" + target._obj.getData()[key];
                        } else
                            throw new Error('Failed to determine primary key!');
                    }
                } else {
                    var obj = items[0].getObject();
                    typeString = obj.getTypeString();
                    model = obj.getModel();
                    def = model.getDefinition();
                    if (def['options']['increments']) {
                        id = items.map(function (panel) {
                            return panel.getObject().getId();
                        });
                    } else {
                        var attributes = model.getModelAttributesController().getAttributes();
                        var prime = [];
                        for (var attr of attributes) {
                            if (attr['primary'])
                                prime.push(attr['name']);
                        }
                        if (prime.length == 1) {
                            var key = prime[0];
                            for (var item of items) {
                                if (where)
                                    where += "&" + key + "=" + item.getObject().getData()[key];
                                else
                                    where = key + "=" + item.getObject().getData()[key];
                            }
                        } else
                            throw new Error('Failed to determine primary key!');
                    }
                }
                var state = new State();
                state.typeString = typeString;
                if (id)
                    state.id = id;
                if (where)
                    state.where = where;
                return controller.loadState(state, true);
            } catch (error) {
                controller.showError(error);
            }
            return Promise.resolve();
        }, openGroup));

        entries.push(new ContextMenuEntry("Details", async function (event, target) {
            return target.openInModal(ActionEnum.read);
        }));

        entries.push(new ContextMenuEntry("Edit", async function (event, target) {
            const modal = await target.openInModal(ActionEnum.update);
            if (event.ctrlKey) {
                var panel = modal.getPanel();
                var form = panel.getForm();
                var entries = form.getFormEntry();
                if (entries) {
                    for (var entry of entries) {
                        if (!entry.isVisible())
                            await entry.show();
                    }
                }
            }
            return Promise.resolve();
        }));

        entries.push(new ContextMenuEntry("Delete", async function (event, target) {
            const controller = app.getController();
            var selected = controller.getSelected();
            if (!selected || selected.length == 0 || (selected.length == 1 && selected[0] == target)) {
                var parentPanel = target.parent;
                if (parentPanel && parentPanel.getClass() == CollectionPanel) {
                    var obj = target.getObject();
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
                    target.openInModal(ActionEnum.delete)
            } else {
                var bConfirmation = await controller.getModalController().openConfirmModal("Delete all selected items?");
                if (bConfirmation) {
                    controller.setLoadingState(true);
                    try {
                        var parentPanel = target.parent;
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
        }));

        if (app.getController().isInDebugMode()) {
            const debugGroup = [];
            const jsonEntry = new ContextMenuEntry("JSON", function (event, target) {
                return app.getController().getModalController().openPanelInModal(new JsonPanel(target.getObject().getData()));
            });
            debugGroup.push(jsonEntry);

            entries.push(new ContextMenuEntry("Debug >", null, debugGroup));
        }

        return entries;
    }

    static addEntriesForAllAttributes(model, showGroup, setGroup, addGroup) {
        var attributes = model.getModelAttributesController().getAttributes();
        if (attributes) {
            var sorted = [...attributes].sort((a, b) => a.name.localeCompare(b.name));
            var entry;
            var bAddSetEntry;
            for (let attr of sorted) {
                bAddSetEntry = true;
                switch (attr['dataType']) {
                    case "relation":
                        if (attr['model']) {
                            entry = new ContextMenuEntry(attr['name'], async function (event, target) {
                                var objs;
                                var selected = app.getController().getSelectedObjects();
                                if (selected && selected.length > 0)
                                    objs = selected;
                                else
                                    objs = [target.getObject()];

                                var state = ContextMenuController._getState(model, attr, objs);

                                const controller = app.getController();
                                if (controller.getConfigController().experimentalFeaturesEnabled()) {
                                    var current = controller.getStateController().getState();
                                    var name = this['name'];
                                    var scope;
                                    if (current['query']) {
                                        for (var part of current['query']) {
                                            if (part.startsWith(name + '_any')) {
                                                scope = part;
                                                break;
                                            }
                                        }
                                    }
                                    if (scope && confirm('Keep current filter on \'' + name + '\'?'))
                                        state.where = `id_in=${scope.substring(scope.indexOf('=') + 1)}&${state.where}`;
                                }
                                await controller.loadState(state, true);
                            });
                            showGroup.push(entry);

                            if (attr['multiple'] && !attr['readonly']) {
                                entry = new ContextMenuEntry(attr['name'], function (event, target) {
                                    var objs;
                                    var selected = app.getController().getSelectedObjects();
                                    if (selected && selected.length > 0)
                                        objs = selected;
                                    else
                                        objs = [target.getObject()];

                                    const panel = ContextMenuController._getAddPanel(model, attr, objs, target);
                                    PanelController.createPanel(attr['model'], attr, ActionEnum.create);
                                    return app.getController().getModalController().openPanelInModal(panel);
                                });
                                addGroup.push(entry);
                                bAddSetEntry = false;
                            }
                        }
                        break;
                    default:
                }
                if (bAddSetEntry && !attr['readonly']) {
                    entry = new ContextMenuEntry(attr['name'], function (event, target) {
                        const controller = app.getController();
                        var skeleton;
                        if (attr['hidden']) {
                            var copy = { ...attr };
                            delete copy['hidden'];
                            skeleton = [copy];
                        } else
                            skeleton = [attr];
                        var panel = new FormPanel(null, skeleton);
                        panel.setApplyAction(async function (p) {
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
                        return controller.getModalController().openPanelInModal(panel);
                    });
                    setGroup.push(entry);
                }
            }
        }
    }

    static _getBackLink(model, attr) {
        var backLink = null;
        if (attr['multiple']) {
            if (attr['via'])
                backLink = attr['via'];
        }
        if (!backLink) {
            var relModel = app.getController().getModelController().getModel(attr['model']);
            if (relModel) {
                var relAttributes = relModel.getModelAttributesController().getAttributes();
                if (relAttributes) {
                    for (var relAttr of relAttributes) {
                        if (relAttr['dataType'] === "relation" && relAttr['model'] === model.getName() && relAttr['multiple'] && !relAttr['via']) {
                            backLink = relAttr['name'];
                            break;
                        }
                    }
                }
            }
        }
        return backLink;
    }

    static _getState(model, attr, objs) {
        var state;
        const params = [];
        const backLink = ContextMenuController._getBackLink(model, attr);
        if (backLink) {
            if (attr['via'] && objs.length == 1)
                params.push(backLink + "=" + objs[0].getData()['id']);
            else {
                var ids = objs.map(function (x) { return x.getData()['id'] });
                params.push(backLink + "_any=" + ids.join(','));
            }
        } else {
            const map = new Map();
            var data;
            var relData;
            for (var i = 0; i < objs.length; i++) {
                data = objs[i].getData();
                if (data) {
                    relData = data[attr['name']];
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
            var str = model.getName() + ":" + objs.map(function (x) { return x.getTitle() }).join(' || ');
            if (str.length < 70)
                state.name = str;
            else
                state.name = str.substring(0, 70) + '...';
            state.typeString = attr['model'];
            state.setQuery(params);
        }
        return state;
    }

    static _getAddPanel(model, attr, objs, target) {
        var panel;
        if (attr['multiple'] && !attr['readonly']) {
            if (!attr['via'] || objs.length == 1) {
                const data = {};
                const backLink = ContextMenuController._getBackLink(model, attr);
                if (backLink) {
                    if (attr['via'])
                        data[backLink] = objs[0].getId();
                    else
                        data[backLink] = objs.map(x => x.getId());
                }
                if (attr['hidden'] && backLink)
                    panel = PanelController.createPanel(attr['model'], data, ActionEnum.create);
                else
                    panel = new AddRelatedItemPanel(objs, attr, data, async function () {
                        var obj = this.getObject();
                        if (obj.getId())
                            await obj.read();
                        await this.render();
                        return Promise.resolve();
                    }.bind(target));
            }
        }
        return panel;
    }
}