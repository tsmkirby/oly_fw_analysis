// Bounded listings of the flash-read callees and the boot-order sites.
// Read-only. Args: <roots-file> <listing-dir> <calls-out>
// Depth and caps are stated in the roots file header and applied here:
//   deep level 0: 500 instructions, then direct callees, then their callees
//   deep level 1: 250 instructions
//   deep level 2: 80 instructions
//   a call past level 2 is named in the call tree and not listed
//   shallow: the one function, cap 500, no callee listings
// A Ghidra function is listed from its body. An address with no function is
// listed linearly for the same cap. Each address is listed once.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.Instruction;
import ghidra.program.model.listing.InstructionIterator;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public class T4bListB1 extends GhidraScript {
  static final int[] CAP = { 500, 250, 80 };
  final Set<Long> listed = new HashSet<>();
  final List<String> calls = new ArrayList<>();

  @Override public void run() throws Exception {
    String[] a = getScriptArgs();
    Path roots = Paths.get(a[0]);
    Path dir = Paths.get(a[1]);
    Path callOut = Paths.get(a[2]);
    Files.createDirectories(dir);
    if (callOut.getParent() != null) Files.createDirectories(callOut.getParent());
    for (String line : Files.readAllLines(roots, StandardCharsets.UTF_8)) {
      line = line.trim();
      if (line.isEmpty() || line.startsWith("#")) continue;
      String[] p = line.split("\\s+");
      boolean deep = p[0].equals("deep");
      long addr = Long.parseLong(p[1], 16);
      String name = p[2];
      calls.add("root " + name + " " + String.format("%08x", addr) + (deep ? " deep" : " shallow"));
      listOne(addr, name, 0, deep ? 2 : 0);
      calls.add("");
    }
    Files.write(callOut, calls, StandardCharsets.UTF_8);
    println("listed " + listed.size());
  }

  void listOne(long addr, String name, int depth, int maxDepth) throws Exception {
    String pad = "  ".repeat(depth);
    if (depth > maxDepth) {
      calls.add(pad + "unnamed " + String.format("%08x", addr));
      return;
    }
    if (!listed.add(addr)) {
      calls.add(pad + "already " + String.format("%08x", addr));
      return;
    }
    Address start = toAddr(addr);
    Function fn = getFunctionAt(start);
    List<String> lines = new ArrayList<>();
    List<Long> callees = new ArrayList<>();
    int cap = CAP[Math.min(depth, CAP.length - 1)];
    boolean truncated = false;
    String how;
    if (fn != null) {
      how = "function " + fn.getName() + " " + fn.getEntryPoint();
      InstructionIterator it = currentProgram.getListing().getInstructions(fn.getBody(), true);
      int n = 0;
      while (it.hasNext()) {
        if (n >= cap) { truncated = true; break; }
        Instruction ins = it.next();
        lines.add(fmt(ins));
        if (ins.getFlowType().isCall()) collect(ins, callees);
        n++;
      }
    } else {
      how = "linear no-function";
      long pc = addr;
      for (int n = 0; n < cap; n++) {
        Instruction ins = currentProgram.getListing().getInstructionAt(toAddr(pc));
        if (ins == null) {
          lines.add(String.format("%08x\t??\tno-instruction", pc));
          break;
        }
        lines.add(fmt(ins));
        if (ins.getFlowType().isCall()) collect(ins, callees);
        if (ins.getFlowType().isTerminal() && !ins.getFlowType().isCall()) break;
        pc += ins.getLength();
      }
    }
    if (truncated) lines.add(String.format("TRUNCATED %08x cap %d", addr, cap));
    Path dest = dir.resolve(String.format("d%d-%s-%08x.txt", depth, name, addr));
    List<String> body = new ArrayList<>();
    body.add("# " + how + " depth " + depth + " cap " + cap + (truncated ? " TRUNCATED" : ""));
    body.addAll(lines);
    Files.write(dest, body, StandardCharsets.UTF_8);
    calls.add(pad + String.format("list %08x %s ins %d callees %d%s", addr, dest.getFileName(), lines.size(), callees.size(), truncated ? " TRUNCATED" : ""));
    LinkedHashSet<Long> unique = new LinkedHashSet<>(callees);
    for (long target : unique) {
      calls.add(pad + "  call " + String.format("%08x", target));
      if (depth < maxDepth) listOne(target, "callee", depth + 1, maxDepth);
      else calls.add(pad + "    not-listed " + String.format("%08x", target));
    }
  }

  void collect(Instruction ins, List<Long> callees) {
    for (Address t : ins.getFlows()) callees.add(t.getOffset());
  }

  String fmt(Instruction ins) throws Exception {
    byte[] b = ins.getBytes();
    StringBuilder h = new StringBuilder();
    for (byte v : b) h.append(String.format("%02x", v & 0xff));
    return String.format("%08x\t%s\t%s", ins.getAddress().getOffset(), h, ins);
  }
}
