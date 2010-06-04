  /*------------------------------ DOM: WINDOW -------------------------------*/

  Window =
  fuse.dom.Window = (function() {
    var isWindow = function(object) {
      return toString.call(object) === '[object Window]';
    },

    Decorator = function() { },

    Window = function Window(object, isCached) {
      // quick return if empty, decorated, or not a window object
      var data, decorated;
      if (!object || object.raw || !isWindow(object)) {
        return object;
      }
      if (isCached === false) {
        decorated = new Decorator;
      } else {
        // return cached if available
        data = domData[Node.getFuseId(object)];
        if (data.decorator) {
          return data.decorator;
        }
        decorated =
        data.decorator = new Decorator;
      }

      decorated.raw = object;
      return decorated;
    };

    // weak fallback
    if (!isWindow(global)) {
      isWindow = function(object) {
        return typeof object.frameElement !== 'undefined';
      };
    }

    fuse.Class({ 'constructor': Window });
    Decorator.prototype = Window.plugin;
    Window.updateGenerics = Node.updateGenerics;
    return Window;
  })();

  Window.plugin.getFuseId = Node.plugin.getFuseId;
