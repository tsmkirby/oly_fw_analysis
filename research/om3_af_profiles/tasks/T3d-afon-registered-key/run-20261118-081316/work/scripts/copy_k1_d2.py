from pathlib import Path
src = Path("work/scripts/exp_k1_d1.mjs").read_text(encoding="utf-8")
src = src.replace("exp-k1-d1", "exp-k1-d2")
src = src.replace("K1. One change", "K1 rerun. The d1 hooks returned early while call_depth was above 0, which is how the menu pump runs, so they never stood in for 0x3D6F. This run stands in except during our own readKey. One change")
Path("work/scripts/exp_k1_d2.mjs").write_text(src, encoding="utf-8")
print("copied")
