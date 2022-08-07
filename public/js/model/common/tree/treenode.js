class TreeNode {

    _conf;
    _parent;

    constructor(conf, parent) {
        this._conf = conf;
        this._parent = parent;
    }

    getTreeNodeConf() {
        return this._conf;
    }

    setTreeNodeConf(conf) {
        this._conf = conf;
    }

    getParent() {
        return this._parent;
    }

    isRootTreeNode() {
        return ((this._parent === undefined) || (this._parent === null));
    }

    getTreeNodeName() {
        return this._conf['name'];
    }

    setTreeNodeName(name) {
        this._conf['name'] = name;
    }

    getTreeNodeType() {
        return this._conf['type'];
    }

    hasCheckBox() {
        return this._conf['checkbox'];
    }

    getActions() {
        return this._conf['actions'];
    }

    getChildTreeNodes() {
        var nodes;
        if (this._conf.nodes) {
            nodes = [];
            for (var node of this._conf.nodes) {
                nodes.push(new TreeNode(node, this));
            }
        }
        return nodes;
    }

    removeChildTreeNode(conf) {
        this._conf.nodes = this._conf.nodes.filter(function (x) { return x != conf });
    }

    addChildTreeNode(conf) {
        if (this._conf.type === "folder") {
            if (this._conf.nodes)
                this._conf.nodes.push(conf);
            else
                this._conf["nodes"] = [conf];
        }
    }

    deleteTreeNode() {
        if (this._parent)
            this._parent.removeChildTreeNode(this._conf);
    }
}