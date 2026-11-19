import json
rows = [json.loads(l) for l in open('work/out/proof1.jsonl', encoding='utf-8') if l.strip()]
for r in rows:
    if not str(r.get('id', '')).startswith('k1e-') and not str(r.get('id', '')).startswith('k2-'):
        continue
    a = r.get('actual') or {}
    h = a.get('half') or {}
    print(r['id'], 'k5962', h.get('k5962'), 'target', a.get('target'), 'half', a.get('halfTarget'), 'scr', a.get('screen'))
