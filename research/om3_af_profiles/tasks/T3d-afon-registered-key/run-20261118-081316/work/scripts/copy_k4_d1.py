from pathlib import Path
src = Path("work/scripts/exp_k1_d2.mjs").read_text(encoding="utf-8")
src = src.replace("exp-k1-d2", "exp-k4-d1")
src = src.replace(
    "K1 rerun. The d1 hooks returned early while call_depth was above 0, which is how the menu pump runs, so they never stood in for 0x3D6F. This run stands in except during our own readKey. One change against the E1 baseline: the mapped getter and the index getter return\n// 0x5b82 and 0 only when the UI id is 0x3D6F. No value hooks, no descriptor link, no table edit.\n// Those two hooks are EMULATOR-ONLY behaviour. Every other hook is role observe.",
    "K4. One change against the E1 baseline, and not the K1 getter hooks.\n// At the deciding compare, when the selected UI id is 0x3D6F and the record is the first page-27 record,\n// D0 is set to 0x3D6F so that record matches. EMULATOR-ONLY behaviour. Every other hook is role observe.",
)
Path("work/scripts/exp_k4_d1.mjs").write_text(src, encoding="utf-8")
print("copied", src.count("exp-k4-d1"))
