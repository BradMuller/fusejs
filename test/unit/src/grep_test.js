new Test.Unit.Runner({

  'testArrayGrep': function() {
    // test empty pattern
    this.assertEqual('abc', fuse.Array('a', 'b', 'c').grep('').join(''));
    this.assertEqual('abc', fuse.Array('a', 'b', 'c').grep(new RegExp('')).join(''));

    this.assertEqual('juanbond, jdd',
      Fixtures.Nicknames.grep(/j/).join(', '));

    this.assertEqual('JUANBOND, JDD',
      Fixtures.Nicknames.grep(/j/, function(nickname) {
        return nickname.toUpperCase();
      }).join(', '));

    this.assertEnumEqual($('grepHeader', 'grepCell'),
      $('grepTable', 'grepTBody', 'grepRow', 'grepHeader', 'grepCell').grep(new Selector('.cell')));

    this.assertEnumEqual([0, 2], fuse.Array.plugin.grep.call(Fixtures.Object, /\d/),
      'called with an object as the `this` value');

    this.assertEnumEqual([], fuse.Array.plugin.grep.call(Fixtures.Object, /undefined/),
      'called with an object as the `this` value iterated over an undefined index');
  },


  'testEnumerableGrep': function() {
    // test empty pattern
    this.assertEqual('abc',
      new EnumObject(['a', 'b', 'c']).grep('').join(''));

    this.assertEqual('abc',
      new EnumObject(['a', 'b', 'c']).grep(new RegExp('')).join(''));

    this.assertEqual('juanbond, jdd',
      Fixtures.Nicknames.grep(/j/).join(', '));

    this.assertEqual('JUANBOND, JDD',
      Fixtures.Nicknames.grep(/j/, function(nickname) {
        return nickname.toUpperCase();
      }).join(", "));

    this.assertEnumEqual($('grepHeader', 'grepCell'),
      $('grepTable', 'grepTBody', 'grepRow', 'grepHeader', 'grepCell')
      .grep(new Selector('.cell')));
  },

  'testGrepEscapesRegExpSpecialCharacters': function() {
    this.assertEqual(';-), :-)',
      Fixtures.Emoticons.grep('-)').join(", "));

    this.assertEnumEqual(['?a', 'c?'],     new EnumObject(['?a','b','c?']).grep('?'));
    this.assertEnumEqual(['*a', 'c*'],     new EnumObject(['*a','b','c*']).grep('*'));
    this.assertEnumEqual(['+a', 'c+'],     new EnumObject(['+a','b','c+']).grep('+'));
    this.assertEnumEqual(['{1}a', 'c{1}'], new EnumObject(['{1}a','b','c{1}']).grep('{1}'));
    this.assertEnumEqual(['(a', 'c('],     new EnumObject(['(a','b','c(']).grep('('));
    this.assertEnumEqual(['|a', 'c|'],     new EnumObject(['|a','b','c|']).grep('|'));
  },

  'testHashGrep': function() {
    // test empty pattern
    this.assertHashEqual(Fixtures.many, $H(Fixtures.many).grep(''));
    this.assertHashEqual(Fixtures.many, $H(Fixtures.many).grep(new RegExp('')));

    this.assert(/(ab|ba)/.test($H(Fixtures.many).grep(/[AB]/).keys().join('')));
    this.assert(/(CCD#D#|D#D#CC)/.test($H(Fixtures.many).grep(/[CD]/, function(v) {
      return v + v;
    }).values().join('')));

    this.assert('toString' == $H(Fixtures.mixed_dont_enum).grep(/bar/, function(v) {
      return v;
    }).keys().join(''));
  }
});