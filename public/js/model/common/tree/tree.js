class Tree {

    static getAllTreeNodes(item) {
        var nodes = [];
        if (Array.isArray(item)) {
            if (item.length > 0) {
                for (var node of item) {
                    if (!node.type || node.type === 'node') {
                        nodes.push(node);
                    } else if (node.type === 'folder') {
                        if (node.nodes)
                            nodes.push(...Tree.getAllTreeNodes(node.nodes));
                    }
                }
            }
        } else if (item.nodes)
            nodes.push(...Tree.getAllTreeNodes(item.nodes));
        return nodes;
    }

    static getNode(arr, name) {
        var res;
        if (Array.isArray(arr) && arr.length > 0) {
            for (var node of arr) {
                if (!node.type || node.type === 'node') {
                    if (node.name === name) {
                        res = node;
                        break;
                    }
                } else if (node.type === 'folder') {
                    res = Tree.getNode(node.nodes, name);
                    if (res)
                        break;
                }
            }
        }
        return res;
    }

    _conf;

    constructor(conf) {
        this.setTreeConf(conf);
    }

    getTreeConf(bRemoveActions) {
        var conf;
        if (bRemoveActions) {
            conf = JSON.parse(JSON.stringify(this._conf));
            var treeNodes = Tree.getAllTreeNodes(conf);
            for (let node of treeNodes)
                delete node['actions'];
        } else
            conf = this._conf;
        return conf;
    }

    setTreeConf(conf) {
        if (Array.isArray(conf)) {
            this._conf = {
                'type': 'dummyRoot',
                'nodes': conf
            };
        } else
            this._conf = conf;
    }

    getRootTreeNode() {
        return new TreeNode(this._conf);
    }

    addTreeNode(name) {
        var folder = {
            "type": "folder",
            "name": name
        }
        if (this._conf.nodes && this._conf.nodes.length > 0)
            this._conf.nodes.unshift(folder);
        else
            this._conf.nodes = [folder];
    }
}