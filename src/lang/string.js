  /*------------------------------ LANG: STRING ------------------------------*/

  Fuse.Object._extend(Fuse.String, (function() {
    function interpret(value) {
      return Fuse.String(value == null ? '' : value);
    }

    return {
      'specialChar': {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\\': '\\\\'
      },
      'interpret': interpret
    };
  })());

  /*--------------------------------------------------------------------------*/

  (function() {
    var __replace = this.replace;

    function replace(pattern, replacement) {
      if (typeof replacement === 'function') {
        var _replacement = replacement;
        replacement = function() {
          // ensure `null` and `undefined` are returned
          var result = _replacement.apply(null, arguments);
          return result || Fuse.String(result);
        };
      }
      var result = __replace.call(this, pattern, replacement);
      if (Fuse.Object.isRegExp(pattern)) pattern.lastIndex = 0;
      return result;
    }

    // For IE
    if (Bug('STRING_REPLACE_SETS_REGEXP_LAST_INDEX'))
      this.replace = replace;
  }).call(Fuse.String.Plugin);

  (function() {
    var __replace = this.replace;

    function replace(pattern, replacement) {
      if (typeof replacement !== 'function')
        return __replace.call(this, pattern, replacement);

      var isGlobal, match, index = 0, result = '', source = String(this);
      if (!Fuse.Object.isRegExp(pattern))
        pattern = new RegExp(Fuse.RegExp.escape(String(pattern)));
      else {
        isGlobal = pattern.global;
        pattern = new RegExp(pattern.source,
          (pattern.ignoreCase && 'i' || '') + (pattern.multiline  && 'm' || ''));
      }

      pattern.lastIndex = 0;
      while (match = pattern.exec(source)) {
        result += source.slice(0, match.index) +
          replacement.apply(null, concatList(match, [index += match.index, source]));
        source = source.slice(match.index + match[0].length);
        index += match[0].length;

        if (isGlobal && !match[0]) {
          result += source.slice(0, 1);
          source  = source.slice(1);
          if (!source) {
            if (!match.index) result += replacement.apply(null, match);
            break;
          }
        }
        else if (!isGlobal) break;
      }
      pattern.lastIndex = 0;
      return Fuse.String(result + source);
    }

    // For Safari 2 and Chrome, based on work by Dean Edwards
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    if (Bug('STRING_REPLACE_COHERSE_FUNCTION_TO_STRING') ||
        Bug('STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN'))
      this.replace = replace;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    function _prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)) };
      var template = new Fuse.Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)) };
    }

    this.gsub = function gsub(pattern, replacement) {
      if (!Fuse.Object.isRegExp(pattern))
        pattern = new Fuse.RegExp(Fuse.RegExp.escape(String(pattern)), 'g');
      if (!pattern.global)
        pattern = Fuse.RegExp.clone(pattern, { 'global': true });
      return this.replace(pattern, _prepareReplacement(replacement));
    };

    this.sub = function sub(pattern, replacement, count) {
      count = (typeof count === 'undefined') ? 1 : count;
      if (count === 1) {
        if (!Fuse.Object.isRegExp(pattern))
          pattern = new Fuse.RegExp(Fuse.RegExp.escape(String(pattern)));
        if (pattern.global)
          pattern = Fuse.RegExp.clone(pattern, { 'global': false });
        return this.replace(pattern, _prepareReplacement(replacement));
      }

      if (typeof replacement !== 'function') {
        var template = new Fuse.Template(replacement);
        replacement = function(match) { return template.evaluate(match) };
      }
      return this.gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    };

    // prevent JScript bug with named function expressions
    var gsub = null, sub = null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.interpolate = function interpolate(object, pattern) {
      return new Fuse.Template(this, pattern).evaluate(object);
    };

    this.succ = function succ() {
      return Fuse.String(this.slice(0, this.length - 1) +
        String.fromCharCode(this.charCodeAt(this.length - 1) + 1));
    };

    this.times = function times(count) {
      return Fuse.String(count < 1 ? '' : new Array(count + 1).join(this));
    };

    this.toArray = function toArray() {
      return this.split('');
    };

    this.toQueryParams = function toQueryParams(separator) {
      var match = String(this).split('?'), hash = Fuse.Object();
      if (match.length > 1 && !match[1]) return hash;

      (match = (match = match[1] || match[0]).split('#')) &&
        (match = match[0].split(' ')[0]);
      if (!match) return hash;

      var pair, key, value, undef, index, i = 0,
       pairs = match.split(separator || '&'), length = pairs.length;

      for ( ; i < length; i++) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (!pair || index == 0) continue;

        if (index != -1) {
          key = decodeURIComponent(pair.slice(0, index));
          value = pair.slice(index + 1);
          if (value) value = decodeURIComponent(value);
        } else key = pair;

        if (Fuse.Object.hasKey(hash, key)) {
          if (!Fuse.List.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    };

    // aliases
    this.toList = this.toArray;
    this.parseQuery = this.toQueryParams;

    // prevent JScript bug with named function expressions
    var interpolate = null,
     succ =           null,
     times =          null,
     toArray =        null,
     toQueryParams =  null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.blank = function blank() {
      return /^\s*$/.test(this);
    };

    this.contains = function contains(pattern) {
      return this.indexOf(pattern) > -1;
    };

    this.empty = function empty() {
      return !this.length;
    };

    this.endsWith = function endsWith(pattern) {
      var d = this.length - pattern.length;
      return d >= 0 && this.lastIndexOf(pattern) == d;
    };

    this.inspect = function inspect(useDoubleQuotes) {
      var escapedString = this.replace(/[\x00-\x1f\\]/g, function(match) {
        var character = Fuse.String.specialChar[match];
        return character ?
          character :
          '\\u00' + Fuse.Number(match.charCodeAt(0)).toPaddedString(2, 16);
      });
      return Fuse.String(useDoubleQuotes
        ? '"' + escapedString.replace(/"/g, '\\"')  + '"'
        : "'" + escapedString.replace(/'/g, '\\\'') + "'");
    };

    this.scan = function scan(pattern, callback) {
      this.gsub(pattern, callback);
      return Fuse.String(this);
    };

    this.startsWith = function startsWith(pattern) {
      return this.indexOf(pattern) == 0;
    };

    // prevent JScript bug with named function expressions
    var blank =    null,
      contains =   null,
      empty =      null,
      endsWith =   null,
      inspect =    null,
      scan =       null,
      startsWith = null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.camelize = (function() {
      function _replacer(match, captured) {
        return captured.toUpperCase();
      }
      function camelize() {
        return this.replace(/\-(\w|$)/g, _replacer);
      }
      return camelize;
    })();

    this.capitalize = function capitalize() {
      return Fuse.String(this.charAt(0).toUpperCase() + this.slice(1).toLowerCase());
    };

    this.dasherize = function dasherize() {
      return this.replace(/_/g,'-');
    };

    this.truncate = function truncate(length, truncation) {
      length = length || 30;
      truncation = (typeof truncation === 'undefined') ? '...' : truncation;
      return Fuse.String(this.length > length
        ? this.slice(0, length - truncation.length) + truncation
        : this);
    };

    this.underscore = function underscore() {
      return this.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/-/g,'_').toLowerCase();
    };

    // prevent JScript bug with named function expressions
    var capitalize = null,
     dasherize =     null,
     truncate =      null,
     underscore =    null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    var s = Fuse.RegExp.specialChar.s,
     matchTrimLeft     = new RegExp('^' + s + '+'),
     matchTrimRight    = new RegExp(s + '+$'),
     matchScripts      = new RegExp(Fuse.ScriptFragment, 'gi'),
     matchHTMLComments = new RegExp('<!--' + s + '*' + Fuse.ScriptFragment + s + '*-->', 'gi'),
     matchOpenTag      = /<script/i;

    this.extractScripts = function extractScripts() {
      var results = Fuse.List();
      if (!matchOpenTag.test(this)) return results;
      var match, scriptTags = this.replace(matchHTMLComments, '');
      while (match = matchScripts.exec(scriptTags))
        match[1] && results.push(match[1]);
      return results;
    };

    this.stripScripts = function stripScripts() {
      return this.replace(matchScripts, '');
    };

    if (!this.trim)
      this.trim = function trim() {
        // keep this method as simple as possible, avoid extraneous method calls
        return Fuse.String(this).replace(matchTrimLeft, '').replace(matchTrimRight, '');
      };
    if (!this.trimLeft)
      this.trimLeft = function trimLeft() {
        return Fuse.String(this).replace(matchTrimLeft, '');
      };
    if (!this.trimRight)
      this.trimRight = function trimRight() {
        return Fuse.String(this).replace(matchTrimRight, '');
      };

    // prevent JScript bug with named function expressions
    var extractScripts = null,
     stripScripts =      null,
     trim =              null,
     trimLeft =          null,
     trimRight =         null;
  }).call(Fuse.String.Plugin);

  (function() {
    this.evalScripts = function evalScripts() {
      return this.extractScripts().map(function(script) { return eval(String(script)) });
    };

    this.stripTags = function stripTags() {
      return this.replace(/<("[^"]*"|'[^']*'|[^'">])+>/g, '');
    };

    // prevent JScript bug with named function expressions
    var evalScripts = null, stripTags = null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    var escapeHTML = function escapeHTML() {
      textNode.data = this;
      return Fuse.String(container.innerHTML.replace(/"/g, '&quot;'));
    };

    var unescapeHTML = function unescapeHTML() {
      Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
      return Fuse.String(Fuse._div.textContent);
    };

    var container = Fuse._doc.createElement('pre'),
     textNode = container.appendChild(Fuse._doc.createTextNode(''));

    // Safari 2.x has issues with escaping html inside a "pre"
    // element so we use the deprecated "xmp" element instead.
    if ((textNode.data = '&') && container.innerHTML !== '&amp;') {
      container = Fuse._doc.createElement('xmp');
      textNode = container.appendChild(Fuse._doc.createTextNode(''));
    }

    // Safari 3.x has issues with escaping the ">" character
    if ((textNode.data = '>') && container.innerHTML !== '&gt;') {
      escapeHTML = function escapeHTML() {
        textNode.data = this;
        return Fuse.String(container.innerHTML.replace(/"/g, '&quot;').replace(/>/g, '&gt;'));
      };
    }

    if (!Feature('ELEMENT_TEXT_CONTENT')) {
      Fuse._div.innerHTML = '<pre>&lt;p&gt;x&lt;/p&gt;</pre>';
      if (Feature('ELEMENT_INNER_TEXT') && Fuse._div.firstChild.innerText === '<p>x</p>') {
        unescapeHTML = function unescapeHTML() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return Fuse.String(Fuse._div.firstChild.innerText.replace(/\r/g, ''));
        };
      }
      else if (Fuse._div.firstChild.innerHTML === '<p>x</p>') {
        unescapeHTML = function unescapeHTML() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return Fuse.String(Fuse._div.firstChild.innerHTML);
        };
      } else {
        unescapeHTML = function unescapeHTML() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          var node, i = 0, results = [];
          while (node = Fuse._div.firstChild.childNodes[i++])
            results.push(node.nodeValue);
          return Fuse.String(results.join(''));
        };
      }
      // cleanup Fuse._div
      Fuse._div.innerHTML = '';
    }

    this.escapeHTML = escapeHTML;
    this.unescapeHTML = unescapeHTML;
  }).call(Fuse.String.Plugin);
