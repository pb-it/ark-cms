class TreeVis {

    _conf;
    _tree;

    _$tree;

    constructor(conf, tree) {
        this._conf = conf;
        this._tree = tree;

        this._$tree = $('<div/>').addClass('tree');
    }

    getTreeVisConf() {
        return this._conf;
    }

    isEditable() {
        return this._conf['editable'];
    }

    render() {
        this._$tree.empty();
        var treeNode = this._tree.getRootTreeNode();
        var treeNodeVis = new TreeNodeVis(this, treeNode);
        this._$tree.append(treeNodeVis.render());
        return this._$tree;
    }
}