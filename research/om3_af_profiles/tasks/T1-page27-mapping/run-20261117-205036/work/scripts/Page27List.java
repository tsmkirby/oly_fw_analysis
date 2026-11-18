// Read-only listing of the page-27 viewer ranges. Every instruction, with address and bytes.
// Argument: output path. Does not modify the program.
// @category OM3
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Instruction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

public class Page27List extends GhidraScript {
    private static final long[][] RANGES = {
        {0x611c7785L, 170L, 0L},
        {0x611c782fL, 101L, 0L},
        {0x61203a81L, 1024L, 0L},
        {0x61204065L, 45L, 0x61204088L},
    };

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length < 1) {
            throw new IllegalArgumentException("missing output path");
        }
        PseudoDisassembler pseudo = new PseudoDisassembler(currentProgram);
        pseudo.setRespectExecuteFlag(false);
        StringBuilder out = new StringBuilder();
        out.append("program=").append(currentProgram.getName()).append('\n');
        out.append("image_base=0x").append(Long.toHexString(currentProgram.getImageBase().getOffset())).append('\n');
        out.append("mode=existing-listing-then-pseudo\n");
        for (long[] range : RANGES) {
            long start = range[0];
            long nbytes = range[1];
            long mark = range[2];
            long endInclusive = start + nbytes - 1;
            out.append(String.format("RANGE start=0x%08x end=0x%08x bytes=%d%n", start, endInclusive, nbytes));
            Address cur = toAddr(start);
            Address limit = toAddr(start + nbytes);
            int count = 0;
            long covered = 0;
            while (cur.compareTo(limit) < 0) {
                Instruction ins = getInstructionAt(cur);
                int len;
                String text;
                byte[] window = getBytes(cur, (int) Math.min(16, limit.subtract(cur)));
                if (ins != null) {
                    len = ins.getLength();
                    text = ins.toString();
                } else {
                    PseudoInstruction pins = pseudo.disassemble(cur, getBytes(cur, 16));
                    if (pins == null) {
                        out.append(String.format("%08x %02x ??%n", cur.getOffset(), window[0] & 0xff));
                        cur = cur.add(1);
                        covered += 1;
                        count += 1;
                        continue;
                    }
                    len = pins.getLength();
                    text = pins.toString();
                }
                if (cur.add(len).compareTo(limit) > 0) {
                    throw new IllegalStateException(
                            "instruction at 0x" + Long.toHexString(cur.getOffset())
                                    + " length " + len + " crosses range end 0x" + Long.toHexString(limit.getOffset()));
                }
                byte[] raw = getBytes(cur, len);
                StringBuilder hex = new StringBuilder();
                for (int i = 0; i < raw.length; i++) {
                    hex.append(String.format("%02x", raw[i] & 0xff));
                }
                String flag = (mark != 0 && cur.getOffset() == mark) ? " CALLSITE" : "";
                out.append(String.format("%08x %s %s%s%n", cur.getOffset(), hex, text, flag));
                cur = cur.add(len);
                covered += len;
                count += 1;
            }
            if (covered != nbytes) {
                throw new IllegalStateException(
                        "covered " + covered + " expected " + nbytes + " at 0x" + Long.toHexString(start));
            }
            out.append("END instructions=").append(count).append(" covered=").append(covered).append("\n\n");
        }
        String text = out.toString().replace("\r\n", "\n");
        Files.writeString(Paths.get(args[0]), text, StandardCharsets.UTF_8);
        println("wrote " + args[0] + " bytes " + text.length());
    }
}
