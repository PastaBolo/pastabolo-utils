import { Observable, MonoTypeOperatorFunction, Subject, NEVER, of, noop, defer, race } from 'rxjs';
import { delay, shareReplay, take, switchMapTo, repeatWhen } from 'rxjs/operators';

import { repeatSwitchMap } from './repeat-switchmap';

/**
 * Keep the last emitted values in cache for the expirationTime provided and share them with all its subscribers. 
 * If an observer subscribes when values are still in cache, it will get them directly.
 * Otherwise, if automaticRefresh is set to false, a new subscription is made to the source and the new values are stored in cache and emitted to all the subscribers.
 *  
 * ## Examples
 * Keep a value in cache for 10s
 * ```ts
 * const source$ = of('value');
 * source$.pipe(cache({ expirationTime: 10000 })).subscribe(console.log);
 * ```
 * 
 * Keep a value in cache for 10s and refresh it automatically by resubscribing to the source when the cache expires
 * ```ts
 * const source$ = of('value');
 * source$.pipe(cache({ expirationTime: 10000, automaticRefresh: true })).subscribe(console.log);
 * ```
 * 
 * Keep a value in cache for 10s and refresh on click
 * ```ts
 * const source$ = of('value');
 * const documentClick$ = fromEvent(document, 'click');
 * source$.pipe(cache({ expirationTime: 10000, refresher: documentClick$  })).subscribe(console.log);
 * ```
 *
 * Keep 3 values in cache (10s for each value)
 * ```ts
 * const source$ = of(1, 2, 3);
 * source$.pipe(cache({ expirationTime: 10000, bufferSize: 3 })).subscribe(console.log);
 * ```
 * 
 * @param {Number} expirationTime - Maximum time length to keep the value in cache in milliseconds.
 * @param {Observable} refresher - Notifier that resubscribes to the source each time it emits to refresh the cache.
 * @param {boolean} automaticRefresh - Refresh the value in cache when it expires.
 * @param {number} bufferSize - Maximum element count of the cache buffer (default 1).
 * @return {Observable} An observable that keeps in cache and emits the last value from the source.
 */
export function cache<T>(config: {
  expirationTime: number;
  refresher?: Observable<unknown>;
  automaticRefresh?: boolean;
  bufferSize?: number;
}): MonoTypeOperatorFunction<T> {
  const newSub = new Subject();

  return source => {
    const inner = source.pipe(
      repeatWhen(complete =>
        complete.pipe(
          delay(config.expirationTime),
          switchMapTo(config.automaticRefresh ? of(noop) : newSub) // After source completion and cache expiration, resubscribe to source automatically if automaticRefresh or wait for a new subscriber
        )
      ),
      repeatSwitchMap(config.refresher || NEVER),
      shareReplay({ refCount: true, bufferSize: config.bufferSize || 1, windowTime: config.expirationTime })
    );

    return defer(() => {
      newSub.next();
      return inner;
    });
  };
}
