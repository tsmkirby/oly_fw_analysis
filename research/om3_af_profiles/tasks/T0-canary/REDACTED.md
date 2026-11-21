# Redaction note (2026-11-21)

Before the archive branch was first pushed with these records, the `whoami /all` output in five T0 canary logs
(`run-20261117-185442`, `-190734`, `-192421`, `-194208`, `-200125`, `work/out/log.txt`) was redacted: the Microsoft
account address is replaced by `[redacted-email]` and the user SID by `[redacted-sid]`. Owner approval 2026-11-21.
Nothing else in those logs was changed; the canary's findings (Low integrity label, write denials) are unaffected.
The unpushed local archive commits that carried these files were rewritten with the same replacement before the push.

The same two strings were also replaced in three local Sol event logs of the T0 reviews
(`run-20261117-192049-review`, `-193919-review`, `-201218-review`, `sol-*.events.jsonl`), which are not archived.
