function extendDefault(options) {
  return fuse.Object.extend({
    'asynchronous': false,
    'method':      'get',
    'onException': function(e) { throw e; }
  }, options);
}

function getInnerHTML(id) {
  var element = $(id);
  return fuse.String(!element ? '' :
    $(id).raw.innerHTML.toString().toLowerCase().replace(/[\r\n\t]/g, ''));
}

var message  = 'You must be running your tests from rake to test this feature.',
 sentence = 'pack my box with <em>five dozen</em> liquor jugs! ' +
   'oh, how <strong>quickly</strong> daft jumping zebras vex...';

/*--------------------------------------------------------------------------*/

var Fixtures = {
  'js': {
    'responseBody': '$("content").update("<H2>Hello world!</H2>");', 
    'Content-Type': '           text/javascript     '
  },
  
  'html': {
    'responseBody': 'Pack my box with <em>five dozen</em> liquor jugs! ' +
      'Oh, how <strong>quickly</strong> daft jumping zebras vex...'
  },
  
  'xml': {
    'responseBody': '<?xml version="1.0" encoding="UTF-8" ?><name attr="foo">bar</name>', 
    'Content-Type': 'application/xml'
  },
  
  'json': {
    'responseBody': '{\n\r"test": 123}', 
    'Content-Type': 'application/json'
  },
  
  'jsonWithoutContentType': {
    'responseBody': '{"test": 123}'
  },
  
  'invalidJson': {
    'responseBody': '{});window.attacked = true;({}',
    'Content-Type': 'application/json'
  },
  
  'headerJson': {
    'X-JSON': '{"test": "hello #\u00E9\u00E0 "}' // hello #éà
  }
};

// make all timers/delays use seconds
fuse.Timer.defaults.multiplier = 1000;