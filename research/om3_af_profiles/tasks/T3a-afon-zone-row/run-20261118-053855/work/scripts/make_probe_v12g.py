from pathlib import Path
t = Path('work/scripts/afon_zone_probe_v12f.mjs').read_text(encoding='utf-8')
t = t.replace('v12f', 'v12g')
old = """  idle(1200);
  state.phase = 'm-afmeter';
  press('afmeter');
  idle(400);
  let fr = null;
  const walkLater = () => new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  let walk = walkLater();
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const frameOf = () => { try { return walk.read().frame; } catch (e) { return null; } };
  fr = frameOf();
  emit({ step: 'afmeter', texts: textsOf(), groups: groups.filter((g) => g.phase === 'm-afmeter'), pages: pages.filter((p) => p.phase === 'm-afmeter'), calls: calls.filter((c) => c.phase === 'm-afmeter') });
  if (fr) shot(resolve('work/out/stock-afmeter-v12g.png'), fr);
  press('menu');
  walk = walkLater();
"""
new = """  idle(1200);
  let fr = null;
  const walkLater = () => new MenuWalk({ press, frame: () => s.frame('boundary'), draws: () => l.draw_log }, { limit: 30 });
  let walk = walkLater();
  const textsOf = () => { try { return walk.read().texts.map((t) => t.text); } catch (e) { return []; } };
  const frameOf = () => { try { return walk.read().frame; } catch (e) { return null; } };
  press('menu');
"""
if old not in t:
    raise SystemExit('pattern missing')
Path('work/scripts/afon_zone_probe_v12g.mjs').write_text(t.replace(old, new, 1), encoding='utf-8')
print('wrote', len(t))
