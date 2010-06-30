new Test.Unit.Runner({

  'testTimerStop': function() {
    function timerEventFired(timer) {
      // timerEventFired will stop the Timer after 3 callbacks
      if (++timerEventCount > 2) timer.stop();
    }

    var timerEventCount = 0,
     timer = fuse.Timer(timerEventFired, 50).start();

    this.wait(600, function() {
      this.assertEqual(3, timerEventCount);
    });
  },

  'testTimerException': function() {
    function timerEventFired(timer) {
      timer.stop();
      throw new Error;
    }

    var timer = fuse.Timer(timerEventFired, 50);

    // we don't want to stop timer's callback from throwing errors
    timer.onTimerEvent = fuse.Function.wrap(timer.onTimerEvent,
      fuse.Function.bind(function(proceed) { this.assertRaise('Error', proceed) }, this));

    timer.start();

    this.wait(100, function() {
      this.assertEqual(false, timer.executing);
    });
  },

  'testTimerDefaultOptions': function() {
    function timerEventFired(timer) {
      timerEventCount++;
      timer.stop();
    }

    var timerEventCount = 0,
     backup = fuse.Object.clone(fuse.Timer.defaults);

    fuse.Object.extend(fuse.Timer.defaults,  { 'multiplier': 1000 });

    var timer = fuse.Timer(timerEventFired, 2).start();

    this.wait(50, function() {
      this.assertEqual(0, timerEventCount);

      this.wait(2000, function() {
        this.assertEqual(1, timerEventCount);
      })
    });

    // restore
    fuse.Timer.defaults = backup;
  }
});