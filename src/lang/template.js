  /*----------------------------- LANG: TEMPLATE -----------------------------*/

  global.Template = Class.create();

  Template.Pattern = /(\\)?(#\{([^}]*)\})/;

  (function() {
    this.initialize = function initialize(template, pattern) {
      this.template = template.toString();
      this.pattern = pattern || Template.Pattern;
    };

    this.evaluate = function evaluate(object) {
      if (object) {
        if (typeof object.toTemplateReplacements === 'function')
          object = object.toTemplateReplacements();
        else if (typeof object.toObject === 'function')
          object = object.toObject();
      }

      var pattern = this.pattern;
      if (!Object.isRegExp(pattern))
        pattern = new RegExp(RegExp.escape(String(pattern)));
      if (!pattern.global)
        pattern = pattern.clone({ 'global': true });

      return this.template.replace(pattern, function() {
        var before = arguments[1] || '';
        if (before === '\\') return arguments[2];
        if (object == null) return before;

        // adds support for dot and bracket notation
        var comp, ctx = object, 
         value   = ctx,
         expr    = arguments[3],
         pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/,
         match   = pattern.exec(expr);
        if (match == null) return before;

        while (match != null) {
          comp  = match[1].startsWith('[') ? match[2].replace(/\\]/g, ']') : match[1];
          value = ctx[comp];
          if (!Object.hasKey(ctx, comp) || value == null) {
            value = ''; break;
          }
          if ('' == match[3]) break;
          ctx   = value;
          expr  = expr.substring('[' == match[3] ? match[1].length : match[0].length);
          match = pattern.exec(expr);
        }

        return before + String.interpret(value);
      });
    };

    // prevent JScript bug with named function expressions
    var initialize = null, evaluate = null;
  }).call(Template.prototype);
