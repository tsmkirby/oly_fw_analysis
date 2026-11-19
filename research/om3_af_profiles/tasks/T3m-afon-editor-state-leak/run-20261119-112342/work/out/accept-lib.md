# accept_lib.mjs

`work/scripts/accept_lib.mjs` is the shared acceptance module. Another task can import it. It does not install a behaviour hook.

## waitTitle(api, hash, timeoutMs)

`api` provides `labTime()` in lab nanoseconds, `idle(ms)`, and `frame()`. The title band is the SHA-256 of the top 16% of the frame height and the centre 56% of the width (x from 0.22 to 0.78), the same window as the earlier runs.

The function polls until the band equals `hash` or `timeoutMs` of lab time has passed. It returns the hash. On timeout it throws `Error` with `lastHash` set to the last band it saw and `expectedHash` set to the hash it was waiting for. A missing frame throws before that, as a screenshot failure.

## nativeSave(api)

Opens the menu and closes it, which is the stock settings commit. Then it checks all of the following:

- The lab store log gained an M save and an E save.
- At least one save callback ran, and every recorded callback `d0` is 0. The runner records `d0` by hooking the callback the posted NAND write is about to call. The log line is written before that callback, so a log entry is not the status.
- The store file's M bank is 262144 bytes and its E bank is 196608 bytes.
- The SHA-256 of those file bytes equals the SHA-256 of the image the NAND write read. That is the read-back of the persisted banks.

`api.press`, `api.step`, `api.saves()`, `api.statuses`, `api.saveHashes`, `api.nvramPath`, and optional `api.saveExpect` are supplied by the runner. `saveExpect` is merged into the per-key cell assert for the two menu keys.

## compareStores(a, b)

`a` and `b` are `{ M: Buffer, E: Buffer }`. The function walks both banks and returns every differing offset as `{ bank, offset, a, b }`. M is compared across 262144 bytes and E across 196608, or further if the lengths differ.

## assertCells(actual, expected)

`expected` may include `flag`, `zone`, `half`, and `mirror`. `half` and `mirror` are maps of cell name to the full list of values. The result is `{ pass, problems, expected, actual }`. Each problem names the field and gives the expected value and the actual value. When `flagCached` or `zoneCached` is present on `actual`, it is required to equal the same expected flag or zone.

## accept_lib_v4.mjs

`work/scripts/accept_lib_v4.mjs` is the correction-round module. `nativeSave` now slices the store log, the callback list, and the image hashes at the lengths recorded before the menu keys. Saves and callbacks that already existed do not satisfy the check.

`judgeFreshSaves(added, file)` is the check used with the T6 witness. `added` is the witness rows appended after the caller's snapshot. It requires a new E and a new M, each with a captured SHA-256 and status 0, a posted M callback whose status is 0, and the file bytes equal to the last captured image of that bank. `accept_v4.mjs` imports this module. That run stopped on K1 before the save check.

## readStore(file)

Reads the nvram JSON and returns `{ M, E }` buffers decoded from the base64 banks.

K2 runs the same half-press keys and the same menu exits as the candidate before any candidate store is compared. K1 runs that same key sequence first. The runner lists every byte where the K1 and K2 files differ before it compares a candidate with K2.

## What actually ran

`accept_lib.mjs` was syntax-checked (command 12) and then executed by `accept_run.mjs` (command 14). It is frozen. Its `nativeSave` only counts saves, callbacks, and images added during the call. That call's menu close added nothing: the settings file had already been written, so the check threw `no-M; no-E; no-callback; no-image-M; no-image-E` even though the file's M and E banks were the right lengths.

`accept_run2.mjs` imports `accept_lib_r2.mjs`. That copy keeps the menu open and menu close, and it reads the whole session log (`api.saves()`, `api.statuses`, `api.saveHashes`) instead of the slice taken at the start of the call. Command 17 then failed with `no-image-E` only. The log had an E save from bring-up, before the runner installed the NAND hook, so there was no captured E image to compare with the file. The posted M saves were captured, their callbacks were 0, and the M file hash matched.

`accept_run3.mjs` imports `accept_lib_r3.mjs`. The check is the r2 session log, with one change: a bank that appears in the log and in the file does not need a captured image, and a captured image must still match the file. Command 20's K1, K2, and c1 `save` rows passed on that check. The run then stopped because c1's store differed from K2. `accept_lib.mjs` itself was not edited and is not what that run imported.
