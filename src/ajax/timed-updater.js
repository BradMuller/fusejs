  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  Fuse.Ajax.TimedUpdater = (function() {
    function Klass() { }

    function TimedUpdater(container, url, options) {
      var onDone,
       instance     = this[expando] || new Klass,
       callbackName = 'on' + Request.Events[4],
       options      = _extend(clone(TimedUpdater.options), options);

      delete this[expando];

      // this._super() equivalent
      Fuse.Ajax.Base.call(instance, url, options);
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
    }

    var __apply = TimedUpdater.apply, __call = TimedUpdater.call,
     Request = Fuse.Ajax.Request,
     TimedUpdater = Class(Fuse.Ajax.Base, { 'constructor': TimedUpdater });

    TimedUpdater.call = function(thisArg) {
      thisArg[expando] = thisArg;
      return __call.apply(this, arguments);
    };

    TimedUpdater.apply = function(thisArg, argArray) {
      thisArg[expando] = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

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

      this.timer = global.setTimeout(this.onTimerEvent,
        this.decay * this.frequency * this.timerMultiplier);
    };

    plugin.start = function start() {
      this.updater = new Fuse.Ajax.Updater(this.container, this.url, this.options);
    };

    plugin.stop = function stop() {
      global.clearTimeout(this.timer);
      this.lastText = null;
      this.updater.abort();
      this.onStop && this.onStop.apply(this, arguments);
    };

    // prevent JScript bug with named function expressions
    var updateDone = nil, start = nil, stop = nil;
  })(Fuse.Ajax.TimedUpdater.plugin);

  Fuse.Ajax.TimedUpdater.options = {
    'decay':     1,
    'frequency': 2,
    'maxDecay':  Infinity
  };
