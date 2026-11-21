// T14 read-only listings and reference dump. Linear pseudo-disassembly.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import ghidra.program.model.address.Address;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.ReferenceIterator;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public class T14Dump extends GhidraScript {
    static final String OUT = "C:/Dev/OM3-tasks/T14-stock-afon-vs-halfpress/ws/work/out";

    @Override
    public void run() throws Exception {
        Path dir = Paths.get(OUT, "listings");
        Files.createDirectories(dir);
        PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
        dis.setRespectExecuteFlag(false);
        long[][] ranges = new long[][] {
            {0x609b3480L, 220},
            {0x609b3b80L, 280},
            {0x609b3ecdL, 180},
            {0x609832f0L, 80},
            {0x60903e40L, 40},
            {0x609025cfL, 160},
            {0x60711280L, 30},
            {0x60447de4L, 90},
            {0x608fe1b0L, 40},
            {0x610a5620L, 250},
            {0x610a58c7L, 70},
            {0x610a5f10L, 140},
            {0x610a6323L, 70},
            {0x610aef37L, 40},
            {0x610b9197L, 40},
            {0x610b962aL, 50},
            {0x60a8f200L, 16},
            {0x610bf5b9L, 40},
            {0x609b3780L, 180},
            {0x609b3980L, 90},
            {0x609eed20L, 40},
            {0x609eff40L, 50},
            {0x609f0680L, 50},
            {0x609b34d1L, 20},
            {0x609023e0L, 120},
            {0x609e7180L, 80},
        };
        String[] names = new String[] {
            "struct-helpers", "writer-accessor", "converter", "shadow-replace",
            "record-copy", "af-init", "dirty-wrappers", "pose-refresh",
            "af-reset", "af-start", "af-release", "afon-owner", "release-common",
            "s1-handler", "handler-9197", "afon-handlers", "builder-pad",
            "classifier-head", "priority-cache", "priority-cache-b",
            "alt-position", "alt-kind-a",             "alt-kind-b", "cache-entry", "priority-use-a", "priority-use-b"
        };
        for (int r = 0; r < ranges.length; r++) {
            List<String> lines = new ArrayList<>();
            long pc = ranges[r][0];
            int n = (int) ranges[r][1];
            lines.add(String.format("RANGE start=%08x count=%d program=%s", pc, n, currentProgram.getName()));
            for (int i = 0; i < n; i++) {
                byte[] b = new byte[16];
                Address a = toAddr(pc);
                try {
                    currentProgram.getMemory().getBytes(a, b);
                } catch (Exception ex) {
                    lines.add(String.format("%08x\t??", pc));
                    break;
                }
                PseudoInstruction ins = dis.disassemble(a, b);
                if (ins == null) {
                    lines.add(String.format("%08x\t%02x\t??", pc, b[0] & 0xff));
                    pc++;
                    continue;
                }
                StringBuilder h = new StringBuilder();
                int len = ins.getLength();
                for (int k = 0; k < len; k++) h.append(String.format("%02x", b[k] & 0xff));
                lines.add(String.format("%08x\t%s\t%s", pc, h, ins));
                pc += len;
            }
            Files.write(dir.resolve(names[r] + ".txt"), lines, StandardCharsets.UTF_8);
            println("wrote " + names[r] + " " + lines.size());
        }
        long[] refs = new long[] {
            0x609b3c79L, 0x609b3bb2L, 0x609b3b98L, 0x609b3ba7L, 0x609b348aL,
            0x609b3ecdL, 0x60903e55L, 0x610a5620L, 0x610a58c7L, 0x610b962aL,
            0x60a8f6bbL, 0x60a8f2beL, 0xa33f2ce0L, 0xa33ca384L, 0xa031ed04L,
            0xa33f2ceaL, 0xa33f2c9cL
        };
        List<String> refLines = new ArrayList<>();
        for (long v : refs) {
            Address a = toAddr(v);
            refLines.add("REFS " + a);
            ReferenceIterator it = currentProgram.getReferenceManager().getReferencesTo(a);
            int c = 0;
            while (it.hasNext() && c < 40) {
                Reference ref = it.next();
                refLines.add("  from " + ref.getFromAddress() + " type " + ref.getReferenceType());
                c++;
            }
            if (c == 0) refLines.add("  none");
        }
        Files.write(dir.resolve("ghidra-refs.txt"), refLines, StandardCharsets.UTF_8);
        println("refs " + refLines.size());
    }
}
