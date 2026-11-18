// Print existing references to the binding-table addresses. Read-only.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.symbol.Reference;
import java.nio.file.*;
import java.util.*;
public class XrefsF1 extends GhidraScript {
  @Override public void run() throws Exception {
    long[] addrs = new long[] {
      0x615c59f4L, 0x615c5e14L, 0x615c59dcL, 0x615c5980L, 0x615c5900L, 0x615c5800L
    };
    List<String> out = new ArrayList<>();
    for (long v : addrs) {
      Address a = toAddr(v);
      Reference[] refs = getReferencesTo(a);
      out.add(String.format("to %08x refs %d", v, refs.length));
      int n = 0;
      for (Reference r : refs) {
        if (n++ >= 20) break;
        out.add(String.format("  from %s type %s", r.getFromAddress(), r.getReferenceType()));
      }
    }
    Path dest = Paths.get(getScriptArgs()[0]);
    if (dest.getParent() != null) Files.createDirectories(dest.getParent());
    Files.write(dest, out);
  }
}
