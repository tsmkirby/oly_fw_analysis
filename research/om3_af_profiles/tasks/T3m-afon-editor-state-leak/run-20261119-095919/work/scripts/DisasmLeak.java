// Read-only disassembly of the leak-path instructions.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import java.nio.file.*;
import java.util.*;
public class DisasmLeak extends GhidraScript {
  @Override public void run() throws Exception {
    String[] a = getScriptArgs();
    long[] starts = new long[a.length / 3];
    int[] counts = new int[a.length / 3];
    String outPath = a[a.length - 1];
    int n = (a.length - 1) / 2;
    PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
    dis.setRespectExecuteFlag(false);
    List<String> out = new ArrayList<>();
    for (int r = 0; r < n; r++) {
      long pc = Long.parseLong(a[r * 2], 16);
      int count = Integer.parseInt(a[r * 2 + 1]);
      out.add("---- " + a[r * 2] + " ----");
      for (int i = 0; i < count; i++) {
        byte[] b = getBytes(toAddr(pc), 16);
        PseudoInstruction ins = dis.disassemble(toAddr(pc), b);
        if (ins == null) { out.add(String.format("%08x\t??", pc)); pc++; continue; }
        StringBuilder h = new StringBuilder();
        for (int k = 0; k < ins.getLength(); k++) h.append(String.format("%02x", b[k] & 0xff));
        out.add(String.format("%08x\t%s\t%s", pc, h, ins));
        pc += ins.getLength();
      }
    }
    Files.write(Paths.get(outPath), out);
  }
}
