  /*---------------------------- SELECTOR: PEPPY -----------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      var item, i = 0,
       results = peppy.query(String(selector || ''), Fuse.getDocument(element));
      while (item = results[i++])
        if (item === element) return true;
      return false;
    };

    Selector.select = function select(selector, context) {
      return toList(peppy.query(String(selector || ''),
        context && context.raw || context || Fuse._doc));
    };

     var toList = NodeList.fromNodeList, match = nil, select = nil;
  })(Fuse.Dom.Selector, Fuse.Dom.NodeList);
