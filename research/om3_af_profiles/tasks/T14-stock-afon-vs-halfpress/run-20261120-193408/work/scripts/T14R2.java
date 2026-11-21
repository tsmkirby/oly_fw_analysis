// T14 correction listings and bounded call walk. Read-only program.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.ReferenceIterator;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public class T14R2 extends GhidraScript {
    static final String OUT = "C:/Dev/OM3-tasks/T14-stock-afon-vs-halfpress/ws/work/out/r2";
    static final long[] GOALS = new long[] {
        0x609b3c79L, 0x609b3bb2L, 0x609b3b98L, 0x609b3ba7L, 0x6071128bL, 0x6071129fL,
        0x60447de4L, 0x60063431L, 0x609b3bcaL, 0x60903e55L
    };

    @Override
    public void run() throws Exception {
        Path dir = Paths.get(OUT, "listings");
        Files.createDirectories(dir);
        PseudoDisassembler dis = new PseudoDisassembler(currentProgram);
        dis.setRespectExecuteFlag(false);
        long[][] ranges = new long[][] {
            {0x610a25f1L, 180},
            {0x610a2f40L, 70},
            {0x610a240cL, 80},
            {0x60873dafL, 70},
            {0x60890a0dL, 55},
            {0x6004cdf8L, 70},
            {0x6004cefdL, 35},
            {0x610a3735L, 40},
            {0x60216e4bL, 40},
            {0x60afab08L, 55},
            {0x60905280L, 40},
            {0x60415e30L, 40},
            {0x610a4b91L, 40},
            {0x60983156L, 28},
            {0x610a2407L, 150},
            {0x610a2decL, 110},
            {0x610a3035L, 40},
            {0x610a3225L, 40},
            {0x610a2fc1L, 16},
            {0x610a3663L, 20},
        };
        String[] names = new String[] {
            "custom-start", "release-dispatch", "direct-entry", "sync-body",
            "sync-helper", "sync-cdf8", "sync-cefd", "s1-gate",
            "pose-caller-a", "pose-caller-b", "accessor-caller-b", "input-dispatch",
            "alt-entry", "shadow-store", "event-down", "event-up",
            "event-down-held", "event-up-held", "fn-0a-release", "fn-0a-other"
        };
        for (int r = 0; r < ranges.length; r++) {
            dump(dis, dir.resolve(names[r] + ".txt"), ranges[r][0], (int) ranges[r][1]);
            println("wrote " + names[r]);
        }

        List<String> walk = new ArrayList<>();
        long[] seeds = new long[] {
            0x610a25f1L, 0x610a240cL, 0x610a2df1L, 0x610a5620L, 0x610a58c7L,
            0x610a6323L, 0x610aef37L, 0x610b962aL, 0x610b9653L, 0x60873dafL,
            0x60890a0dL, 0x6004cdf8L, 0x6004cefdL,             0x609024aaL, 0x60216e4bL, 0x60afab08L, 0x610a2407L, 0x610a2decL,
            0x60983156L, 0x610a3035L, 0x610a3225L, 0x610a2fc1L
        };
        for (long s : seeds) {
            walk.add("");
            walk.add("SEED " + hex(s));
            Function f = currentProgram.getFunctionManager().getFunctionContaining(toAddr(s));
            if (f == null) {
                walk.add("  no function");
                continue;
            }
            walk.add("  function " + f.getEntryPoint() + " body " + f.getBody().getMinAddress() + ".." + f.getBody().getMaxAddress());
            List<long[]> calls = callsIn(f);
            int indirect = 0;
            for (long[] c : calls) {
                String mark = isGoal(c[1]) ? " GOAL" : "";
                walk.add(String.format("  call %s -> %s %s%s", hex(c[0]), hex(c[1]), c[2] == 1 ? "call32" : "call16", mark));
                Function cal = currentProgram.getFunctionManager().getFunctionAt(toAddr(c[1]));
                if (cal == null) {
                    cal = currentProgram.getFunctionManager().getFunctionContaining(toAddr(c[1]));
                }
                if (cal != null && cal.getEntryPoint().getOffset() != f.getEntryPoint().getOffset()) {
                    for (long[] inner : callsIn(cal)) {
                        if (isGoal(inner[1])) {
                            walk.add(String.format("    callee %s contains %s -> %s GOAL", cal.getEntryPoint(), hex(inner[0]), hex(inner[1])));
                        }
                    }
                }
            }
            Address a = f.getEntryPoint();
            Address end = f.getBody().getMaxAddress();
            while (a != null && a.compareTo(end) <= 0) {
                ghidra.program.model.listing.Instruction ins = currentProgram.getListing().getInstructionAt(a);
                if (ins == null) {
                    a = a.next();
                    continue;
                }
                if (ins.getFlowType().isCall() && ins.getFlows().length == 0) {
                    walk.add("  indirect " + ins.getAddress() + " " + ins);
                    indirect++;
                }
                a = ins.getMaxAddress().next();
            }
            walk.add("  indirect_count " + indirect);
            walk.add("  keys " + keysIn(f));
        }
        Files.write(Paths.get(OUT, "call-walk.txt"), walk, StandardCharsets.UTF_8);
        println("walk " + walk.size());

        List<String> rev = new ArrayList<>();
        long[] roots = new long[] {0x609b3c79L, 0x609b3b98L, 0x609b3bb2L, 0x609b3ba7L, 0x6071128bL, 0x60447de4L, 0x610a25f1L, 0x610a2df1L, 0x610a5620L};
        Set<Long> seen = new HashSet<>();
        ArrayDeque<long[]> q = new ArrayDeque<>();
        for (long r0 : roots) q.add(new long[] {r0, 0});
        int emitted = 0;
        while (!q.isEmpty() && emitted < 400) {
            long[] item = q.removeFirst();
            long addr = item[0];
            int depth = (int) item[1];
            if (!seen.add(addr) || depth > 4) continue;
            rev.add("REV d=" + depth + " " + hex(addr));
            ReferenceIterator it = currentProgram.getReferenceManager().getReferencesTo(toAddr(addr));
            int c = 0;
            int queued = 0;
            while (it.hasNext()) {
                Reference ref = it.next();
                c++;
                if (c <= 24) {
                    rev.add("  from " + ref.getFromAddress() + " " + ref.getReferenceType());
                }
                if (depth < 4 && ref.getReferenceType().isCall() && queued < 12) {
                    Function cf = currentProgram.getFunctionManager().getFunctionContaining(ref.getFromAddress());
                    if (cf != null) {
                        q.add(new long[] {cf.getEntryPoint().getOffset(), depth + 1});
                        queued++;
                    }
                }
            }
            if (c == 0) rev.add("  none");
            if (c > 24) rev.add("  ..." + c + " refs");
            emitted++;
        }
        Files.write(Paths.get(OUT, "reverse-refs.txt"), rev, StandardCharsets.UTF_8);
        println("rev " + rev.size());
    }

    boolean isGoal(long t) {
        for (long g : GOALS) if (g == t) return true;
        return false;
    }

    String hex(long v) { return String.format("%08x", v); }

    List<long[]> callsIn(Function f) throws Exception {
        List<long[]> out = new ArrayList<>();
        Address a = f.getBody().getMinAddress();
        Address end = f.getBody().getMaxAddress();
        while (a != null && a.compareTo(end) <= 0) {
            ghidra.program.model.listing.Instruction ins = currentProgram.getListing().getInstructionAt(a);
            if (ins == null) {
                a = a.next();
                continue;
            }
            int n = ins.getLength();
            byte[] buf = new byte[n];
            currentProgram.getMemory().getBytes(ins.getAddress(), buf);
            int op = buf[0] & 0xff;
            long site = ins.getAddress().getOffset();
            if (op == 0xcd && n >= 3) {
                int rel = (buf[1] & 0xff) | ((buf[2] & 0xff) << 8);
                if ((rel & 0x8000) != 0) rel |= 0xffff0000;
                out.add(new long[] {site, (site + rel) & 0xffffffffL, 0});
            } else if (op == 0xdd && n >= 5) {
                int rel = (buf[1] & 0xff) | ((buf[2] & 0xff) << 8) | ((buf[3] & 0xff) << 16) | ((buf[4] & 0xff) << 24);
                out.add(new long[] {site, (site + rel) & 0xffffffffL, 1});
            }
            a = ins.getMaxAddress().next();
        }
        return out;
    }

    String keysIn(Function f) throws Exception {
        Address a = f.getBody().getMinAddress();
        int len = (int) (f.getBody().getMaxAddress().getOffset() - a.getOffset() + 1);
        if (len <= 0 || len > 20000) return "skip";
        byte[] buf = new byte[len];
        currentProgram.getMemory().getBytes(a, buf);
        int[] keys = new int[] {0x9a41, 0x1dd1, 0x84d1, 0x88b2, 0x1df1, 0x1e01, 0xe951, 0x9fa1, 0xdfa1, 0x90a1};
        StringBuilder sb = new StringBuilder();
        for (int key : keys) {
            byte lo = (byte) (key & 0xff);
            byte hi = (byte) ((key >> 8) & 0xff);
            for (int i = 0; i + 1 < buf.length; i++) {
                if (buf[i] == lo && buf[i + 1] == hi) {
                    int prev = i > 0 ? (buf[i - 1] & 0xff) : -1;
                    if (prev == 0x2c || prev == 0xcc || (i >= 2 && (buf[i - 2] & 0xff) == 0xfc)) {
                        sb.append(String.format(" %04x@%08x", key, a.getOffset() + i - (prev == 0x2c || prev == 0xcc ? 1 : 2)));
                    }
                }
            }
        }
        byte[] sh = new byte[] {(byte) 0x94, 0x4a, 0x3d, (byte) 0xa3};
        for (int i = 0; i + 8 < buf.length; i++) {
            if (buf[i] == sh[0] && buf[i + 1] == sh[1] && buf[i + 2] == sh[2] && buf[i + 3] == (byte) 0xa3) {
                sb.append(String.format(" shadow94@%08x", a.getOffset() + i));
            }
        }
        return sb.length() == 0 ? "none" : sb.toString();
    }

    void dump(PseudoDisassembler dis, Path path, long pc0, int n) throws Exception {
        List<String> lines = new ArrayList<>();
        long pc = pc0;
        lines.add(String.format("RANGE start=%08x count=%d program=%s", pc0, n, currentProgram.getName()));
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
        Files.write(path, lines, StandardCharsets.UTF_8);
    }
}
