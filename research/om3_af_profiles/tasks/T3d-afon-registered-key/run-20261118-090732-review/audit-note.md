# Audit note (Opus), 2026-11-18

The audit reports one violation, `CHANGED PROJECT-STATE.md`.

**Cause.** The coordinator (Opus) edited `PROJECT-STATE.md` at 14:07:36Z, two seconds after the
"before" snapshot (14:07:34Z), while this review was running. The edit was the Q7 correction after T3d.
Sol runs in Codex's read-only sandbox, and `work_unchanged=True`. This was not an agent write.

**Effect on the review.** None on its validity. Sol may have read either version of the file. The change
concerns only the storage note, which this review does not rely on.

**Rule adopted.** The coordinator makes no edits under the research tree while a Grok or Sol run is
active. Edits wait until the run completes. Recorded in PROJECT-STATE §9.
