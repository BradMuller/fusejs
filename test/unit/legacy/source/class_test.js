new Test.Unit.Runner({

  'testClassCreate': function() {
    this.assert(fuse.Object.isFunction(Fixtures.Animal),
      'Fixtures.Animal is not a constructor');

    this.assertEqual(4,
      fuse.Array(Fixtures.Cat, Fixtures.Dog, Fixtures.Mouse, Fixtures.Ox)
        .intersect(Fixtures.Animal.subclasses).length,
      'Subclasses collection should have 4 classes.');

    Fixtures.Animal.subclasses.each(function(subclass) {
      this.assertEqual(Fixtures.Animal, subclass.superclass) }, this);

    var Bird = fuse.Class(Fixtures.Animal);
    this.assertEqual(Bird, Fixtures.Animal.subclasses.last());
    this.assertEnumEqual(fuse.Object.keys(new Fixtures.Animal).sort(),
      fuse.Object.keys(new Bird).sort());

    // Safari 3.1+ mistakes regular expressions as typeof `function`
    var klass = function() { }, regexp = /foo/;
    this.assertNothingRaised(function() {
      klass = fuse.Class(Fixtures.Animal, { '_regexp': regexp });
    }, 'Class creation failed when the subclass contains a regular expression as a property.');

    this.assertEqual(String(regexp), String(new klass()._regexp), 'The regexp property should exist.');
  },

  'testClassInstantiation': function() {
    var pet = new Fixtures.Animal('Nibbles');

    this.assertEqual('Nibbles', pet.name,
      'property not initialized');

    this.assertEqual(Fixtures.Animal, pet.constructor,
      'bad constructor reference');

    this.assertEqual('Nibbles: Hi!', pet.say('Hi!'));

    this.assertUndefined(pet.superclass);

    var Empty = fuse.Class();
    this.assert('object', typeof new Empty);
  },

  'testConstructorExplicitReturn': function() {
    var $decorator = fuse.Class({
      'initialize': function(element) {
        if (element.constructor === $decorator)
          return element;
        this.id = 'decorator_id_' + $decorator.idCounter++;
        this._element = $(element);
      }
    });

    $decorator.idCounter = 0;

    var decorated = new $decorator('test');
    this.assertEqual('decorator_id_0', decorated.id);
    this.assertEqual('decorator_id_0', new $decorator(decorated).id,
      'Constructor is not returning a value.');
  },

  'testInheritance': function() {
    var tom = new Fixtures.Cat('Tom');

    this.assertEqual(Fixtures.Cat, tom.constructor,
      'bad constructor reference');

    this.assertEqual(Fixtures.Animal, tom.constructor.superclass,
      'bad superclass reference');

    this.assertEqual('Tom', tom.name);
    this.assertEqual('Tom: meow', tom.say('meow'));
    this.assertEqual('Tom: Yuk! I only eat mice.', tom.eat(new Fixtures.Animal));
  },

  'testSuperclassMethodCall': function() {
    var tom = new Fixtures.Cat('Tom');
    this.assertEqual('Tom: Yum!', tom.eat(new Fixtures.Mouse));

    // augment the constructor and test
    var Dodo = fuse.Class(Fixtures.Animal, function() {
      function initialize(name) {
        this.callSuper(initialize, name);
        this.extinct = true;
      }

      function say(message) {
        return this.callSuper(say, message) + ' honk honk';
      }

      return { 'initialize': initialize, 'say': say };
    });

    var gonzo = new Dodo('Gonzo');
    this.assertEqual('Gonzo', gonzo.name,
      'Should have called super `initialize` method and set `name` property');

    this.assert(gonzo.extinct, 'Dodo birds should be extinct',
      'Should have set the `extinct` property of the Dodo instance');

    this.assertEqual('Gonzo: hello honk honk', gonzo.say('hello'),
      'Should have called super `say` method resolved from arguments.callee');
  },

  'testClassExtend': function() {
    var tom = new Fixtures.Cat('Tom'), jerry = new Fixtures.Mouse('Jerry');

    Fixtures.Animal.addPlugins({
      'sleep': function() { return this.say('ZZZ'); }
    });

    Fixtures.Mouse.extend(
      /* plugins - test passing a closure */
      function() {
        function sleep() {
          return this.callSuper(sleep, 'sleep') +
            ' ... no, can\'t sleep! Gotta steal cheese!';
        }

        function escape(cat) {
          return this.say('(from a mousehole) Take that, ' + cat.name + '!');
        }

        return { 'sleep': sleep, 'escape': escape };
      },

      /* mixins */
      null,

      /* statics */
      { 'staticTest': function() { return 'static'; }
    });

    this.assertEqual('function', typeof Fixtures.Mouse.staticTest,
      'Class.extend(plugins, null, statics) should have added a static method to Fixtures.Mouse');

    Fixtures.Mouse.addStatics({
      'staticTest': function() { return 'static too'; }
    });

    this.assertEqual('static too', Fixtures.Mouse.staticTest(),
      'Class.addStatics(statics) should have updated the static method on Fixtures.Mouse');

    this.assertEqual('Tom: ZZZ', tom.sleep(),
      'added instance method not available to subclass');

    this.assertEqual(
      'Jerry: ZZZ ... no, can\'t sleep! Gotta steal cheese!',
      jerry.sleep());

    this.assertEqual(
      'Jerry: (from a mousehole) Take that, Tom!',
      jerry.escape(tom));

    // insure that a method has not propagated *up* the prototype chain:
    this.assertUndefined(tom.escape);
    this.assertUndefined((new Fixtures.Animal()).escape);

    Fixtures.Animal.extend([{
      'sleep': function() { return this.say('zZzZ') }
    }]);

    this.assertEqual(
      'Jerry: zZzZ ... no, can\'t sleep! Gotta steal cheese!',
      jerry.sleep());
  },

  'testBaseClassWithMixin': function() {
    var grass = new Fixtures.Plant('grass', 3);
    this.assertRespondsTo('getValue', grass);
    this.assertEqual('#<Sellable: 3kg>', grass.inspect());
  },

  'testSubclassWithMixin': function() {
    var snoopy = new Fixtures.Dog('Snoopy', 12, 'male');
    this.assertRespondsTo('reproduce', snoopy);
  },

  'testSubclassWithMixins': function() {
    var cow = new Fixtures.Ox('cow', 400, 'female');
    this.assertEqual('#<Sellable: 400kg>', cow.inspect());
    this.assertRespondsTo('reproduce', cow);
    this.assertRespondsTo('getValue', cow);
  },

  'testMixinHasNoSuper': function() {
    var flower = fuse.Class(Fixtures.Sellable);
    this.assert(Fixtures.Sellable.getValue._isMixin);
    this.assert((new flower).getValue);
    this.assertUndefined((new flower).getValue.$super);
  },

  'testClassWithToStringAndValueOfMethods': function() {
    var Foo = fuse.Class({
      'toString': function() { return 'toString' },
      'valueOf':  function() { return 'valueOf'  }
    }),

    Parent = fuse.Class({
      'm1': function(){ return 'm1' },
      'm2': function(){ return 'm2' }
    }),

    Child = fuse.Class(Parent, {
      'm1': function() { return this.callSuper(arguments) + ' child' },
      'm2': function() { return this.callSuper(arguments) + ' child' }
    });

    if (fuse.env.test('FUNCTION_TO_STRING_RETURNS_SOURCE'))
      this.assert(new Child().m1.toString().indexOf(' child') > -1);

    this.assertEqual('toString', new Foo().toString());
    this.assertEqual('valueOf',  new Foo().valueOf());
  },

  'testGrandChildClass': function() {
    var Parent = fuse.Class({
      'say': function() {
        return 'Parent#say';
      }
    }),

    Child = fuse.Class(Parent, {
      'say': function() {
        return 'Child#say > ' + this.callSuper(arguments);
      }
    }),

    GrandChild = fuse.Class(Child, {
      'say': function() {
        return 'GrandChild#say > ' + this.callSuper(arguments);
      }
    });

    var grandChild = new GrandChild;
    this.assertEqual('GrandChild#say > Child#say > Parent#say', grandChild.say());
  }
});