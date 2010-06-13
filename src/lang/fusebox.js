  /*----------------------------- LANG: FUSEBOX ------------------------------*/

  fuse.Fusebox = (function() {

    var SKIP_METHODS_RETURNING_ARRAYS,

    ACTIVE_X_OBJECT = 1,

    OBJECT__PROTO__ = 2,

    IFRAME = 3,

    cache = [],

    mode = (function()  {
      // true for IE >= 5.5 (ActiveX object by itself is supported by IE4)
      // note: use iframes when served from the file protocol to avoid an ActiveX warning.
      //
      // The htmlfile ActiveX object avoids https mixed content warnings and is a
      // workaround for access denied errors thrown when using iframes to create
      // sandboxes after the document.domain is set. Access will be denied until
      // the iframe is loaded which disqualifies its use as a synchronous solution
      // (Opera 9.25 is out of luck here).
      if (envTest('ACTIVE_X_OBJECT') &&
          global.location && global.location.protocol !== 'file:') {
        try {
          // ensure ActiveX is enabled
          result = new ActiveXObject('htmlfile') && ACTIVE_X_OBJECT;
          return result;
        } catch (e) { }
      }
      // true for Carakan, JaegerMonkey, JavaScriptCore, KJS, Nitro, Rhino,
      // SpiderMonkey, SquirrelFish (Extreme), Tamarin, TraceMonkey, V8
      //
      // Check "OBJECT__PROTO__" first because Firefox will permanently screw up
      // other iframes on the page if an iframe is inserted and removed before the
      // dom has loaded.
      if (envTest('OBJECT__PROTO__')) {
        return OBJECT__PROTO__;
      }
      // last but not least try the iframe
      var doc = global.document;
      if (isHostType(global, 'frames') && doc &&
          isHostType(doc, 'createElement')) {
        return IFRAME;
      }
    })(),

    createSandbox = (function() {
      if (mode === OBJECT__PROTO__) {
        return function() { return global; };
      }
      // IE requires the iframe/htmlfile remain in the cache or it will be
      // marked for garbage collection
      var counter = 0, doc = global.document;
      if (mode === ACTIVE_X_OBJECT) {
        return function() {
          var htmlfile = new ActiveXObject('htmlfile');
          htmlfile.open();
          htmlfile.write('<script>document.global = this;<\/script>');
          htmlfile.close();
          cache.push(htmlfile);
          return htmlfile.global;
        };
      }
      if (mode === IFRAME) {
        return function() {
          var idoc, iframe, result,
           parentNode = doc.body || doc.documentElement,
           name       = expando + counter++;

          try {
            // set name attribute for IE6/7
            iframe = doc.createElement('<iframe name="' + name + '">');
          } catch (e) {
            (iframe = doc.createElement('iframe')).name = name;
          }

          iframe.style.display = 'none';
          parentNode.insertBefore(iframe, parentNode.firstChild);

          try {
            (idoc = global.frames[name].document).open();
            idoc.write('<script>parent.fuse.' + expando + ' = this;<\/script>');
            idoc.close();
          } catch (e) {
            // Opera 9.25 throws security error when trying to write to an iframe
            // after the document.domain is set. Also Opera < 9 doesn't support
            // inserting an iframe into the document.documentElement.
            throw new Error('Fusebox failed to create a sandbox by iframe.');
          }

          result = global.fuse[expando];
          delete global.fuse[expando];

          cache.push(iframe);
          return result;
        };
      }
      return function() {
        throw new Error('Fusebox failed to create a sandbox.');
      };
    })(),

    createFusebox = function(instance) {
      // Most methods try to follow ES5 spec but may differ from
      // the documented method.length value or allow null callbacks.
      var Array, Boolean, Date, Function, Number, Object, RegExp, String, from,
       sandbox        = createSandbox(),
       __Array        = sandbox.Array,
       __Boolean      = sandbox.Boolean,
       __Date         = sandbox.Date,
       __Function     = sandbox.Function,
       __Number       = sandbox.Number,
       __Object       = sandbox.Object,
       __RegExp       = sandbox.RegExp,
       __String       = sandbox.String,
       filterCallback = function(value) { return value != null; },
       glFunction     = global.Function,
       reStrict       = /^\s*(['"])use strict\1/,
       sbSlice        = __Array.prototype.slice;

      instance || (instance = new Klass);

      from = function(value) {
        var classOf = toString.call(value);
        switch (classOf) {
          case '[object Array]':
            if (value.constructor !== instance.Array) {
              return instance.Array.fromArray(value);
            }
            break;

          case '[object Boolean]':
            if (value.constructor !== instance.Boolean) {
              return instance.Boolean(value == true);
            }
            break;

          case '[object Date]':
            if (value.constructor !== instance.Date) {
              return instance.Date(+value);
            }
            break;

          case '[object RegExp]':
            if (value.constructor !== instance.RegExp) {
              return instance.RegExp(value.source,
                (value.global     ? 'g' : '') +
                (value.ignoreCase ? 'i' : '') +
                (value.multiline  ? 'm' : ''));
            }
            break;

          case '[object Number]' :
          case '[object String]' :
            classOf = classOf.slice(8,-1);
            if (value.constructor !== instance[classOf]) {
              return instance[classOf](value);
            }
        }
        return value;
      };

      if (mode === OBJECT__PROTO__) {
        Array = function Array(length) {
          var result, args = arguments, argLen = args.length;
          if (argLen) {
            result = argLen === 1 && length > -1
              ? new __Array(length)
              : Array.fromArray(args);
          } else result = new __Array();

          result['__proto__'] = arrPlugin;
          return result;
        };

        Boolean = function Boolean(value) {
          var result = new __Boolean(value);
          result['__proto__'] = boolPlugin;
          return result;
        };

        Date = function Date(year, month, date, hours, minutes, seconds, ms) {
          var result;
          if (this.constructor === Date) {
            result = arguments.length === 1
              ? new __Date(year)
              : new __Date(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0);
            result['__proto__'] = datePlugin;
          } else {
            result = instance.String(new __Date);
          }
          return result;
        };

        Function = function Function(argN, body) {
          var args = arguments,
          result = args.length < 3
            ? __Function(argN, body)
            : __Function.apply(__Function, args);
          result['__proto__'] = funcPlugin;
          return result;
        };

        Number = function Number(value) {
          var result = new __Number(value);
          result['__proto__'] = numPlugin;
          return result;
        };

        Object = function Object(value) {
          if (value != null) {
            return from(value);
          }
          var result = new __Object;
          result['__proto__'] = objPlugin;
          return result;
        };

        RegExp = function RegExp(pattern, flags) {
          var result = new __RegExp(pattern, flags);
          result['__proto__'] = regPlugin;
          return result;
        };

        String = function String(value) {
          var result = new __String(arguments.length ? value : '');
          result['__proto__'] = strPlugin;
          return result;
        };

        // make prototype values conform to ES5 spec and inherit from regular natives
        Object.prototype['__proto__']                      = __Object.prototype;
        (Array.prototype    = [ ])['__proto__']            = __Array.prototype;
        (Boolean.prototype  = new __Boolean)['__proto__']  = __Boolean.prototype;
        (Date.prototype     = new __Date)['__proto__']     = __Date.prototype;
        (Function.prototype = new __Function)['__proto__'] = __Function.prototype;
        (Number.prototype   = new __Number)['__proto__']   = __Number.prototype;
        (RegExp.prototype   = new __RegExp)['__proto__']   = __RegExp.prototype;
        (String.prototype   = new __String)['__proto__']   = __String.prototype;
      }
      else {
        Array = function Array(length) {
          var args = arguments, argLen = args.length;
          if (argLen) {
            return argLen === 1 && length > -1
              ? new __Array(length)
              : Array.fromArray(args);
          }
          return new __Array();
        };

        Boolean = function Boolean(value) {
          return new __Boolean(value);
        };

        Date = function Date(year, month, date, hours, minutes, seconds, ms) {
          if (this.constructor === Date) {
           return arguments.length === 1
             ? new __Date(year)
             : new __Date(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0);
          }
          return instance.String(new __Date);
        };

        Function = function Function(argN, body) {
          var fn, result, args = sbSlice.call(arguments, 0),
           toString = function toString() { return originalBody; },
           originalBody = body = args.pop();

          // ensure we aren't in strict mode and map arguments.callee to the wrapper
          if (body && body.search(reStrict) < 0) {
            body = 'arguments.callee = arguments.callee.' + expando + '; ' + body;
          }

          // create function using global.Function constructor
          fn = new glFunction(args.join(','), body);

          // ensure `thisArg` isn't set to the sandboxed global
          result = fn[expando] = new __Function('global, fn',
            'var sandbox = this; return function() { return fn.apply(this == sandbox ? global : this, arguments) }')(global, fn);

          // make toString() return the unmodified function body
          result.toString = toString;

          return result;
        };

        Number = function Number(value) {
          return new __Number(value);
        };

        Object = function Object(value) {
          return value != null
            ? from(value)
            : new __Object;
        };

        RegExp = function RegExp(pattern, flags) {
          return new __RegExp(pattern, flags);
        };

        String = function String(value) {
          return new __String(arguments.length ? value : '');
        };

        // map native wrappers prototype to those of the sandboxed natives
        Array.prototype    = __Array.prototype;
        Boolean.prototype  = __Boolean.prototype;
        Date.prototype     = __Date.prototype;
        Function.prototype = __Function.prototype;
        Number.prototype   = __Number.prototype;
        Object.prototype   = __Object.prototype;
        RegExp.prototype   = __RegExp.prototype;
        String.prototype   = __String.prototype;
      }

      /*----------------------------------------------------------------------*/

      var arrPlugin         = Array.plugin    = Array.prototype,
       boolPlugin           = Boolean.plugin  = Boolean.prototype,
       datePlugin           = Date.plugin     = Date.prototype,
       funcPlugin           = Function.plugin = Function.prototype,
       objPlugin            = Object.plugin   = Object.prototype,
       numPlugin            = Number.plugin   = Number.prototype,
       regPlugin            = RegExp.plugin   = RegExp.prototype,
       strPlugin            = String.plugin   = String.prototype,
       __concat             = arrPlugin.concat,
       __every              = arrPlugin.every,
       __filter             = arrPlugin.filter,
       __join               = arrPlugin.join,
       __indexOf            = arrPlugin.indexOf,
       __lastIndexOf        = arrPlugin.lastIndexOf,
       __map                = arrPlugin.map,
       __push               = arrPlugin.push,
       __reverse            = arrPlugin.reverse,
       __slice              = arrPlugin.slice,
       __splice             = arrPlugin.splice,
       __some               = arrPlugin.some,
       __sort               = arrPlugin.sort,
       __unshift            = arrPlugin.unshift,
       __getDate            = datePlugin.getDate,
       __getDay             = datePlugin.getDay,
       __getFullYear        = datePlugin.getFullYear,
       __getHours           = datePlugin.getHours,
       __getMilliseconds    = datePlugin.getMilliseconds,
       __getMinutes         = datePlugin.getMinutes,
       __getMonth           = datePlugin.getMonth,
       __getSeconds         = datePlugin.getSeconds,
       __getTime            = datePlugin.getTime,
       __getTimezoneOffset  = datePlugin.getTimezoneOffset,
       __getUTCDate         = datePlugin.getUTCDate,
       __getUTCDay          = datePlugin.getUTCDay,
       __getUTCFullYear     = datePlugin.getUTCFullYear,
       __getUTCHours        = datePlugin.getUTCHours,
       __getUTCMilliseconds = datePlugin.getUTCMilliseconds,
       __getUTCMinutes      = datePlugin.getUTCMinutes,
       __getUTCMonth        = datePlugin.getUTCMonth,
       __getUTCSeconds      = datePlugin.getUTCSeconds,
       __getYear            = datePlugin.getYear,
       __toISOString        = datePlugin.toISOString,
       __toJSON             = datePlugin.toJSON,
       __toExponential      = numPlugin.toExponential,
       __toFixed            = numPlugin.toFixed,
       __toPrecision        = numPlugin.toPrecision,
       __exec               = regPlugin.exec,
       __charAt             = strPlugin.charAt,
       __charCodeAt         = strPlugin.charCodeAt,
       __strConcat          = strPlugin.concat,
       __strIndexOf         = strPlugin.indexOf,
       __strLastIndexOf     = strPlugin.lastIndexOf,
       __localeCompare      = strPlugin.localeCompare,
       __match              = strPlugin.match,
       __replace            = strPlugin.replace,
       __search             = strPlugin.search,
       __strSlice           = strPlugin.slice,
       __split              = strPlugin.split,
       __substr             = strPlugin.substr,
       __substring          = strPlugin.substring,
       __toLowerCase        = strPlugin.toLowerCase,
       __toLocaleLowerCase  = strPlugin.toLocaleLowerCase,
       __toLocaleUpperCase  = strPlugin.toLocaleUpperCase,
       __toUpperCase        = strPlugin.toUpperCase,
       __trim               = strPlugin.trim,
       __trimLeft           = strPlugin.trimLeft,
       __trimRight          = strPlugin.trimRight;

      Function.FALSE           = function FALSE() { return false; };

      Function.TRUE            = function TRUE() { return true; };

      Function.IDENTITY        = IDENTITY;

      Function.NOOP            = NOOP;

      Number.MAX_VALUE         = 1.7976931348623157e+308;

      Number.MIN_VALUE         = 5e-324;

      Number.NaN               = +'x';

      Number.NEGATIVE_INFINITY = __Number.NEGATIVE_INFINITY;

      Number.POSITIVE_INFINITY = __Number.POSITIVE_INFINITY;

      RegExp.SPECIAL_CHARS = {
        's': {
          // whitespace
          '\x09': '\\x09', '\x0B': '\\x0B', '\x0C': '\\x0C', '\x20': '\\x20', '\xA0': '\\xA0',

          // line terminators
          '\x0A': '\\x0A', '\x0D': '\\x0D', '\u2028': '\\u2028', '\u2029': '\\u2029',

          // unicode category "Zs" space separators
          '\u1680': '\\u1680', '\u180e': '\\u180e', '\u2000': '\\u2000',
          '\u2001': '\\u2001', '\u2002': '\\u2002', '\u2003': '\\u2003',
          '\u2004': '\\u2004', '\u2005': '\\u2005', '\u2006': '\\u2006',
          '\u2007': '\\u2007', '\u2008': '\\u2008', '\u2009': '\\u2009',
          '\u200a': '\\u200a', '\u202f': '\\u202f', '\u205f': '\\u205f',
          '\u3000': '\\u3000'
        }
      };

      Array.create = function create() {
        return Array.fromArray(arguments);
      };

      Array.fromArray = function fromArray(array) {
        var result = new __Array;
        result.push.apply(result, array);
        return result;
      };

      if (mode === OBJECT__PROTO__) {
        Array.fromArray = function fromArray(array) {
          var result = sbSlice.call(array, 0);
          result['__proto__'] = arrPlugin;
          return result;
        };
      }
      else if (SKIP_METHODS_RETURNING_ARRAYS) {
        Array.fromArray = function fromArray(array) {
          return sbSlice.call(array, 0);
        };
      }

      // ES5 15.4.3.2
      if (!isFunction(Array.isArray = __Array.isArray)) {
        Array.isArray = function isArray(value) {
          return toString.call(value) === '[object Array]';
        };
      }

      Date.now = function now() {
        return instance.Number(__Date.now());
      };

      // ES5 15.9.4.4
      if (!isFunction(__Date.now)) {
        Date.now = function now() {
          return instance.Number(+new __Date());
        };
      }

      // ES5 15.9.4.2
      Date.parse = function parse(dateString) {
        return instance.Number(__Date.parse(dateString));
      };

      // ES5 15.9.4.3
      Date.UTC = function UTC(year, month, date, hours, minutes, seconds, ms) {
        return instance.Number(__Date.UTC(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0));
      };

      // ES5 15.5.3.2
      String.fromCharCode = function fromCharCode(charCode) {
        return String(arguments.length > 1
          ? __String.fromCharCode.apply(__String, arguments)
          : __String.fromCharCode(charCode));
      };

      // versions of WebKit and IE have non-spec-conforming /\s/
      // so we standardize it (see: ES5 15.10.2.12)
      // http://www.unicode.org/Public/UNIDATA/PropList.txt
      RegExp = (function(RE) {
        var character,
         RegExp = RE,
         reCharClass = /\\s/g,
         newCharClass = [],
         charMap = RE.SPECIAL_CHARS.s;

        // catch whitespace chars that are missed by erroneous \s
        for (character in charMap) {
          if (character.replace(/\s/, '').length)
            newCharClass.push(charMap[character]);
        }

        if (newCharClass.length) {
          newCharClass.push('\\s');
          newCharClass = '(?:' + newCharClass.join('|') + ')';

          // redefine RegExp to auto-fix \s issues
          RegExp = function RegExp(pattern, flags) {
            return new RE((toString.call(pattern) === '[object RegExp]' ?
              pattern.source : String(pattern))
                .replace(reCharClass, newCharClass), flags);
          };

          // map properties of old RegExp to the redefined one
          RegExp.SPECIAL_CHARS = RE.SPECIAL_CHARS;
          regPlugin = RegExp.plugin = RegExp.prototype = RE.prototype;
        }

        return RegExp;
      })(RegExp);

      /*----------------------------------------------------------------------*/

      if (isFunction(arrPlugin.every)) {
        (arrPlugin.every = function every(callback, thisArg) {
          return __every.call(this, callback || IDENTITY, thisArg);
        }).raw = __every;
      }
      if (isFunction(arrPlugin.filter)) {
        (arrPlugin.filter = function filter(callback, thisArg) {
          var result = __filter.call(this, callback || filterCallback, thisArg);
          return result.length
            ? Array.fromArray(result)
            : Array();
        }).raw = __filter;
      }
      if (isFunction(arrPlugin.indexOf)) {
        (arrPlugin.indexOf = function indexOf(item, fromIndex) {
          return instance.Number(__indexOf.call(this, item,
            fromIndex == null ? 0 : fromIndex));
        }).raw = __indexOf;
      }
      if (isFunction(arrPlugin.lastIndexOf)) {
        (arrPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
          return instance.Number(__lastIndexOf.call(this, item,
            fromIndex == null ? this.length : fromIndex));
        }).raw = __lastIndexOf;
      }
      if (isFunction(arrPlugin.map)) {
        if (SKIP_METHODS_RETURNING_ARRAYS) {
          arrPlugin.map = function map(callback, thisArg) {
            return __map.call(this, callback || IDENTITY, thisArg);
          };
        } else {
          arrPlugin.map = function map(callback, thisArg) {
            var result = __map.call(this, callback || IDENTITY, thisArg);
            return result.length
              ? Array.fromArray(result)
              : Array();
          };
        }
        arrPlugin.map.raw = __map;
      }
      if (isFunction(arrPlugin.some)) {
        (arrPlugin.some = function some(callback, thisArg) {
          return __some.call(this, callback || IDENTITY, thisArg);
        }).raw = __some;
      }

      if (!SKIP_METHODS_RETURNING_ARRAYS) {
        arrPlugin.concat = function concat() {
          var args = arguments;
          return Array.fromArray(args.length
            ? __concat.apply(this, args)
            : __concat.call(this));
        };

        arrPlugin.reverse = function reverse() {
          return this.length > 0
            ? Array.fromArray(__reverse.call(this))
            : Array();
        };

        arrPlugin.slice = function slice(start, end) {
          var result = __slice.call(this, start, end == null ? this.length : end);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

        arrPlugin.sort = function sort(compareFn) {
          return this.length > 0
            ? Array.fromArray(compareFn ? __sort.call(this, compareFn) : __sort.call(this))
            : Array();
        };

        arrPlugin.splice = function splice(start, deleteCount) {
          var result = __splice.apply(this, arguments);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };
      }

      arrPlugin.concat.raw  = __concat;
      arrPlugin.reverse.raw = __reverse;
      arrPlugin.slice.raw   = __slice;
      arrPlugin.sort.raw    = __sort;
      arrPlugin.splice.raw  = __splice;

      (arrPlugin.join = function join(separator) {
        return String(__join.call(this, separator));
      }).raw = __join;

      (arrPlugin.push = function push(item) {
        var args = arguments;
        return instance.Number(args.length > 1
          ? __push.apply(this, args)
          : __push.call(this, item));
      }).raw = __push;

      (arrPlugin.unshift = function unshift(item) {
        var args = arguments;
        return instance.Number(args.length > 1
          ? __unshift.apply(this, args)
          : __unshift.call(this, item));
      }).raw = __unshift;

      if (isFunction(datePlugin.toISOString)) {
        (datePlugin.toISOString = function toISOString() {
          return instance.String(__toISOString.call(this));
        }).raw = __toISOString;
      }
      if (isFunction(datePlugin.toJSON)) {
        (datePlugin.toJSON = function toJSON() {
          return instance.String(__toJSON.call(this));
        }).raw = __toJSON;
      }

      (datePlugin.getDate = function getDate() {
        return instance.Number(__getDate.call(this));
      }).raw = __getDate;

      (datePlugin.getDay = function getDay() {
        return instance.Number(__getDay.call(this));
      }).raw = __getDay;

      (datePlugin.getFullYear = function getFullYear() {
        return instance.Number(__getFullYear.call(this));
      }).raw = __getFullYear;

      (datePlugin.getHours = function getHours() {
        return instance.Number(__getHours.call(this));
      }).raw = __getHours;

      (datePlugin.getMilliseconds = function getMilliseconds() {
        return instance.Number(__getMilliseconds.call(this));
      }).raw = __getMilliseconds;

      (datePlugin.getMinutes = function getMinutes() {
        return instance.Number(__getMinutes.call(this));
      }).raw = __getMinutes;

      (datePlugin.getMonth = function getMonth () {
        return instance.Number(__getMonth.call(this));
      }).raw = __getMonth;

      (datePlugin.getSeconds = function getSeconds() {
        return instance.Number(__getSeconds.call(this));
      }).raw = __getSeconds;

      (datePlugin.getTime = function getTime() {
        return instance.Number(__getTime.call(this));
      }).raw = __getTime;

      (datePlugin.getTimezoneOffset = function getTimezoneOffset() {
        return instance.Number(__getTimezoneOffset.call(this));
      }).raw = __getTimezoneOffset;

      (datePlugin.getUTCDate = function getUTCDate() {
        return instance.Number(__getUTCDate.call(this));
      }).raw = __getUTCDate;

      (datePlugin.getUTCDay = function getUTCDay() {
        return instance.Number(__getUTCDay.call(this));
      }).raw = __getUTCDay;

      (datePlugin.getUTCFullYear = function getUTCFullYear() {
        return instance.Number(__getUTCFullYear.call(this));
      }).raw = __getUTCFullYear;

      (datePlugin.getUTCHours = function getUTCHours() {
        return instance.Number(__getUTCHours.call(this));
      }).raw = __getUTCHours;

      (datePlugin.getUTCMilliseconds = function getUTCMilliseconds() {
        return instance.Number(__getUTCMilliseconds.call(this));
      }).raw = __getUTCMilliseconds;

      (datePlugin.getUTCMinutes = function getUTCMinutes() {
        return instance.Number(__getUTCMinutes.call(this));
      }).raw = __getUTCMinutes;

      (datePlugin.getUTCMonth = function getUTCMonth() {
        return instance.Number(__getUTCMonth.call(this));
      }).raw = __getUTCMonth;

      (datePlugin.getUTCSeconds = function getUTCSeconds() {
        return instance.Number(__getUTCSeconds.call(this));
      }).raw = __getUTCSeconds;

      (datePlugin.getYear = function getYear() {
        return instance.Number(__getYear.call(this));
      }).raw = __getYear;

      (numPlugin.toExponential = function toExponential(fractionDigits) {
        return instance.String(__toExponential.call(this, fractionDigits));
      }).raw = __toExponential;

      (numPlugin.toFixed = function toFixed(fractionDigits) {
        return instance.String(__toFixed.call(this, fractionDigits));
      }).raw = __toFixed;

      (numPlugin.toPrecision = function toPrecision(precision) {
        return instance.String(__toPrecision.call(this, precision));
      }).raw = __toPrecision;

      (regPlugin.exec = function exec(string) {
        var output = __exec.call(this, string);
        if (output) {
          var item, i = -1, length = output.length, result = instance.Array();
          while (++i < length) {
            result[i] = (item = output[i]) == null ? item : instance.String(item);
          }
          result.index = output.index;
          result.input = output.input;
        }
        return output && result;
      }).raw = __exec;

      if (isFunction(strPlugin.trim)) {
        (strPlugin.trim = function trim() {
          return String(__trim.call(this));
        }).raw = __trim;
      }
      if (isFunction(strPlugin.trimLeft)) {
        (strPlugin.trimLeft = function trimLeft() {
          return String(__trimLeft.call(this));
        }).raw = __trimLeft;
      }
      if (isFunction(strPlugin.trimRight)) {
        (strPlugin.trimRight = function trimRight() {
          return String(__trimRight.call(this));
        }).raw = __trimRight;
      }

      (strPlugin.charAt = function charAt(pos) {
        return String(__charAt.call(this, pos));
      }).raw = __charAt;

      (strPlugin.charCodeAt = function charCodeAt(pos) {
        return instance.Number(__charCodeAt.call(this, pos));
      }).raw = __charCodeAt;

      (strPlugin.concat = function concat(item) {
        var args = arguments;
        return String(args.length > 1
          ? __strConcat.apply(this, args)
          : __strConcat.call(this, item));
      }).raw = __strConcat;

      (strPlugin.indexOf = function indexOf(item, fromIndex) {
        return instance.Number(__strIndexOf.call(this, item,
          fromIndex == null ? 0 : fromIndex));
      }).raw = __strIndexOf;

      (strPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
        return instance.Number(__strLastIndexOf.call(this, item,
          fromIndex == null ? this.length : fromIndex));
      }).raw = __strLastIndexOf;

      (strPlugin.localeCompare = function localeCompare(that) {
        return instance.Number(__localeCompare.call(this, that));
      }).raw = __localeCompare;

      (strPlugin.match = function match(pattern) {
        var output = __match.call(this, pattern);
        if (output) {
          var item, i = -1, length = output.length, result = instance.Array();
          while (++i < length) {
            result[i] = (item = output[i]) == null ? item : instance.String(item);
          }
        }
        return output && result;
      }).raw = __match;

      (strPlugin.replace = function replace(pattern, replacement) {
        return String(__replace.call(this, pattern, replacement));
      }).raw = __replace;

      (strPlugin.search = function search(pattern) {
        return instance.Number(__search.call(this, pattern));
      }).raw = __search;

      (strPlugin.slice = function slice(start, end) {
        return String(__strSlice.call(this, start,
          end == null ? this.length : end));
      }).raw = __strSlice;

      (strPlugin.split = function split(separator, limit) {
        var item, i = -1, output = __split.call(this, separator, limit),
         length = output.length, result = instance.Array();
        while (++i < length) {
          result[i] = (item = output[i]) == null ? item : String(item);
        }
        return result;
      }).raw = __split;

      (strPlugin.substr = function substr(start, length) {
        return String(__substr.call(start, length == null ? this.length : length));
      }).raw = __substr;

      (strPlugin.substring = function substring(start, end) {
        return String(__substring.call(this, start,
          end == null ? this.length : end));
      }).raw = __substring;

      (strPlugin.toLowerCase = function toLowerCase() {
        return String(__toLowerCase.call(this));
      }).raw = __toLowerCase;

      (strPlugin.toLocaleLowerCase = function toLocaleLowerCase() {
        return String(__toLocaleLowerCase.call(this));
      }).raw = __toLocaleLowerCase;

      (strPlugin.toLocaleUpperCase = function toLocaleUpperCase() {
        return String(__toLocaleUpperCase.call(this));
      }).raw = __toLocaleUpperCase;

      (strPlugin.toUpperCase = function toUpperCase() {
        return String(__toUpperCase.call(this));
      }).raw = __toUpperCase;

      // add [[Class]] property to eaches prototype as a fallback
      // in case {}.toString.call(value) doesn't work on sandboxed natives
      arrPlugin['[[Class]]']  = '[object Array]';
      boolPlugin['[[Class]]'] = '[object Boolean]';
      datePlugin['[[Class]]'] = '[object Date]';
      funcPlugin['[[Class]]'] = '[object Function]';
      numPlugin['[[Class]]']  = '[object Number]';
      regPlugin['[[Class]]']  = '[object RegExp]';
      strPlugin['[[Class]]']  = '[object String]';

      // point constructor properties to the native wrappers
      arrPlugin.constructor  = Array;
      boolPlugin.constructor = Boolean;
      datePlugin.constructor = Date;
      funcPlugin.constructor = Function;
      objPlugin.constructor  = Object;
      numPlugin.constructor  = Number;
      regPlugin.constructor  = RegExp;
      strPlugin.constructor  = String;

      /*----------------------------------------------------------------------*/

      // prevent JScript bug with named function expressions
      var FALSE = nil, TRUE = nil, UTC = nil, charAt = nil, charCodeAt = nil,
       create = nil, concat = nil, every = nil, exec = nil, filter = nil,
       fromArray = nil, fromCharCode = nil, getDate = nil, getDay = nil,
       getFullYear = nil, getHours = nil, getMilliseconds = nil, getMinutes = nil,
       getMonth = nil, getSeconds = nil, getTime = nil, getTimezoneOffset = nil,
       getUTCDate = nil, getUTCDay = nil, getUTCFullYear = nil, getUTCHours = nil,
       getUTCMilliseconds = nil, getUTCMinutes = nil, getUTCMonth = nil,
       getUTCSeconds = nil, getYear = nil, join = nil, indexOf = nil,
       isArray = nil, lastIndexOf = nil, localeCompare = nil, match = nil,
       map = nil, now = nil, parse = nil, push = nil, replace = nil,
       reverse = nil, search = nil, slice = nil, some = nil, sort = nil,
       split = nil, splice = nil, substr = nil, substring = nil,
       toExponential = nil, toFixed = nil, toISOString = nil, toJSON = nil,
       toLowerCase = nil, toLocaleLowerCase = nil, toLocaleUpperCase = nil,
       toPrecision = nil, toUpperCase = nil, trim = nil, trimLeft = nil,
       trimRight = nil, unshift = nil;

      // assign native wrappers to Fusebox instance and return
      instance.Array    = Array;
      instance.Boolean  = Boolean;
      instance.Date     = Date;
      instance.Function = Function;
      instance.Number   = Number;
      instance.Object   = Object;
      instance.RegExp   = RegExp;
      instance.String   = String;

      return instance;
    },

    postProcess = NOOP,

    Klass = function() { },

    Fusebox = function Fusebox(instance) { return createFusebox(instance); };

    /*------------------------------------------------------------------------*/

    // redefine Fusebox to remove the iframe from the document
    if (mode === IFRAME) {
      Fusebox = function Fusebox(instance) {
        return postProcess(createFusebox(instance));
      };

      postProcess = function(instance) {
        // remove iframe
        var iframe = cache[cache.length -1];
        iframe.parentNode.removeChild(iframe);
        return instance;
      };
    }

    if (mode != OBJECT__PROTO__) {
      (function() {
        var div,
         sandbox = createSandbox(),
         Array = sandbox.Array;

        // IE and Opera's Array accessors return
        // sandboxed arrays so we can skip wrapping them
        SKIP_METHODS_RETURNING_ARRAYS =
          !(Array().slice(0) instanceof global.Array);

        if (mode === IFRAME) {
          // remove iframe from document
          postProcess();

          // Opera 9.5 - 10a throws a security error when calling Array#map or String#lastIndexOf
          // Opera 9.5 - 9.64 will error by simply calling the methods.
          // Opera 10 will error when first accessing the contentDocument of
          // another iframe and then accessing the methods.
          if (Array.prototype.map) {
            // create second iframe
            createSandbox();
            // remove second iframe from document
            postProcess();
            // test to see if Array#map is corrupted
            try { Array().map(IDENTITY); }
            catch (e) {
              postProcess = (function(__postProcess) {
                return function(instance) {
                  instance.Array.prototype.map =
                  instance.String.prototype.lastIndexOf = nil;
                  return __postProcess(instance);
                };
              })(postProcess);
            }
          }

          // pave cache
          // avoid IE memory leak with nodes removed by removeChild()
          div = global.document.createElement('div');
          while (cache.length) {
            div.appendChild(cache.pop());
            div.innerHTML = '';
          }
        }

        // cleanup
        cache = [];
        div = sandbox = nil;
      })();
    }

    // map Fusebox.prototype to Klass so Fusebox can be called without the `new` expression
    Klass.prototype = Fusebox.prototype;

    /*--------------------------------------------------------------------------*/

    // assign Fusebox natives to Fuse object
    (function() {
      var backup, key, i = -1,

      __toString = {}.toString,

      SKIPPED_KEYS = { 'constructor': 1 },

      createGeneric = function(proto, methodName) {
        return Function('o,s',
          'function ' + methodName + '(thisArg){' +
          'var a=arguments,m=o.' + methodName +
          ';return a.length' +
          '?m.apply(thisArg,s.call(a,1))' +
          ':m.call(thisArg)' +
          '}return ' + methodName)(proto, slice);
      },

      updateGenerics = function updateGenerics(deep) {
        var Klass = this;
        if (deep) {
          fuse.updateGenerics(Klass, deep);
        } else {
          fuse.Object.each(Klass.prototype, function(value, key, proto) {
            if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
              Klass[key] = createGeneric(proto, key);
          });
        }
      };

      Fusebox(fuse);

      // break fuse.Object.prototype's relationship to other fuse natives
      // for consistency across sandbox variations.
      if (mode !== OBJECT__PROTO__) {
        backup = {
          'Array':    fuse.Array,
          'Boolean':  fuse.Boolean,
          'Date':     fuse.Date,
          'Function': fuse.Function,
          'Number':   fuse.Number,
          'RegExp':   fuse.RegExp,
          'String':   fuse.String
        };

        Fusebox(fuse);

        fuse.Array    = backup.Array;
        fuse.Boolean  = backup.Boolean;
        fuse.Date     = backup.Date;
        fuse.Function = backup.Function;
        fuse.Number   = backup.Number;
        fuse.RegExp   = backup.RegExp;
        fuse.String   = backup.String;
      }

      // redifine `toString` if there are no issues
      if (__toString.call(fuse.Array()) === '[object Array]') {
        toString = __toString;
      }

      // assign sandboxed natives to Fuse and add `updateGeneric` methods
      while (key = arguments[++i]) {
        fuse[key].updateGenerics = updateGenerics;
      }
    })('Array', 'Boolean', 'Date', 'Function', 'Number', 'Object', 'RegExp', 'String');

    return Fusebox;
  })();
