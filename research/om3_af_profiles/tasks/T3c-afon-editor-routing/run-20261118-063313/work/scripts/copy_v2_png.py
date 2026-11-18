from pathlib import Path
for name in ("page", "open"):
    src = Path(f"work/out/proto-r1-v1-{name}.png")
    dst = Path(f"work/out/proto-r1-v2-{name}.png")
    dst.write_bytes(src.read_bytes())
    print(dst, dst.stat().st_size)
