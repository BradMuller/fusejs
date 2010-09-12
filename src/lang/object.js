  /*------------------------------ LANG: OBJECT ------------------------------*/

  eachKey =
  fuse.Object.each = (function() {
    var each;

    function bind(fn, thisArg) {
      return function(value, key, object) {
        return fn.call(thisArg, value, key, object);
      };
    }

    // use switch statement to avoid creating a temp variable
    switch (function() {
      var key, count = 0, klass = function() { this.toString = 1; };
      klass.prototype.toString = 1;
      for (key in new klass) { count++; }
      return count;
    }()) {

      case 0: // IE
        var shadowed = [
          'constructor', 'hasOwnProperty',
          'isPrototypeOf', 'propertyIsEnumerable',
          'toLocaleString', 'toString', 'valueOf'
        ];

        each = function each(object, callback, thisArg) {
          if (object) {
            var key, i = -1;
            thisArg && (callback = bind(callback, thisArg));
            for (key in object) {
              if (callback(object[key], key, object) === false) {
                return object;
              }
            }
            while(key = shadowed[++i]) {
              if (hasKey(object, key) &&
                  callback(object[key], key, object) === false) {
                break;
              }
            }
          }
          return object;
        };

        break;

      case 2:
        // Tobie Langel: Safari 2 broken for-in loop
        // http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
        each = function each(object, callback, thisArg) {
          var key, keys = { }, skipProto = isFunction(object);
          if (object)  {
            thisArg && (callback = bind(callback, thisArg));
            for (key in object) {
              if (!(skipProto && key == 'prototype') &&
                  !hasKey(keys, key) && (keys[key] = 1) &&
                  callback(object[key], key, object) === false) {
                break;
              }
            }
          }
          return object;
        };

        break;

      default: // Others
        each = function each(object, callback, thisArg) {
          var key, skipProto = isFunction(object);
          if (object) {
            thisArg && (callback = bind(callback, thisArg));
            for (key in object) {
              if (!(skipProto && key == 'prototype') &&
                  callback(object[key], key, object) === false) {
                break;
              }
            }
          }
          return object;
        };
    }

    return each;
  })();

  /*--------------------------------------------------------------------------*/

  // Use fuse.Object.hasKey() on object Objects only as it may error on DOM Classes
  // https://bugzilla.mozilla.org/show_bug.cgi?id=375344
  hasKey =
  fuse.Object.hasKey = (function() {
    var objectProto = Object.prototype,
     hasOwnProperty = objectProto.hasOwnProperty;

    if (!isFunction(hasOwnProperty)) {
      if (envTest('OBJECT__PROTO__')) {
        // Safari 2
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          // convert primatives to objects so IN operator will work
          object = Object(object);

          var result, proto = object[PROTO];
          object[PROTO] = null;
          result = property in object;
          object[PROTO] = proto;
          return result;
        };
      } else {
        // Other
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          object = Object(object);
          var constructor = object.constructor;
          return property in object &&
            (constructor && constructor.prototype
              ? object[property] !== constructor.prototype[property]
              : object[property] !== objectProto[property]);
        };
      }
    }
    else {
      hasKey = function hasKey(object, property) {
        // ES5 15.2.4.5
        if (object == null) throw new TypeError;
        return hasOwnProperty.call(object, property);
      };
    }

    // Garrett Smith found an Opera bug that occurs with the window object and not the global
    if (window.window == window && !hasKey(window.window, 'Object')) {
      var __hasKey = hasKey;
      hasKey = function hasKey(object, property) {
        if (object == null) throw new TypeError;
        if(object == window) {
          return property in object &&
            object[property] !== objectProto[property];
        }
        return __hasKey(object, property);
      };
    }

    return hasKey;
  })();

  /*--------------------------------------------------------------------------*/

  fuse.Object.isFunction = isFunction;

  fuse.Object.isHostType = isHostType;

  isArray =
  fuse.Object.isArray = fuse.Array.isArray;

  isElement =
  fuse.Object.isElement = function isElement(value) {
    return !!value && value.nodeType == ELEMENT_NODE;
  };

  isHash =
  fuse.Object.isHash = function isHash(value) {
    var Hash = fuse.Hash;
    return !!value && value.constructor == Hash && value != Hash.prototype;
  };

  isNumber =
  fuse.Object.isNumber = function isNumber(value) {
    return toString.call(value) == NUMBER_CLASS && isFinite(value);
  };

  // ES5 4.3.2
  isPrimitive =
  fuse.Object.isPrimitive = function isPrimitive(value) {
    var type = typeof value;
    return value == null || type == 'boolean' || type == 'number' || type == 'string';
  };

  isRegExp =
  fuse.Object.isRegExp = function isRegExp(value) {
    return toString.call(value) == REGEXP_CLASS;
  };

  isString =
  fuse.Object.isString = function isString(value) {
    return toString.call(value) == STRING_CLASS;
  };

  /*--------------------------------------------------------------------------*/

  (function(Obj) {

    Obj.clone = function clone(object, deep) {
      if (object) {
        if (isFunction(object.clone)) {
          return object.clone(deep);
        }
        if (typeof object == 'object') {
          var length, result, constructor = object.constructor, i = -1;
          switch (toString.call(object)) {
            case ARRAY_CLASS  :
              if (deep) {
                result = constructor();
                length = object.length;
                while (++i < length) result[i] = Obj.clone(object[i], deep);
              } else {
                result = object.slice(0);
              }
              return result;

            case REGEXP_CLASS :
              return constructor(object.source,
                (object.global     ? 'g' : '') +
                (object.ignoreCase ? 'i' : '') +
                (object.multiline  ? 'm' : ''));

            case NUMBER_CLASS  :
            case STRING_CLASS  : return new constructor(object);
            case BOOLEAN_CLASS : return new constructor(object == true);
            case DATE_CLASS    : return new constructor(+object);
          }

          result = Obj();
          if (deep) {
            eachKey(object, function(value, key) {
             result[key] = Obj.clone(value, deep);
            });
          } else {
            Obj.extend(result, object);
          }
          return result;
        }
      }
      return Obj();
    };

    Obj.extend = function extend(destination, source) {
      eachKey(source, function(value, key) { destination[key] = value; });
      return destination;
    };

    // ES5 15.2.4.2
    // The erratum states Object#toString should return
    // [object Null] and [object Undefined] for null and undefined values.
    // However, Null and Undefined are *not* [[Class]] property values.
    Obj.getClassOf = function getClassOf(object) {
      if (object == null) throw new TypeError;
      return fuse.String(toString.call(object).slice(8, -1));
    };

    Obj.isEmpty = function isEmpty(object) {
      var result = true;
      if (object) {
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) return (result = false);
        });
      }
      return result;
    };

    // https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript
    // http://www.iana.org/assignments/port-numbers
    Obj.isSameOrigin = (function() {
      var loc      = window.location,
       protocol    = loc.protocol,
       port        = loc.port,
       reUrlParts  = /([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^\/:$]+)(?:\:(\d+))?/,
       defaultPort = protocol == 'ftp:' ? 21 : protocol == 'https:' ? 443 : 80,

      isSameOrigin = function isSameOrigin(url) {
        var domainIndex, urlDomain,
         result    = true,
         docDomain = fuse._doc.domain,
         parts     = String(url).match(reUrlParts) || [];

        if (parts[0]) {
          urlDomain = parts[2];
          domainIndex = urlDomain.indexOf(docDomain);
          result = parts[1] == protocol &&
            (!domainIndex || urlDomain.charAt(domainIndex -1) == '.') &&
              (parts[3] || defaultPort) == (port || defaultPort);
        }
        return result;
      };

      return isSameOrigin;
    })();

    // ES5 15.2.3.14
    if (!isFunction(Obj.keys)) {
      Obj.keys = function keys(object) {
        if (isPrimitive(object)) throw new TypeError;

        var result = fuse.Array(), i = -1;
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) result[++i] = key;
        });
        return result;
      };
    }

    Obj.values = function values(object) {
      if (isPrimitive(object)) throw new TypeError;

      var result = fuse.Array(), i = -1;
      eachKey(object, function(value, key) {
        if (hasKey(object, key)) result[++i] = value;
      });
      return result;
    };

    Obj.toHTML = function toHTML(object) {
      return object && typeof object.toHTML == 'function'
        ? fuse.String(object.toHTML())
        : fuse.String(object == null ? '' : object);
    };

    // prevent JScript bug with named function expressions
    var clone =   null,
     each =       null,
     extend =     null,
     getClassOf = null,
     isEmpty =    null,
     keys =       null,
     values =     null,
     toHTML =     null;
  })(fuse.Object);
