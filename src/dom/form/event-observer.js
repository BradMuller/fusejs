  /*-------------------------- FORM: EVENT OBSERVER --------------------------*/

  (function() {
    var BaseEventObserver = Fuse.Class({
      'constructor': (function() {
        function BaseEventObserver(element, callback) {
          this.element = Fuse.get(element);

          var eventObserver = this, onElementEvent = this.onElementEvent;
          this.onElementEvent = function() { onElementEvent.call(eventObserver); };

          if (getNodeName(this.element) === 'FORM')
            return this.registerFormCallbacks();

          var member, name = element.name, i = 0;
          this.group = (name && Selector.select(element.nodeName +
            '[name="' + name + '"]', getDocument(this.element))) || [element];

          this.callback = callback;
          this.lastValue = this.getValue();

          while (member = this.group[i++])
            this.registerCallback(member);
        }
        var Selector = Fuse.Dom.Selector;
        return BaseEventObserver;
      })()
    });

    (function(plugin) {
      plugin.onElementEvent = function onElementEvent() {
        var value = this.getValue();
        if (this.lastValue === value) return;
        this.callback(this.element, value);
        this.lastValue = value;
      };

      plugin.registerCallback = function registerCallback(element) {
        if (!element.type) return;
        var eventName = 'change', type = element.type;
        if (type === 'checkbox' || type === 'radio')
          eventName = 'click';
        Event.observe(element, eventName, this.onElementEvent);
      };

      plugin.registerFormCallbacks = function registerFormCallbacks() {
        var element, elements = Form.getElements(this.element), i= 0;
        while (element = elements[i++]) this.registerCallback(element);
      };

      // prevent JScript bug with named function expressions
      var onElementEvent = nil, registerCallback = nil, registerFormCallbacks = nil;
    })(BaseEventObserver.plugin);

    /*------------------------------------------------------------------------*/

    Field.EventObserver = Fuse.Class(BaseEventObserver, {
      'constructor': (function() {
        function FieldEventObserver(element, callback) {
          if (!(this instanceof FieldEventObserver))
            return new FieldEventObserver(element, callback);
          BaseEventObserver.call(this, element, callback);
        }
        return FieldEventObserver;
      })(),

      'getValue': (function() {
        function getValue() {
          if (this.group.length === 1)
            return Field.getValue(this.element);
          var member, value, i = 0;
          while (member = this.group[i++])
            if (value = Field.getValue(member))
              return value;
        }
        return getValue;
      })()
    });

    Form.EventObserver = Fuse.Class(BaseEventObserver, {
      'constructor': (function() {
        function FormEventObserver(element, callback) {
          if (!(this instanceof FormEventObserver))
            return new FormEventObserver(element, callback);
          BaseEventObserver.call(this, element, callback);
        }
        return FormEventObserver;
      })(),

      'getValue': (function() {
        function getValue() { return Form.serialize(this.element); }
        return getValue;
      })()
    });
  })();
