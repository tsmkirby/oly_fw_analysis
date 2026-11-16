// OM-Emu E147 read-only research: native bank-7 validation/copy/default tests or live switch test.
// Supply the OM-Emu checkout path and the exact decoded main. Synthetic settings are RAM-only.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repo, main, mode = 'bank7'] = process.argv.slice(2);
assert(repo && main && ['bank7','switch'].includes(mode), 'usage: script OM_EMU MAIN [bank7|switch]');
process.env.OM_EMU_MODEL = 'E147';
const use = p => import(pathToFileURL(resolve(repo, 'emu', p)).href);
const raw = readFileSync(main);
const sha = createHash('sha256').update(raw).digest('hex');
assert.equal(sha,'5e8d376e9111a44ac0352f26030d7c1b17026d42c45f3600cfa02a0e8c5b7d59');
const { IMAGE_BASE, MODEL } = await use('src/fw/model.mjs');
assert.equal(MODEL,'E147');
assert.equal(IMAGE_BASE,0x60021020);
const { expandImage } = await use('src/fw/expand.mjs');
const rom = expandImage(raw);
const emit = x => console.log(JSON.stringify(x));
emit({model: MODEL, main_sha256: sha, cpu_base: '0x60021020', mode});

if (mode === 'switch') {
  const { Player } = await use('src/lab/player.mjs');
  const { PLAYER_PARSER } = await use('scenarios/session_replay.mjs');
  const { loadBlock, loadNand } = await use('checks/lib/env.mjs');
  const { REGISTRY_INIT } = await use('src/lab/menu.mjs');
  const watched = new Map([
    [0x60062691,'registry_bootstrap'], [0x60063dc0,'load_dispatch'],
    [0x60063e85,'bank7_load_call'], [0x6006137a,'area_validator'],
    [0x60063eb2,'bank7_defaults_call'], [0x60063ebb,'bank7_load_success'],
    [0x60062d28,'bank7_defaults'],
  ]);
  const hits = Object.fromEntries([...watched.values()].map(name => [name,0]));
  const coverage = { stub() {}, mark(pc) {
    const mainPc = pc >= 0x50000000 && pc < 0x52000000 ? IMAGE_BASE+pc-0x50000000 :
                   pc >= 0xa0021020 && pc < 0xa2021020 ? pc-0x40000000 : pc;
    const name = watched.get(mainPc);
    if(name) hits[name]++;
  }};
  const pl = new Player({ ...PLAYER_PARSER, no_browser: true, idle: 'off', out: '<out>', no_wait_on_error: true },
                        { rom, resBlock: loadBlock(), nand: loadNand(), createHash, machine: {coverage}, wallClock: () => performance.now()/1000 });
  pl.open_session();
  try {
    const s = pl.session;
    const wait = t => s.idle_slice(s.lab.lab_time() + t * 1e6);
    wait(1500);
    emit({startup_coverage: hits});
    emit({ registry_entry: '0x'+REGISTRY_INIT.toString(16), store_phases:s.lab.store_log?.phases?.slice(0,6) ?? [] });
    const seen = (position, movie, label) => {
      const st = s.status();
      assert.equal(st.still_movie,position);
      assert.equal(s.get(44),movie);
      emit({position,movie_setting_44:movie,label});
    };
    seen(2,0,'fresh start: stills');
    for (const [position,movie,label] of [[1,1,'movie (level 2)'],[0,1,'movie (level 3)'],[2,0,'stills']]) {
      const rec = pl.run_input({type:'switch',id:'still_movie',value:position});
      s.camapp.pump();
      wait(1000);
      assert.equal(rec.position.label,label);
      assert(rec.uiin.some(x => x.code === '0x02021909'));
      seen(position,movie,label);
    }
    emit({pass:true, checks:4, memory_pokes:0});
  } finally { pl.close_session(); }
} else {
  const { createMachine } = await use('src/machine.mjs');
  const m = createMachine({rom,dramBytes:128<<20,insnLimit:0});
  const DESC=0x650b7000, CFG=0x650b7040, A=0x66000000, B=0x66040000;
  const LIVE=0x62920700, TOP=0x66100000, STOP=0x66110000, SIZE=0x40000;
  const u16=a=>Buffer.from(m.dbgRead(a,2)).readUInt16LE();
  const u32=a=>Buffer.from(m.dbgRead(a,4)).readUInt32LE();
  const w=(a,v,n=4)=>{const b=Buffer.alloc(n);b.writeUIntLE(v,0,n);m.dbgWrite(a,b);};
  const stubs=new Map([[0x60024a01,4],[0x60023deb,0x1c],[0x6006229b,0x28]]);
  const fixture=(id,count,marker,bad=false)=>{
    const b=Buffer.alloc(SIZE);
    b.writeUInt16LE(id); b.writeUInt32LE(count,4); b.writeUInt16LE(marker,SIZE-2);
    let sum=0;
    for(let i=0;i<SIZE;i+=2) sum=(sum+b.readUInt16LE(i))&0xffff;
    b.writeUInt16LE((-sum)&0xffff,2);
    if(bad) b.writeUInt16LE(marker+1,SIZE-2);
    return b;
  };
  function run(a,b,selected,name) {
    m.dbgWrite(DESC,Buffer.alloc(0x1c));m.dbgWrite(CFG,Buffer.alloc(0xc));
    w(CFG+8,1,2);w(DESC,12,2);w(DESC+4,A);w(DESC+8,b?B:0);
    w(DESC+0xc,0x600e4be4);w(DESC+0x10,LIVE);w(DESC+0x14,SIZE);
    w(0xa32bb920,DESC);w(0xa32bfb30,0x55,2);w(0xa32bf934,0);
    m.dbgWrite(A,a); if(b)m.dbgWrite(B,b);m.dbgWrite(LIVE,Buffer.alloc(SIZE,0x59));
    m.dbgWrite(TOP-0x0c,Buffer.alloc(0x10));w(TOP,STOP);
    const r=new Uint32Array(16);
    r[4]=CFG;r[8]=TOP-0x0c;r[9]=0x60063dc0;r[11]=STOP;
    m.setRegs(r);m.setBreakpoints([STOP,...stubs.keys()]);
    let rebuilds=0, gotStop=false;
    for(let i=0;i<64;i++){
      const kind=m.cont();
      const pc=m.getReg(9);
      assert.equal(kind,'stop',name+': '+JSON.stringify(m.lastStop()));
      assert.equal(m.lastStop()?.kind,'break',name+': PC '+pc.toString(16)+' '+JSON.stringify(m.lastStop()));
      if(pc===STOP){gotStop=true;break;}
      assert(stubs.has(pc),name+': unexpected stop '+pc.toString(16));
      if(pc===0x6006229b)rebuilds++;
      const sp=(m.getReg(8)+stubs.get(pc))>>>0;
      const ret=u32(sp);
      assert.equal(ret,m.getReg(11),name+': stub return frame');
      m.setReg(8,sp);m.setReg(9,ret);
    }
    assert(gotStop,name+': no root return');
    assert.equal(m.getReg(8),TOP,name+': restored SP');
    assert.equal(m.getReg(0),0,name+': boot status');
    assert.equal(u16(DESC+2),Math.max(0,selected),name+': selected slot');
    assert.equal(u16(0xa32bfb30),selected<0?1:0,name+': defaults flag');
    assert.equal(rebuilds,selected<0?2:1,name+': registry boundary count');
    if(selected>=0) assert(Buffer.from(m.dbgRead(LIVE,SIZE)).equals(selected===0?a:b),name+': full area copied');
    else {
      assert.equal(u16(LIVE),12,name+': default ID');
      assert.equal(u32(LIVE+4),a.readUInt32LE(4),name+': A sequence retained');
      assert.equal(u16(LIVE+8),0,name+': ROM defaults start');
      assert.equal(u32(0xa32bf934),0x62959b65,name+': published runtime end');
      assert.equal(u16(LIVE+SIZE-2),0x5959,name+': poisoned tail retained');
    }
    emit({name,pass:true,selected:selected<0?'defaults':selected===0?'A':'B',rebuilds});
  }
  const a=fixture(12,8,0x1234), bad=fixture(12,8,0x1234,true), wrong=fixture(13,8,0x1234);
  const newer=fixture(12,9,0x5678), equal=fixture(12,8,0x5678), gap=fixture(12,10,0x5678);
  for(const trial of [
    [a,null,0,'stock shape: valid A, B absent'],[wrong,null,-1,'stock shape: wrong ID despite zero sum'],
    [bad,null,-1,'stock shape: last halfword corruption'],[bad,newer,1,'synthetic A/B: only B valid'],
    [a,newer,1,'synthetic A/B: B one generation newer'],[newer,a,0,'synthetic A/B: A one generation newer'],
    [a,equal,-1,'synthetic A/B: equal generations'],[a,gap,-1,'synthetic A/B: gap of two'],
    [fixture(12,0xffffffff,1),fixture(12,0,2),1,'synthetic A/B: wrap to zero'],
    [wrong,bad,-1,'synthetic A/B: neither valid'],
  ]) run(...trial);
  emit({pass:true,checks:10,scope:'isolated stock instructions; synthetic RAM copies, diagnostics and registry rebuild intercepted; no NAND I/O'});
}
