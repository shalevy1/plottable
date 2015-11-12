///<reference path="../testReference.ts" />

describe("DoubleClick Interaction", () => {
  let clickedPoint: Plottable.Point;
  let svg: d3.Selection<void>;
  let doubleClickInteraction: Plottable.Interactions.DoubleClick;
  let component: Plottable.Component;

  beforeEach(() => {
    const svgWidth = 400;
    const svgHeight = 400;
    svg = TestMethods.generateSVG(svgWidth, svgHeight);
    component = new Plottable.Component();
    component.renderTo(svg);

    doubleClickInteraction = new Plottable.Interactions.DoubleClick();
    doubleClickInteraction.attachTo(component);

    clickedPoint = {x: svgWidth / 2, y: svgHeight / 2};
  });

  afterEach(function() {
    if (this.currentTest.state === "passed") {
      svg.remove();
    }
  });

  type ClickTestCallback = {
    (p?: Plottable.Point): void;
    lastPoint: Plottable.Point;
    called: boolean;
    reset: () => void;
  };

  function makeClickCallback() {
    let callback: ClickTestCallback;
    callback = <any> function(p?: Plottable.Point) {
      callback.lastPoint = p;
      callback.called = true;
    }
    callback.called = false;
    callback.reset = () => {
      callback.lastPoint = null;
      callback.called = false;
    }
    return callback;
  }

  function doubleClickPoint(mode: TestMethods.InteractionMode = TestMethods.InteractionMode.Mouse) {
    doubleClickPointWithMove(clickedPoint, clickedPoint, mode);
  }

  function doubleClickPointWithMove(firstClickPoint: Plottable.Point,
                                    secondClickPoint: Plottable.Point,
                                    mode: TestMethods.InteractionMode) {
    TestMethods.triggerFakeInteractionEvent(mode,
                                            TestMethods.InteractionType.Start,
                                            component.content(),
                                            firstClickPoint.x,
                                            firstClickPoint.y);
    TestMethods.triggerFakeInteractionEvent(mode,
                                            TestMethods.InteractionType.End,
                                            component.content(),
                                            firstClickPoint.x,
                                            firstClickPoint.y);
    TestMethods.triggerFakeInteractionEvent(mode,
                                            TestMethods.InteractionType.Start,
                                            component.content(),
                                            secondClickPoint.x,
                                            secondClickPoint.y);
    TestMethods.triggerFakeInteractionEvent(mode,
                                            TestMethods.InteractionType.End,
                                            component.content(),
                                            secondClickPoint.x,
                                            secondClickPoint.y);
    TestMethods.triggerFakeMouseEvent("dblclick", component.content(), secondClickPoint.x, secondClickPoint.y);
  }

  describe("onDoubleClick/offDoubleClick", () => {
    describe("registration", () => {
      it("registers callback using onDoubleClick", () => {
        const callback = makeClickCallback();

        doubleClickInteraction.onDoubleClick(callback);
        doubleClickPoint();

        assert.isTrue(callback.called, "Interaction should trigger the callback");
      });

      it("unregisters callback using offDoubleClick", () => {
        const callback = makeClickCallback();

        doubleClickInteraction.onDoubleClick(callback);
        doubleClickInteraction.offDoubleClick(callback);
        doubleClickPoint();

        assert.isFalse(callback.called, "Callback should be disconnected from the interaction");
      });

      it("can register multiple onDoubleClick callbacks", () => {
        const callback1 = makeClickCallback();
        const callback2 = makeClickCallback();

        doubleClickInteraction.onDoubleClick(callback1);
        doubleClickInteraction.onDoubleClick(callback2);
        doubleClickPoint();

        assert.isTrue(callback1.called, "Interaction should trigger the first callback");
        assert.isTrue(callback2.called, "Interaction should trigger the second callback");
      });

      it("can register multiple onDoubleClick callbacks and unregister one", () => {
        const callback1 = makeClickCallback();
        const callback2 = makeClickCallback();

        doubleClickInteraction.onDoubleClick(callback1);
        doubleClickInteraction.onDoubleClick(callback2);
        doubleClickInteraction.offDoubleClick(callback1);
        doubleClickPoint();

        assert.isFalse(callback1.called, "Callback1 should be disconnected from the click interaction");
        assert.isTrue(callback2.called, "Callback2 should still exist on the click interaction");
      });

      it("onDoubleClick returns this", () => {
        const value = doubleClickInteraction.onDoubleClick();
        assert.strictEqual(value, doubleClickInteraction);
      });

      it("offDoubleClick returns this", () => {
        const value = doubleClickInteraction.offDoubleClick();
        assert.strictEqual(value, doubleClickInteraction);
      });
    });

    describe("callbacks", () => {
      let callback: ClickTestCallback;

      beforeEach(() => {
        callback = makeClickCallback();
        doubleClickInteraction.onDoubleClick(callback);
      });

      [TestMethods.InteractionMode.Mouse, TestMethods.InteractionMode.Touch].forEach((mode: TestMethods.InteractionMode) => {
        it("calls callback and passes correct click position for " + TestMethods.InteractionMode[mode], () => {
          doubleClickPoint(mode);

          assert.deepEqual(callback.lastPoint, clickedPoint, "was passed correct point");
        });

        it("does not call callback if clicked in different locations for " + TestMethods.InteractionMode[mode], () => {
          doubleClickPointWithMove(clickedPoint, {x: clickedPoint.x + 10, y: clickedPoint.y + 10}, mode);

          assert.isFalse(callback.called, "callback was not called");
        });
      });

      it("does not trigger callback when touch event is cancelled", () => {
        let doubleClickedPoint: Plottable.Point = null;
        let dblClickCallback = (point: Plottable.Point) => doubleClickedPoint = point;
        doubleClickInteraction.onDoubleClick(dblClickCallback);

        TestMethods.triggerFakeTouchEvent("touchstart", component.content(), [{x: clickedPoint.x, y: clickedPoint.y}]);
        TestMethods.triggerFakeTouchEvent("touchend", component.content(), [{x: clickedPoint.x, y: clickedPoint.y}]);
        TestMethods.triggerFakeTouchEvent("touchstart", component.content(), [{x: clickedPoint.x, y: clickedPoint.y}]);
        TestMethods.triggerFakeTouchEvent("touchend", component.content(), [{x: clickedPoint.x, y: clickedPoint.y}]);
        TestMethods.triggerFakeTouchEvent("touchcancel", component.content(), [{x: clickedPoint.x, y: clickedPoint.y}]);
        TestMethods.triggerFakeMouseEvent("dblclick", component.content(), clickedPoint.x, clickedPoint.y);
        assert.deepEqual(doubleClickedPoint, null, "point never set");
      });
    });
  });
});
