class TreeNode {

    _conf;
    _parent;

    _$divTreeNode;
    _$checkbox;

    _nodes;

    constructor(conf, parent) {
        this._conf = conf;
        this._parent = parent;
    }

    render() {
        var bNew;
        var $divTreeNode;
        if (this._$divTreeNode) {
            bNew = false;
            $divTreeNode = this._$divTreeNode;
            this._$divTreeNode.empty();
        } else {
            bNew = true;
            $divTreeNode = $('<div/>')
                .addClass('treenode');
            this._$divTreeNode = $divTreeNode;
        }

        if (this._conf.root && this._conf.root == true) {
            $divTreeNode.addClass('root');

            var $divTreeGroup = $('<div/>')
                .addClass('treegroup')
                .addClass('show');

            var node;
            this._nodes = [];
            if (this._conf.nodes) {
                for (var elem of this._conf.nodes) {
                    node = new TreeNode(elem, this);
                    this._nodes.push(node);
                    $divTreeGroup.append(node.render());
                }
            }

            $divTreeNode.append($divTreeGroup);
        } else if (this._conf.type && this._conf.type === "folder") {
            var $icon = new Icon("folder").renderIcon();
            $divTreeNode.append($icon);
            $divTreeNode.append(SPACE + this._conf.name);

            var $divTreeGroup = $('<div/>')
                .addClass('treegroup');

            if (this._conf.nodes) {
                var node;
                this._nodes = [];
                for (var elem of this._conf.nodes) {
                    node = new TreeNode(elem, this);
                    this._nodes.push(node);
                    $divTreeGroup.append(node.render());
                }
            }

            $divTreeNode.append($divTreeGroup);

            $divTreeNode.on("click.treenode", function (event) {
                if (event.originalEvent.originalTarget == this._$divTreeNode[0]) {
                    event.stopPropagation();
                    $divTreeGroup[0].classList.toggle('show');
                }
            }.bind(this));
        } else { //if (this._conf.type === "node")
            if (this._conf.checkbox) {
                this._$checkbox = $('<input />', { type: 'checkbox', value: this._conf.name });
                $divTreeNode.append(this._$checkbox);
            }
            $divTreeNode.append(this._conf.name);
        }

        if (bNew == true) {
            if (this._conf.click) {
                $divTreeNode.on("click.treenode", function (event) {
                    event.stopPropagation();
                    this._conf.click();
                }.bind(this));
            }

            if (!this._conf.root || this._conf.root == false) {
                $divTreeNode.attr({
                    "draggable": "true"
                });

                $divTreeNode.on("dragstart.treenode", function (event) {
                    event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(this._conf));
                }.bind(this));
            }

            $divTreeNode.on("dragover.treenode", function (event) {
                event.preventDefault();
            });

            $divTreeNode.on("dragleave.treenode", function (event) {
            });

            $divTreeNode.on("dragend.treenode", function (event) {
                event.stopPropagation();
                this._parent.removeNode(this._conf);
            }.bind(this));

            $divTreeNode.on("drop.treenode", function (event) {
                event.stopPropagation();
                this.addNode(JSON.parse(event.originalEvent.dataTransfer.getData("text/plain")));
            }.bind(this));
        }

        return $divTreeNode;
    }

    setConf(conf) {
        this._conf = conf;
    }

    removeNode(conf) {
        this._conf.nodes = this._conf.nodes.filter(function (x) { return x != conf });
        this.render();
    }

    addNode(conf) {
        if (this._conf.type === "folder") {
            if (this._conf.nodes)
                this._conf.nodes.push(conf);
            else
                this._conf["nodes"] = [conf];
        }
        this.render();
    }
}