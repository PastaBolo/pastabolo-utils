import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { createObservableWithValues } from 'jasmine-auto-spies';
import { SubscriberSpy, subscribeSpyTo } from '@hirez_io/observer-spy';

import { cache } from './cache';

describe('cache operator', () => {
  let fakeSource$: Observable<any>;
  let fakeSourceWithCache$: Observable<any>;
  let observerSpy1: SubscriberSpy<any>;
  let observerSpy2: SubscriberSpy<any>;
  const expirationTime = 200;

  const createFakeSourceWithCache = (config: Parameters<typeof cache>[0]) => fakeSource$.pipe(cache(config));

  describe('GIVEN the source emits one value and complete immediately', () => {
    Given(() => {
      fakeSource$ = createObservableWithValues([
        { value: 1 },
        { complete: true }
      ]);
    });

    describe('GIVEN there is only one subscriber', () => {

      describe('GIVEN automaticRefresh is not set (false by default)', () => {

        describe(`GIVEN there is no refresher 
                  THEN there is only one subscription to the source`, () => {
          Given(() => {
            fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime });
          });

          When(fakeAsync(() => {
            observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
            tick(5 * expirationTime);
          }));

          Then(() => {
            expect(observerSpy1.getValuesLength()).toEqual(1);
          });
        });

        describe(`GIVEN there is a refresher 
                  WHEN the refresher emits twice
                  THEN subscription to source is made 3 times`, () => {
          let refresher = new Subject();

          Given(() => {
            fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime, refresher });
          });

          When(fakeAsync(() => {
            observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
            tick();
            refresher.next();
            tick();
            refresher.next();
            tick(5 * expirationTime);
          }));

          Then(() => {
            expect(observerSpy1.getValuesLength()).toEqual(3);
          });
        });
      });

      describe('GIVEN automaticRefresh is set to true', () => {

        describe(`GIVEN there is no refresher 
                  THEN subscription to the source is repeated when cache expires`, () => {
          Given(() => {
            fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime, automaticRefresh: true });
          });

          When(fakeAsync(() => {
            observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
            tick(5 * expirationTime);
            observerSpy1.unsubscribe();
          }));

          Then(() => {
            expect(observerSpy1.getValuesLength()).toEqual(6);
          });
        });

        describe(`GIVEN there is a refresher
                  WHEN the refresher emits twice AND we wait once for automaticRefresh
                  THEN subscription to source is made 4 times`, () => {
          let refresher = new Subject();

          Given(() => {
            fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime, automaticRefresh: true, refresher });
          });

          When(fakeAsync(() => {
            observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
            tick(expirationTime / 2); // Refresh before cache expires and reset automaticRefresh
            refresher.next();
            tick(expirationTime); // Waiting for cache automatic refresh
            tick(expirationTime / 2); // Waiting the first remaining expirationTime to make sure automaticRefresh has been reset 
            refresher.next();
            tick();
            observerSpy1.unsubscribe();
          }));

          Then(() => {
            expect(observerSpy1.getValuesLength()).toEqual(4);
          });
        });
      });
    });

    describe('GIVEN there are two subscribers', () => {

      describe('GIVEN automaticRefresh is not set (false by default)', () => {
        Given(() => {
          fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime });
        });

        describe(`WHEN the second observer subscribes before the cache expires
                  THEN there is not a new subscription to the source when this observer subscribes
                  AND the two observers get the same value once from the cache`, () => {
          When(fakeAsync(() => {
            observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
            tick(expirationTime / 2);
            observerSpy2 = subscribeSpyTo(fakeSourceWithCache$);
            tick(5 * expirationTime);
          }));

          Then(() => {
            expect(observerSpy1.getValuesLength()).toEqual(1);
            expect(observerSpy2.getValuesLength()).toEqual(1);
          });
        });

        describe(`WHEN the second observer subscribes after the cache expires
                  THEN a new subscription is made to the source when this observer subscribes 
                  AND the first observer gest two values and the second observer gets one value`, () => {
          When(fakeAsync(() => {
            observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
            tick(expirationTime);
            observerSpy2 = subscribeSpyTo(fakeSourceWithCache$);
            tick(5 * expirationTime);
          }));

          Then(() => {
            expect(observerSpy1.getValuesLength()).toEqual(2);
            expect(observerSpy2.getValuesLength()).toEqual(1);
          });
        });
      });

      describe('GIVEN automaticRefresh is set to true', () => {
        Given(() => {
          fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime, automaticRefresh: true });
        });

        describe(`WHEN the second observer subscribes
                  THEN there is not a new subscription to the source when this observer subscribes
                  AND the two observers get the same value from the cache
                  AND they get another value when the cache is automatically refreshed`, () => {
          Then(fakeAsync(() => {
            observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
            tick();
            expect(observerSpy1.getValuesLength()).toEqual(1);
            tick(expirationTime); // Refreshed automatically
            expect(observerSpy1.getValuesLength()).toEqual(2);
            tick(expirationTime / 2); // Not refreshed a second time yet
            observerSpy2 = subscribeSpyTo(fakeSourceWithCache$);
            expect(observerSpy1.getValuesLength()).toEqual(2);
            expect(observerSpy2.getValuesLength()).toEqual(1); // get the value from the cache
            tick(expirationTime / 2); // Refreshed automatically
            expect(observerSpy1.getValuesLength()).toEqual(3);
            expect(observerSpy2.getValuesLength()).toEqual(2);
            observerSpy1.unsubscribe();
            observerSpy2.unsubscribe();
          }));
        });
      });
    });
  });

  describe('GIVEN the source emits multiple value over time', () => {
    Given(() => {
      fakeSource$ = createObservableWithValues([
        { value: 1 },
        { value: 2, delay: expirationTime / 2 },
        { complete: true }
      ]);
    });

    describe(`GIVEN bufferSize is not set (default is 1)
              WHEN the second observer subscribes after the source emitted two values
              THEN this observer will only get the last emitted value`, () => {
      Given(() => {
        fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime });
      });

      When(fakeAsync(() => {
        observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
        tick(expirationTime / 2);
        observerSpy2 = subscribeSpyTo(fakeSourceWithCache$);
        observerSpy1.unsubscribe();
        observerSpy2.unsubscribe();
      }));

      Then(() => {
        expect(observerSpy1.getValues()).toEqual([1, 2]);
        expect(observerSpy2.getValues()).toEqual([2]);
      });
    });

    describe(`GIVEN bufferSize is set to 2
              WHEN the second observer subscribes during the windowTime of the two last emitted values
              THEN this observer will only get the two last emitted value`, () => {
      Given(() => {
        fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime, bufferSize: 2 });
      });

      When(fakeAsync(() => {
        observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
        tick(expirationTime / 2);
        observerSpy2 = subscribeSpyTo(fakeSourceWithCache$);
        observerSpy1.unsubscribe();
        observerSpy2.unsubscribe();
      }));

      Then(() => {
        expect(observerSpy1.getValues()).toEqual([1, 2]);
        expect(observerSpy2.getValues()).toEqual([1, 2]);
      });
    });

    describe(`GIVEN bufferSize is set to 2
              WHEN the second observer subscribes during the windowTime of the last emitted value only
              THEN this observer will only get the last emitted value`, () => {
      Given(() => {
        fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime, bufferSize: 2 });
      });

      When(fakeAsync(() => {
        observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
        tick(expirationTime);
        observerSpy2 = subscribeSpyTo(fakeSourceWithCache$);
        observerSpy1.unsubscribe();
        observerSpy2.unsubscribe();
      }));

      Then(() => {
        expect(observerSpy1.getValues()).toEqual([1, 2]);
        expect(observerSpy2.getValues()).toEqual([2]);
      });
    });
  });

  describe('completion strategy', () => {

    describe('GIVEN the source completes THEN the subscriber never completes', () => {
      Given(() => {
        fakeSource$ = createObservableWithValues([
          { value: 1 },
          { complete: true }
        ]);

        fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime });
      });

      When(fakeAsync(() => {
        observerSpy1 = subscribeSpyTo(fakeSourceWithCache$);
        tick(5 * expirationTime);
      }));

      Then(() => {
        expect(observerSpy1.receivedComplete()).toBeFalse();
      });
    });
  });

  describe('error strategy', () => {

    describe('GIVEN the source emits an error THEN the subscriber gets the error', () => {
      let fakeError = 'FAKE ERROR';

      Given(() => {
        fakeSource$ = createObservableWithValues([{ errorValue: fakeError }]);
        fakeSourceWithCache$ = createFakeSourceWithCache({ expirationTime });
      });

      When(fakeAsync(() => {
        observerSpy1 = subscribeSpyTo(fakeSourceWithCache$, { expectErrors: true });
        tick(5 * expirationTime);
      }));

      Then(() => {
        expect(observerSpy1.getError()).toEqual(fakeError);
      });
    });
  });
});
