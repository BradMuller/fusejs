new Test.Unit.Runner({

  // Make sure to set defaults in the test forms, as some browsers override this
  // with previously entered values on page reload
  'setup': function() {
    $$('form').each(function(f) { $(f).reset() });

    // hidden value does not reset (for some reason)
    $('bigform').raw['tf_hidden'].value = '';
  },

  'testDollarF': function() {
    // test normal execution
    this.assertEqual('4', $F('input_enabled'));

    // test unsupported element
    this.assertNothingRaised(function() { $F('inputs') });
    this.assertEqual(null, $F('inputs'));

    // test unknown element
    this.assertNothingRaised(function() { $F('bork') });
    this.assertEqual(null, $F('bork'));
  },

  'testFormReset': function() {
    $('input_enabled').raw.value = 'something else';
    $('form').reset();
    this.assertEqual(4, $F('input_enabled'));
  },

  'testFieldEventObserver': function() {
    var container, observerA, observerB, radios,
     self = this,
     fakeEvent = { 'isEvent': true },
     Field = fuse.dom.InputElement,
     callbackCounter = 0;

    observerA = Field.EventObserver('input_enabled', function(element, value, event) {
      callbackCounter++;

      self.assertEqual($('input_enabled'), element,
        'Should pass the element as the first argument to the callback.');

      self.assertEqual('boo!', value,
        'Should pass the new value as the second argument to the callback.');

      self.assert(event && event.isEvent,
        'Should pass the event object as the thrid argument to the callback.');
    });

    this.assertEqual(0, callbackCounter);
    $('input_enabled').setValue('boo!');

    // can't test the event directly, simulating
    observerA.onElementEvent(fakeEvent);
    this.assertEqual(1, callbackCounter);

    // test control groups
    container = $('form_with_control_groups'),
    radios = container.down(3);

    observerB = Field.EventObserver(radios[0], function() {
      // not executed
      // self.assertEqual(radios[0], '2r');
    });

    this.assertEqual('2r', observerB.getValue());
    this.assertEnumEqual(radios, observerB.group);
  },

  'testFeldObserver': function() {
    var Field = fuse.dom.InputElement,
     timedCounter = 0;

    // first part: regular field
    var observer = Field.Observer('input_enabled',
      function() { ++timedCounter }, 0.5);

    // test it's unchanged yet
    this.assertEqual(0, timedCounter);

    // test it doesn't change on first check
    this.wait(550, function() {
      this.assertEqual(0, timedCounter);

      // change, test it doesn't immediately change
      $('input_enabled').setValue('yowza!');
      this.assertEqual(0, timedCounter);

      // test it changes on next check, but not again on the next
      this.wait(550, function() {
        this.assertEqual(1, timedCounter);
        this.wait(550, function() {
          this.assertEqual(1, timedCounter);
          observer.stop();
        });
      });
    });

    // second part: multiple-select
    fuse.Array(1, 2, 3).each(function(index) {
      $('multiSel1_opt' + index).raw.selected = 1 == index;
    });

    timedCounter = 0;
    observer = Field.Observer( 'multiSel1', function() { ++timedCounter }, 0.5);

    // test it's unchanged yet
    this.assertEqual(0, timedCounter);

    // test it doesn't change on first check
    this.wait(550, function() {
      this.assertEqual(0, timedCounter);

      // change, test it doesn't immediately change
      // NOTE: it is important that the 3rd be re-selected, for the
      // serialize form to obtain the expected value :-)
      $('multiSel1_opt3').raw.selected = true;
      this.assertEqual(0, timedCounter);

      // test it changes on next check, but not again on the next
      this.wait(550, function() {
        this.assertEqual(1, timedCounter);
        this.wait(550, function() {
          this.assertEqual(1, timedCounter);
          observer.stop();
        });
      });
    });
  },

  'testFormObserver': function() {
    var Form = fuse.dom.FormElement,
     timedCounter = 0;

    // should work the same way was Form.Element.Observer
    var observer = Form.Observer('form', 
      function(form, value) { ++timedCounter }, 0.5);

    // test it's unchanged yet
    this.assertEqual(0, timedCounter);

    // test it doesn't change on first check
    this.wait(550, function() {
      this.assertEqual(0, timedCounter);

      // change, test it doesn't immediately change
      $('input_enabled').setValue('yowza!');
      this.assertEqual(0, timedCounter);

      // test it changes on next check, but not again on the next
      this.wait(550, function() {
        this.assertEqual(1, timedCounter);
        this.wait(550, function() {
          this.assertEqual(1, timedCounter);
          observer.stop();
        });
      });
    });
  },

  'testFormEnabling': function() {
    var Form = fuse.dom.FormElement,
     form = $('bigform'),
     input1  = $('dummy_disabled'),
     input2  = $('focus_text');

    this.assertDisabled(input1);
    this.assertEnabled(input2);

    form.disable();
    this.assertDisabled(input1, input2);
    
    form.enable();
    this.assertEnabled(input1, input2);
    
    input1.disable();
    this.assertDisabled(input1);

    // non-form elements:
    var fieldset = $('selects_fieldset'), fields = fieldset.getChildren();
    fields.each(function(select) { this.assertEnabled(select) }, this);

    Form.disable(fieldset);
    fields.each(function(select) { this.assertDisabled(select) }, this);

    Form.enable(fieldset);
    fields.each(function(select) { this.assertEnabled(select) }, this);
  },

  'testFormElementEnabling': function() {
    var field = $('input_disabled');
    field.enable();
    this.assertEnabled(field);

    field.disable();
    this.assertDisabled(field);

    field = $('input_enabled');
    this.assertEnabled(field);

    field.disable();
    this.assertDisabled(field);

    field.enable();
    this.assertEnabled(field);
  },

  // due to the lack of a DOM hasFocus() API method,
  // we're simulating things here a little bit
  'testFormActivating': function() {
    // Firefox, IE, and Safari 2+
    function getSelection(decorator) {
      var element = decorator.raw || decorator;
      try {
        var result;
        if (typeof element.selectionStart == 'number') {
          result = element.value.substring(element.selectionStart, element.selectionEnd);
        } else if (document.selection && document.selection.createRange) {
          result = document.selection.createRange().text;
        }
        return result || '';
      }
      catch(e) { return '' }
    }

    // Form.focusFirstControl shouldn't focus disabled elements
    var element = $('bigform').getFirstControl();
    this.assertEqual('submit', element.raw.id);

    // Test IE doesn't select text on buttons
    $('bigform').focusFirstControl();
    this.assertEqual('', getSelection(element));

    element = $('button_submit');
    this.assertEqual('', getSelection(element.activate()));

    fuse.Array('form', 'button_elements').each(function(container) {
      $(container).query('*[type="button"],*[type="submit"],*[type="reset"]')
        .each(function(element) {
          this.assertEqual('', getSelection($(element).activate()));
        }, this);
    }, this);

    // Form.Element.activate should select text on text input elements
    element = $('focus_text');
    this.assertEqual('Hello', getSelection(element.activate()),
      'The browser may not be able to retreave selected text');

    // Form.Element.activate shouldn't raise an exception when the form or field is hidden
    this.assertNothingRaised(function() {
      $('form_focus_hidden').focusFirstControl();
    });

    // Form.focusFirstControl should only call activate if the first element exists
    this.assertNothingRaised(function() {
      $('form_empty').focusFirstControl();
    });
  },

  'testFormGetControls': function() {
    var elements = fuse.dom.FormElement.getControls('various'),
     names = $w('tf_selectOne tf_textarea tf_checkbox tf_selectMany tf_text tf_radio tf_hidden tf_password');
    this.assertEnumEqual(names, elements.map(function(element) { return element.raw.name; }))
  },

  'testFormGetInputs': function() {
    var form = $('form');
    fuse.Array(form.getInputs(), form.getInputs()).each(function(inputs) {
      this.assertEqual(5, inputs.length);
      this.assert(fuse.Object.isArray(inputs));
      this.assert(inputs.every(function(input) { return (input.nodeName.toUpperCase() === 'INPUT') }));
    }, this);

    // ensure private method nodeListSlice works as expected
    this.assertEqual(3, $('form_with_object_prototypes').getInputs().length,
      'Failed to convert nodeList to an array using private method `nodeListSlice`.');
  },

  'testFormGetFirstControl': function() {
    this.assertEqual($('ffe_checkbox'),     $('ffe').getFirstControl());
    this.assertEqual($('ffe_ti_checkbox'),  $('ffe_ti').getFirstControl());
    this.assertEqual($('ffe_ti2_checkbox'), $('ffe_ti2').getFirstControl());
  },

  'testFormSerialize': function() {
    var serialize = fuse.dom.FormElement.serialize,
     serializeElements = fuse.dom.FormElement.serializeElements;

    // form is initially empty
    var expected = {
      'tf_selectOne': '',
      'tf_textarea':  '',
      'tf_text':      '',
      'tf_hidden':    '',
      'tf_password':  ''
    };

    this.assertHashEqual(expected, serialize('various', true));

    // set up some stuff
    var form = $('bigform').raw;
    form['tf_selectOne'].selectedIndex = 1;
    form['tf_textarea'].value   = 'boo hoo!';
    form['tf_text'].value       = '123\u00c3\u00b6\u00c3\u00a4\u00c3\u00bc';
    form['tf_hidden'].value     = 'moo%hoo&test';
    form['tf_password'].value   = 'sekrit code';
    form['tf_checkbox'].checked = true;
    form['tf_radio'].checked    = true;

    // return params
    expected = {
      'tf_selectOne': 1,
      'tf_textarea':  'boo hoo!',
      'tf_text':      '123\u00c3\u00b6\u00c3\u00a4\u00c3\u00bc',
      'tf_hidden':    'moo%hoo&test',
      'tf_password':  'sekrit code',
      'tf_checkbox':  'on',
      'tf_radio':     'on'
    };

    this.assertHashEqual(expected, serialize('various', true));

    // return string
    expected = fuse.Object.toQueryString(expected).split('&').sort();
    this.assertEnumEqual(expected, serialize('various').split('&').sort());
    this.assert(fuse.Object.isString(serialize('form', { 'hash': false })));

    // Checks that disabled element is not included in serialized form.
    $('input_enabled').enable();
    this.assertHashEqual({
      'val1': 4,
      'action': 'blah',
      'first_submit': 'Commit it!'
    },
    serialize('form', true));

    // should not eat empty values for duplicate names
    $('checkbox_hack').raw.checked = false;
    var data = serialize('value_checks', true);

    this.assertEnumEqual(['', 'siamese'], data['twin']);
    this.assertEqual('0', data['checky']);

    $('checkbox_hack').raw.checked = true;
    this.assertEnumEqual($w('1 0'), serialize('value_checks', true)['checky']);

    // all kinds of SELECT controls
    var params = serialize('selects_fieldset', true);
    expected = { 'nvm[]': ['One', 'Three'], 'evu': '', 'evm[]': ['', 'Three'] };
    this.assertHashEqual(expected, params);

    params = serialize('selects_wrapper', true);
    this.assertHashEqual(fuse.Object.extend(expected,
      { 'vu': 1, 'vm[]': [1, 3], 'nvu': 'One' }), params);

    // explicit submit button
    expected = { 'val1': 4, 'action': 'blah', 'second_submit': 'Delete it!' };
    this.assertHashEqual(expected, $('form').serialize({ 'submit': 'second_submit' }));

    expected = { val1:4, action:'blah' };
    this.assertHashEqual(expected, $('form').serialize({ 'submit': false }));

    expected = { val1:4, action:'blah' };
    this.assertHashEqual(expected, $('form').serialize({ 'submit': 'inexistent' }));

    // file input should not be serialized
    this.assertEqual('', $('form_with_file_input').serialize());

    // test with image input button
    expected = { 'clicky':'click me', 'greeting': 'Hello', 'commit_img.x': 2,
      'commit_img.y': 4, 'commit_img': 1, 'search': 'search' };

    this.assertHashEqual(expected, serialize('inputs',
      { 'submit': $('input_image'), 'x': 2, 'y': 4 }));

    // test with button element
    expected = { 'clicky': 'click me', 'greeting': 'Hello', 'search': 'search', 'bu_submit': 1 };
    var elements = $('inputs').getChildren().concat($('button_submit'));

    this.assertHashEqual(expected,
      serializeElements('bigform', elements, { 'submit': $('button_submit') }));

    // test control groups
    expected = { 'group_radio': '2r', 'group_checkbox': '2c' };
    this.assertHashEqual(expected, $('form_with_control_groups').serialize(true));

    // test form elements names matching Object.prototype properties
    expected = { 'length':'', 'toString':'', 'valueOf':'' };
    this.assertHashEqual(expected,  $('form_with_object_prototypes').serialize(true));
    this.assertEqual('length=&toString=&valueOf=',  $('form_with_object_prototypes').serialize());

    // test selectboxes with no selected value
    expected = { 'vm[]': 3 };
    $('selects_wrapper').query('select').each(function(element) { element.selectedIndex = -1 });
    $('multiSel1').raw.selectedIndex = 2;

    this.assertEqual('vm%5B%5D=3', serialize('selects_wrapper'));
    this.assertHashEqual(expected, serialize('selects_wrapper', true));
  },

  'testFormMethodsOnExtendedElements': function() {
    var form = $('form'),
     serialize = fuse.dom.FormElement.serialize;

    this.assertEqual(serialize('form'), form.serialize());

    this.assertEqual(serialize('input_enabled'),
      $('input_enabled').serialize());

    this.assertNotEqual(form.serialize,
      $('input_enabled').serialize);

    // ensure button elements are extended with fuse.dom.FormElement methods
    this.assertNothingRaised(function() { $('button_submit').getValue() });

    fuse.dom.InputElement.extend(
      { 'anInputMethod': function(input)  { return 'input'  } });

    fuse.dom.SelectElement.extend(
      { 'aSelectMethod': function(select) { return 'select' } });

    form = $('bigform').raw;
    var input = $(form['tf_text']), select = $(form['tf_selectOne']);

    this.assert(input.anInputMethod);
    this.assert(!input.aSelectMethod);
    this.assertEqual('input', input.anInputMethod());

    this.assert(select.aSelectMethod);
    this.assert(!select.anInputMethod);
    this.assertEqual('select', select.aSelectMethod());
  },

  'testFormRequest': function() {
    // Opera 9.25 will automatically translate
    // `action` uri's from relative to absolute.

    // test "GET" method
    var form = $('form'), request = form.request();
    this.assert(form.hasAttribute('method'));
    this.assert(request.url.contains('fixtures/empty.js?val1=4'));
    this.assertEqual('get', request.method);

    // test "PUT" method
    request = form.request({ 'method': 'put', 'parameters': { 'val2': 'hello' } });

    this.assertEqual(4,       request.options.parameters['val1']);
    this.assertEqual('hello', request.options.parameters['val2']);
    this.assertEqual('post',  request.method);
    this.assertEqual('put',   request.parameters['_method']);

    // with empty action attribute
    request = $('ffe').request({ 'method': 'post' });
    this.assert(request.url.contains('/form_test.html'),
      'wrong default action for form element with empty action attribute');

    // with explicit options.submit
    request = form.request({ 'submit': 'second_submit' });
    this.assert(request.url.contains('second_submit=Delete%20it!'));
  },

  'testFormElementClear': function() {
    fuse.Array('form','bigform').each(function(container) {
      // Form.Element#clear should clear text inputs,
      // uncheck checkboxes/radio buttons, and
      // deselect any options from a dropdown list
      $(container).query('input,select,textarea').each(function(element) {
        var asserted = element.value,
         backup      = asserted,
         decorator   = $(element),
         prop        = 'value',
         tagName     = element.tagName.toUpperCase();

        if (fuse.Array('button', 'image', 'reset', 'submit').contains(element.type)) {
          // default values for "asserted" and "prop"
        }
        else if (tagName == 'INPUT' || tagName  == 'TEXTAREA') {
          if (fuse.Array('checkbox', 'radio').contains(element.type)) {
            backup = element.checked;
            element.checked = true;
            asserted = false;
            prop = 'checked';
          }
          else {
            element.value = 'something';
            asserted = '';
          }
        }
        else if (tagName == 'SELECT') {
          backup = element.selectedIndex;
          element.selectedIndex = Math.max(0, element.options.length -1);
          asserted = -1;
          prop = 'selectedIndex';
        }

        decorator.clear();

        this.assertEqual(asserted, element[prop],
          decorator.inspect() + ';' + (element.name ? ' name="' +
          element.name + '";' : '') +
          (element.type ? ' type="' + element.type + '";' : ''));

        // restore original value
        element[prop] = backup;
      }, this);
    }, this);
    
    // Form.Element#clear should NOT clear button
    // values of any kind.
    this.assertUndefined(fuse.query('button').get(0).clear,
      'BUTTON decorator should not have a clear() method.');
  },

  'testFormElementMethodsChaining': function() {
    var methods = $w('clear activate disable enable'),
      formControls = $('form').getControls();
 
    methods.each(function(method) {
      formControls.each(function(element) {
        var returned = element[method]();
        this.assertIdentical(element, returned);
      }, this);
    }, this);
  },

  'testGetValue': function() {
  	// test button element
  	this.assertEqual('1', $('button_submit').getValue());
  	this.assertEqual('',  $('button_novalue').getValue());
  },

  'testSetValue': function() {
    // test button element
    var button = $('button_submit');
    button.setValue('2');

    this.assertEqual('2', button.getValue());

    // test button with no value attribute
    button = $('button_novalue');
    this.assertNothingRaised(function() { button.setValue('something') });
    this.assertEqual('something', button.getValue());

    // text input
    var input = $('input_enabled'), oldValue = input.getValue();

    this.assertEqual(input, input.setValue('foo'),
      'setValue chaining is broken');

    this.assertEqual('foo', input.getValue(),
      'value improperly set');

    input.setValue(oldValue);

    this.assertEqual(oldValue, input.getValue(),
      'value improperly restored to original');

    // checkbox
    input = $('checkbox_hack');
    input.setValue('2');
    this.assertEqual('2', input.getValue());

    // selectbox
    input = $($('bigform').raw['vu']);
    input.setValue('3');

    this.assertEqual('3', input.getValue(),
      'single select option improperly set');

    input.setValue('1');
    this.assertEqual('1', input.getValue());

    // multiple select
    input = $($('bigform').raw['vm[]']);
    input.setValue(['2', '3']);
    this.assertEnumEqual(['2', '3'], input.getValue(),
      'multiple select options improperly set');

    input.setValue(['1', '3']);
    this.assertEnumEqual(['1', '3'], input.getValue());
  },

  'testFormMethodsReturnElement': function() {
    element = $('form');
    $w('disable enable focusFirstControl reset').each(function(method) {
      this.assert(element === $('form')[method](),
        'fuse.dom.FormElement#' + method + ' returned a non element value.');
    }, this);
  },

  'testFormElementMethodsReturnElement': function() {
    element = $('focus_text');
    var backup = element.raw.value;

    $w('activate clear disable enable focus select').each(function(method) {
      this.assert(element === $('focus_text')[method](),
        'fuse.dom.InputElement#' + method + ' returned a non element value.');
    }, this);

    element.value = backup;
  }
});