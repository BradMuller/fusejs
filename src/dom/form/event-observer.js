  /*-------------------------- FORM: EVENT OBSERVER --------------------------*/

  (function() {
    var BaseEventObserver = Class(function() {
      var CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 },

      BaseEventObserver = function BaseEventObserver(element, callback) {
        var member, name, i = -1, 
         eventObserver = this, onElementEvent = this.onElementEvent;

        this.element = fuse.get(element);
        element = element.raw || element;

        this.onElementEvent = function(event) {
          onElementEvent.call(eventObserver, event);
        };

        if (getNodeName(element) === 'FORM') {
          return this.registerFormCallbacks();
        }

        name = element.name;
        this.group =
          (name && fuse.query(element.nodeName +
          '[name="' + name + '"]', getDocument(element)).get()) ||
          NodeList(fuse.get(element));

        this.callback = callback;
        this.lastValue = this.getValue();

        while (member = this.group[++i]) {
          this.registerCallback(member);
        }
        return this;
      },
      
      onElementEvent = function onElementEvent(event) {
        var value = this.getValue();
        if (String(this.lastValue) != String(value)) {
          this.callback(this.element, value, event);
          this.lastValue = value;
        }
      },

      registerCallback = function registerCallback(element) {
        var type, decorator = fuse.get(element);
        element = decorator.raw || decorator;
        if (type = element.type) {
          decorator.observe(CHECKED_INPUT_TYPES[type] ? 'click' : 'change',
            this.onElementEvent);
        }
      },

      registerFormCallbacks = function registerFormCallbacks() {
        var element, elements = this.element.getControls(), i= 0;
        while (element = elements[i++]) this.registerCallback(element);
      };

      return {
        'constructor': BaseEventObserver,
        'onElementEvent': onElementEvent,
        'registerCallback': registerCallback,
        'registerFormCallbacks': registerFormCallbacks
      };
    }),

    /*------------------------------------------------------------------------*/

    CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 },

    Field = fuse.dom.InputElement,

    getValue = nil;


    Field.EventObserver = (function() {
      var Klass = function() { },

      FieldEventObserver = function FieldEventObserver(element, callback) {
        return BaseEventObserver.call(new Klass, element, callback);
      };

      Class(BaseEventObserver, { 'constructor': FieldEventObserver });
      Klass.prototype = FieldEventObserver.plugin;
      return FieldEventObserver;
    })();

    Field.EventObserver.plugin.getValue = function getValue() {
      var element, member, value, i = -1;
      if (this.group.length === 1) {
        return this.element.getValue();
      }
      while (member = this.group[++i]) {
        element = member.raw || member;
        if (CHECKED_INPUT_TYPES[element.type]) {
          if (element.checked) {
            return member.getValue();
          }
        } else if (value = member.getValue()) {
          return value;
        }
      }
    };

    Form.EventObserver = (function() {
      var Klass = function() { },

      FormEventObserver = function FormEventObserver(element, callback) {
        return BaseEventObserver.call(new Klass, element, callback);
      };

      Class(BaseEventObserver, { 'constructor': FormEventObserver });
      Klass.prototype = FormEventObserver.plugin;
      return FormEventObserver;
    })();

    Form.EventObserver.plugin.getValue = function getValue() {
      return this.element.serialize();
    };
  })();
