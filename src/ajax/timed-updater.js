  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  fuse.ajax.TimedUpdater = (function() {

    var Obj = fuse.Object,

    Request = fuse.ajax.Request,

    Klass   = function() { },

    TimedUpdater = function TimedUpdater(container, url, options) {
      var onDone,
       callbackName = 'on' + capitalize(Request.READY_STATES[4]),
       instance     = __instance || new Klass,
       options      = Obj.extend(Obj.clone(TimedUpdater.defaults), options);

      __instance = null;

      // this._super() equivalent
      fuse.ajax.Base.call(instance, url, options);
      options = instance.options;

      // dynamically set readyState eventName to allow for easy customization
      onDone = options[callbackName];

      instance.container = container;
      instance.frequency = options.frequency;
      instance.maxDecay  = options.maxDecay;

      options[callbackName] = function(request, json) {
        if (!request.aborted) {
          instance.updateDone(request);
          onDone && onDone(request, json);
        }
      };

      instance.onStop = options.onStop;
      instance.onTimerEvent = function() { instance.start(); };
      instance.start();
      return instance;
    },

    __instance,
    __apply = TimedUpdater.apply,
    __call = TimedUpdater.call;

    TimedUpdater.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    TimedUpdater.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    fuse.Class(fuse.ajax.Base, { 'constructor': TimedUpdater });
    Klass.prototype = TimedUpdater.plugin;
    return TimedUpdater;
  })();

  (function(plugin) {
    plugin.updateDone = function updateDone(request) {
      var options = this.options, decay = options.decay,
       responseText = request.responseText;

      if (decay) {
        this.decay = Math.min(responseText == String(this.lastText) ?
          (this.decay * decay) : 1, this.maxDecay);

        this.lastText = responseText;
      }

      this.timer = setTimeout(this.onTimerEvent,
        this.decay * this.frequency * this.timerMultiplier);
    };

    plugin.start = function start() {
      this.updater = new fuse.ajax.Updater(this.container, this.url, this.options);
    };

    plugin.stop = function stop() {
      global.clearTimeout(this.timer);
      this.lastText = null;
      this.updater.abort();
      this.onStop && this.onStop.apply(this, arguments);
    };

    // prevent JScript bug with named function expressions
    var updateDone = null, start = null, stop = null;
  })(fuse.ajax.TimedUpdater.plugin);

  fuse.ajax.TimedUpdater.defaults = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };
