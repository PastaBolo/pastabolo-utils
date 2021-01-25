import { MonoTypeOperatorFunction, noop, Observable } from 'rxjs';
import { startWith, switchMapTo } from 'rxjs/operators';

/**
 * Returns an Observable that mirrors the source Observable. 
 * This method will resubscribe to the source Observable each time the notifier emits. For each emission, the previous subscription is completed.
 * It completes if the source and the repeat observable complete.
 * It emits error if the source or the repeat observable emits error.
 *
 * ## Example  
 * Repeat a message stream on click
 * ```ts
 * const source$ = of('Repeat message');
 * const documentClick$ = fromEvent(document, 'click');
 * source$.pipe(repeatSwitchMap(documentClick$)).subscribe(console.log);
 * ```
 *
 * @param {Observable} notifier - Observable that repeats the subscription to the source each time it emits.
 * @return {Observable} The source Observable modified with repeat logic.
 */
export function repeatSwitchMap<T>(notifier: Observable<any>): MonoTypeOperatorFunction<T> {
  return source => notifier.pipe(
    startWith(noop),
    switchMapTo(source)
  );
}
