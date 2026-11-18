# Save a child command's real stdout, stderr and exit code under work/out/cmd.
import subprocess
import sys
from pathlib import Path

name, cmd = sys.argv[1], sys.argv[2:]
if not name or not cmd:
    sys.stderr.write("usage: run_logged_a1.py <name> <command> [args]\n")
    sys.exit(2)
out = Path("work/out/cmd")
out.mkdir(parents=True, exist_ok=True)
r = subprocess.run(cmd, capture_output=True)
(out / f"{name}.out").write_bytes(r.stdout)
(out / f"{name}.err").write_bytes(r.stderr)
(out / f"{name}.exit").write_text(str(r.returncode), encoding="utf-8")
sys.stdout.buffer.write(r.stdout)
sys.stderr.buffer.write(r.stderr)
sys.exit(r.returncode)
