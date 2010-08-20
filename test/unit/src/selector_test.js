new Test.Unit.Runner({

  'testSelectorWithTagName': function() {
    this.assertEnumEqual($A(document.getElementsByTagName('li')), fuse.query('li'));
    this.assertEnumEqual([$('strong')], $$('strong'));
    this.assertEnumEqual([], $$('nonexistent'));

    var allNodes = $A(document.getElementsByTagName('*'))
      .filter(function(node) { return node.nodeType === 1 });

    this.assertEnumEqual(allNodes, fuse.query('*'));
  },

  'testSelectorWithId': function() {
    this.assertEnumEqual([$('fixtures')], $$('#fixtures'));
    this.assertEnumEqual([], $$('#nonexistent'));
    this.assertEnumEqual([$('troubleForm')], $$('#troubleForm'));
  },

  'testSelectorWithClassName': function() {
    this.assertEnumEqual($('p', 'link_1', 'item_1'), $$('.first'));
    this.assertEnumEqual([], $$('.second'));
  },

  'testSelectorWithTagNameAndId': function() {
    this.assertEnumEqual([$('strong')], $$('strong#strong'));
    this.assertEnumEqual([], $$('p#strong'));
  },

  'testSelectorWithTagNameAndClassName': function() {
    this.assertEnumEqual($('link_1', 'link_2'), $$('a.internal'));
    this.assertEnumEqual([$('link_2')], $$('a.internal.highlight'));
    this.assertEnumEqual([$('link_2')], $$('a.highlight.internal'));
    this.assertEnumEqual([], $$('a.highlight.internal.nonexistent'));
  },

  'testSelectorWithIdAndClassName': function() {
    this.assertEnumEqual([$('link_2')], $$('#link_2.internal'));
    this.assertEnumEqual([$('link_2')], $$('.internal#link_2'));
    this.assertEnumEqual([$('link_2')], $$('#link_2.internal.highlight'));
    this.assertEnumEqual([], $$('#link_2.internal.nonexistent'));
  },

  'testSelectorWithTagNameAndIdAndClassName': function() {
    this.assertEnumEqual([$('link_2')], $$('a#link_2.internal'));
    this.assertEnumEqual([$('link_2')], $$('a.internal#link_2'));
    this.assertEnumEqual([$('item_1')], $$('li#item_1.first'));

    this.assertEnumEqual([], $$('li#item_1.nonexistent'));
    this.assertEnumEqual([], $$('li#item_1.first.nonexistent'));
  },

  'test$$MatchesAncestryWithTokensSeparatedByWhitespace': function() {
    // This also tests Opera's XPath engine which breaks down
    // when selectors are too complex (a regression in version 9.5)
    this.assertEnumEqual($('em2', 'em', 'span'), $$('#fixtures a *'));
    this.assertEnumEqual([$('p')], $$('div#fixtures p'));
  },

  'test$$CombinesResultsWhenMultipleExpressionsArePassed': function() {
    this.assertEnumEqual($('link_1', 'link_2', 'item_1', 'item_2', 'item_3'),
      $$('#p a', ' ul#list li '));
  },

  'testSelectorWithTagNameAndAttributeExistence': function() {
    this.assertEnumEqual($$('#fixtures h1'), $$('h1[class]'),
      'h1[class]');

    this.assertEnumEqual($$('#fixtures h1'), $$('h1[CLASS]'),
      'h1[CLASS]');

    this.assertEnumEqual([$('item_3')], $$('li#item_3[class]'),
      'li#item_3[class]');
  },

  'testSelectorWithTagNameAndSpecificAttributeValue': function() {
    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    // http://www.w3.org/TR/CSS2/selector.html#matching-attrs
    // http://www.w3.org/TR/CSS21/syndata.html#strings
    var errored = false;
    try { $$('a[href=#]'); } catch(e) { errored = true; }

    this.assert(errored, 'Should error when non class, id, or name attributes selectors are not quoted.');
    this.assertEnumEqual($('link_1', 'link_2', 'link_3'), $$('a[href="#"]'));
  },

  'testSelectorWithTagNameAndWhitespaceTokenizedAttributeValue': function() {
    this.assertEnumEqual($('link_1', 'link_2'), $$('a[class~="internal"]'),
      "a[class~=\"internal\"]");
 
    this.assertEnumEqual($('link_1', 'link_2'), $$('a[class~=internal]'),
      "a[class~=internal]");
  },

  'testSelectorWithAttributeAndNoTagName': function() {
    this.assertEnumEqual($(document.body).query('a[href]'),
      $(document.body).query('[href]'));

    this.assertEnumEqual($$('a[class~="internal"]'),
      $$('[class~=internal]'));

    this.assertEnumEqual($$('*[id]'), $$('[id]'));

    this.assertEnumEqual($('checked_radio', 'unchecked_radio'),
      $$('[type=radio]'));

    this.assertEnumEqual($$('*[type=checkbox]'),
      $$('[type=checkbox]'));

    this.assertEnumEqual($('with_title', 'commaParent'),
      $$('[title]'));

    this.assertEnumEqual($$('#troubleForm *[type=radio]'),
      $$('#troubleForm [type=radio]'));

    this.assertEnumEqual($$('#troubleForm *[type]'),
      $$('#troubleForm [type]'));
  },

  'testSelectorWithAttributeContainingDash': function() {
    this.assertEnumEqual([$('attr_with_dash')], $$('[dashed-id]'));
    this.assertEnumEqual([$('attr_with_dash')], $$('[dashed-id="something"]'));
  },

  'testSelectorWithUniversalAndHyphenTokenizedAttributeValue': function() {
    this.assertEnumEqual([$('item_3')], $$('*[xml:lang|="en"]'));
    this.assertEnumEqual([$('item_3')], $$('*[xml:lang|="EN"]'));
  },

  'testSelectorWithTagNameAndNegatedAttributeValue': function() {
    this.assertEnumEqual([], $$('a:not([href="#"])'));
  },

  'testSelectorWithBracketAttributeValue': function() {
    // quoted
    this.assertEnumEqual($('chk_1', 'chk_2'),
      $$('#troubleForm2 input[name="brackets\\[5\\]\\[\\]"]'));

    // unquoted
    this.assertEnumEqual($('chk_1', 'chk_2'),
      $$('#troubleForm2 input[name=brackets\\[5\\]\\[\\]]'));

    this.assertEnumEqual([$('chk_1')],
      $$('#troubleForm2 input[name="brackets\\[5\\]\\[\\]"]:checked'));

    this.assertEnumEqual([$('chk_2')],
      $$('#troubleForm2 input[name="brackets\\[5\\]\\[\\]"][value="2"]'));
  },

  'test$$WithNestedAttributeSelectors': function() {
    this.assertEnumEqual([$('strong')],
      $$('div[style] p[id] strong'),
      'div[style] p[id] strong');
  },

  'testSelectorWithMultipleConditions': function() {
    this.assertEnumEqual([$('link_3')],
      $$('a[class~=external][href="#"]'),
     'a[class~=external][href="#"]');

    this.assertEnumEqual([],
      $$('a[class~=external]:not([href="#"])'),
     'a[class~=external]:not([href="#"])');
  },

  'testSelectorMatchElements': function() {
    this.assertElementsMatch(
      Selector.matchElements($('list').getDescendants(), 'li'),
      '#item_1', '#item_2', '#item_3');

    this.assertElementsMatch(
      Selector.matchElements($('fixtures').getDescendants(), 'a.internal'),
      '#link_1', '#link_2');

    this.assertEnumEqual([],
      Selector.matchElements($('fixtures').getDescendants(),
      'p.last'));

    this.assertElementsMatch(
      Selector.matchElements($('fixtures').getDescendants(), '.inexistant, a.internal'),
      '#link_1', '#link_2');
  },

  'testSelectorFindElement': function() {
    this.assertElementMatches(
       Selector.findElement($('list').getDescendants(), 'li'),
      'li#item_1.first');

    this.assertElementMatches(
      Selector.findElement($('list').getDescendants(), 'li', 1),
      'li#item_2');

    this.assertElementMatches(
      Selector.findElement($('list').getDescendants(), 'li#item_3'),
      'li');

    this.assertEqual(undef,
      Selector.findElement($('list').getDescendants(),
      'em'));
  },

  'testElementMatch': function() {
    var span = $('dupL1');

    // tests that should pass
    this.assert(span.match('span'));
    this.assert(span.match('span#dupL1'));

    this.assert(span.match('div > span'),
      'child combinator');

    this.assert(span.match('#dupContainer span'),
      'descendant combinator');

    this.assert(span.match('#dupL1'),
      'ID only');

    this.assert(span.match('span.span_foo'),
      'class name 1');

    this.assert(span.match('span.span_bar'), 
      'class name 2');

    this.assert(span.match('span:first-child'),
      'first-child pseudoclass');

    this.assert(!span.match('span.span_wtf'),
      'bogus class name');

    this.assert(!span.match('#dupL2'),
      'different ID');

    this.assert(!span.match('div'),
      'different tag name');

    this.assert(!span.match('span span'),
      'different ancestry');

    this.assert(!span.match('span > span'),
      'different parent');

    this.assert(!span.match('span:nth-child(5)'),
      'different pseudoclass');

    this.assert(!$('link_2').match('a[rel^=external]'));
    this.assert($('link_1').match('a[rel^=external]'));
    this.assert($('link_1').match('a[rel^="external"]'));
    this.assert($('link_1').match("a[rel^='external']"));

    this.assert( span.match({ 'match': fuse.Function.TRUE }),
      'custom selector');

    this.assert(!span.match({ 'match': fuse.Function.FALSE }),
      'custom selector');

    this.assert(span.match('div, span'),
      'comma-joined selector');

    this.assert(span.match('span, div'),
      'comma-joined selector');

    this.assert(!span.match('span span, div'),
      'comma-joined selector with one complex selector');

    this.assert(span.match('span span, div span'),
      'comma-joined selector with two complex selector');
  },

  'testQueryGet': function() {
    this.assertEqual($('list'), fuse.query('#list').get(0),
      'Passing index should return the correct decorated element.');

    this.assertEqual($('item_2'), fuse.query('#list li').get(-2),
      'Negative index should return the correct decorated element.');

    this.assertEqual($('item_1'), fuse.query('#list li').get(-99),
      'Negative index larger than array length should be treated as index 0.');

    this.assertEqual($('item_3'), fuse.query('#list li').get(99),
      'Index larger than array length should be treated as index with value of length.');

    this.assertEnumEqual($('item_1', 'item_2', 'item_3'), fuse.query('#list li').get(),
      'Passing no arguments should return all results decorated');
  },

  'testSelectorWithSpaceInAttributeValue': function() {
    this.assertEnumEqual([$('with_title')], $$('cite[title="hello world!"]'));
  },

  // AND NOW COME THOSE NEW TESTS AFTER ANDREW'S REWRITE!

  'testSelectorWithNamespacedAttributes': function() {
    this.assertElementsMatch($$('[xml:lang]'), '#item_3', 'div');
    this.assertElementsMatch($$('*[xml:lang]'), '#item_3', '#namespace_attr');
  },

  'testSelectorWithChild': function() {
    this.assertEnumEqual($('link_1',   'link_2'),   $$('p.first > a'));
    this.assertEnumEqual($('father',   'uncle'),    $$('div#grandfather > div'));
    this.assertEnumEqual($('level2_1', 'level2_2'), $$('#level1>span'));
    this.assertEnumEqual($('level2_1', 'level2_2'), $$('#level1 > span'));
    this.assertEnumEqual($('level3_1', 'level3_2'), $$('#level2_1 > *'));

    this.assertEnumEqual([], $$('div > #nonexistent'));

    $RunBenchmarks && this.wait(500, function() {
      this.benchmark(function() { $$('#level1 > span') }, 1000);
    });
  },

  'testSelectorWithAdjacence': function() {
    this.assertEnumEqual([$('uncle')], $$('div.brothers + div.brothers'));
    this.assertEnumEqual([$('uncle')], $$('div.brothers + div'));

    this.assertEnumEqual([], $$('#level3_2 + *'));
    this.assertEnumEqual([], $$('#level3_1 + em'));
    this.assertEnumEqual([], $$('#level2_2 + span'));

    this.assertEqual($('level2_2'), $$('#level2_1+span').get(0));
    this.assertEqual($('level2_2'), $$('#level2_1 + span').get(0));
    this.assertEqual($('level2_2'), $$('#level2_1 + *').get(0));

    this.assertEqual($('level3_2'), $$('#level3_1 + span').get(0));
    this.assertEqual($('level3_2'), $$('#level3_1 + *').get(0));

    $RunBenchmarks && this.wait(500, function() {
      this.benchmark(function() { $$('#level3_1 + span') }, 1000);
    });
  },

  'testSelectorWithLaterSibling': function() {
    this.assertEqual($('level2_2'), $$('#level2_1 ~ span').get(0));

    this.assertEnumEqual([$('list')], $$('h1 ~ ul'));
    this.assertEnumEqual($('level2_2', 'level2_3'), $$('#level2_1 ~ *'));

    this.assertEnumEqual([], $$('#level2_2 ~ span'));
    this.assertEnumEqual([], $$('#level3_2 ~ *'));
    this.assertEnumEqual([], $$('#level3_1 ~ em'));

    this.assertEnumEqual([$('level3_2')], $$('#level3_1 ~ #level3_2'));
    this.assertEnumEqual([$('level3_2')], $$('span ~ #level3_2'));

    this.assertEnumEqual([], $$('div ~ #level3_2'));
    this.assertEnumEqual([], $$('div ~ #level2_3'));

    $RunBenchmarks && this.wait(500, function() {
      this.benchmark(function() { $$('#level2_1 ~ span') }, 1000);
    });
  },

  'testSelectorWithNewAttributeOperators': function() {
    this.assertEnumEqual($('father', 'uncle'),
      $$('div[class^=bro]'),
      'matching beginning of string');

    this.assertEnumEqual($('father', 'uncle'),
      $$('div[class$=men]'),
      'matching end of string');

    this.assertEnumEqual($('father', 'uncle'),
      $$('div[class*="ers m"]'),
      'matching substring');

    this.assertEnumEqual($('level2_1', 'level2_2', 'level2_3'),
      $$('#level1 *[id^="level2_"]'));

    this.assertEnumEqual($('level2_1', 'level2_2', 'level2_3'),
      $$('#level1 *[id^=level2_]'));

    this.assertEnumEqual($('level2_1', 'level3_1'),
      $$('#level1 *[id$="_1"]'));

    this.assertEnumEqual($('level2_1', 'level3_1'),
      $$('#level1 *[id$=_1]'));

    this.assertEnumEqual($('level2_1', 'level3_2', 'level2_2', 'level2_3'),
      $$('#level1 *[id*="2"]'));

    this.assertEnumEqual($('level2_1', 'level3_2', 'level2_2', 'level2_3'),
      $$('#level1 *[id*="2"]'));

    $RunBenchmarks && this.wait(500, function() {
      this.benchmark(function() { $$('#level1 *[id^=level2_]') }, 1000, '[^=]');
      this.benchmark(function() { $$('#level1 *[id$=_1]') },      1000, '[$=]');
      this.benchmark(function() { $$('#level1 *[id*=_2]') },      1000, '[*=]');
    });
  },

  'testSelectorWithDuplicates': function() {
    this.assertEnumEqual($$('div div'), $$('div div').unique());
    this.assertEnumEqual($('dupL2', 'dupL3', 'dupL4', 'dupL5'),
      $$('#dupContainer span span'));

    $RunBenchmarks && this.wait(500, function() {
      this.benchmark(function() { $$('#dupContainer span span') }, 1000);
    });
  },

  'testSelectorWithFirstLastOnlyNthNthLastChild': function() {
    this.assertEnumEqual([$('level2_1')],
      $$('#level1>*:first-child'));

    this.assertEnumEqual($('level2_1', 'level3_1', 'level_only_child'),
      $$('#level1 *:first-child'));

    this.assertEnumEqual([$('level2_3')],
      $$('#level1>*:last-child'));

    this.assertEnumEqual($('level3_2', 'level_only_child', 'level2_3'),
      $$('#level1 *:last-child'));

    this.assertEnumEqual([$('level2_3')],
      $$('#level1>div:last-child'));

    this.assertEnumEqual([$('level2_3')],
      $$('#level1 div:last-child'));

    this.assertEnumEqual([],
      $$('#level1>div:first-child'));

    this.assertEnumEqual([],
      $$('#level1>span:last-child'));

    this.assertEnumEqual($('level2_1', 'level3_1'),
      $$('#level1 span:first-child'));

    this.assertEnumEqual([],
      $$('#level1:first-child'));

    this.assertEnumEqual([],
      $$('#level1>*:only-child'));

    this.assertEnumEqual([$('level_only_child')],
      $$('#level1 *:only-child'));

    this.assertEnumEqual([],
      $$('#level1:only-child'));

    this.assertEnumEqual([$('link_2')],
      $$('#p *:nth-last-child(2)'),
      'nth-last-child');

    this.assertEnumEqual([$('link_2')],
      $$('#p *:nth-child(3)'),
      'nth-child');

    this.assertEnumEqual([$('link_2')],
      $$('#p a:nth-child(3)'),
      'nth-child');

    this.assertEnumEqual($('item_2', 'item_3'),
      $$('#list > li:nth-child(n+2)'));

    this.assertEnumEqual($('item_1', 'item_2'),
      $$('#list > li:nth-child(-n+2)'));

    $RunBenchmarks && this.wait(500, function() {
      this.benchmark(function() { $$('#level1 *:first-child') }, 1000, ':first-child');
      this.benchmark(function() { $$('#level1 *:last-child') },  1000, ':last-child');
      this.benchmark(function() { $$('#level1 *:only-child') },  1000, ':only-child');
    });
  },

  'testSelectorWithFirstLastNthNthLastOfType': function() {
    this.assertEnumEqual([$('link_2')],
      $$('#p a:nth-of-type(2)'),
      'nth-of-type');

    this.assertEnumEqual([$('link_1')],
      $$('#p a:nth-of-type(1)'),
      'nth-of-type');

    this.assertEnumEqual([$('link_2')],
      $$('#p a:nth-last-of-type(1)'),
      'nth-last-of-type');

    this.assertEnumEqual([$('link_1')],
      $$('#p a:first-of-type'),
      'first-of-type');

    this.assertEnumEqual([$('link_2')],
      $$('#p a:last-of-type'),
      'last-of-type');
  },

  'testSelectorWithNot': function() {
    this.assertEnumEqual([$('link_2')],
      $$('#p a:not(a:first-of-type)'),
      'first-of-type');

    this.assertEnumEqual([$('link_1')],
      $$('#p a:not(a:last-of-type)'),
      'last-of-type');

    this.assertEnumEqual([$('link_2')],
      $$('#p a:not(a:nth-of-type(1))'),
      'nth-of-type');

    this.assertEnumEqual([$('link_1')],
      $$('#p a:not(a:nth-last-of-type(1))'),
      'nth-last-of-type');

    this.assertEnumEqual([$('link_2')],
      $$('#p a:not([rel~=nofollow])'),
      'attribute 1');

    this.assertEnumEqual([$('link_2')],
      $$('#p a:not(a[rel^=external])'),
      'attribute 2');

    this.assertEnumEqual([$('link_2')],
      $$('#p a:not(a[rel$=nofollow])'),
      'attribute 3');

    this.assertEnumEqual([$('em')],
      $$('#p a:not(a[rel$="nofollow"]) > em'),
      'attribute 4');

    this.assertEnumEqual([$('item_2')],
      $$('#list li:not(#item_1):not(#item_3)'),
      'adjacent :not clauses');

    this.assertEnumEqual([$('son')],
      $$('#grandfather > div:not(#uncle) #son'));

    this.assertEnumEqual([$('em')],
      $$('#p a:not(a[rel$="nofollow"]) em'),
      'attribute 4 + all descendants');

    this.assertEnumEqual([$('em')],
      $$('#p a:not(a[rel$="nofollow"])>em'),
      'attribute 4 (without whitespace)');
  },

  'testSelectorWithEnabledDisabledChecked': function() {
    this.assertEnumEqual([$('disabled_text_field')],
      $$('#troubleForm > *:disabled'));
 
    this.assertEnumEqual($('troubleForm').getInputs().without($('disabled_text_field'), $('hidden')),
      $$('#troubleForm > *:enabled'));

    this.assertEnumEqual($('checked_box', 'checked_radio'),
      $$('#troubleForm *:checked'));
  },

  'testSelectorWithEmpty': function() {
    $('level3_1').raw.innerHTML = '';
 
    this.assertEnumEqual($('level3_1', 'level3_2', 'level2_3'),
     $$('#level1 *:empty'),
     '#level1 *:empty');
 
    this.assertEnumEqual([],
      $$('#level_only_child:empty'),
      'newlines count as content!');
  },

  'testIdenticalResultsFromEquivalentSelectors': function() {
    this.assertEnumEqual($$('div.brothers'),
      $$('div[class~=brothers]'));

    this.assertEnumEqual($$('div.brothers'),
      $$('div[class~=brothers].brothers'));

    this.assertEnumEqual($$('div:not(.brothers)'),
      $$('div:not([class~=brothers])'));

    this.assertEnumEqual($$('li ~ li'),
      $$('li:not(:first-child)'));

    this.assertEnumEqual($$('ul > li'),
      $$('ul > li:nth-child(n)'));

    this.assertEnumEqual($$('ul > li:nth-child(even)'),
      $$('ul > li:nth-child(2n)'));

    this.assertEnumEqual($$('ul > li:nth-child(odd)'),
      $$('ul > li:nth-child(2n+1)'));

    this.assertEnumEqual($$('ul > li:first-child'),
      $$('ul > li:nth-child(1)'));

    this.assertEnumEqual($$('ul > li:last-child'),
      $$('ul > li:nth-last-child(1)'));

    this.assertEnumEqual($$('ul > li:nth-child(n-999)'),
      $$('ul > li'));

    this.assertEnumEqual($$('ul>li'), $$('ul > li'));

    this.assertEnumEqual($$('#p a:not(a[rel$="nofollow"])>em'),
      $$('#p a:not(a[rel$="nofollow"]) > em'))
  },

  'testSelectorsThatShouldReturnNothing': function() {
    this.assertEnumEqual([], $$('span:empty > *'));
    this.assertEnumEqual([], $$('div.brothers:not(.brothers)'));
    this.assertEnumEqual([], $$('#level2_2 :only-child:not(:last-child)'));
    this.assertEnumEqual([], $$('#level2_2 :only-child:not(:first-child)'));
  },

  'testCommasFor$$': function() {
    // using NWMatcher the next two asserts would return document ordered lists of matching elements
    this.assertEnumEqual($('p', 'link_1', 'list', 'item_1', 'item_3', 'troubleForm'),
      $$('#list, .first,*[xml:lang="en-us"] , #troubleForm'));

    this.assertEnumEqual($('p', 'link_1', 'list', 'item_1', 'item_3', 'troubleForm'),
      $$('#list, .first,', '*[xml:lang="en-us"] , #troubleForm'));

    this.assertEnumEqual($('commaParent', 'commaChild'),
      $$('form[title*="commas,"], input[value="#commaOne,#commaTwo"]'));

    this.assertEnumEqual($('commaParent', 'commaChild'),
      $$('form[title*="commas,"]', 'input[value="#commaOne,#commaTwo"]'));
  },

  'testSelectorExtendsAllNodes': function(){
    var element = document.createElement('div');

    fuse.Number(3).times(function() {
      element.appendChild(document.createElement('div'));
    });

    element.setAttribute('id', 'scratch_element');
    $$('body')[0].appendChild(element);

    var results = $$('#scratch_element div');
    this.assert(typeof results[0].show == 'function');
    this.assert(typeof results[1].show == 'function');
    this.assert(typeof results[2].show == 'function');
  },

  /*
  'testCountedIsNotAnAttribute': function() {
    var el = $('list');
    Selector.handlers.mark([el]);
    this.assert(!el.innerHTML.contains("_counted"));
    Selector.handlers.unmark([el]);
    this.assert(!el.innerHTML.contains("_counted"));
  },
  */

  'testCopiedNodesGetIncluded': function() {
    this.assertElementsMatch(
      Selector.matchElements($('counted_container').getDescendants(), 'div'),
      'div.is_counted'
    );

    $('counted_container').raw.innerHTML +=
      $('counted_container').raw.innerHTML;

    this.assertElementsMatch(
      Selector.matchElements($('counted_container').getDescendants(), 'div'),
      'div.is_counted',
      'div.is_counted'
    );
  },

  'testElementDown': function() {
    var a = $('dupL4');
    var b = $('dupContainer').down('#dupL4');

    this.assertEqual(a, b);
  },

  'testSelectorNotInsertedNodes': function() {
    var wrapper = fuse('<div>');
    wrapper.update('<table><tr><td id="myTD"></td></tr></table>');

    this.assertNotNullOrUndefined(
      new Selector('[id=myTD]').findElements(wrapper)[0]);

    this.assertNotNullOrUndefined(wrapper.query('[id=myTD]')[0],
      '[id=myTD]');

    this.assertNotNullOrUndefined(wrapper.query('td')[0],
      'td');

    this.assertNotNullOrUndefined(wrapper.query('#myTD')[0],
      '#myTD');

    this.assertNotNullOrUndefined(wrapper.down().query('[id=myTD]')[0],
      '[id=myTD] on wrapper child');

    var clone = $('list').raw.cloneNode(true);
    this.assert($$('#item_1', clone)[0] == fuse.dom.Element.down(clone));
  },

  'testSelectorSplit': function() {
    this.assertEnumEqual(['.group', 'div[class~="expand"]', 'a'],
      Selector.split('.group, div[class~="expand"], a'));

    // currently there is no support for namespace selectors
    // http://www.w3.org/TR/css3-selectors/#univnmsp
    // but it should NOT freeze Firefox
    this.assertEnumEqual(['h2'], Selector.split('.foo li:not(.selected) *|h2'));
  }
});