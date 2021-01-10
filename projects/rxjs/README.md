# RxJS

This library provides some operators to enhance the power of RxJS 🚀

<br>

# Table of contents

* [Operators](#operators)
  * [repeatSwitch](#repeatSwitch)
  * [cache](#cache)

<br>

# Operators

## repeatSwitch

Returns an Observable that mirrors the source Observable. <br>
This method will resubscribe to the source Observable each time the notifier emits. For each emission, the previous subscription is completed. <br>
It completes if the source and the repeat observable complete and if repeatOnNotifierComplete is set to false.

### Examples  

Repeat a message stream on click
```ts
const source$ = of('Repeat message');
const documentClick$ = fromEvent(document, 'click');

source.pipe(repeatSwitch(() => documentClick$)).subscribe(console.log);
```

Repeat a message stream with a delay after source completion
```ts
const source$ = of('Repeat message');

source.pipe(repeatSwitch(complete => complete.pipe(delay(200)))).subscribe(console.log);
```

### Parameters

* `notifier: (notifications: Observable) => Observable` <br>
Function that returns an observable of notifications that repeat the subscription to the source each time that observable emits. This function can get an observable as a parameter that only emits the last value from the source when source completes.
* `repeatOnNotifierComplete: boolean` <br> 
  If true (default), the notifier repeats instead of completing. If false, repetitions will occur until the notifier completes.

<br>

## cache

Keep the last emitted values in cache for the expirationTime provided and share them with all its subscribers. 
If an observer subscribes when values are still in cache, it will get them directly.
Otherwise, if automaticRefresh is set to false, a new subscription is made to the source and the new values are stored in cache and emitted to all the subscribers.

### Examples

Keep a value in cache for 10s
```ts
const source$ = of('value');

source.pipe(cache({ expirationTime: 10000 })).subscribe(console.log);
```

Keep a value in cache for 10s and refresh it automatically by resubscribing to the source when the cache expires
```ts
const source$ = of('value');

source.pipe(cache({ expirationTime: 10000, automaticRefresh: true })).subscribe(console.log);
```

Keep a value in cache for 10s and refresh on click
```ts
const source$ = of('value');
const documentClick$ = fromEvent(document, 'click');

source.pipe(cache({ expirationTime: 10000, refresher: documentClick$  })).subscribe(console.log);
```

Keep 3 values in cache (10s for each value)
```ts
const source$ = of(1, 2, 3);

source$.pipe(cache({ expirationTime: 10000, bufferSize: 3 })).subscribe(console.log);
```

### Parameters

* `expirationTime: number` <br>
Maximum time length to keep the value in cache in milliseconds. 
* `refresher: Observable` <br>
Notifier that resubscribes to the source each time it emits to refresh the cache.
* `automaticRefresh: boolean` <br>
Refresh the value in cache when it expires.
* `bufferSize: number` <br>
Maximum element count of the cache buffer (default 1).

<br>

---

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.5.