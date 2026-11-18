from pathlib import Path
src = Path("work/scripts/trace_decision_d1.mjs")
dst = Path("work/scripts/trace_callee_d1.mjs")
text = src.read_text(encoding="utf-8")
text = text.replace("trace-decision-d1", "trace-callee-d1")
text = text.replace("Decision trace.", "Callee trace. Same baseline as trace_decision_d1.")
dst.write_text(text, encoding="utf-8")
print(dst, dst.stat().st_size)
