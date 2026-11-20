// Generated table for the T8d short proof. Not an experiment version.
// Press bytes come from K1e's S1. Release bytes come from the candidate's own S1.
// Every AF-ON exit matches a K2 press or release of the same key. No ten-byte literal.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const P = {
  subject: 'T8c brief section 0: 0x1e71[0] is 0 after every key',
  bank: 'T8c Q1: saved index the stock direct screen writes when the link is on',
  flagOn: 'T3m decision: MODE is 1 while the AF-ON editor is open',
  flagOff: 'T3m decision: leave writes MODE 0',
  flagImage: 'Image MODE is 255 until the hook writes it. K1e and K2 do not install the hook.',
  ownerOn: 'T8c brief section 2.3: AF-ON press owner is 2',
  ownerOff: 'T8c brief section 2.3: AF-ON release owner is 0',
  ownerS1: 'T8c brief section 2.3: S1 down owner is 1 and S1 up owner is 0',
  edge: 'T6 exp_size_v1: an owned edge has status 0 and enabled 1',
  sealMirror: 'K1e mirror bytes at bring-up. Hashed with the step.',
  sealHalf: 'K1e half-press image at bring-up. Hashed with the step.',
  sealSize: 'Custom-size record at bring-up. Hashed with the step.',
  sealEdge: 'Owner-block edge state sealed on this step and hashed with it.',
  sealOwner: 'Owner sealed on this step and hashed with it.',
  sealTen: 'Ten-byte record written by this S1 press. Hashed as soon as it is read.',
};

const lit = (value, provenance) => ({ source: 'literal', value, provenance });
const seal = (provenance) => ({ source: 'seal', provenance });
const ref = (role, id, extra = {}) => ({ source: 'ref:' + role + ':' + id, ...extra });

function byRole(spec) {
  const roles = Object.keys(spec);
  if (roles.length === 1) return spec[roles[0]];
  return { byRole: spec };
}

const RAW = [
  { id: 'base', action: 'check', who: ['k1e', 'k2', 'candidate'], pose: 1, bank: 0, half: 'base' },
  { id: 'enter-land', action: 'enter', who: ['candidate'], pose: 1, bank: 0, flagOn: true, mirror: 'factory', half: 'reset' },
  { id: 'e-open', action: 'key', key: 'up', who: ['k1e', 'candidate'], pose: 1, bank: 0, editor: true, flagOn: true, mirrorFrom: 'e-open', half: 'k1e-move', halfRef: 'base' },
  { id: 'e-up', action: 'key', key: 'up', who: ['k1e', 'candidate'], pose: 1, bank: 0, editor: true, flagOn: true, mirrorFrom: 'e-up', half: 'k1e-move', halfRef: 'e-open' },
  { id: 'e-ok', action: 'key', key: 'ok', who: ['k1e', 'candidate'], pose: 1, bank: 0, editor: true, exit: true, matchExit: 'n-ok', commit: true, identityFrom: 'k1e:e-ok', mirrorFrom: 'e-ok', half: 'k1e-hold', halfRef: 'e-up', flagClear: 'up' },
  { id: 'ke-s1-down', action: 'edge', key: 's1', dir: 'down', who: ['k1e'], pose: 1, bank: 0, matchExit: 'pre-s1-down', sealPress: true, half: 'k1e-hold', halfRef: 'e-ok', commit: true, identityFrom: 'k1e:ke-s1-down' },
  { id: 'ke-s1-up', action: 'edge', key: 's1', dir: 'up', who: ['k1e'], pose: 1, bank: 0, matchExit: 'pre-s1-up', half: 'k1e-hold', halfRef: 'e-ok', commit: true, identityFrom: 'k1e:ke-s1-up' },
  { id: 'pre-s1-down', action: 'edge', key: 's1', dir: 'down', who: ['k2', 'candidate'], pose: 1, bank: 0, matchExit: 'ke-s1-down', crossS1: true, mirrorFrom: 'e-ok', half: 'reset' },
  { id: 'pre-s1-up', action: 'edge', key: 's1', dir: 'up', who: ['k2', 'candidate'], pose: 1, bank: 0, matchExit: 'ke-s1-up', mirrorFrom: 'e-ok', half: 'reset' },
  { id: 'k2-af-down', action: 'edge', key: 'afon', dir: 'down', who: ['k2'], pose: 1, bank: 0, matchExit: 'k2-p-af-down', sealPress: true, ownerLit: 2, half: 'reset', commit: true, identityFrom: 'k2:k2-af-down' },
  { id: 'k2-af-up', action: 'edge', key: 'afon', dir: 'up', who: ['k2'], pose: 1, bank: 0, matchExit: 'k2-p-af-up', sealPress: true, ownerLit: 0, half: 'reset', commit: true, identityFrom: 'k2:k2-af-up' },
  { id: 'af-down', action: 'edge', key: 'afon', dir: 'down', who: ['candidate'], pose: 1, bank: 0, matchExit: 'k2-af-down', pressFrom: 'ke-s1-down', bankFrom: 'e-ok', ownerLit: 2, judgeRead: true, commit: true, identityFrom: 'k1e:ke-s1-down', mirrorFrom: 'e-ok', half: 'reset' },
  { id: 'af-up', action: 'edge', key: 'afon', dir: 'up', who: ['candidate'], pose: 1, bank: 0, matchExit: 'k2-af-up', releaseFrom: 'pre-s1-down', ownerLit: 0, commit: true, identityFrom: 'k1e:ke-s1-up', mirrorFrom: 'e-ok', half: 'reset' },
  { id: 'pose-exif6', action: 'pose', key: 'exif6', who: ['k1e', 'k2', 'candidate'], pose: 2, bank: 4, mirrorFrom: 'e-ok', half: 'reset' },
  { id: 'enter-exif6', action: 'enter', who: ['candidate'], pose: 2, bank: 4, flagOn: true, mirrorFrom: 'e-ok', half: 'reset' },
  { id: 'p-up', action: 'key', key: 'up', who: ['k1e', 'candidate'], pose: 2, bank: 4, editor: true, flagOn: true, mirrorFrom: 'p-up', half: 'k1e-move', halfRef: 'e-ok' },
  { id: 'p-menu', action: 'key', key: 'menu', who: ['k1e', 'candidate'], pose: 2, bank: 4, editor: true, exit: true, matchExit: 'back-shoot', commit: true, identityFrom: 'k1e:p-menu', mirrorFrom: 'p-menu', half: 'edited-vs-reset', halfRef: 'p-up', flagClear: 'down' },
  { id: 'back-shoot', action: 'key', key: 'menu', who: ['k1e', 'candidate'], pose: 2, bank: 4, exit: true, matchExit: 'p-menu', commit: true, identityFrom: 'k1e:back-shoot', mirrorFrom: 'p-menu', half: 'edited-vs-reset', halfRef: 'p-up' },
  { id: 'ke-p-s1-down', action: 'edge', key: 's1', dir: 'down', who: ['k1e'], pose: 2, bank: 4, matchExit: 'pre-p-s1-down', sealPress: true, half: 'k1e-hold', halfRef: 'p-up', commit: true, identityFrom: 'k1e:ke-p-s1-down' },
  { id: 'ke-p-s1-up', action: 'edge', key: 's1', dir: 'up', who: ['k1e'], pose: 2, bank: 4, matchExit: 'pre-p-s1-up', half: 'k1e-hold', halfRef: 'p-up', commit: true, identityFrom: 'k1e:ke-p-s1-up' },
  { id: 'pre-p-s1-down', action: 'edge', key: 's1', dir: 'down', who: ['k2', 'candidate'], pose: 2, bank: 4, matchExit: 'pre-l-s1-down', crossS1: true, mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'pre-p-s1-up', action: 'edge', key: 's1', dir: 'up', who: ['k2', 'candidate'], pose: 2, bank: 4, matchExit: 'ke-p-s1-up', mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'k2-p-af-down', action: 'edge', key: 'afon', dir: 'down', who: ['k2'], pose: 2, bank: 4, matchExit: 'k2-l-af-down', sealPress: true, ownerLit: 2, half: 'reset', commit: true, identityFrom: 'k2:k2-p-af-down' },
  { id: 'k2-p-af-up', action: 'edge', key: 'afon', dir: 'up', who: ['k2'], pose: 2, bank: 4, matchExit: 'k2-l-af-up', sealPress: true, ownerLit: 0, half: 'reset', commit: true, identityFrom: 'k2:k2-p-af-up' },
  { id: 'p-af-down', action: 'edge', key: 'afon', dir: 'down', who: ['candidate'], pose: 2, bank: 4, matchExit: 'k2-p-af-down', pressFrom: 'ke-p-s1-down', bankFrom: 'p-up', ownerLit: 2, judgeRead: true, commit: true, identityFrom: 'k1e:ke-p-s1-down', mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'p-af-up', action: 'edge', key: 'afon', dir: 'up', who: ['candidate'], pose: 2, bank: 4, matchExit: 'k2-p-af-up', releaseFrom: 'pre-p-s1-down', ownerLit: 0, commit: true, identityFrom: 'k1e:ke-p-s1-up', mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'pose-land', action: 'pose', key: 'landscape', who: ['k2', 'candidate'], pose: 1, bank: 0, mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'pre-l-s1-down', action: 'edge', key: 's1', dir: 'down', who: ['k2', 'candidate'], pose: 1, bank: 0, matchExit: 'n-s1-down', crossS1: true, mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'pre-l-s1-up', action: 'edge', key: 's1', dir: 'up', who: ['k2', 'candidate'], pose: 1, bank: 0, matchExit: 'n-s1-up', mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'k2-l-af-down', action: 'edge', key: 'afon', dir: 'down', who: ['k2'], pose: 1, bank: 0, matchExit: 'k2-af-down', sealPress: true, ownerLit: 2, half: 'reset', commit: true, identityFrom: 'k2:k2-l-af-down' },
  { id: 'k2-l-af-up', action: 'edge', key: 'afon', dir: 'up', who: ['k2'], pose: 1, bank: 0, matchExit: 'k2-af-up', sealPress: true, ownerLit: 0, half: 'reset', commit: true, identityFrom: 'k2:k2-l-af-up' },
  { id: 'l-af-down', action: 'edge', key: 'afon', dir: 'down', who: ['candidate'], pose: 1, bank: 0, matchExit: 'k2-l-af-down', pressFrom: 'ke-s1-down', bankFrom: 'e-ok', ownerLit: 2, judgeRead: true, commit: true, identityFrom: 'k1e:ke-s1-down', mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'l-af-up', action: 'edge', key: 'afon', dir: 'up', who: ['candidate'], pose: 1, bank: 0, matchExit: 'k2-l-af-up', releaseFrom: 'pre-l-s1-down', ownerLit: 0, commit: true, identityFrom: 'k1e:ke-s1-up', mirrorFrom: 'p-menu', half: 'reset' },
  { id: 'n-open', action: 'key', key: 'up', who: ['k2', 'candidate'], pose: 1, bank: 0, mirrorFrom: 'p-menu', half: 'normal-move', halfRef: 'base' },
  { id: 'n-up', action: 'key', key: 'up', who: ['k2', 'candidate'], pose: 1, bank: 0, mirrorFrom: 'p-menu', half: 'normal-move', halfRef: 'n-open' },
  { id: 'n-ok', action: 'key', key: 'ok', who: ['k2', 'candidate'], pose: 1, bank: 0, exit: true, matchExit: 'e-ok', commit: true, identityFrom: 'k1e:e-ok', mirrorFrom: 'p-menu', half: 'normal-hold', halfRef: 'n-up' },
  { id: 'n-s1-down', action: 'edge', key: 's1', dir: 'down', who: ['k2', 'candidate'], pose: 1, bank: 0, matchExit: 'ke-s1-down', crossS1: true, normalHalf: true, mirrorFrom: 'p-menu', half: 'normal-hold', halfRef: 'n-up' },
  { id: 'n-s1-up', action: 'edge', key: 's1', dir: 'up', who: ['k2', 'candidate'], pose: 1, bank: 0, matchExit: 'pre-l-s1-up', mirrorFrom: 'p-menu', half: 'normal-hold', halfRef: 'n-up' },
  { id: 'pose-after-edit', action: 'pose', key: 'exif6', who: ['k2', 'candidate'], pose: 2, bank: 4, mirrorFrom: 'p-menu', half: 'pose-hold' },
];

const last = { k1e: null, k2: null, candidate: null };

function flagField(step) {
  const spec = {};
  for (const role of step.who) {
    if (role === 'candidate' && step.flagOn) spec.candidate = lit(1, P.flagOn);
    else if (role === 'candidate' && step.id !== 'base') spec.candidate = lit(0, P.flagOff);
    else spec[role] = lit(255, P.flagImage);
  }
  return byRole(spec);
}

function mirrorField(step) {
  const spec = {};
  for (const role of step.who) {
    if (role === 'candidate' && step.mirror === 'factory') spec.candidate = ref('K1e', 'base', { map: 'half-to-mirror' });
    else if (role === 'candidate' && step.mirrorFrom) spec.candidate = ref('K1e', step.mirrorFrom, { map: 'half-to-mirror' });
    else if (step.id === 'base' && role === 'k1e') spec.k1e = seal(P.sealMirror);
    else if (step.id === 'base') spec[role] = ref('K1e', 'base', { field: 'mirror' });
    else spec[role] = ref('session', last[role], { field: 'mirror' });
  }
  return byRole(spec);
}

function halfField(step) {
  if (step.half === 'base') {
    return byRole({
      k1e: seal(P.sealHalf),
      k2: ref('K1e', 'base', { map: 'bank-cell' }),
      candidate: ref('K1e', 'base', { map: 'bank-cell' }),
    });
  }
  if (step.half === 'reset') return ref('K1e', 'base', { map: 'bank-cell' });
  if (step.half === 'k1e-move' || step.half === 'k1e-hold' || step.half === 'edited-vs-reset') {
    const spec = {};
    if (step.who.includes('k1e')) {
      spec.k1e = step.half === 'k1e-move'
        ? ref('K1e', step.halfRef, { field: 'half', relation: 'pos-changed-at-bank' })
        : ref('K1e', step.halfRef, { map: 'bank-cell' });
    }
    if (step.who.includes('k2')) spec.k2 = ref('K1e', 'base', { map: 'bank-cell' });
    if (step.who.includes('candidate')) spec.candidate = ref('K1e', 'base', { map: 'bank-cell' });
    return byRole(spec);
  }
  if (step.half === 'normal-move') {
    const spec = {};
    if (step.who.includes('k2')) spec.k2 = ref('K2', step.halfRef, { field: 'half', relation: 'pos-changed-at-bank' });
    if (step.who.includes('candidate')) spec.candidate = ref('K2', step.id, { map: 'bank-cell' });
    return byRole(spec);
  }
  if (step.half === 'normal-hold') return ref('K2', step.halfRef, { map: 'bank-cell' });
  if (step.half === 'pose-hold') {
    return byRole({
      k2: seal('K2 half-press after the normal edit and this pose. The candidate matches that record.'),
      candidate: ref('K2', step.id, { map: 'bank-cell' }),
    });
  }
  throw new Error('half mode ' + step.half);
}

function sizeField(step) {
  const spec = {};
  for (const role of step.who) {
    if (step.id === 'base' && role === 'k1e') spec.k1e = seal(P.sealSize);
    else if (role === 'candidate') spec.candidate = ref('K1e', 'base', { field: 'sizeRecord' });
    else if (step.id === 'base') spec[role] = ref('K1e', 'base', { field: 'sizeRecord' });
    else spec[role] = ref('session', last[role], { field: 'sizeRecord' });
  }
  return byRole(spec);
}

function chainOrSpecial(step, field) {
  if (step.ownerLit != null && field === 'owner') {
    const provenance = step.ownerLit === 2 ? P.ownerOn : step.ownerLit === 1 ? P.ownerS1 : P.ownerOff;
    return lit(step.ownerLit, provenance);
  }
  if (step.key === 'afon' && field === 'edge') return lit({ status: 0, enabled: 1 }, P.edge);
  if (step.action === 'edge' && step.key === 's1') {
    const spec = {};
    for (const role of step.who) {
      if (role === 'candidate') spec.candidate = ref('K2', step.id, { field });
      else spec[role] = seal(field === 'owner' ? P.sealOwner : P.sealEdge);
    }
    return byRole(spec);
  }
  const spec = {};
  for (const role of step.who) {
    if (step.id === 'base' && role === 'k1e') spec.k1e = seal(field === 'owner' ? P.sealOwner : P.sealEdge);
    else if (step.id === 'base') spec[role] = ref('K1e', 'base', { field });
    else spec[role] = ref('session', last[role], { field });
  }
  return byRole(spec);
}

function tenPair(step) {
  if (step.sealPress) {
    return { target: seal(P.sealTen), halfTarget: seal(P.sealTen) };
  }
  if (step.pressFrom) {
    return { target: ref('K1e', step.pressFrom, { field: 'halfTarget', bankFrom: step.bankFrom }) };
  }
  if (step.releaseFrom) {
    const spec = ref('session', step.releaseFrom, { field: 'halfTarget' });
    return { target: spec, halfTarget: { ...spec } };
  }
  if (step.crossS1 || step.normalHalf) {
    return {
      halfTarget: byRole({
        k2: seal(P.sealTen),
        candidate: ref('K2', step.id, { field: 'halfTarget' }),
      }),
      target: byRole({
        k2: seal(P.sealTen),
        candidate: ref('K2', step.id, { field: 'target' }),
      }),
    };
  }
  return null;
}

const steps = RAW.map((raw) => {
  if (raw.action === 'edge' && raw.key === 's1' && raw.ownerLit == null) raw.ownerLit = raw.dir === 'down' ? 1 : 0;
  const step = {
    id: raw.id,
    action: raw.action,
    who: raw.who,
    pose: raw.pose,
    bank: raw.bank,
    fields: {
      subject: lit(0, P.subject),
      bank: lit(raw.bank, P.bank),
      flag: flagField(raw),
      mirror: mirrorField(raw),
      halfBank: halfField(raw),
      sizeRecord: sizeField(raw),
      edge: chainOrSpecial(raw, 'edge'),
      owner: chainOrSpecial(raw, 'owner'),
    },
  };
  if (raw.key) step.key = raw.key;
  if (raw.dir) step.dir = raw.dir;
  if (raw.editor) step.editor = true;
  if (raw.half) step.half = raw.half;
  if (raw.halfRef) step.halfRef = raw.halfRef;
  if (raw.mirrorFrom) step.mirrorFrom = raw.mirrorFrom;
  if (raw.mirror) step.mirror = raw.mirror;
  if (raw.flagClear) step.flagClear = raw.flagClear;
  if (raw.exit) step.exit = true;
  if (raw.commit) {
    step.commit = true;
    step.identityFrom = raw.identityFrom;
  }
  if (raw.action === 'key' && (raw.exit || raw.commit)) {
    step.exitSeq = [{ key: raw.key, dir: 'down' }, { key: raw.key, dir: 'up' }];
  } else if (raw.exit) {
    step.exitSeq = [{ key: raw.key, dir: 'down' }, { key: raw.key, dir: 'up' }];
  }
  if (raw.action === 'edge') step.exitSeq = [{ key: raw.key, dir: raw.dir }];
  if (raw.action === 'key') step.assertDown = true;
  if (raw.matchExit) step.matchExit = raw.matchExit;
  if (raw.pressFrom) step.pressFrom = raw.pressFrom;
  if (raw.releaseFrom) step.releaseFrom = raw.releaseFrom;
  if (raw.crossS1) step.crossS1 = true;
  if (raw.normalHalf) step.normalHalf = true;
  if (raw.judgeRead) step.judgeRead = true;
  if (raw.sealPress) step.sealPress = true;
  const ten = tenPair(raw);
  if (ten && ten.target) step.fields.target = ten.target;
  if (ten && ten.halfTarget) step.fields.halfTarget = ten.halfTarget;
  if (raw.judgeRead) {
    step.fields.readBank = lit(raw.bank, 'T8c Q1 saved index. Dynamic hook read during this press. The static T6 formula is not this value.');
  }
  for (const role of raw.who) last[role] = raw.id;
  return step;
});

const table = {
  task: 'T11',
  method: 'T8b generated table, one source per field, exits matched to a control sequence',
  zoneDial: 'Reset zone is already Small, stored value 2. The dial is not turned. One detent would leave Small.',
  zoneRule: {
    press: 'K1e S1 down record, hashed in the session before the candidate compares',
    release: 'K1e S1 up record, hashed in the session before the candidate compares',
  },
  staticT6: 'Linked pose word 2 selects 5, pose word 4 selects 3, otherwise 1. Design calculation only. The hook is not this formula.',
  savedBank: { pose1: 0, pose2: 4, pose4: 2, unlinked: 0 },
  steps,
};
export { table };
if (process.argv[1] && process.argv[1].replaceAll('\\', '/').endsWith('table_v2.mjs')) {
  writeFileSync(resolve('work/out/proof-table-t11-v2.json'), JSON.stringify(table, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ steps: steps.length }) + '\n');
}
