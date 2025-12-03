// Minimal text OT: operations are arrays of components
// Component types:
// - number > 0: retain n chars
// - string: insert text
// - { d: n }: delete n chars (n > 0)

function isRetain(c) { return typeof c === 'number' && c > 0; }
function isInsert(c) { return typeof c === 'string' && c.length > 0; }
function isDelete(c) { return c && typeof c === 'object' && typeof c.d === 'number' && c.d > 0; }

function opLength(op) {
  let l = 0;
  for (const c of op) {
    if (isRetain(c)) l += c;
    else if (isInsert(c)) l += c.length;
    else if (isDelete(c)) l -= c.d; // logical len change
  }
  return l;
}

function apply(content, op) {
  let idx = 0;
  let out = '';
  for (const c of op) {
    if (isRetain(c)) {
      out += content.slice(idx, idx + c);
      idx += c;
    } else if (isInsert(c)) {
      out += c;
    } else if (isDelete(c)) {
      idx += c.d;
    }
  }
  out += content.slice(idx);
  return out;
}

function normalize(op) {
  const res = [];
  for (const c of op) {
    if (isRetain(c) || isInsert(c) || isDelete(c)) res.push(c);
  }
  // merge adjacent of same type
  const merged = [];
  for (const c of res) {
    const last = merged[merged.length - 1];
    if (last == null) { merged.push(c); continue; }
    if (isRetain(last) && isRetain(c)) { merged[merged.length - 1] = last + c; continue; }
    if (isInsert(last) && isInsert(c)) { merged[merged.length - 1] = last + c; continue; }
    if (isDelete(last) && isDelete(c)) { merged[merged.length - 1] = { d: last.d + c.d }; continue; }
    merged.push(c);
  }
  return merged;
}

// Compose opA then opB -> single op
function compose(a, b) {
  const out = [];
  let ai = 0, bi = 0;
  let aRem = 0, bRem = 0;
  let aCur = null, bCur = null;

  function nextA() { if (aCur == null && ai < a.length) { aCur = a[ai++]; aRem = isRetain(aCur) ? aCur : isInsert(aCur) ? aCur.length : aCur.d; } }
  function nextB() { if (bCur == null && bi < b.length) { bCur = b[bi++]; bRem = isRetain(bCur) ? bCur : isInsert(bCur) ? bCur.length : bCur.d; } }

  nextA(); nextB();
  while (aCur != null || bCur != null) {
    if (bCur == null) { // flush remaining A effect
      if (isRetain(aCur)) { out.push(aRem); aRem = 0; aCur = null; nextA(); }
      else if (isInsert(aCur)) { out.push(aCur.slice(aCur.length - aRem)); aRem = 0; aCur = null; nextA(); }
      else if (isDelete(aCur)) { out.push({ d: aRem }); aRem = 0; aCur = null; nextA(); }
      continue;
    }

    if (isInsert(bCur)) { // B inserts go straight out
      const part = bCur.slice(bCur.length - bRem);
      out.push(part);
      bRem -= part.length;
      if (bRem === 0) { bCur = null; nextB(); }
      continue;
    }

    if (aCur == null) { // only B left
      if (isRetain(bCur)) { out.push(bRem); bRem = 0; bCur = null; nextB(); }
      else if (isDelete(bCur)) { out.push({ d: bRem }); bRem = 0; bCur = null; nextB(); }
      continue;
    }

    const take = Math.min(aRem, bRem);
    if (isRetain(bCur)) {
      if (isRetain(aCur)) out.push(take);
      else if (isInsert(aCur)) out.push(aCur.slice(aCur.length - aRem, aCur.length - aRem + take));
      else if (isDelete(aCur)) out.push({ d: take });
      aRem -= take; bRem -= take;
      if (aRem === 0) { aCur = null; nextA(); }
      if (bRem === 0) { bCur = null; nextB(); }
      continue;
    }

    if (isDelete(bCur)) {
      if (isRetain(aCur)) { bRem -= take; aRem -= take; out.push({ d: take }); }
      else if (isInsert(aCur)) { // deleting over inserted text cancels inserted part
        const insPart = aCur.slice(aCur.length - aRem, aCur.length - aRem + take);
        // deletion over insert: nothing emitted (they cancel)
        // reduce remaining
        aRem -= take; bRem -= take;
      } else if (isDelete(aCur)) {
        // consecutive deletes, keep delete
        out.push({ d: take });
        aRem -= take; bRem -= take;
      }
      if (aRem === 0) { aCur = null; nextA(); }
      if (bRem === 0) { bCur = null; nextB(); }
      continue;
    }
  }
  return normalize(out);
}

// Transform a against b, producing a' that can apply after b
function transform(a, b) {
  const out = [];
  let ai = 0, bi = 0;
  let aRem = 0, bRem = 0;
  let aCur = null, bCur = null;

  function nextA() { if (aCur == null && ai < a.length) { aCur = a[ai++]; aRem = isRetain(aCur) ? aCur : isInsert(aCur) ? aCur.length : aCur.d; } }
  function nextB() { if (bCur == null && bi < b.length) { bCur = b[bi++]; bRem = isRetain(bCur) ? bCur : isInsert(bCur) ? bCur.length : bCur.d; } }

  nextA(); nextB();
  while (aCur != null || bCur != null) {
    if (bCur == null) { // nothing to transform against
      if (isRetain(aCur)) { out.push(aRem); aRem = 0; aCur = null; nextA(); }
      else if (isInsert(aCur)) { out.push(aCur.slice(aCur.length - aRem)); aRem = 0; aCur = null; nextA(); }
      else if (isDelete(aCur)) { out.push({ d: aRem }); aRem = 0; aCur = null; nextA(); }
      continue;
    }

    if (isInsert(bCur)) {
      // B inserts shift A's coordinates: A must retain over inserted text
      const take = Math.min(bRem, Number.MAX_SAFE_INTEGER);
      out.push(take);
      bRem -= take;
      if (bRem === 0) { bCur = null; nextB(); }
      continue;
    }

    if (aCur == null) {
      if (isRetain(bCur)) { bRem = 0; bCur = null; nextB(); }
      else if (isDelete(bCur)) { bRem = 0; bCur = null; nextB(); }
      continue;
    }

    const take = Math.min(aRem, bRem);

    if (isRetain(bCur)) {
      if (isRetain(aCur)) out.push(take);
      else if (isInsert(aCur)) out.push(aCur.slice(aCur.length - aRem, aCur.length - aRem + take));
      else if (isDelete(aCur)) out.push({ d: take });
      aRem -= take; bRem -= take;
      if (aRem === 0) { aCur = null; nextA(); }
      if (bRem === 0) { bCur = null; nextB(); }
      continue;
    }

    if (isDelete(bCur)) {
      if (isRetain(aCur)) { aRem -= take; /* skip over deleted */ }
      else if (isInsert(aCur)) { // insertion is unaffected by deletions in B ahead of A's index
        const part = aCur.slice(aCur.length - aRem, aCur.length - aRem + take);
        out.push(part);
        aRem -= take;
      } else if (isDelete(aCur)) {
        // both delete: A deletes fewer characters after B
        aRem -= take;
      }
      bRem -= take;
      if (aRem === 0) { aCur = null; nextA(); }
      if (bRem === 0) { bCur = null; nextB(); }
      continue;
    }
  }
  return normalize(out);
}

module.exports = { apply, transform, compose, normalize, isRetain, isInsert, isDelete };
