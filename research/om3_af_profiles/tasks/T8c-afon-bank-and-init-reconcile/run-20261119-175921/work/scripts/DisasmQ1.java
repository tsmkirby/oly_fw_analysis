// Bounded disassembly. Args are triples: start-hex, instruction-count, out-file.
// Bytes come from the program image. Do not edit after this runs.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import ghidra.program.model.address.Address;
import java.nio.file.*;
import java.util.*;

public class DisasmQ1 extends GhidraScript {
  byte[] at(long pc) throws Exception {
    Address a = toAddr(pc);
    byte[] out = new byte[16];
    int n = currentProgram.getMemory().getBytes(a, out);
    if (n <= 0) return null;
    return n == out.length ? out : Arrays.copyOf(out, n);
  }

  @Override
  public void run() throws Exception {
    String[] a = getScriptArgs();
    PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
    dis.setRespectExecuteFlag(false);
    for (int n = 0; n + 2 < a.length; n += 3) {
      long pc = Long.parseLong(a[n], 16);
      int count = Integer.parseInt(a[n + 1]);
      List<String> out = new ArrayList<>();
      for (int i = 0; i < count; i++) {
        byte[] b = at(pc);
        if (b == null || b.length == 0) {
          out.add(String.format("%08x\t??\tmemory ended", pc));
          break;
        }
        PseudoInstruction ins = dis.disassemble(toAddr(pc), b);
        if (ins == null) {
          out.add(String.format("%08x\t%02x\t??", pc, b[0] & 0xff));
          pc++;
          continue;
        }
        StringBuilder h = new StringBuilder();
        int len = ins.getLength();
        for (int k = 0; k < len && k < b.length; k++) h.append(String.format("%02x", b[k] & 0xff));
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
