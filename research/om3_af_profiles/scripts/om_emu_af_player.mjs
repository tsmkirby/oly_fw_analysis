// Compare real OM-Emu player button events with and without the archived AF Home prototype.
// The existing decoded-byte diff is applied in memory only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [checkout, mode='stock', diff]=process.argv.slice(2);
assert(checkout && (mode==='stock'||mode==='overlay'&&diff));
process.env.OM_EMU_MODEL='E147';
const use=p=>import(pathToFileURL(resolve(checkout,'emu',p)).href);
const {loadImage,loadBlock,loadNand,patchedFirmware,createHash}=await use('checks/lib/env.mjs');
const {IMAGE_BASE, A}=await use('src/fw/model.mjs');
const {Player}=await use('src/lab/player.mjs');
const {PLAYER_PARSER}=await use('scenarios/session_replay.mjs');
let fw={rom:loadImage(),resBlock:loadBlock()};
if(mode==='overlay') {
 const rows=readFileSync(diff,'utf8').trim().split(/\r?\n/).slice(1);
 const patches=[];
 for(const row of rows) {
   const [o,,old,next]=row.split(',');
   const off=parseInt(o,16);
   const last=patches.at(-1);
   if(last&&off===last.offset+last.old.length) {last.old.push(parseInt(old,16));last.new.push(parseInt(next,16));}
   else patches.push({offset:off,old:[parseInt(old,16)],new:[parseInt(next,16)]});
 }
 fw=patchedFirmware(patches.map((x,n)=>({block:'main',offset:x.offset,old:Uint8Array.from(x.old),new:Uint8Array.from(x.new),source:diff,n})));
}
const watched=new Map(Object.entries({
  '6017a5fc':'key_irq','6031eb12':'installer','6031ead0':'ensure','60030659':'mutex_create',
  '6031eb80':'half_wrapper','6031ec99':'half_up_wrapper','6031edb2':'afon_wrapper','6031eecb':'afon_up_wrapper',
  '610b9197':'half_original','610b96f0':'half_up_original','610b962a':'afon_original','610b9653':'afon_up_original',
  '603c86d7':'queue95_start','609e05a6':'queue94_lock_start','603c8d71':'start_ack',
  '61088126':'display_set','61087044':'display_clear','61203696':'multirow_ctor','61203a81':'multirow_lookup'
}).map(([k,v])=>[parseInt(k,16),v]));
let hit={};const covered={mark(pc){
 const at=pc>=0x50000000&&pc<0x52000000?IMAGE_BASE+pc-0x50000000:pc>=0xa0021020&&pc<0xa2021020?pc-0x40000000:pc;
 const symbol=watched.get(at); if(symbol)hit[symbol]=(hit[symbol]??0)+1;
},stub(){}};
const pl=new Player({...PLAYER_PARSER,no_browser:true,idle:'off',a15:'on',out:'<out>',no_wait_on_error:true},
  {...fw,nand:loadNand(),createHash,wallClock:()=>performance.now()/1000,machine:{coverage:covered},
   ...(mode==='overlay'?{patch:fw.summary,patchRanges:fw.changed,loaded:'on'}:{})});
pl.camapp_components=true;pl.camapp_native_tra=true;
const emit=x=>console.log(JSON.stringify({mode,...x}));
try {
 pl.open_session();
 const s=pl.session, l=s.lab;
 let events=[], dispatch=[], matches=[];
 l.observe(0x50000000+0x610beb04-IMAGE_BASE,(lab,r)=>{
   if(events.length>=200||r.a0<0x60000000) return;
   events.push({event:'0x'+(r.d0>>>0).toString(16),shoot:'0x'+lab.sim.u32((r.a0>>>0)+0xac).toString(16),
                secondary:'0x'+lab.sim.u32((r.a0>>>0)+0xb8).toString(16)});
 },'obs-af-engine-entry');
 l.observe(0x50000000+0x610becab-IMAGE_BASE,(lab,r)=>{
   if(!r.d0 && dispatch.length<100)dispatch.push({matched:false});
   else if(dispatch.length<100)dispatch.push({matched:true,d0:'0x'+(r.d0>>>0).toString(16)});
 },'obs-af-engine-prefilter');
 l.observe(0x50000000+0x610b9feb-IMAGE_BASE,(lab,r)=>{
   if(matches.length>=160) return;
   const row=r.a1>>>0;
   matches.push({event:'0x'+(r.d0>>>0).toString(16),row:'0x'+row.toString(16),handler:'0x'+lab.sim.u32(row+12).toString(16)});
 },'obs-af-engine-row');
 const getString=A(0x510bb079);
 const label=id=>{
   const v=l.call(getString,{d0:id},null,null,200000).a0>>>0;
   return v?Buffer.from(l.sim.read(v,128)).toString('utf16le').split(String.fromCharCode(0))[0]:null;
 };
 const ids=[0x1279,0x06b1,0x282c,0x127b,0x124f,0x0f19,0x11c4];
 emit({step:'menu-labels',strings:Object.fromEntries(ids.map(id=>['0x'+id.toString(16),label(id)])),
       values:Object.fromEntries([2154,2155,1936].map(id=>[id,s.get(id)]))});
 const idle=(ms)=>{const to=l.lab_time()+ms*1e6;while(l.lab_time()<to)s.idle_slice(Math.min(to,l.lab_time()+50e6));};
 const key=(k,d)=>{const rec=s.key(k,d);s.camapp.pump();return rec;};
 const press=(k)=>{key(k,'down');idle(100);key(k,'up');idle(800);};
 const phase=()=>l.call(A(0x50AB57E9),{},null,null,200000).d0;
 const state=()=>({...s.status().still_movie!==undefined?{still:s.status().still_movie,movie:s.get(44)}:{},
   phase:phase(),gui:s.status().gui,display:l.sim.u32(0x62b7f7b4),
   fields:[0x6131bd5c,0x6131bd6c,0x6131c29c,0x6131c2ac].map(a=>l.sim.u32(a).toString(16)),
   ...(mode==='overlay'?{owned:Array.from(l.sim.read(0xa031e920,32))}:{})});
 idle(2000);
 emit({step:'startup',...state(),hit});
 press('menu');press('menu');
 const assignments=[];
 for(const sid of [47,48,49,50,51,52,53,54,55,56,528,570,571,572,578,1292,1294,1295,1296,1297,1507,1508,1509,1510,1511,1512,1513,1957,1959,1964,1966]){
   try{
     const choices=l.scalar_keys(sid,'research read');
     assignments.push({sid,value:s.get(sid),supports69:choices.includes(69),supports9:choices.includes(9)});
   } catch(e) { assignments.push({sid,error:e.message}); }
 }
 emit({step:'stock-custom-settings',assignments});
 emit({step:'shooting',...state(),hit});
 for(const [k,d] of [['afon','down'],['afon','up'],['s1','down'],['afon','down'],['afon','up'],['afon','down'],['afon','up'],['s1','up']]){
   hit={};events=[];dispatch=[];matches=[];const rec=key(k,d);idle(600);
   emit({step:k+':'+d,uiin:rec?.uiin,events:rec?.events,...state(),hit,engine:events,prefilter:dispatch,matches});
 }
 emit({done:true});
} catch(e) {emit({boundary:e.stack,hit});process.exitCode=1;}
finally {if(pl.session)pl.close_session();}
