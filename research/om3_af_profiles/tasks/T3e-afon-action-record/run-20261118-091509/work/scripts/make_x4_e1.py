# Build exp_x4_e1.mjs from the X1 script. The only behaviour change is the
# third record's second word, 0x1e3 -> 0x0e3d.
from pathlib import Path

src = Path("work/scripts/exp_x1_e1.mjs").read_text(encoding="utf-8")
out = src.replace("exp_x1_e1", "exp_x4_e1").replace("exp-x1-e1", "exp-x4-e1").replace("overlay-x1-e1", "overlay-x4-e1")
old = "third[4] = 0x6f; third[5] = 0x3d;"
new = "third[4] = 0x6f; third[5] = 0x3d;\nthird[16] = 0x3d; third[17] = 0x0e; third[18] = 0x00; third[19] = 0x00;"
if old not in out:
    raise SystemExit("third-record site missing")
out = out.replace(old, new, 1)
old_purpose = "page-27 action table copy, third record UI id 0x3D6F"
new_purpose = "page-27 action table copy, third record UI id 0x3D6F, second word 0x0e3d"
if old_purpose not in out:
    raise SystemExit("purpose missing")
out = out.replace(old_purpose, new_purpose, 1)
old_exp = (
    "explanation: 'E1 already draws the 0x3D6F row and points it at the two-record list 0x6158ba04, "
    "and OK stays shut because that id is absent from the page-27 action table. The one change is a "
    "3-record copy of that table in the section-1 tail: the two stock records byte-exact, plus 2154\\'s "
    "record with only the UI id changed to 0x3D6F. The section-7 pointer and count are then aimed at it. "
    "T3a\\'s value hooks are installed so a confirm for 0x3D6F writes the RAM byte and is not given a stock key. "
    "Nothing else changes.',\n"
    "    change: 'owned 72-byte action table at 0x6031ea00 and EMULATOR-ONLY writes of 0x6150f5f0 and 0x6150f5f4',"
)
new_exp = (
    "explanation: 'X1 matched the third record (D0 and D1 both 0x3D6F at A2 0x6031ea30) and opened the two-option chooser, "
    "but confirm called 0x6041937f with UI id 2154 and value 1, and the RAM byte stayed 0. The third record still carried "
    "second word 0x1e3, and the only stock record with that word is 2154 at 0x6150c514. The live table\\'s first record has "
    "the same word, so a lookup by it finds 2154 before 0x3D6F. The one change against X1 is that second word, from 0x1e3 "
    "to 0x0e3d. No aligned action record in 0x6150b000..0x61511000 uses 0x0e3d. The row, the option list, the section-7 "
    "redirects, and the value hooks stay as in X1.',\n"
    "    change: 'third record second word 0x1e3 -> 0x0e3d',"
)
if old_exp not in out:
    raise SystemExit("explanation missing")
out = out.replace(old_exp, new_exp, 1)
header = (
    "// X4. One change against the X1 baseline.\n"
    "// X1 opened the chooser for 0x3D6F but confirm called the setter with 2154.\n"
    "// The third record's second word was still 0x1e3, which only the stock 2154 record owns.\n"
    "// This run changes that word to 0x0e3d and leaves every other byte as in X1.\n"
)
out = header + out.split("\n", 5)[-1] if False else out
# Replace the opening comment block only.
old_head = out.split("import assert", 1)[0]
new_head = (
    "// X4. One change against the X1 baseline.\n"
    "// X1 opened the chooser for 0x3D6F and matched the third record, but confirm\n"
    "// called 0x6041937f with UI id 2154. That record's second word was still\n"
    "// 0x1e3, owned in the stock table only by 2154. This run changes that word\n"
    "// to 0x0e3d. The row, options, redirects, and value hooks stay as in X1.\n"
    "// Usage: node26 work/scripts/exp_x4_e1.mjs om-emu work/out/exp-x4-e1.jsonl\n"
)
out = new_head + "import assert" + out.split("import assert", 1)[1]
Path("work/scripts/exp_x4_e1.mjs").write_text(out, encoding="utf-8", newline="\n")
print("wrote", len(out))
