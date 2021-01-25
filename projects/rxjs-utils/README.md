# RxJS utils

This library provides some operators to enhance the power of RxJS 🚀

<br>

# Table of contents

* [Installation](#installation)
* [Operators](#operators)
  * [repeatSwitchMap](#▶️-repeatSwitchMap)
  * [cache](#▶️-cache)
* [Updates](#updates)

<br>

# Installation

```
npm install @pastabolo/rxjs-utils
```
or
```
yarn add @pastabolo/rxjs-utils
```

<br>

# Operators

## ▶️ `repeatSwitchMap`

### ⚠️ The problem

Sometimes, you want to reset the subscription to an observable by reacting to a list of triggers and then `switchMap` to te source.
- It might be difficult to identify what is the source at first glance
- You waste time and effort to understand what is going on (it may not be clear that the subscription to the source has to be reset each time a trigger emits)
- You have to initiate the subscription manually (by using the `startWith` operator or by having a resetter which is a `BehaviorSubject` instead of a `Subject`)

```ts
merge(
  interval(5000),
  resetter1$,
  resetter2$
).pipe(
  startWith(''),
  switchMap(() => source$) // source$ is declared here
).subscribe();
```

### ✔️ Solution

By using the `repeatSwitchMap` operator, you can do this in a cleaner way :
- Declare the source at the first line so you can identify it easily
- The name of this operator is meaningful so you can easily understand what is intended to be done
- You don't have to initiate the subscription manually with a `startWith` and keep your resetters as `Subject` which could be a more appropriate object than a `BehaviorSubject` because they might not be supposed to emit at initialization

```ts
source$.pipe( // source is declared here
  repeatSwitchMap(
    merge(
      interval(5000),
      resetter1$,
      resetter2$
    )
  )
).subscribe();
```

📝 This operator and the existing `repeatWhen` operator are different because `repeatWhen` waits for the source to complete before subscribing to the inner observable that triggers new subscription to this source.

### Description

Returns an Observable that mirrors the source Observable. <br>
This method will resubscribe to the source Observable each time the notifier emits. For each emission, the previous subscription is completed. <br>
It completes if the source and the repeat observable complete. <br>
It emits error if the source or the repeat observable emits error.

### Examples  

Repeat a message stream on click
```ts
const source$ = of('Repeat message');
const documentClick$ = fromEvent(document, 'click');

source$.pipe(repeatSwitchMap(documentClick$)).subscribe(console.log);
```

### Parameters

* `notifier: Observable` <br>
Observable that repeats the subscription to the source each time it emits.

<br>

## ▶️ `cache`

### ⚠️ The problem

When you want to cache values, you can store them in variables or specific RxJS objects like `ReplaySubject`, `BehaviorSubject` or even use the `shareReplay` operator. But, with these methods, you don't have the notions of expiration, refreshment and automatic refresh.

### ✔️ Solution

You can extend your observable with the `cache` operator and specify : 
- an exipration time
- a refresher which is an observable that refresh the cached source when it emits
- a flag to automatically refresh the cache when it expires

### Description

Keep the last emitted values in cache for the expirationTime provided and share them with all its subscribers. 
If an observer subscribes when values are still in cache, it will get them directly.
Otherwise, if automaticRefresh is set to false, a new subscription is made to the source and the new values are stored in cache and emitted to all the subscribers.

### Examples

Keep a value in cache for 10s
```ts
const source$ = of('value');

source$.pipe(cache({ expirationTime: 10000 })).subscribe(console.log);
```

Keep a value in cache for 10s and refresh it automatically by resubscribing to the source when the cache expires
```ts
const source$ = of('value');

source$.pipe(cache({ expirationTime: 10000, automaticRefresh: true })).subscribe(console.log);
```

Keep a value in cache for 10s and refresh on click
```ts
const source$ = of('value');
const documentClick$ = fromEvent(document, 'click');

source$.pipe(cache({ expirationTime: 10000, refresher: documentClick$  })).subscribe(console.log);
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

# Updates

## v0.1.0

- `repeatSwitchMap` operator refactoring : does not accept a function anymore but an observable. The repeat observable does not have to react to source completion to not encroach upon existing `repeatWhen` operator

## v0.0.1

- add `repeatSwitchMap` and `cache` operators

---

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.5.