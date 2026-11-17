// T0 canary: write program name, image base, and the 9 bytes at 0x60405804.
// @category OM3
import ghidra.app.script.GhidraScript;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

public class T0Smoke extends GhidraScript {
    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length < 1) {
            throw new IllegalArgumentException("missing output path");
        }
        byte[] raw = getBytes(toAddr(0x60405804L), 9);
        StringBuilder hex = new StringBuilder();
        for (int i = 0; i < raw.length; i++) {
            if (i > 0) {
                hex.append(' ');
            }
            hex.append(String.format("%02x", raw[i] & 0xff));
        }
        long base = currentProgram.getImageBase().getOffset();
        String text = "program=" + currentProgram.getName() + "\n"
                + "image_base=0x" + Long.toHexString(base) + "\n"
                + "addr=0x60405804\n"
                + "bytes=" + hex + "\n";
        Files.writeString(Paths.get(args[0]), text, StandardCharsets.UTF_8);
        println(text);
    }
}
