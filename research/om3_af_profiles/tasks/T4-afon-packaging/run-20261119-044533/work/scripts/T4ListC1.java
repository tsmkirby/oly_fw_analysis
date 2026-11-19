// Bounded listings, blob disassembly, and caller chains. Read-only.
// Args: <ranges-file> <xref-out>
// ranges-file lines:
//   name start-hex instruction-count
//   blob name start-hex hexbytes
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.symbol.Reference;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public class T4ListC1 extends GhidraScript {
  @Override public void run() throws Exception {
    String[] a = getScriptArgs();
    Path ranges = Paths.get(a[0]);
    Path xrefOut = Paths.get(a[1]);
    if (xrefOut.getParent() != null) Files.createDirectories(xrefOut.getParent());
    PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
    dis.setRespectExecuteFlag(false);
    for (String line : Files.readAllLines(ranges, StandardCharsets.UTF_8)) {
      line = line.trim();
      if (line.isEmpty() || line.startsWith("#")) continue;
      String[] p = line.split("\\s+");
      if (p[0].equals("blob")) {
        String name = p[1];
        long pc0 = Long.parseLong(p[2], 16);
        byte[] raw = hex(p[3]);
        List<String> out = new ArrayList<>();
        int o = 0;
        long pc = pc0;
        while (o < raw.length) {
          int n = Math.min(16, raw.length - o);
          byte[] b = new byte[16];
          System.arraycopy(raw, o, b, 0, n);
          PseudoInstruction ins = dis.disassemble(toAddr(pc), b);
          if (ins == null || ins.getLength() <= 0 || o + ins.getLength() > raw.length) {
            out.add(String.format("%08x\t%02x\t??", pc, raw[o] & 0xff));
            o++;
            pc++;
            continue;
          }
          StringBuilder h = new StringBuilder();
          for (int k = 0; k < ins.getLength(); k++) h.append(String.format("%02x", raw[o + k] & 0xff));
          out.add(String.format("%08x\t%s\t%s", pc, h, ins));
          o += ins.getLength();
          pc += ins.getLength();
        }
        Path dest = Paths.get("work", "out", name + ".txt");
        Files.write(dest, out, StandardCharsets.UTF_8);
        println("blob " + name + " " + out.size() + " ins " + String.format("%08x", pc0));
        continue;
      }
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
      0x6040476dL, 0x60405865L, 0x6017a5fcL, 0x611f7f3eL, 0x611f7f44L,
      0x611f7f40L, 0x611f7f42L, 0x60021187L, 0x6004603bL, 0x60045f6fL,
      0x6124f4e5L, 0x615cc934L, 0x615c6234L
    };
    List<String> xref = new ArrayList<>();
    for (long v : targets) {
      Address addr = toAddr(v);
      Reference[] refs = getReferencesTo(addr);
      xref.add(String.format("to %08x refs %d", v, refs.length));
      int shown = 0;
      for (Reference r : refs) {
        if (shown++ >= 40) {
          xref.add("  ...");
          break;
        }
        xref.add(String.format("  from %s type %s", r.getFromAddress(), r.getReferenceType()));
      }
    }
    Files.write(xrefOut, xref, StandardCharsets.UTF_8);
    println("xrefs " + xref.size());

    List<String> chain = new ArrayList<>();
    long[] roots = new long[] {
      0x6040476dL, 0x60405865L, 0x6017a5fcL, 0x6124f4e5L, 0x60045ed5L, 0x611f7f01L
    };
    for (long v : roots) {
      chain.add(String.format("root %08x", v));
      walk(v, 0, chain, new HashSet<Long>());
      chain.add("");
    }
    Path chainOut = Paths.get("work", "out", "callers-c1.txt");
    Files.write(chainOut, chain, StandardCharsets.UTF_8);
    println("callers " + chain.size());
  }

  void walk(long v, int depth, List<String> out, Set<Long> seen) throws Exception {
    String pad = "  ".repeat(depth);
    if (depth > 4) {
      out.add(pad + "depth stop");
      return;
    }
    Address addr = toAddr(v);
    Function f = getFunctionContaining(addr);
    Address entry = f == null ? addr : f.getEntryPoint();
    long entryV = entry.getOffset();
    if (!seen.add(entryV)) {
      out.add(String.format("%ssee %08x", pad, entryV));
      return;
    }
    if (f == null) {
      out.add(String.format("%s%08x no function record", pad, v));
    } else {
      out.add(String.format("%s%08x in %s entry %s body %s-%s",
          pad, v, f.getName(), f.getEntryPoint(), f.getBody().getMinAddress(), f.getBody().getMaxAddress()));
    }
    Reference[] refs = getReferencesTo(entry);
    int n = 0;
    for (Reference r : refs) {
      String t = r.getReferenceType().toString();
      if (!t.contains("CALL") && !t.contains("UNCONDITIONAL_JUMP")) continue;
      if (n++ >= 12) {
        out.add(pad + "  ...");
        break;
      }
      long from = r.getFromAddress().getOffset();
      out.add(String.format("%s  call from %08x %s", pad, from, t));
      walk(from, depth + 1, out, seen);
    }
    if (n == 0) out.add(pad + "  no call refs to entry");
  }

  static byte[] hex(String s) {
    byte[] b = new byte[s.length() / 2];
    for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(s.substring(i * 2, i * 2 + 2), 16);
    return b;
  }
}
