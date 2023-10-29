# ga-ta

## `crash`

```typescript
import {crash} from "ga-ts";

const a = condition === true ? 1 : crash("This should never happen.");
```

## `Option`

```typescript
import {Option, Some, None} from "ga-ts";


```

## `Result`


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
