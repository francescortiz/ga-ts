# ga-ts

## On the absence of `unwrap` and unsafe methods

In the spirit of promoting safer and more predictable code, `ga-ts` intentionally avoids implementing functions
like `unwrap` or any other methods that can potentially introduce unsafe access patterns. Here's why:

1. **Predictability:** One of the primary goals of a functional programming paradigm is to encourage writing code that's
   easy to reason about. When developers use functions like `unwrap`, they assume that the value they're dealing with
   exists. If this assumption is incorrect, it can lead to runtime errors that are challenging to trace and debug.

2. **Enforced Handling:** By not providing an `unwrap` function, we ensure that developers must handle all potential
   cases, such as when a value might be `null` or `undefined`. This leads to a more robust codebase where edge cases are
   less likely to be overlooked.

3. **Safety:** Runtime errors, especially those caused by unexpected null or undefined values, can have cascading
   effects. They can cause applications to crash or behave unpredictably, leading to poor user experiences or, in the
   worst cases, data loss or corruption. By promoting safer access patterns, we aim to minimize these risks.

4. **Clearer Intent:** When a developer uses an `unwrap` method, it's not always evident to future code reviewers or
   maintainers why it was considered safe to use in that specific instance. Without such unsafe methods, the intent
   behind the code becomes clearer, as every potential outcome must be explicitly handled.

5. **Learning Curve:** For newcomers to TypeScript or functional programming, understanding when it's truly safe to use
   functions like `unwrap` can be daunting. By avoiding these patterns altogether, we hope to make `ga-ts` more
   approachable and reduce the chances of misuse.

In essence, while unsafe methods can sometimes lead to shorter, more concise code, they also introduce risks that we
believe aren't aligned with the core principles of functional programming and safe TypeScript practices. We encourage
developers to embrace patterns that explicitly handle all potential outcomes, leading to more resilient and maintainable
codebases.

## Contents

### `crash`

```typescript
import { crash } from "ga-ts";

const a = condition === true ? 1 : crash("This should never happen.");
```

### `Option`

```typescript
import { Option, Some, None } from "ga-ts";

const flagOption: Option<boolean> = [None, Some(false), Some(true)][Math.floor(Math.random() * 3)];

if (!flagOption.some) {
    // The flag is not set, ask the user to set it.
    return;
}

// The flag is set, use it.
const flag = flagOption.value;
```

### `Result`

```typescript
import { crash, AsyncResult, Ok, AsyncOk, Err } from "ga-ts";
import { inspect } from "util";

const firstOne: Result<number, never> = Ok(Math.random());
const secondOne: AsyncResult<number, never> = AsyncOk(Promise.resolve(Math.random()));

const chosenOne = [firstOne, secondOne][Math.floor(Math.random() * 2)];

const randomPicAsyncResult: AsyncResult<ArrayBuffer, string | Error | unknown> = chosenOne!
    .map((x) => Math.floor(x * 100)) // -> Sync
    // Up until this point we have a Result<number, never>

    .flatMap((x) => (x === 0 ? Err("Zero is not allowed.") : Ok(x))) // -> Sync
    // Now we have a Result<number, string>

    .attemptMap((x) => (x === 1 ? crash("One is not allowed.") : x)) // -> Sync
    // Now things got nastier, we have Result<number, string | unknown>, attemptMap is a bad
    // boy. Use flatMap instead for cleaner types.

    .attemptMap((x) => fetch(`https://example.com/${x}`)) // -> Async
    .mapError(async (error_) => {
        const error = new Error(`Failed to fetch ${(error_ as Error)?.message || error_}`);
        await fetch("https://example.com/error", {
            method: "POST",
            body: inspect(error, { depth: null }),
        });
        return error;
    }) // -> Async
    .map((x) => x.arrayBuffer()); // -> Sync

// Use it
const randomPicResult = await randomPicAsyncResult;
if (randomPicResult.ok) {
    // ...randomPicResult.value is an ArrayBuffer
} else {
    // ...randomPicResult.error is an string | Error | unknown
}

// Or mess with it, I wouldn't recommend it though
const isOk = await randomPicAsyncResult.ok; // -> boolean
const value = await randomPicAsyncResult.value; // -> Option<ArrayBuffer>
const error = await randomPicAsyncResult.error; // -> Option<string | Error | unknown>
```

## Roadmap

-   [x] Add `Task`.
-   [ ] Add `Option` tests.
-   [ ] Research what other methods to implement.
