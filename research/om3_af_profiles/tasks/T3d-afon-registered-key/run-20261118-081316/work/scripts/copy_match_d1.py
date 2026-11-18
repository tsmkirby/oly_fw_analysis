from pathlib import Path
src = Path("work/scripts/trace_callee_d1.mjs").read_text(encoding="utf-8")
src = src.replace("trace-callee-d1", "trace-match-d1")
src = src.replace("Callee trace. Same baseline as trace_decision_d1.", "Match-key trace. Same baseline.")
Path("work/scripts/trace_match_d1.mjs").write_text(src, encoding="utf-8")
print("copied", len(src))
