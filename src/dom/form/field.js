  /*--------------------------------- FIELD ----------------------------------*/

  (function(dom) {
    (function() {
      var tagName, i = -1,
       tagNames = ['button', 'input', 'option', 'select', 'textarea'];
      while (tagName = tagNames[++i]) {
        Element.extendByTag(tagName);
      }
    })();

    var CHECKED_INPUT_TYPES = {
      'CHECKBOX': 1,
      'RADIO':    1
    },

    INPUT_BUTTONS = {
      'button': 1,
      'image':  1,
      'reset':  1,
      'submit': 1
    },

    PLUGINS = {
      'BUTTON':   buttonPlugin,
      'INPUT':    inputPlugin,
      'OPTION':   optionPlugin,
      'SELECT':   selectPlugin,
      'TEXTAREA': textAreaPlugin
    },

    buttonPlugin   = dom.ButtonElement.plugin,

    inputPlugin    = dom.InputElement.plugin,

    optionPlugin   = dom.OptionElement.plugin,

    selectPlugin   = dom.SelectElement.plugin,

    textAreaPlugin = dom.TextAreaElement.plugin,

    getOptionValue = function getValue() {
      var element = this.raw || this, text = element.text, value = element.value;
      return fuse.String(value || text);
    };


    /* define common field class methods */

    inputPlugin.activate = function activate() {
      var element = this.raw || this;
      try { element.focus(); } catch(e) { }
      if (element.select && getNodeName(element) !== 'BUTTON' &&
          !INPUT_BUTTONS[element.type])
        element.select();
      return this;
    };

    inputPlugin.clear = function clear() {
      var element = this.raw || this, nodeName = getNodeName(element);
      if (nodeName !== 'BUTTON' && !INPUT_BUTTONS[element.type])
        PLUGINS[nodeName].setValue.call(this, null);
      return this;
    };

    inputPlugin.disable = function disable() {
      (this.raw || this).disabled = true;
      return this;
    };

    inputPlugin.enable = function enable() {
      (this.raw || this).disabled = false;
      return this;
    };

    inputPlugin.focus = function focus() {
      // avoid IE errors when element
      // or ancestors are not visible
      try { (this.raw || this).focus(); } catch(e) { }
      return this;
    };

    inputPlugin.present = function present() {
      return !!(this.raw || this).value;
    };

    inputPlugin.serialize = function serialize() {
      var value, pair,
       element = this.raw || this, nodeName = getNodeName(element);

      if (!element.disabled && element.name) {
        value = PLUGINS[nodeName].getValue.call(this);
        if (isArray(value) && value.length < 2)
          value = value[0];
        if (value != null) {
          pair = { };
          pair[element.name] = value;
          return Obj.toQueryString(pair);
        }
      }
      return fuse.String('');
    };

    inputPlugin.select = function select() {
      (this.raw || this).select();
      return this;
    };

    // copy InputElement methods to the other field classes
    eachKey(inputPlugin, function(value, key, object) {
      if (key !== 'constructor' && hasKey(object, key))
        buttonPlugin[key]   =
        selectPlugin[key]   =
        textAreaPlugin[key] = value;
    });


    /* define getValue/setValue for each field class */

    inputPlugin.getValue = function getValue() {
      var element = this.raw || this;
      return CHECKED_INPUT_TYPES[element.type.toUpperCase()] && !element.checked
        ? null
        : fuse.String(element.value);
    };

    inputPlugin.setValue = function setValue(value) {
      var element = this.raw || this;
      if (CHECKED_INPUT_TYPES[element.type.toUpperCase()])
        element.checked = !!value;
      else element.value = value || '';
      return this;
    };

    selectPlugin.initialize = function initialize() {
      this.options = this.raw.options;
    };

    selectPlugin.getValue = function getValue() {
      var i, node, element = this.raw || this, result = null;
      if (element.type === 'select-one') {
        var index = element.selectedIndex;
        if (index > -1) result = getOptionValue.call(element.options[index]);
      }
      else if (element.options.length) {
        result = fuse.Array(); i = 0;
        while (node = element.options[i++])
          if (node.selected) result.push(getOptionValue.call(node));
      }
      return result;
    };

    selectPlugin.setValue = function setValue(value) {
      var node, i = 0, element = this.raw || this;
      if (value === null)
        element.selectedIndex = -1;

      else if (isArray(value)) {
        // quick of array#indexOf
        value = expando + value.join(expando) + expando; i = 0;
        while (node = element.options[i++])
          node.selected = value.indexOf(expando + getOptionValue.call(node) + expando) > -1;
      }
      else {
        value = String(value);
        while (node = element.options[i++])
          if (getOptionValue.call(node) == value) { node.selected = true; break; }
      }
      return this;
    };

    buttonPlugin.getValue   =
    textAreaPlugin.getValue = function getValue() {
      return fuse.String((this.raw || this).value);
    };

    buttonPlugin.setValue   =
    textAreaPlugin.setValue =
    optionPlugin.setValue   = function setValue(value) {
      (this.raw || this).value  = value || '';
      return this;
    };

    optionPlugin.getValue = getOptionValue;

    // handle IE6/7 bug with button elements
    if (envTest('BUTTON_VALUE_CHANGES_AFFECT_INNER_CONTENT')) {
      buttonPlugin.getValue = function getValue() {
        return buttonPlugin.getAttribute.call(this, 'value');
      };

      buttonPlugin.setValue = function setValue(value) {
        return buttonPlugin.setAttribute.call(this, 'value', value);
      };
    }

    // prevent JScript bug with named function expressions
    var initialize = nil,
     activate =      nil,
     clear =         nil,
     disable =       nil,
     enable =        nil,
     focus =         nil,
     getValue =      nil,
     present =       nil,
     select =        nil,
     setValue =      nil,
     serialize =     nil;
  })(fuse.dom);
