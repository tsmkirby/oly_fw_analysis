 // Run stock bank-7 load and default fallback against synthetic RAM images.
 // No flash I/O. Diagnostics and post-load registry rebuild are explicit boundaries.
 // @category OM3
import java.nio.file.*;
import java.util.*;
import java.nio.*;
public class OM3Bank7BootProbe extends OM3FullShooting {
 static final long DESC=0x700b7000L, CFG=0x700b7040L, A=0x71000000L, B=0x71040000L;
 static final long LIVE=0x62920700L;
 static final int SIZE=0x40000;
 int rebuilds;
 @Override boolean external(long where)throws Exception {
  if(where==0x60024a01L||where==0x60023debL)return true;
  if(where==0x6006229bL){rebuilds++;return true;}
  return super.external(where);
 }
 byte[] fixture(int id,long count,int marker,boolean corrupt) {
  byte[] b=new byte[SIZE];
  var w=ByteBuffer.wrap(b).order(ByteOrder.LITTLE_ENDIAN);
  w.putShort(0,(short)id);w.putInt(4,(int)count);w.putShort(SIZE-2,(short)marker);
  int sum=0;for(int i=0;i<b.length;i+=2)sum+=Short.toUnsignedInt(w.getShort(i));
  w.putShort(2,(short)-sum);
  if(corrupt)w.putShort(SIZE-2,(short)(marker+1));
  return b;
 }
 void descriptor(byte[] a,byte[] b)throws Exception {
  e.writeMemory(toAddr(DESC),new byte[0x1c]);e.writeMemory(toAddr(CFG),new byte[0xc]);
  e.writeMemoryValue(toAddr(CFG+8),2,1);
  e.writeMemoryValue(toAddr(DESC),2,0x0c);
  e.writeMemoryValue(toAddr(DESC+4),4,A);
  e.writeMemoryValue(toAddr(DESC+8),4,b==null?0:B);
  e.writeMemoryValue(toAddr(DESC+0xc),4,0x600e4be4L);
  e.writeMemoryValue(toAddr(DESC+0x10),4,LIVE);
  e.writeMemoryValue(toAddr(DESC+0x14),4,SIZE);
  e.writeMemoryValue(toAddr(0xa32bb920L),4,DESC);
  e.writeMemoryValue(toAddr(0xa32bfb30L),2,0x55);
  e.writeMemoryValue(toAddr(0xa32bf934L),4,0);
  e.writeMemory(toAddr(A),a);if(b!=null)e.writeMemory(toAddr(B),b);
  byte[] poison=new byte[SIZE];Arrays.fill(poison,(byte)0x59);e.writeMemory(toAddr(LIVE),poison);
 }
 void trial(List<String> log,String name,byte[] a,byte[] b,int selected)throws Exception {
  descriptor(a,b);rebuilds=0;e.writeRegister("A0",CFG);runNative(0x60063dc0L,0xa0,0x0c);
  check(reg("D0")==0,"native boot branch status");
  check(u8(DESC+2)==Math.max(0,selected),"copy select");
  check(u16(0xa32bfb30L)==(selected<0?1:0),"defaults flag");
  check(rebuilds==(selected<0?2:1),"registry-rebuild call count");
  if(selected>=0) {
   check(Arrays.equals(e.readMemory(toAddr(LIVE),SIZE),selected==0?a:b),"whole selected image copied");
  } else {
   check(u16(LIVE)==0x0c&&u32(LIVE+4)==Integer.toUnsignedLong(ByteBuffer.wrap(a).order(ByteOrder.LITTLE_ENDIAN).getInt(4)),"default header and preserved A sequence");
   check(u32(0xa32bf934L)>LIVE+8&&u16(LIVE+8)==0,"ROM defaults copied to payload, resident end published");
   check(u16(LIVE+SIZE-2)==0x5959,"default helper did not wholesale rewrite area");
  }
  log.add(String.format("PASS %s: %s descriptor-slot=%d defaults=%d runtime-end=%08x",name,selected<0?"default":selected==0?"A copied":"B copied",u8(DESC+2),u16(0xa32bfb30L),u32(0xa32bf934L)));
 }
 @Override public void run()throws Exception {
  Path out=Paths.get(getScriptArgs()[0]);Files.createDirectories(out);List<String> results=new ArrayList<>();String outcome;
  profileInit(6,out);nativeInstructionLimit=6_000_000;
  try{
   byte[] a=fixture(12,8,0x1234,false), bad=fixture(12,8,0x1234,true), wrong=fixture(13,8,0x1234,false);
   byte[] newer=fixture(12,9,0x5678,false), equal=fixture(12,8,0x5678,false), gap=fixture(12,10,0x5678,false);
   trial(results,"stock shape: valid A, B absent",a,null,0);
   trial(results,"stock shape: wrong ID despite zero sum",wrong,null,-1);
   trial(results,"stock shape: last halfword corruption",bad,null,-1);
   trial(results,"synthetic A/B: only B valid",bad,newer,1);
   trial(results,"synthetic A/B: B one generation newer",a,newer,1);
   trial(results,"synthetic A/B: A one generation newer",newer,a,0);
   trial(results,"synthetic A/B: equal generations",a,equal,-1);
   trial(results,"synthetic A/B: gap of two",a,gap,-1);
   trial(results,"synthetic A/B: wrap to zero",fixture(12,0xffffffffL,1,false),fixture(12,0,2,false),1);
   trial(results,"synthetic A/B: neither valid",wrong,bad,-1);
   outcome="PASS 10 native bank-7 area-load cases; synthetic RAM images, diagnostic and registry boundaries; no camera/flash access.";
  }catch(Exception ex){outcome="BOUNDARY "+e.getExecutionAddress()+": "+ex;}
  Files.write(out.resolve("results.txt"),results);Files.writeString(out.resolve("outcome.txt"),outcome+"\n");println(outcome);e.dispose();
 }
}
