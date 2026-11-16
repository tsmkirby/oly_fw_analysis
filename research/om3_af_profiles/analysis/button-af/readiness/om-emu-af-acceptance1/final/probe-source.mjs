// Compare real OM-Emu player button events with and without the archived AF Home prototype.
// The existing decoded-byte diff is applied in memory only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [checkout, mode='stock', diff, afonCode='0xb', assignment, setup]=process.argv.slice(2);
assert(checkout && (mode==='stock'||mode==='overlay'&&diff));
const acceptance=process.env.OM3_LIVE_ACCEPTANCE==='1';
const requestedSubject=process.env.OM3_LIVE_SCP===undefined?null:Number(process.env.OM3_LIVE_SCP);
assert.ok(requestedSubject===null||(Number.isInteger(requestedSubject)&&requestedSubject>=0&&requestedSubject<=6));
process.env.OM_EMU_MODEL='E147';
const use=p=>import(pathToFileURL(resolve(checkout,'emu',p)).href);
const {loadImage,loadBlock,loadNand,patchedFirmware,createHash}=await use('checks/lib/env.mjs');
const {IMAGE_BASE, A}=await use('src/fw/model.mjs');
const {Player}=await use('src/lab/player.mjs');
const {BY_ID,UIIN_ENTRIES,apply_uiin_layout,uiin_layout}=await use('src/lab/play.mjs');
const {API_SET}=await use('src/lab/menu.mjs');
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
const layout=uiin_layout(fw.rom);
const keyEntry=code=>{
 const entries=layout.groups.flatMap(({entries},group)=>
   entries.filter(([, , candidate])=>candidate===code).map(entry=>[group,...entry]));
 assert.equal(entries.length,1,'one active UI_IN key for '+code.toString(16));
 return entries[0];
};
const selectedMode=/^idle-120b:(0|1):([0-3])$/.exec(setup??'');
const initializeIdle=setup==='idle-120b'||setup==='idle-120b-matrix'||selectedMode!==null;
if(initializeIdle){
 apply_uiin_layout(fw.rom);
 // Register the additional active-low key for the player's initial released image.
 const entry=keyEntry(0x120b);
 assert.equal(entry[4],2);
 UIIN_ENTRIES.set(entry.slice(0,3).join(','),entry);
}
const watched=new Map(Object.entries({
  '6017a5fc':'key_irq','6031eb12':'installer','6031ead0':'ensure','60030659':'mutex_create',
  '6031eb80':'half_wrapper','6031ec99':'half_up_wrapper','6031edb2':'afon_wrapper','6031eecb':'afon_up_wrapper',
  '610b9197':'half_original','610b96f0':'half_up_original','610b962a':'afon_original','610b9653':'afon_up_original',
  '603c86d7':'queue95_start','609e05a6':'queue94_lock_start','603c8d71':'start_ack',
  '61088126':'display_set','61087044':'display_clear','61203696':'multirow_ctor','61203a81':'multirow_lookup',
  '610b43f9':'custom_action_down','610a5620':'af_control_start','610a58c7':'af_control_stop'
}).map(([k,v])=>[parseInt(k,16),v]));
const orderedSites=new Map([
 [0x610b9197,'stock-half-down'],[0x610b96f0,'stock-half-up'],
]);
let calls=[];
let hit={};const covered={mark(pc){
 const at=pc>=0x50000000&&pc<0x52000000?IMAGE_BASE+pc-0x50000000:pc>=0xa0021020&&pc<0xa2021020?pc-0x40000000:pc;
 const symbol=watched.get(at); if(symbol)hit[symbol]=(hit[symbol]??0)+1;
 const call=orderedSites.get(at);
 if(acceptance&&call&&calls.at(-1)!==call&&calls.length<96)calls.push(call);
},stub(){}};
const pl=new Player({...PLAYER_PARSER,no_browser:true,idle:'off',a15:'on',out:'<out>',no_wait_on_error:true},
  {...fw,nand:loadNand(),createHash,wallClock:()=>performance.now()/1000,machine:{coverage:covered},
   ...(mode==='overlay'?{patch:fw.summary,patchRanges:fw.changed,loaded:'on'}:{})});
pl.camapp_components=true;pl.camapp_native_tra=true;
const emit=x=>console.log(JSON.stringify({mode,afonCode,setup,...x}));
try {
 pl.open_session();
 const s=pl.session, l=s.lab;
 if(acceptance&&mode==='overlay'){
   // Observe the calls made by the wrappers themselves. Other GUI tasks call
   // the mutex service as well, and OM-Emu can handle the service entry in HLE.
   const targets=new Map([[0x60032312,'wrapper-lock'],[0x6003791b,'wrapper-unlock']]);
   for(const field of [0x6131bd5c,0x6131bd6c]){
     const entry=l.sim.u32(field);
     assert.ok(entry>=0x6031eb80&&entry<0x6031f000);
     const code=Buffer.from(l.sim.read(entry,255));
     for(let offset=0;offset+7<=code.length;offset++){
       if(code[offset]!==0xdd||code[offset+5]!==0xf0)continue;
       const target=entry+offset+code.readInt32LE(offset+1);
       if(targets.has(target))orderedSites.set(entry+offset,targets.get(target));
     }
   }
 }
 const candidate=keyEntry(Number(afonCode));
 BY_ID.get('afon').uiin=candidate;
 let events=[], dispatch=[], matches=[], input=[];
 const hex=value=>'0x'+(value>>>0).toString(16);
 const inputSites={
   0x60179d62:'uiin_sink',0x601785c9:'uiin_publish',
   0x610b0ac7:'custom_key_dispatch',0x610b0b45:'raw_afon_comparison',
   0x610ad5e7:'button_event_translation',0x610848f2:'key_decode',
   0x610831e6:'assign_value',0x6004610f:'broker_ready',0x6004615f:'broker_receive',
   0x60416117:'filter_match',0x60046154:'filter_result',
   0x6004614d:'broker_remap_result',0x60415e4e:'broker_remap_call',
   0x60414d9c:'tracked_press',0x60414dd6:'tracked_release',0x60414d09:'tracked_conflict',
   0x610a5620:'af_start_entry',0x610a58c7:'af_stop_entry',
   0x61083219:'key_to_function',0x610b23b0:'custom_event'
 };
 for(const [site,name] of Object.entries(inputSites)){
   l.observe(0x50000000+Number(site)-IMAGE_BASE,(lab,r)=>{
     if(input.length<80)input.push({name,d0:hex(r.d0),d1:hex(r.d1),d2:hex(r.d2),a0:hex(r.a0),a1:hex(r.a1),returnAddress:hex(r.mdr),
       ...(name==='filter_match'?{row:hex(r.a2),event:hex(r.a3)}:{}),
       ...(name==='tracked_conflict'?{held:hex(lab.sim.u32(r.a0>>>0))}:{})});
   },'obs-'+name);
 }
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
   uiinSink:l.sim.read(0xa32d9ca4,1)[0],uiinPublish:l.sim.u32(0xa32d9d08),
   target:{
     effectiveSubject:l.sim.read(0x62a6a0eb,1)[0],
     gateMode:l.sim.u32(0xa33ca314)&0xffff,
     gatePhase:l.sim.u32(0xa33ca2b8)&0xffff,
     record:Array.from(l.sim.read(0xa33ca384,10)),
   },
   ...(acceptance?{settings:{subject:s.get(1712),focus:s.get(25)}}:{}),
   fields:[0x6131bd5c,0x6131bd6c,0x6131c29c,0x6131c2ac].map(a=>l.sim.u32(a).toString(16)),
   ...(mode==='overlay'?{owned:Array.from(l.sim.read(0xa031e920,32))}:{})});
 idle(2000);
 emit({step:'startup',...state(),hit});
 if(process.env.OM3_LIVE_AF_MENU==='1'){
   const {MenuWalk}=await use('src/lab/menuwalk.mjs');
   const modelRows=[];
   const descriptor=0x6158f0f8;
   const thirdRow=process.env.OM3_LIVE_AF_MENU_THIRD;
   const observe=(address,callback)=>l.observe(0x50000000+address-IMAGE_BASE,callback,'obs-menu-'+address.toString(16));
   let page;
   if(thirdRow==='both')observe(0x61203a81,(lab,r)=>{
     const viewer=r.a0>>>0;
     if(lab.sim.u32(viewer+0x13e8)!==descriptor)return;
     const model=lab.sim.u32(viewer+0x13e0);
     const category=lab.sim.u32(model+0x2c);
     assert.equal(lab.sim.u32(category)&0xffff,0);
     const provider=lab.sim.u32(category+4);
     const size=lab.sim.u32(provider+0x48)&0xffff;
     if(size===3)return;
     assert.equal(size,2);
     for(const offset of [0x4c,0x50,0x54]){
       const pointer=lab.sim.u32(provider+offset);
       if(!pointer)continue;
       const firstTwo=Buffer.from(lab.sim.read(pointer,4));
       const third=Buffer.from(firstTwo.subarray(0,2));
       if(offset===0x54)third.writeUInt16LE(1712);
       const replacement=Buffer.alloc(4);
       replacement.writeUInt32LE(lab.alloc(Buffer.concat([firstTwo,third]),2));
       lab.sim.write(provider+offset,replacement);
     }
     const newSize=Buffer.alloc(2);
     newSize.writeUInt16LE(3);
     lab.sim.write(provider+0x48,newSize);
   });
   observe(0x61203b95,(lab,r)=>{page=lab.sim.u32((r.a0>>>0)+0x13e8);});
   observe(0x61203bec,(lab,r)=>{
     if(page!==descriptor||modelRows.length>=16)return;
     const model=r.a0>>>0;
     modelRows.push({model:hex(model),list:hex(lab.sim.u32(model+0x2c)),
       count:lab.sim.u32(model+0x30),index:r.d1>>>0});
   });
   observe(0x61203bf1,(_lab,r)=>{
     if(page===descriptor&&modelRows.length&&modelRows.at(-1).setting===undefined)
       modelRows.at(-1).setting=r.d0>>>0;
   });
   observe(0x611f6b32,(lab,r)=>{
     const row=modelRows.at(-1);
     if(page!==descriptor||!row||row.setting!==undefined||row.provider)return;
     const object=r.a0>>>0,vtable=lab.sim.u32(object);
     const size=lab.sim.u32(object+0x48)&0xffff;
     const ids=lab.sim.u32(object+0x54);
     row.provider={get:hex(lab.sim.u32(vtable+0x10)),size,ids:hex(ids),
       values:Array.from({length:Math.min(size,8)},(_,index)=>
         Buffer.from(lab.sim.read(ids+2*index,2)).readUInt16LE())};
   });
   press('menu');
   const walk=new MenuWalk({press,frame:()=>s.frame('boundary'),draws:()=>l.draw_log});
   let menuRow;
   const visited=new Set();
   while(!menuRow){
     const visible=walk.read().texts.map(row=>row.text);
     menuRow=visible.find(text=>text.endsWith('AF Button'));
     if(menuRow)break;
     const page=visible.join('\n');
     assert.ok(!visited.has(page)&&visited.size<64,'AF Button row missing from the live menu pages');
     visited.add(page);
     press('left');
   }
   if(thirdRow==='descriptors'||thirdRow==='both'){
     // Local renderer experiment. Borrow the Subject Detect setting as a
     // third ID, with no edit or save operation.
     const rows=l.sim.u32(descriptor+4);
     assert.equal(l.sim.u32(descriptor+8)&0xffff,2);
     const original=Buffer.from(l.sim.read(rows,72));
     const third=Buffer.from(original.subarray(0,36));
     third.writeUInt32LE(1712,0);
     const relocated=l.alloc(Buffer.concat([original,third]),4);
     const fields=Buffer.from(l.sim.read(descriptor+4,8));
     fields.writeUInt32LE(relocated,0);
     fields.writeUInt16LE(3,4);
     l.sim.write(descriptor+4,fields);
     emit({step:'menu-third-row-fixture',thirdRow,relocated:hex(relocated),addedSetting:1712});
   }
   walk.to([{row:[menuRow]}]);
   const texts=walk.read().texts.map(row=>row.text);
   emit({step:'af-button-page',texts,pagesVisited:visited.size,keys:walk.log,priority:[s.get(2154),s.get(2155)],modelRows});
   emit({done:true});
 } else {
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
 const filter=Array.from({length:75},(_,i)=>{
   const addr=0xa31f1ccc+i*8;
   return [hex(addr),l.sim.u32(addr),l.sim.u32(addr+4)];
 }).filter(([,code])=>code).map(([addr,code,arg])=>[addr,hex(code),hex(arg)]);
 const controls=layout.groups.map(({entries},group)=>({group,entries:entries.filter(([, , code])=>code>0)}));
 const profileRows=[0x6131bd50,0x6131bd60,0x6131c290,0x6131c2a0].map(addr=>
   [hex(addr),...[0,4,8,12].map(offset=>hex(l.sim.u32(addr+offset)))]);
 const remap={gate:l.sim.read(0xa31f2034,1)[0],callback:hex(l.sim.u32(0xa31f2030))};
 const tracked=()=>[0xa31f1f24,0xa31f201c].map(base=>{
   const rows=[];
   for(let i=0;i<31;i++){
     const address=base+i*8;
     const code=l.sim.u32(address);
     if(!code)break;
     const [published,physical]=l.sim.read(address+4,2);
     rows.push({code:hex(code),published,physical});
   }
   return rows;
 });
 if(initializeIdle)assert.ok(tracked()[0].some(row=>row.code==='0x120b'&&!row.published&&!row.physical));
 emit({step:'raw-key-tables',filter,controls,candidate,profileRows,remap,tracked:tracked()});
 if(assignment!==undefined&&assignment!=='-'){
   assert.equal(Number(afonCode),0x120b);
   const previous=s.get(49);
   s.set(49,Number(assignment));
   idle(500);
   assert.equal(s.get(49),Number(assignment));
   emit({step:'assignment',sid:49,previous,value:s.get(49)});
 }
 if(setup==='release-120b'){
   assert.equal(Number(afonCode),0xb);
   BY_ID.get('afon').uiin=keyEntry(0x120b);
   key('afon','down');
   const release=key('afon','up');
   idle(700);
   BY_ID.get('afon').uiin=candidate;
   assert.ok(tracked()[0].some(row=>row.code==='0x120b'&&!row.published&&!row.physical));
   emit({step:'release-parked-key',uiin:release.uiin,tracked:tracked()});
 }
 if(Number(afonCode)===0x120b){
   key('afon','down');
   key('afon','up');
   idle(700);
 }
 const edge=(k,d,config)=>{
   hit={};events=[];dispatch=[];matches=[];input=[];calls=[];const rec=key(k,d);idle(600);
   emit({step:k+':'+d,config,uiin:rec?.uiin,events:rec?.events,...state(),hit,engine:events,prefilter:dispatch,matches,input,
     ...(acceptance?{calls}:{}),
     ...(k==='afon'?{tracked:tracked()}:{})});
 };
 const setMode=(sid,value)=>{
   const write=l.call(API_SET,{d0:sid,d1:value},null,null,200000);
   idle(500);
   const actual=s.get(sid);
   emit({step:'set-mode',sid,want:value,actual,ret:write.d0});
   return actual===value;
 };
 let config;
 if(selectedMode){
   const [,focusArg,lockArg]=selectedMode;
   const focus=Number(focusArg),lock=Number(lockArg),sid=66+focus;
   assert.ok(focus===1||lock<3);
   assert.ok(s.get(25)===focus||setMode(25,focus));
   assert.ok(setMode(sid,lock));
   config={focus:s.get(25),sid,lock:s.get(sid)};
   assert.deepEqual(config,{focus,sid,lock});
 }
 if(requestedSubject!==null){
   assert.ok(s.get(1712)===requestedSubject||setMode(1712,requestedSubject),'SCP readback');
 }
 for(const [k,d] of [['s1','down'],['s1','up'],
     ['afon','down'],['afon','up'],['s1','down'],['afon','down'],['afon','up'],['s1','up'],
     ['afon','down'],['s1','down'],['s1','up'],['afon','up']]){
   edge(k,d,config);
 }
 if(setup==='idle-120b-matrix'){
   for(const [focus,sid,count] of [[0,66,3],[1,67,4]]){
     if(s.get(25)!==focus){
       if(!setMode(25,focus))continue;
     }
     for(let lock=0;lock<count;lock++){
       if(!setMode(sid,lock))continue;
       const config={focus:s.get(25),sid,lock:s.get(sid)};
       assert.deepEqual(config,{focus,sid,lock});
       edge('afon','down',config);
       edge('afon','up',config);
       edge('s1','down',config);
       edge('s1','up',config);
     }
   }
 }
 emit({done:true});
 }
} catch(e) {emit({boundary:e.stack,hit});process.exitCode=1;}
finally {if(pl.session)pl.close_session();}
