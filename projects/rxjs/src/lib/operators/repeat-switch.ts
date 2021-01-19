import { asapScheduler, identity, MonoTypeOperatorFunction, noop, Observable, pipe } from 'rxjs';
import { last, observeOn, repeat, share, startWith, switchMapTo } from 'rxjs/operators';

/**
 * Returns an Observable that mirrors the source Observable. 
 * This method will resubscribe to the source Observable each time the notifier emits. For each emission, the previous subscription is completed.
 * It completes if the source and the repeat observable complete and if repeatOnNotifierComplete is set to false.
 *
 * ## Examples  
 * Repeat a message stream on click
 * ```ts
 * const source$ = of('Repeat message');
 * const documentClick$ = fromEvent(document, 'click');
 * source.pipe(repeatSwitchMap(() => documentClick$)).subscribe(console.log);
 * ```
 * 
 * Repeat a message stream with a delay after source completion
 * ```ts
 * const source$ = of('Repeat message');
 * source.pipe(repeatSwitchMap(complete => complete.pipe(delay(200)))).subscribe(console.log);
 * ```
 *
 * @param {function(notifications: Observable): Observable} notifier - Function that returns an observable of notifications that repeat the subscription to the source each time that observable emits. This function can get an observable as a parameter that only emits the last value from the source when source completes.
 * @param {boolean} repeatOnNotifierComplete - if true (default), the notifier repeats instead of completing. If false, repetitions will occur until the notifier completes.
 * @return {Observable} The source Observable modified with repeat logic.
 */
export function repeatSwitchMap<T>(
  notifier: (notifications: Observable<T>) => Observable<any>,
  { repeatOnNotifierComplete = true } = {}
): MonoTypeOperatorFunction<T> {
  return pipe(
    observeOn(asapScheduler), // Deferring is required to make sure that the source is really shared between the subscriptions even if source is cold and emits values and completes synchronously (like 'of' observable)
    share(),
    source => notifier(source.pipe(last())).pipe(
      repeatOnNotifierComplete ? repeat() : identity,
      startWith(noop),
      switchMapTo(source)
    )
  );
}