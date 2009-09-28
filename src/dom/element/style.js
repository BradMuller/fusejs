  /*----------------------------- ELEMENT: STYLE -----------------------------*/

  (function(plugin) {
    var DIMENSION_NAMES = {
      'height': 1,
      'width':  1
    },

    FLOAT_TRANSLATIONS = typeof Fuse._docEl.style.styleFloat !== 'undefined'
      ? { 'float': 'styleFloat', 'cssFloat': 'styleFloat' }
      : { 'float': 'cssFloat' },

    POSITION_NAMES = {
      'bottom': 1,
      'left':   1,
      'right':  1,
      'top':    1
    },

    RELATIVE_CSS_UNITS = {
      'em': 1,
      'ex': 1
    },

    camelize = Fuse.String.plugin.camelize,

    nullHandlers = [];

    function getComputedStyle(element, name) {
      name = FLOAT_TRANSLATIONS[name] || name;
      var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
      return getValue(element, name, css && css[name]);
    }

    function getValue(element, name, value) {
      name = FLOAT_TRANSLATIONS[name] || name;
      value = value || element.style[name];
      if (name == 'opacity')
        return value === '1' ? '1.0' : parseFloat(value) || '0';
      return value === 'auto' || value === '' ? null : value;
    }

    function isNull(element, name) {
      var length = nullHandlers.length;
      while (length--) {
        if (nullHandlers[length](element, name))
          return true;
      }
      return false;
    }

    if (Bug('ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO'))
      nullHandlers.push(function(element, name) {
        return POSITION_NAMES[name] &&
          getComputedStyle(element, 'position') === 'static';
      });

    if (Bug('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN'))
      nullHandlers.push(function(element, name) {
        return DIMENSION_NAMES[name] && getComputedStyle(element, 'display') === 'none';
      });


    plugin.setStyle = function setStyle(styles) {
      var hasOpacity, key, opacity, elemStyle = this.style;

      if (isString(styles)) {
        elemStyle.cssText += ';' + styles;
        return styles.indexOf('opacity') > -1
          ? this.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1])
          : this;
      }

      if (isHash(styles)) styles = styles._object;
      hasOpacity = 'opacity' in styles;

      if (hasOpacity) {
        opacity = styles.opacity;
        this.setOpacity(opacity);
        delete styles.opacity;
      }

      for (key in styles)
        elemStyle[FLOAT_TRANSLATIONS[key] || key] = styles[key];

      if (hasOpacity) styles.opacity = opacity;
      return this;
    };


    // fallback for browsers without computedStyle or currentStyle
    if (!Feature('ELEMENT_COMPUTED_STYLE') && !Feature('ELEMENT_CURRENT_STYLE'))
      plugin.getStyle = function getStyle(name) {
        var result = getValue(this, camelize.call(name));
        return result === null ? result : Fuse.String(result);
      };

    // Opera 9.2x
    else if (Bug('ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX'))
      plugin.getStyle = function getStyle(name) {
        name = camelize.call(name);
        var dim, result, element = this.raw || this;

        if (isNull(element, name))
          return null;

        if (DIMENSION_NAMES[name]) {
          dim = name == 'width' ? 'Width' : 'Height';
          result = getComputedStyle(element, name);
          if ((parseFloat(result) || 0) === element['offset' + dim])
            return Fuse.String(Element['get' + dim](element, 'content') + 'px');
        }

        result = getComputedStyle(element, name);
        return result === null ? result : Fuse.String(result);
      };

    // Firefox, Safari, Opera 9.5+
    else if (Feature('ELEMENT_COMPUTED_STYLE'))
      plugin.getStyle = function getStyle(name) {
        name = camelize.call(name);
        var result, element = this.raw || this;

        if (isNull(element, name)) return null;

        result = getComputedStyle(element, name);
        return result === null ? result : Fuse.String(result);
      };

    // IE
    else plugin.getStyle = (function() {
      // We need to insert into element a span with the M character in it.
      // The element.offsetHeight will give us the font size in px units.
      // Inspired by Google Doctype:
      // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
      var span = Fuse._doc.createElement('span');
      span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
      span.innerHTML = 'M';

      function getStyle(name) {
        var currStyle, element, elemStyle, runtimeStyle, runtimePos,
         stylePos, pos, result, size, unit;

        // handle opacity
        if (name == 'opacity') {
          result = String(this.getOpacity());
          if (result.indexOf('.') < 0) result += '.0';
          return Fuse.String(result);
        }

        element = this.raw || this;
        name = camelize.call(name);

        // get cascaded style
        name      = FLOAT_TRANSLATIONS[name] || name;
        elemStyle = element.style;
        currStyle = element.currentStyle || elemStyle;
        result    = currStyle[name];

        // handle auto values
        if (result === 'auto') {
          if (DIMENSION_NAMES[name] && currStyle.display !== 'none')
            return Fuse.String(this['get' +
              (name == 'width' ? 'Width' : 'Height')]('content') + 'px');
          return null;
        }

        // If the unit is something other than a pixel (em, pt, %),
        // set it on something we can grab a pixel value from.
        // Inspired by Dean Edwards' comment
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
        if (/^\d+(\.\d+)?(?!px)[%a-z]+$/i.test(result)) {
          if (name == 'fontSize') {
            unit = result.match(/\D+$/)[0];
            if (unit === '%') {
              size = element.appendChild(span).offsetHeight;
              element.removeChild(span);
              return Fuse.String(Math.round(size) + 'px');
            }
            else if (RELATIVE_CSS_UNITS[unit])
              elemStyle = (element = element.parentNode).style;
          }

          runtimeStyle = element.runtimeStyle;

          // backup values
          pos = name == 'height' ? 'top' : 'left';
          stylePos = elemStyle[pos];
          runtimePos = runtimeStyle[pos];

          // set runtimeStyle so no visible shift is seen
          runtimeStyle[pos] = stylePos;
          elemStyle[pos] = result;
          result = elemStyle['pixel' + (pos === 'top' ? 'Top' : 'Left')] + 'px';

          // revert changes
          elemStyle[pos] = stylePos;
          runtimeStyle[pos] = runtimePos;
        }
        return Fuse.String(result);
      }

      return getStyle;
    })();

    // prevent JScript bug with named function expressions
    var getStyle = nil, setStyle = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  // Note: For performance we only support classNames containing \x20 spaces.
  // Newline, tab and other whitespaces are not supported.
  (function(plugin) {
    plugin.addClassName = function addClassName(className) {
      if (!this.hasClassName(className)) {
        var element = this.raw || this;
        element.className += (element.className ? ' ' : '') + className;
      }
      return this;
    };

    plugin.classNames = function classNames() {
      var cn = (this.raw || this).className;
      return cn ? Fuse.String(cn).split(' ') : Fuse.List();
    };

    plugin.hasClassName = function hasClassName(className) {
      var cn = (this.raw || this).className;
      return cn.length > 0 && (cn === className || (' ' + cn + ' ')
        .indexOf(' ' + className + ' ') > -1);
    };

    plugin.removeClassName = function removeClassName(className) {
      var classNames, cn, length,
       element = this.raw || this, i = 0, result = [];

      if (cn = element.className) {
        classNames = cn.split(' ');
        length = classNames.length;

        while (i < length) {
          cn = classNames[i++];
          if (cn != className) result.push(cn);
        }
        element.className = result.join(' ');
      }
      return this;
    };

    plugin.toggleClassName = function toggleClassName(className) {
      return this[this.hasClassName(className) ?
        'removeClassName' : 'addClassName'](className);
    };

    // prevent JScript bug with named function expressions
    var addClassName = nil,
     classNames =      nil,
     hasClassName =    nil,
     removeClassName = nil,
     toggleClassName = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    plugin.getDimensions = function getDimensions(options) {
      return {
        'width': this.getWidth(options),
        'height': this.getHeight(options)
      };
    };

    plugin.getOpacity = (function() {
      var getOpacity = function getOpacity() {
        return Fuse.Number(parseFloat(this.style.opacity));
      };

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        getOpacity = function getOpacity() {
          var element = this.raw || this,
           style = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return Fuse.Number(parseFloat(style
            ? style.opacity
            : element.style.opacity));
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        getOpacity = function getOpacity() {
          var element = this.raw || this,
           currStyle = element.currentStyle || element.style,
           result = currStyle['filter'].match(/alpha\(opacity=(.*)\)/);
          return Fuse.Number(result && result[1] ? parseFloat(result[1]) / 100 : 1.0);
        };
      }
      return getOpacity;
    })();

    plugin.setOpacity = (function() {
      var setOpacity = function setOpacity(value) {
        this.style.opacity = (value == 1 || value == '' && isString(value)) ? '' :
          (value < 0.00001) ? '0' : value;
        return this;
      };

      // TODO: Is this really needed or the best approach ?
      if (Fuse.Env.Agent.WebKit && (userAgent.match(/AppleWebKit\/(\d+)/) || [])[1] < 500) {
        var __setOpacity = setOpacity;

        setOpacity = function setOpacity(value) {
          __setOpacity.call(this, value);

          if (value == 1) {
            var element = this.raw || this;
            if (getNodeName(element) === 'IMG' && element.width) {
              element.width++; element.width--;
            } else try {
              element.removeChild(element.appendChild(element
                .ownerDocument.createTextNode(' ')));
            } catch (e) { }
          }
          return this;
        };
      }
      else if (Fuse.Env.Agent.Gecko && /rv:1\.8\.0/.test(userAgent)) {
        setOpacity = function setOpacity(value) {
          this.style.opacity = (value == 1) ? 0.999999 :
            (value == '' && isString(value)) ? '' :
              (value < 0.00001) ? 0 : value;
          return this;
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        setOpacity = function setOpacity(value) {
          // strip alpha from filter style
          var element = this.raw || this,
           elemStyle  = element.style,
           currStyle  = element.currentStyle,
           filter     = this.getStyle('filter').replace(/alpha\([^)]*\)/i, ''),
           zoom      = elemStyle.zoom;

          // hasLayout is false then force it
          if (!(zoom && zoom !== 'normal' || currStyle && currStyle.hasLayout))
            elemStyle.zoom = 1;

          if (value == 1 || value == '' && isString(value)) {
            if (filter) elemStyle.filter = filter;
            else elemStyle.removeAttribute('filter');
          }
          else {
            if (value < 0.00001) value = 0;
            elemStyle.filter = filter + 'alpha(opacity=' + (value * 100) + ')';
          }
          return this;
        };
      }
      return setOpacity;
    })();

    plugin.isVisible = function isVisible() {
      if (!Fuse._body) return false;

      var isVisible = function isVisible() {
        // handles IE and the fallback solution
        var element = this.raw || this, currStyle = element.currentStyle;
        return currStyle !== null && (currStyle || element.style).display !== 'none' &&
          !!(element.offsetHeight || element.offsetWidth);
      };

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        isVisible = function isVisible() {
          var element = this.raw || this,
           compStyle = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return !!(compStyle && (element.offsetHeight || element.offsetWidth));
        };
      }

      if (Bug('TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN')) {
        var __isVisible = isVisible;

        isVisible = function isVisible() {
          if (__isVisible.call(this)) {
            var element = this.raw || this, nodeName = getNodeName(element);
            if ((nodeName === 'THEAD' || nodeName === 'TBODY' || nodeName === 'TR') &&
               (element = element.parentNode))
              return isVisible.call(element);
            return true;
          }
          return false;
        };
      }

      // redefine method and execute
      return (Element.plugin.isVisible = isVisible).call(this);
    };

    // prevent JScript bug with named function expressions
    var getDimensions = nil, isVisible = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  // define Element#getWidth and Element#getHeight
  (function(plugin) {

    var PRESETS = {
      'box':     { 'border':  1, 'margin':  1, 'padding': 1 },
      'visual':  { 'border':  1, 'padding': 1 },
      'client':  { 'padding': 1 },
      'content': {  }
    },

    HEIGHT_WIDTH_STYLE_SUMS = {
      'Height': {
        'border':  ['borderTopWidth', 'borderBottomWidth'],
        'margin':  ['marginTop',      'marginBottom'],
        'padding': ['paddingTop',     'paddingBottom']
      },
      'Width': {
        'border':  ['borderLeftWidth', 'borderRightWidth'],
        'margin':  ['marginLeft',      'marginRight'],
        'padding': ['paddingLeft',     'paddingRight']
      }
    },

    i = 0;

    while (i < 2) (function() {
      function getSum(decorator, name) {
        var styles = STYLE_SUMS[name];
        return (parseFloat(decorator.getStyle(styles[0])) || 0) +
          (parseFloat(decorator.getStyle(styles[1])) || 0);
      }

      function getDimension(options) {
        var backup, elemStyle, isGettingSum, result;

        // default to `visual` preset
        if (!options) options = PRESETS.visual;
        else if (options && isString(options)) {
          if (STYLE_SUMS[options]) isGettingSum = true;
          else options = PRESETS[options];
        }

        // First get our offset(Width/Height) (visual)
        // offsetHeight/offsetWidth properties return 0 on elements
        // with display:none, so show the element temporarily
        if (!this.isVisible()) {
          elemStyle = this.style;
          backup = elemStyle.cssText;
          elemStyle.cssText += ';display:block;visibility:hidden;';

          // exit early when returning style sums
          if (isGettingSum) {
            result = getSum(this, options);
            elemStyle.cssText = backup;
            return Fuse.Number(result);
          }
          result = (this.raw || this)[property];
          elemStyle.cssText = backup;
        }
        else if (isGettingSum) return Fuse.Number(getSum(this, options));

        else result = (this.raw || this)[property];

        // add margins because they're excluded from the offset values
        if (options.margin)
          result += getSum(this, 'margin');

        // subtract border and padding because they're included in the offset values
        if (!options.border)
          result -= getSum(this, 'border');

        if (!options.padding)
          result -= getSum(this, 'padding');

        return Fuse.Number(result);
      }

      var dim = i++ ? 'Width' : 'Height',
       property = 'offset' + dim,
       STYLE_SUMS = HEIGHT_WIDTH_STYLE_SUMS[dim];

      plugin['get' + dim] = getDimension;
    })();

    i = undef;
  })(Element.plugin);
