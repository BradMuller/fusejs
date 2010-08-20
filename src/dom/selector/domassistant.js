  /*---------------------------- SELECTOR: DOMASSISTANT ----------------------------*/

  fuse._engine = window.DOMAssistant;

  //= require "../../../vendor/domassistant/DOMAssistant.js"

  DOMAssistant.harmonize();

  (function(engine, object, NodeList) {
    var match = function match(element, selectors) {
      element = element.raw || fuse(element).raw;

      var node, i = -1, result = engine.$(fuse.dom.getDocument(element))
        .cssSelect(String(selectors || ''));

      while (node = result[++i]) {
        if (node == element) return true;
      }
      return false;
    },

    select = function select(selectors, context, callback) {
      var node, i = -1, result = engine.$(context && fuse(context).raw || fuse._doc)
        .cssSelect(String(selectors || ''));

      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return NodeList.fromArray(result);
    };

    object.engine = engine;
    object.match  = match;
    object.select = select;

  })(DOMAssistant, fuse.dom.selector, fuse.dom.NodeList);

  // restore
  if (fuse._engine) window.DOMAssistant = fuse._engine;
  delete fuse._engine;
