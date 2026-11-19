# Record the workspace main-image length and SHA-256. Static. No emulator.
import hashlib
from pathlib import Path

p = Path("inputs/00_0100_50000020.decoded.bin")
data = p.read_bytes()
sha = hashlib.sha256(data).hexdigest()
documented = "5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59"
print(f"bytes {len(data)}")
print(f"sha256 {sha}")
print(f"documented {documented}")
print(f"match {sha == documented}")
