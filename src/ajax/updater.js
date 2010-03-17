  /*------------------------------ AJAX: UPDATER -----------------------------*/

  fuse.ajax.Updater = (function() {
    var Request = fuse.ajax.Request,

    Klass = function() { },

    Updater = function Updater(container, url, options) {
      var callbackName = 'on' + Request.Events[4],
       instance = __instance || new Klass,
       onDone = options[callbackName];

      __instance = null;

      instance.container = {
        'success': fuse.get(container.success || container),
        'failure': fuse.get(container.failure || (container.success ? null : container))
      };

      options[callbackName] = function(request, json) {
        instance.updateContent(request.responseText);
        onDone && onDone(request, json);
      };

      // instance._super() equivalent
      fuse.ajax.Request.call(instance, url, options);
    },

    __instance,
    __apply = Updater.apply,
    __call = Updater.call;

    Updater.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Updater.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Class(fuse.ajax.Request, { 'constructor': Updater });
    Klass.prototype = Updater.plugin;
    return Updater;
  })();

  fuse.ajax.Updater.plugin.updateContent = (function() {
    var updateContent = function updateContent(responseText) {
      var insertion,
       options = this.options,
       receiver = this.container[this.isSuccess() ? 'success' : 'failure'];

      if (receiver) {
        if (!options.evalScripts) {
          responseText = responseText.stripScripts();
        }
        if (options.insertion) {
          if (isString(options.insertion)) {
            insertion = { }; insertion[options.insertion] = responseText;
            receiver.insert(insertion);
          } else {
            options.insertion(receiver, responseText);
          }
        } else {
          receiver.update(responseText);
        }
      }
    };

    return updateContent;
  })();
