# ca-ta

## `crash`

```typescript
import {crash} from "pacots";

const a = condition === true ? 1 : crash("This should never happen.");
```

## `Result`

Don't worry about async anymore.

```typescript
import { crash, Result } from "pacots";
import { inspect } from "util";

const firstOne: Result<number, Error> = Ok(Math.random());
const secondOne: Result<number, Error> = Ok(() => Math.random());
const thirdOne: AsyncResult<number, Error> = Ok(Promise.resolve(Math.random()));
const fourthOne: AsyncResult<number, Error> = Ok(async () => Promise.resolve(Math.random()));

const chosenOne = [firstOne, secondOne, thirdOne, fourthOne][Math.floow(Math.random() * 4)];

const randomPicResult: Result<Buffer, Error> = chosenOne
    .map((x) => Math.floor(x * 100)) // -> Sync
    .map((x) => x === 0 ? throw new Error("Zero is not allowed.") : x) // -> Sync
    .map((x) => x === 1 ? crash("One is not allowed.") : x) // -> Sync
    .map((x) => fetch(`https://example.com/${x}`)) // -> Async
    .mapErr(async (err) => {
        const error = new Error("Failed to fetch", {cause: err});
        await fetch("https://example.com/error", {method: "POST", body: inspect(error, {depth: null})})
        return error;
    }) // -> Async
    .map((x) => x.arrayBuffer()) // -> Sync


// Use it
const randomPic = await randomPicResult;
if (randomPic.ok) {
    // ...randomPic.val is a Buffer
} else {
    // ...randomPic.err is an Error
}

// Or mess with it, I wouldn't recommend it though
const isOk = await randomPicResult.ok; // -> boolean
const value = await randomPicResult.val; // -> Option<Buffer>
const error = await randomPicResult.err; // -> Option<Error>
```
