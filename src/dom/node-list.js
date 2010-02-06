  /*----------------------------- DOM: NODELIST ------------------------------*/

  NodeList =
  fuse.dom.NodeList = fuse.Fusebox().Array;

  addArrayMethods(NodeList);
  addNodeListMethods(NodeList);

  // ensure each element is wrapped
  (function(plugin) {
    NodeList.from = function from(iterable) {
      if (!iterable || iterable == '') return NodeList();
      var object = fuse.Object(iterable);
      if ('toArray' in object) return object.toArray();
      if ('item' in iterable)  return NodeList.fromNodeList(iterable);

      var length = iterable.length >>> 0, results = NodeList(length);
      while (length--) if (length in object) results[length] = Node(iterable[length]);
      return results;
    };

    NodeList.fromArray = function fromArray(array) {
      var results = new NodeList, length = array.length >>> 0;
      while (length--) results[length] = Node(array[length]);
      return results;
    };

    NodeList.fromNodeList = function fromNodeList(nodeList) {
      var i = 0, results = NodeList();
      while (results[i] = Node(nodeList[i++])) { }
      return results.length-- && results;
    };

    // ECMA 15.4.4.7
    plugin.push = function push() {
      if (this == null) throw new TypeError;
      var args = arguments, length = args.length, object = Object(this),
       pad = object.length >>> 0, newLength = pad + length;

      while (length--) this[pad + length] = new Node(args[length]);
      return newLength;
    };

    // ECMA-5 15.4.4.4
    plugin.concat = function concat() {
      if (this == null) throw new TypeError;
      var i = 0, args = arguments, length = args.length, object = Object(this),
       results = isArray(object) ? NodeList.fromArray(object) : NodeList(Node(object));

      for ( ; i < length; i++) {
        if (isArray(args[i])) {
          for (var j = 0, sub = args[i], subLen = sub.length; j < subLen; j++)
            results.push(Node(sub[j]));
        } else results.push(Node(args[i]));
      }
      return results;
    };

    // ECMA-5 15.4.4.13	
    plugin.unshift = (function(__unshift) {
      function unshift(item) {
        if (this == null) throw new TypeError;
        var args = arguments;
        return args.length > 1
          ? __unshift.apply(this, NodeList.fromArray(args))
          : __unshift.call(this, Node(item));
      }
      return unshift;
    })(plugin.unshift);

    // ECMA-5 15.4.4.12
    plugin.splice = (function(__splice) {
      function splice(start, deleteCount) {
        if (this == null) throw new TypeError;
        var args = arguments;
        return args.length > 2
          ? __splice.apply(this, concatList([start, deleteCount], NodeList.fromArray(slice.call(args, 2))))
          : __splice.apply(this, start, deleteCount);
      }
      return splice;
    })(plugin.splice);

    // make NodeList use fuse.Array#map so values aren't passed through fuse.dom.Node
    plugin.map = fuse.Array.plugin.map;

    // prevent JScript bug with named function expressions
    var concat = nil, from = nil, fromArray = nil, fromNodeList = nil, push = nil;
  })(NodeList.plugin);
