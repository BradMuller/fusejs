  /*----------------------------- DOM: DOCUMENT ------------------------------*/

  Document = 
  fuse.dom.Document = (function() {
    function Decorator() { }

    function Document(node) {
      // quick return if empty, decorated, or not a document node
      if (!node || node.raw || node.nodeType !== DOCUMENT_NODE)
        return node;

      var decorated, pluginViewport, viewport,
       id = Node.getFuseId(node),
       data = Data[id];

      // return cached if available
      if (data.decorator) return data.decorator;

      decorated =
      data.decorator = new Decorator;

      pluginViewport = Document.plugin.viewport;
      viewport = decorated.viewport = { };

      viewport.ownerDocument =
      decorated.raw = node;
      decorated.nodeName = node.nodeName;
 
      eachKey(pluginViewport, function(value, key, object) {
        if (hasKey(object, key)) viewport[key] = value;
      });

      return decorated;
    }

    var Document = Class(Node, { 'constructor': Document });
    Decorator.prototype = Document.plugin;
    Document.updateGenerics = Node.updateGenerics;
    return Document;
  })();

  (function(plugin) {
    var viewport =
    plugin.viewport = { };

    function define() {
      function getHeight() {
        return fuse.Number(dimensionNode.clientHeight);
      }

      function getWidth() {
        return fuse.Number(dimensionNode.clientWidth);
      }

      // Safari < 3 -> doc
      // Opera  < 9.5, Quirks mode -> body
      // Others -> docEl
      var doc = this.ownerDocument,
       dimensionNode = 'clientWidth' in doc ? doc : doc[fuse._info.root.property];

      // lazy define methods
      this.getHeight = getHeight;
      this.getWidth  = getWidth;

      return this[arguments[0]]();
    }

    plugin.getFuseId = function getFuseId() {
      return Node.getFuseId(this.raw || this);
    };

    viewport.getDimensions = function getDimensions() {
      return { 'width': this.getWidth(), 'height': this.getHeight() };
    };

    viewport.getHeight = function getHeight() {
      return define.call(this, 'getHeight');
    };

    viewport.getWidth = function getWidth() {
      return define.call(this, 'getWidth');
    };

    viewport.getScrollOffsets = (function() {
      var getScrollOffsets = function getScrollOffsets() {
        return returnOffset(global.pageXOffset, global.pageYOffset);
      };

      if (typeof global.pageXOffset !== 'number')
        getScrollOffsets = function getScrollOffsets() {
          var scrollEl = fuse._scrollEl;
          return returnOffset(scrollEl.scrollLeft, scrollEl.scrollTop);
        };

      return getScrollOffsets;
    })();

    // prevent JScript bug with named function expressions
    var getDimensions = nil,
     getFuseId =        nil,
     getHeight =        nil,
     getWidth =         nil,
     getScrollOffsets = nil;
  })(Document.plugin);
