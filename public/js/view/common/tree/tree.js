class Tree {

    static flattenTree(arr) {
        var nodes = [];
        if (Array.isArray(arr) && arr.length > 0) {
            for (var node of arr) {
                if (!node.type || node.type === 'node') {
                    nodes.push(node);
                } else if (node.type === 'folder') {
                    nodes.push(...Tree.flattenTree(node.nodes));
                }
            }
        }
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
    _node;
    //_$div;

    constructor(conf) {
        this.setConf(conf);
    }

    render() {
        if (this._node)
            this._node.setConf(this._conf);
        else
            this._node = new TreeNode(this._conf);
        var $div = this._node.render();
        return $div;
    }

    getConf() {
        return this._conf.nodes;
    }

    setConf(conf) {
        this._conf = {
            "root": true,
            "nodes": conf
        }
    }

    getSelectedNodes() {
        var values;
        var nodes = $("input[type='checkbox']:checked");
        if (nodes) {
            values = [];
            for (var node of nodes) {
                values.push(node.value);
            }
        }
        return values;
    }

    addFolder(name) {
        var folder = {
            "type": "folder",
            "name": name
        }
        if (this._conf.nodes && this._conf.nodes.length > 0)
            this._conf.nodes.unshift(folder);
        else
            this._conf.nodes = [folder];
        this.render();
    }
}