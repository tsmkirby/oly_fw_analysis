// Bounded disassembly from the stock program. Args are triples:
// start-hex instruction-count out-file. Do not edit after it has run.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import java.nio.file.*;
import java.util.*;
public class DisasmStockV1 extends GhidraScript {
  @Override public void run() throws Exception {
    String[] a = getScriptArgs();
    PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
    dis.setRespectExecuteFlag(false);
    for (int n = 0; n + 2 < a.length; n += 3) {
      long pc = Long.parseLong(a[n], 16);
      int count = Integer.parseInt(a[n + 1]);
      List<String> out = new ArrayList<>();
      for (int i = 0; i < count; i++) {
        byte[] b = getBytes(toAddr(pc), 16);
        if (b == null) { out.add(String.format("%08x\t??\tunreadable", pc)); break; }
        PseudoInstruction ins = dis.disassemble(toAddr(pc), b);
        if (ins == null) { out.add(String.format("%08x\t%02x\t??", pc, b[0] & 0xff)); pc++; continue; }
        int len = ins.getLength();
        StringBuilder h = new StringBuilder();
        for (int k = 0; k < len; k++) h.append(String.format("%02x", b[k] & 0xff));
        out.add(String.format("%08x\t%s\t%s", pc, h, ins));
        pc += len;
      }
      Path dest = Paths.get(a[n + 2]);
      if (dest.getParent() != null) Files.createDirectories(dest.getParent());
      Files.write(dest, out);
      println("wrote " + dest + " " + out.size());
    }
  }
}
