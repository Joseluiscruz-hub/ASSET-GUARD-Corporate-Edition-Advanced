import {
  DestroyRef,
  Injector,
  PendingTasks,
  RuntimeError,
  assertInInjectionContext,
  assertNotInReactiveContext,
  computed,
  effect,
  getOutputDestroyRef,
  inject,
  microtaskEffect,
  resource,
  signal,
  untracked
} from "./chunk-45ZY5V2V.js";
import "./chunk-WYPONUPU.js";
import "./chunk-GKQC46YA.js";
import {
  Observable,
  ReplaySubject,
  takeUntil
} from "./chunk-DWU2VAII.js";
import "./chunk-73HIIJXH.js";
import {
  __publicField
} from "./chunk-EWTE5DHJ.js";

// node_modules/@angular/core/fesm2022/rxjs-interop.mjs
function takeUntilDestroyed(destroyRef) {
  if (!destroyRef) {
    assertInInjectionContext(takeUntilDestroyed);
    destroyRef = inject(DestroyRef);
  }
  const destroyed$ = new Observable((observer) => {
    const unregisterFn = destroyRef.onDestroy(observer.next.bind(observer));
    return unregisterFn;
  });
  return (source) => {
    return source.pipe(takeUntil(destroyed$));
  };
}
var OutputFromObservableRef = class {
  constructor(source) {
    __publicField(this, "source");
    __publicField(this, "destroyed", false);
    __publicField(this, "destroyRef", inject(DestroyRef));
    this.source = source;
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }
  subscribe(callbackFn) {
    if (this.destroyed) {
      throw new RuntimeError(953, ngDevMode && "Unexpected subscription to destroyed `OutputRef`. The owning directive/component is destroyed.");
    }
    const subscription = this.source.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (value) => callbackFn(value)
    });
    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }
};
function outputFromObservable(observable, opts) {
  ngDevMode && assertInInjectionContext(outputFromObservable);
  return new OutputFromObservableRef(observable);
}
function outputToObservable(ref) {
  const destroyRef = getOutputDestroyRef(ref);
  return new Observable((observer) => {
    destroyRef == null ? void 0 : destroyRef.onDestroy(() => observer.complete());
    const subscription = ref.subscribe((v) => observer.next(v));
    return () => subscription.unsubscribe();
  });
}
function toObservable(source, options) {
  !(options == null ? void 0 : options.injector) && assertInInjectionContext(toObservable);
  const injector = (options == null ? void 0 : options.injector) ?? inject(Injector);
  const subject = new ReplaySubject(1);
  const watcher = effect(() => {
    let value;
    try {
      value = source();
    } catch (err) {
      untracked(() => subject.error(err));
      return;
    }
    untracked(() => subject.next(value));
  }, {
    injector,
    manualCleanup: true
  });
  injector.get(DestroyRef).onDestroy(() => {
    watcher.destroy();
    subject.complete();
  });
  return subject.asObservable();
}
function toObservableMicrotask(source, options) {
  !(options == null ? void 0 : options.injector) && assertInInjectionContext(toObservable);
  const injector = (options == null ? void 0 : options.injector) ?? inject(Injector);
  const subject = new ReplaySubject(1);
  const watcher = microtaskEffect(() => {
    let value;
    try {
      value = source();
    } catch (err) {
      untracked(() => subject.error(err));
      return;
    }
    untracked(() => subject.next(value));
  }, {
    injector,
    manualCleanup: true
  });
  injector.get(DestroyRef).onDestroy(() => {
    watcher.destroy();
    subject.complete();
  });
  return subject.asObservable();
}
function toSignal(source, options) {
  var _a;
  typeof ngDevMode !== "undefined" && ngDevMode && assertNotInReactiveContext(toSignal, "Invoking `toSignal` causes new subscriptions every time. Consider moving `toSignal` outside of the reactive context and read the signal value where needed.");
  const requiresCleanup = !(options == null ? void 0 : options.manualCleanup);
  requiresCleanup && !(options == null ? void 0 : options.injector) && assertInInjectionContext(toSignal);
  const cleanupRef = requiresCleanup ? ((_a = options == null ? void 0 : options.injector) == null ? void 0 : _a.get(DestroyRef)) ?? inject(DestroyRef) : null;
  const equal = makeToSignalEqual(options == null ? void 0 : options.equal);
  let state;
  if (options == null ? void 0 : options.requireSync) {
    state = signal({
      kind: 0
      /* StateKind.NoValue */
    }, {
      equal
    });
  } else {
    state = signal({
      kind: 1,
      value: options == null ? void 0 : options.initialValue
    }, {
      equal
    });
  }
  let destroyUnregisterFn;
  const sub = source.subscribe({
    next: (value) => state.set({
      kind: 1,
      value
    }),
    error: (error) => {
      if (options == null ? void 0 : options.rejectErrors) {
        throw error;
      }
      state.set({
        kind: 2,
        error
      });
    },
    complete: () => {
      destroyUnregisterFn == null ? void 0 : destroyUnregisterFn();
    }
    // Completion of the Observable is meaningless to the signal. Signals don't have a concept of
    // "complete".
  });
  if ((options == null ? void 0 : options.requireSync) && state().kind === 0) {
    throw new RuntimeError(601, (typeof ngDevMode === "undefined" || ngDevMode) && "`toSignal()` called with `requireSync` but `Observable` did not emit synchronously.");
  }
  destroyUnregisterFn = cleanupRef == null ? void 0 : cleanupRef.onDestroy(sub.unsubscribe.bind(sub));
  return computed(() => {
    const current = state();
    switch (current.kind) {
      case 1:
        return current.value;
      case 2:
        throw current.error;
      case 0:
        throw new RuntimeError(601, (typeof ngDevMode === "undefined" || ngDevMode) && "`toSignal()` called with `requireSync` but `Observable` did not emit synchronously.");
    }
  }, {
    equal: options == null ? void 0 : options.equal
  });
}
function makeToSignalEqual(userEquality = Object.is) {
  return (a, b) => a.kind === 1 && b.kind === 1 && userEquality(a.value, b.value);
}
function pendingUntilEvent(injector) {
  if (injector === void 0) {
    assertInInjectionContext(pendingUntilEvent);
    injector = inject(Injector);
  }
  const taskService = injector.get(PendingTasks);
  return (sourceObservable) => {
    return new Observable((originalSubscriber) => {
      const removeTask = taskService.add();
      let cleanedUp = false;
      function cleanupTask() {
        if (cleanedUp) {
          return;
        }
        removeTask();
        cleanedUp = true;
      }
      const innerSubscription = sourceObservable.subscribe({
        next: (v) => {
          originalSubscriber.next(v);
          cleanupTask();
        },
        complete: () => {
          originalSubscriber.complete();
          cleanupTask();
        },
        error: (e) => {
          originalSubscriber.error(e);
          cleanupTask();
        }
      });
      innerSubscription.add(() => {
        originalSubscriber.unsubscribe();
        cleanupTask();
      });
      return innerSubscription;
    });
  };
}
function rxResource(opts) {
  (opts == null ? void 0 : opts.injector) || assertInInjectionContext(rxResource);
  return resource({
    ...opts,
    loader: void 0,
    stream: (params) => {
      let sub;
      const onAbort = () => sub.unsubscribe();
      params.abortSignal.addEventListener("abort", onAbort);
      const stream = signal({
        value: void 0
      });
      let resolve;
      const promise = new Promise((r) => resolve = r);
      function send(value) {
        stream.set(value);
        resolve == null ? void 0 : resolve(stream);
        resolve = void 0;
      }
      sub = opts.loader(params).subscribe({
        next: (value) => send({
          value
        }),
        error: (error) => {
          send({
            error
          });
          params.abortSignal.removeEventListener("abort", onAbort);
        },
        complete: () => {
          if (resolve) {
            send({
              error: new Error("Resource completed before producing a value")
            });
          }
          params.abortSignal.removeEventListener("abort", onAbort);
        }
      });
      return promise;
    }
  });
}
export {
  outputFromObservable,
  outputToObservable,
  pendingUntilEvent,
  rxResource,
  takeUntilDestroyed,
  toObservable,
  toSignal,
  toObservableMicrotask as ɵtoObservableMicrotask
};
/*! Bundled license information:

@angular/core/fesm2022/rxjs-interop.mjs:
  (**
   * @license Angular v19.2.21
   * (c) 2010-2025 Google LLC. https://angular.io/
   * License: MIT
   *)
*/
//# sourceMappingURL=@angular_core_rxjs-interop.js.map
