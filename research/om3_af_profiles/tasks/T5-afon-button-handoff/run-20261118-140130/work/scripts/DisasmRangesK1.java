// Bounded disassembly. The bytes come from work/out/static-windows-k1.json,
// which static_overlay_k1.py took from the decoded image after the central-edge
// CSV. Ghidra's program is the stock image, so overlay code is not read from it.
// Args: <windows.json> then triples start-hex instruction-count out-file.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
public class DisasmRangesK1 extends GhidraScript {
  Map<Long, byte[]> windows = new HashMap<>();
  byte[] at(long pc) {
    for (Map.Entry<Long, byte[]> e : windows.entrySet()) {
      long base = e.getKey();
      byte[] raw = e.getValue();
      if (pc >= base && pc < base + raw.length) {
        int n = (int) (pc - base);
        byte[] out = new byte[Math.min(16, raw.length - n)];
        System.arraycopy(raw, n, out, 0, out.length);
        return out;
      }
    }
    return null;
  }
  void load(String path) throws Exception {
    String text = Files.readString(Paths.get(path), StandardCharsets.UTF_8);
    // The sidecar is one JSON object. Each window has "address" and "hex".
    int i = 0;
    while (true) {
      int a = text.indexOf("\"address\"", i);
      if (a < 0) break;
      int hexKey = text.indexOf("\"hex\"", a);
      if (hexKey < 0) break;
      int aq = text.indexOf('"', text.indexOf(':', a) + 1);
      int aq2 = text.indexOf('"', aq + 1);
      long addr = Long.parseLong(text.substring(aq + 1, aq2), 16);
      int hq = text.indexOf('"', text.indexOf(':', hexKey) + 1);
      int hq2 = text.indexOf('"', hq + 1);
      String hex = text.substring(hq + 1, hq2);
      byte[] raw = new byte[hex.length() / 2];
      for (int k = 0; k < raw.length; k++) raw[k] = (byte) Integer.parseInt(hex.substring(k * 2, k * 2 + 2), 16);
      windows.put(addr, raw);
      i = hq2 + 1;
    }
    if (windows.isEmpty()) throw new IllegalStateException("no windows in " + path);
  }
  @Override public void run() throws Exception {
    String[] a = getScriptArgs();
    load(a[0]);
    PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
    dis.setRespectExecuteFlag(false);
    for (int n = 1; n + 2 < a.length; n += 3) {
      long pc = Long.parseLong(a[n], 16);
      int count = Integer.parseInt(a[n + 1]);
      List<String> out = new ArrayList<>();
      for (int i = 0; i < count; i++) {
        byte[] b = at(pc);
        if (b == null || b.length == 0) { out.add(String.format("%08x\t??\twindow ended", pc)); break; }
        PseudoInstruction ins = dis.disassemble(toAddr(pc), b);
        if (ins == null) { out.add(String.format("%08x\t%02x\t??", pc, b[0] & 0xff)); pc++; continue; }
        int len = ins.getLength();
        if (len > b.length) { out.add(String.format("%08x\tshort window", pc)); break; }
        StringBuilder h = new StringBuilder();
        for (int k = 0; k < len; k++) h.append(String.format("%02x", b[k] & 0xff));
        out.add(String.format("%08x\t%s\t%s", pc, h, ins));
        pc += len;
      }
      Path dest = Paths.get(a[n + 2]);
      if (dest.getParent() != null) Files.createDirectories(dest.getParent());
      Files.write(dest, out);
    }
  }
}
