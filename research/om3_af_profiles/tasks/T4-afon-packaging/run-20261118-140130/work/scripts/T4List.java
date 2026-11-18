// Bounded listings and existing Ghidra references. Read-only.
// Args: <ranges-file> <xref-out>
// ranges-file lines: name start-hex instruction-count
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import ghidra.program.model.address.Address;
import ghidra.program.model.symbol.Reference;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public class T4List extends GhidraScript {
  @Override public void run() throws Exception {
    String[] a = getScriptArgs();
    Path ranges = Paths.get(a[0]);
    Path xrefOut = Paths.get(a[1]);
    if (xrefOut.getParent() != null) Files.createDirectories(xrefOut.getParent());
    PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
    dis.setRespectExecuteFlag(false);
    List<String> xref = new ArrayList<>();
    for (String line : Files.readAllLines(ranges, StandardCharsets.UTF_8)) {
      line = line.trim();
      if (line.isEmpty() || line.startsWith("#")) continue;
      String[] p = line.split("\\s+");
      String name = p[0];
      long pc = Long.parseLong(p[1].replace("0x", "").replace("0X", ""), 16);
      int n = Integer.parseInt(p[2]);
      List<String> out = new ArrayList<>();
      long start = pc;
      for (int i = 0; i < n; i++) {
        byte[] b = getBytes(toAddr(pc), 16);
        PseudoInstruction ins = dis.disassemble(toAddr(pc), b);
        if (ins == null) {
          out.add(String.format("%08x\t%02x\t??", pc, b[0] & 0xff));
          pc++;
          continue;
        }
        StringBuilder h = new StringBuilder();
        for (int k = 0; k < ins.getLength(); k++) h.append(String.format("%02x", b[k] & 0xff));
        out.add(String.format("%08x\t%s\t%s", pc, h, ins));
        pc += ins.getLength();
      }
      Path dest = Paths.get("work", "out", "listings", name + ".txt");
      Files.createDirectories(dest.getParent());
      Files.write(dest, out, StandardCharsets.UTF_8);
      println("listing " + name + " " + out.size() + " ins " + String.format("%08x", start));
    }
    long[] targets = new long[] {
      0x6124f4e5L, 0x615c540cL, 0x615cc934L, 0x615cc938L, 0x6037bedcL,
      0x6061912cL, 0x60405865L, 0x6041931eL, 0x6041937fL, 0x60419446L,
      0x60419696L, 0x6158f0f8L, 0x6158f0fcL, 0x61529ce8L, 0x61529cecL,
      0x6150f5f0L, 0x60029b28L, 0x60045ed5L, 0x6017a5fcL, 0x611f7f35L,
      0x611f7f42L, 0x615cc934L, 0x606216ecL, 0x6037cc5cL, 0x615c6234L,
      0x615c59dcL, 0x615c7b0cL
    };
    for (long v : targets) {
      Address addr = toAddr(v);
      Reference[] refs = getReferencesTo(addr);
      xref.add(String.format("to %08x refs %d", v, refs.length));
      int shown = 0;
      for (Reference r : refs) {
        if (shown++ >= 30) {
          xref.add("  ...");
          break;
        }
        xref.add(String.format("  from %s type %s", r.getFromAddress(), r.getReferenceType()));
      }
    }
    Files.write(xrefOut, xref, StandardCharsets.UTF_8);
    println("xrefs " + xref.size());
  }
}
