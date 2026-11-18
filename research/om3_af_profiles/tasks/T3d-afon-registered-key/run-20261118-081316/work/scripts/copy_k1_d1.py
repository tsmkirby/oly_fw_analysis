from pathlib import Path
src = Path("work/scripts/trace_match_d1.mjs").read_text(encoding="utf-8")
Path("work/scripts/exp_k1_d1.mjs").write_text(src, encoding="utf-8")
print("copied", len(src))
