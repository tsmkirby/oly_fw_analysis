// Bounded disassembly of several ranges. Args are triples: start-hex count out-file, repeated.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import java.nio.file.*;
import java.util.*;
public class DisasmRangesA3 extends GhidraScript {
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
        PseudoInstruction ins = dis.disassemble(toAddr(pc), b);
        if (ins == null) { out.add(String.format("%08x\t??", pc)); pc++; continue; }
        StringBuilder h = new StringBuilder();
        for (int k = 0; k < ins.getLength(); k++) h.append(String.format("%02x", b[k] & 0xff));
        out.add(String.format("%08x\t%s\t%s", pc, h, ins));
        pc += ins.getLength();
      }
      Files.write(Paths.get(a[n + 2]), out);
    }
  }
}
