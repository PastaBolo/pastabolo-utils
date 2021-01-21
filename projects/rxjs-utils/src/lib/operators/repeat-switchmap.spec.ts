import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, of, Subject, timer } from 'rxjs';
import { delay } from 'rxjs/operators';
import { createObservableWithValues } from 'jasmine-auto-spies';
import { SubscriberSpy, subscribeSpyTo } from '@hirez_io/observer-spy';

import { repeatSwitchMap } from './repeat-switchmap';

describe('repeatSwitchMap', () => {
  let repeat$: Subject<void>;
  let source$: Observable<any>;
  let observerSpy: SubscriberSpy<any>;

  beforeEach(() => { repeat$ = new Subject(); });

  describe(`GIVEN source is a cold observable that emits and completes immediately 
            WHEN subscribing AND triggering repeat subject twice
            THEN receive value 3 times from the source`, () => {
    Given(() => {
      source$ = of(1);
    });

    When(fakeAsync(() => {
      observerSpy = subscribeSpyTo(
        source$.pipe(repeatSwitchMap(() => repeat$))
      );
      tick();
      repeat$.next();
      tick();
      repeat$.next();
    }));

    Then(() => {
      expect(observerSpy.getValuesLength()).toEqual(3);
    });
  });

  describe(`GIVEN source emits with delay 
            WHEN subscribing AND triggering repeat subject twice with enough delay
            THEN receive value 3 times from the source`, () => {
    Given(() => {
      source$ = createObservableWithValues([{ value: 1, delay: 100 }]);
    });

    When(fakeAsync(() => {
      observerSpy = subscribeSpyTo(
        source$.pipe(repeatSwitchMap(() => repeat$))
      );
      tick(100);
      repeat$.next();
      tick(100);
      repeat$.next();
      tick(100);
    }));

    Then(() => {
      expect(observerSpy.getValuesLength()).toEqual(3);
    });
  });

  describe(`GIVEN source emits with delay 
            WHEN subscribing AND triggering repeat subject twice without enough delay
            THEN receive value 2 times from the source because of switching`, () => {
    Given(() => {
      source$ = createObservableWithValues([{ value: 1, delay: 100 }]);
    });

    When(fakeAsync(() => {
      observerSpy = subscribeSpyTo(
        source$.pipe(repeatSwitchMap(() => repeat$))
      );
      tick(100);
    }));

    Then(fakeAsync(() => {
      expect(observerSpy.getValuesLength()).toEqual(1);
      repeat$.next();
      tick(50);
      repeat$.next(); // not enough delay : triggers switching
      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(1);
      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(2);
    }));
  });

  describe(`GIVEN source emits with delay 
            WHEN subscribing AND triggering repeat subject multiple times with or without enough delay
            THEN receive values from the source at the right time`, () => {
    Given(() => {
      source$ = createObservableWithValues([{ value: 1, delay: 100 }]);
    });

    Then(fakeAsync(() => {
      observerSpy = subscribeSpyTo(
        source$.pipe(repeatSwitchMap(() => repeat$))
      );

      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(0);
      repeat$.next(); // not enough delay : triggers switching
      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(0);
      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(1);
      repeat$.next();
      tick(100);
      expect(observerSpy.getValuesLength()).toEqual(2);
      repeat$.next();
      tick(50);
      repeat$.next(); // not enough delay : triggers switching
      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(2);
      repeat$.next(); // not enough delay : triggers switching
      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(2);
      tick(50);
      expect(observerSpy.getValuesLength()).toEqual(3);
    }));
  });

  describe(`GIVEN source emits with delay 
            WHEN subscribing AND listening to source emissions before repeating with another delay
            THEN receive values from the source at the right time`, () => {
    Given(() => {
      source$ = createObservableWithValues([
        { value: 1, delay: 100 },
        { complete: true }
      ]);
    });

    Then(fakeAsync(() => {
      observerSpy = subscribeSpyTo(
        source$.pipe(repeatSwitchMap(source => source.pipe(delay(200))))
      );

      tick(100);
      expect(observerSpy.getValuesLength()).toEqual(1);
      tick(200);
      expect(observerSpy.getValuesLength()).toEqual(1);
      tick(100);
      expect(observerSpy.getValuesLength()).toEqual(2);
      tick(300);
      expect(observerSpy.getValuesLength()).toEqual(3);

      observerSpy.unsubscribe();
    }));
  });

  describe(`GIVEN the source emits multiple values over time
            WHEN subscribing to source AND triggering repeat after the first value is emitted
            THEN repeatSwitchMap resubscribes to source and completes the previous subscription`, () => {
    Given(() => {
      source$ = createObservableWithValues([
        { value: 1, delay: 100 },
        { value: 2, delay: 100 }
      ]);
    });

    Then(fakeAsync(() => {
      observerSpy = subscribeSpyTo(
        source$.pipe(repeatSwitchMap(() => repeat$))
      );
      expect(observerSpy.getValues()).toEqual([]);
      tick(100);
      expect(observerSpy.getValues()).toEqual([1]);
      repeat$.next();
      tick(200);
      expect(observerSpy.getValues()).toEqual([1, 1, 2]);
    }));
  });

  describe('completion strategy', () => {

    describe('GIVEN the notifier is an observable that completes', () => {
      let repeatOnNotifierComplete: boolean | undefined;

      When(fakeAsync(() => {
        observerSpy = subscribeSpyTo(
          source$.pipe(repeatSwitchMap(() => timer(200), { repeatOnNotifierComplete }))
        );
        tick(800);
        observerSpy.unsubscribe();
      }));

      describe('GIVEN repeatOnNotifierComplete is not set (true by default)', () => {

        describe(`GIVEN the source never completes 
                  WHEN subscribing to source 
                  THEN repeatSwitchMap repeats AND never completes`, () => {
          Given(() => {
            source$ = createObservableWithValues([{ value: 1 }]);
          });

          Then(() => {
            expect(observerSpy.getValuesLength()).toEqual(5);
            expect(observerSpy.receivedComplete()).toBeFalse();
          });
        });

        describe(`GIVEN the source completes
                  WHEN subscribing to source 
                  THEN repeatSwitchMap repeats AND never completes`, () => {
          Given(() => {
            source$ = createObservableWithValues([
              { value: 1 },
              { complete: true }
            ]);
          });

          Then(() => {
            expect(observerSpy.getValuesLength()).toEqual(5);
            expect(observerSpy.receivedComplete()).toBeFalse();
          });
        });
      });

      describe('GIVEN repeatOnNotifierComplete is set to false', () => {
        Given(() => {
          repeatOnNotifierComplete = false;
        });

        afterEach(() => { repeatOnNotifierComplete = undefined })

        describe(`GIVEN the source does not complete
                  WHEN subscribing to source 
                  THEN repeatSwitchMap repeats until the notifier completes AND never completes`, () => {
          Given(() => {
            source$ = createObservableWithValues([{ value: 1 }]);
          });

          Then(() => {
            expect(observerSpy.getValuesLength()).toEqual(2);
            expect(observerSpy.receivedComplete()).toBeFalse();
          });
        });

        describe(`GIVEN the source completes
                  WHEN subscribing to source 
                  THEN repeatSwitchMap repeats until the notifier completes AND completes`, () => {
          Given(() => {
            source$ = createObservableWithValues([
              { value: 1 },
              { complete: true }
            ]);
          });

          Then(() => {
            expect(observerSpy.getValuesLength()).toEqual(2);
            expect(observerSpy.receivedComplete()).toBeTrue();
          });
        });
      });
    });
  });

  describe('error strategy', () => {
    When(fakeAsync(() => {
      observerSpy = subscribeSpyTo(
        source$.pipe(repeatSwitchMap(() => repeat$)),
        { expectErrors: true }
      );
    }));

    describe('GIVEN the source emits an error THEN the subscriber gets the error', () => {
      const fakeError = 'FAKE ERROR FROM SOURCE';

      Given(() => {
        source$ = createObservableWithValues([{ errorValue: fakeError }]);
      });

      Then(() => {
        expect(observerSpy.getError()).toEqual(fakeError);
      });
    });

    describe('GIVEN the notifier emits an error THEN the subscriber gets the error', () => {
      const fakeError = 'FAKE ERROR FROM NOTIFIER';

      Given(() => {
        source$ = createObservableWithValues([{ value: 1 }]);
      });

      When(() => {
        repeat$.error(fakeError);
      });

      Then(() => {
        expect(observerSpy.getError()).toEqual(fakeError);
      });
    });
  });
});