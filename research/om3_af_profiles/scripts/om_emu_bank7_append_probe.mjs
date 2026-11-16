// Bank-7 append compatibility experiment on stock OM-Emu E147 instructions.
// Candidate descriptor and old image are synthetic RAM buffers, never emitted as firmware.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [repo, binary] = process.argv.slice(2);
assert(repo && binary,'usage: script OM_EMU decoded_main');
process.env.OM_EMU_MODEL='E147';
const use=p=>import(pathToFileURL(resolve(repo,'emu',p)).href);
const {IMAGE_BASE, MODEL}=await use('src/fw/model.mjs');
const {createMachine}=await use('src/machine.mjs');
const raw=readFileSync(binary);
assert.equal(MODEL,'E147');
assert.equal(createHash('sha256').update(raw).digest('hex'),'5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59');
const START=0x600e4bec, END=0x6011fe20, LIVE=0x62920700, BANK_SIZE=0x40000;
const PTR=0x66000000, REG=0x65010000, TOP=0x65020000, STOP=0x65030000;
const raw16=a=>raw.readUInt16LE(a-IMAGE_BASE);
function stream(start) {
 const records=[];
 let a=start;
 for(let i=0;i<4096;i++){
   const key=raw16(a);
   if(!key)return {records,end:a};
   const count=raw16(a+2),width=(key&3)||4;
   assert([1,2,4].includes(width)&&count>0,'descriptor '+a.toString(16));
   records.push({key,count,width});a=(a+4+count*width+3)&~3;
 }
 throw new Error('unbounded table');
}
const stock=stream(START);
assert.equal(stock.end,END);assert.equal(stock.records.length,1215);
const used = new Set([0x60095584,0x600b8f54,0x600bb5ec,0x600bda78,START]
 .flatMap(start=>stream(start).records.map(x=>x.key>>>4)));
const SLOT = Array.from({length:4095},(_,i)=>4095-i).find(slot=>!used.has(slot));
assert(SLOT,'no free synthetic slot in the scanned registry tables');
const KEY=(SLOT<<4)|4;
const m=createMachine({rom:raw,dramBytes:128<<20,insnLimit:0});
const read=(a,n)=>Buffer.from(m.dbgRead(a,n));
const u32=a=>read(a,4).readUInt32LE();
const u16=a=>read(a,2).readUInt16LE();
const w=(a,v,n=4)=>{const b=Buffer.alloc(n);b.writeUIntLE(v,0,n);m.dbgWrite(a,b);};
function call(entry,frame,{a0=0,a1=0,d0=0,d1=0}={}){
 m.dbgWrite(TOP-frame,Buffer.alloc(frame+4));w(TOP,STOP);
 const r=new Uint32Array(16);
 r[0]=d0;r[1]=d1;r[4]=a0;r[5]=a1;r[8]=TOP-frame;r[9]=entry;r[11]=STOP;
 m.setRegs(r);m.setBreakpoints([STOP,0x60068a54,0x60024a01]);
 for(let i=0;i<12;i++){
   m.cont();
   const hit=m.getReg(9);
   assert.equal(m.lastStop()?.kind,'break',JSON.stringify({entry,hit,stop:m.lastStop()}));
   if(hit===STOP){assert.equal(m.getReg(8),TOP);return m.getReg(0);}
   assert.equal(hit,0x60024a01,'unexpected error or diagnostic');
   const sp=m.getReg(8)+4,ret=u32(sp);
   assert.equal(ret,m.getReg(11));m.setReg(8,sp);m.setReg(9,ret);
 }
 throw new Error('did not return');
}
const json=x=>console.log(JSON.stringify(x));
const defaults=(desc)=>call(0x60062d93,0x34,{a0:LIVE,a1:desc,d0:BANK_SIZE});
const init=(desc)=>{m.dbgWrite(REG,Buffer.alloc(0x8000));
 assert.equal(call(0x60062536,0x30,{a0:desc,a1:LIVE+8,d0:REG}),0);
 return read(REG,0x8000);
};
const endWord=0xa32bf934;
m.dbgWrite(LIVE,Buffer.alloc(BANK_SIZE,0x59));
assert.equal(defaults(START),0);
w(LIVE,12,2);w(LIVE+4,8);
call(0x60061422,0x08,{a0:LIVE,d0:BANK_SIZE});
assert.equal(call(0x6006137a,0x14,{a0:LIVE,d0:BANK_SIZE,d1:12}),0,'checksum-valid old-shaped area');
const end=u32(endWord), candidate=(end+3)&~3;
assert.equal(end,0x62959b65);
const payload=read(LIVE+8,end-LIVE-8);
const stockReg=init(START);
const original=raw.subarray(START-IMAGE_BASE,END-IMAGE_BASE);
const extended=Buffer.alloc(original.length+24);
original.copy(extended);
extended.writeUInt16LE(KEY,original.length);
extended.writeUInt16LE(4,original.length+2);
m.dbgWrite(PTR,extended);
assert.equal(u32(candidate),0x59595959);

const oldWithNewDescriptors=init(PTR);
const slotOff=SLOT*8;
assert.equal(oldWithNewDescriptors.readUInt16LE(slotOff),KEY);
assert.equal(oldWithNewDescriptors.readUInt16LE(slotOff+2),4);
assert.equal(oldWithNewDescriptors.readUInt32LE(slotOff+4),candidate);
oldWithNewDescriptors.fill(0,slotOff,slotOff+8);
assert(oldWithNewDescriptors.equals(stockReg),'existing registry entries changed');
assert.equal(u32(candidate),0x59595959,'registering a key must not be mistaken for initializing it');
json({case:'append registers 4 words without moving any of the stock bank-7 entries',slot:'experimental 0x'+SLOT.toString(16),profile_address:'0x'+candidate.toString(16),old_tail_word:'0x'+u32(candidate).toString(16),stock_validator_status:0});
assert.equal(defaults(PTR),0);
assert.equal(u32(endWord),candidate+16);
const prefix=read(LIVE+8,payload.length);
if(!prefix.equals(payload)){
 const diffs=[];let n=0;for(let i=0;i<prefix.length;i++)if(prefix[i]!==payload[i]){n++;if(diffs.length<12)diffs.push([i+8,payload[i],prefix[i]]);}
 json({prefix_differences:n,first_differences:diffs});
}
assert(prefix.equals(payload));
assert(read(candidate,16).equals(Buffer.alloc(16)));
assert(read(candidate+16,4).equals(Buffer.alloc(4,0x59)));
w(candidate,0x3146414f);
call(0x60061422,0x08,{a0:LIVE,d0:BANK_SIZE});
assert.equal(call(0x6006137a,0x14,{a0:LIVE,d0:BANK_SIZE,d1:12}),0,'stock validator also accepts synthetic extended area');
assert(init(START).equals(stockReg),'old registration must ignore appended payload data');
json({case:'stock validator and old registry accept the synthetic extended area without registering the added key',stock_validator_status:0,pass:true});
json({case:'extended defaults initialize only the appended words and retain the stock value prefix',new_end:'0x'+u32(endWord).toString(16),pass:true});
json({pass:true,scope:'isolated native ROM registration/defaults, synthetic descriptor and RAM only; no save, reset, Workspace export, hardware or approved production key'});
