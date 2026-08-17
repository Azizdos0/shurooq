// Per-section content templates + a shared renderer.
//
// Each section defines an ordered list of fields. Field types:
//   line   — single-line text
//   prose  — multi-line text (paragraphs split on blank lines)
//   list   — repeatable items; `item` is the sub-field schema and
//            `itemStyle` drives how the renderer lays the items out
//              ('notice' | 'article' | 'stat' | 'ordered')
// Hints: role:'headline'|'dateline', hideLabel, and (for lists) `seed`
// pre-fills default rows. `titleField` names the field used as the piece's
// display title (falls back to the section's default title).

export const templates = {
  progress: {
    titleField: 'headline',
    fields: [
      { id: 'headline', label: 'العنوان', type: 'line', role: 'headline' },
      { id: 'intro', label: 'مقدّمة', type: 'prose', hideLabel: true },
      {
        id: 'findings', label: 'المؤشّرات', type: 'list', itemStyle: 'stat',
        item: [
          { id: 'number', label: 'الرقم', type: 'line' },
          { id: 'label', label: 'الدلالة', type: 'line' },
          { id: 'detail', label: 'السياق', type: 'prose' },
        ],
      },
    ],
  },

  lost: {
    titleField: 'lead_headline',
    fields: [
      { id: 'dateline', label: 'المدينة والتاريخ', type: 'line', role: 'dateline' },
      { id: 'lead_headline', label: 'عنوان الخبر الرئيسي', type: 'line', role: 'headline' },
      { id: 'lead_body', label: 'الخبر الرئيسي', type: 'prose', hideLabel: true },
      {
        id: 'news', label: 'أخبارٌ أخرى', type: 'list', itemStyle: 'article',
        item: [
          { id: 'headline', label: 'العنوان', type: 'line' },
          { id: 'body', label: 'الخبر', type: 'prose' },
        ],
      },
      {
        id: 'market', label: 'أخبار السوق', type: 'list', itemStyle: 'notice',
        item: [{ id: 'text', label: 'الخبر', type: 'line' }],
      },
      {
        id: 'classifieds', label: 'إعلانات', type: 'list', itemStyle: 'notice',
        item: [{ id: 'text', label: 'الإعلان', type: 'line' }],
      },
      { id: 'weather', label: 'الطقس', type: 'line' },
    ],
  },

  people: {
    titleField: 'question',
    fields: [
      { id: 'question', label: 'سؤال العدد', type: 'line', role: 'headline' },
      { id: 'intro', label: 'تقديم', type: 'prose', hideLabel: true },
      {
        id: 'topics', label: 'المحاور', type: 'list', itemStyle: 'article',
        item: [
          { id: 'headline', label: 'المحور', type: 'line' },
          { id: 'body', label: 'التفصيل', type: 'prose' },
        ],
        seed: [
          { headline: 'الطعام', body: '' },
          { headline: 'الكسب والأجور', body: '' },
          { headline: 'الشكاوى', body: '' },
          { headline: 'اللباس', body: '' },
          { headline: 'المخاوف', body: '' },
          { headline: 'اللهو', body: '' },
        ],
      },
    ],
  },

  without: {
    titleField: 'premise',
    fields: [
      { id: 'premise', label: 'الفرضية', type: 'line', role: 'headline' },
      { id: 'divergence', label: 'نقطة التحوّل', type: 'prose' },
      {
        id: 'consequences', label: 'النتائج', type: 'list', itemStyle: 'ordered',
        item: [{ id: 'text', label: 'النتيجة', type: 'prose' }],
      },
      { id: 'dispatch', label: 'خبرٌ من ذلك الزمن', type: 'prose' },
    ],
  },

  internet: {
    titleField: null,
    fields: [
      { id: 'period', label: 'الفترة', type: 'line' },
      { id: 'intro', label: 'تقديم', type: 'prose', hideLabel: true },
      {
        id: 'items', label: 'البنود', type: 'list', itemStyle: 'article',
        item: [
          { id: 'title', label: 'العنوان', type: 'line' },
          { id: 'summary', label: 'ماذا جرى ولماذا يهمّ', type: 'prose' },
        ],
      },
    ],
  },
};

// ---- helpers -------------------------------------------------------------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const paras = (v) =>
  String(v ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const proseHtml = (v) => paras(v).map((p) => `<p>${esc(p)}</p>`).join('');

// Derive the piece's display title from its content.
export function deriveTitle(sectionId, content, fallback = '') {
  const t = templates[sectionId];
  if (!t || !t.titleField) return fallback;
  const v = content?.[t.titleField];
  return (typeof v === 'string' && v.trim()) ? v.trim() : fallback;
}

// Render the structured BODY of a piece to an HTML string (values escaped).
// The section header (ornament + name) is rendered by the page, not here.
export function renderPieceBody(sectionId, content = {}) {
  const t = templates[sectionId];
  if (!t) return '';
  const out = [];

  for (const f of t.fields) {
    const val = content[f.id];

    if (f.type === 'line') {
      if (!val || !String(val).trim()) continue;
      if (f.role === 'headline') out.push(`<h3 class="pub-headline">${esc(val)}</h3>`);
      else if (f.role === 'dateline') out.push(`<p class="pub-dateline">${esc(val)}</p>`);
      else out.push(`<p class="pub-linefield"><span class="pub-label">${esc(f.label)}</span> ${esc(val)}</p>`);
      continue;
    }

    if (f.type === 'prose') {
      const html = proseHtml(val);
      if (!html) continue;
      if (!f.hideLabel) out.push(`<p class="pub-label">${esc(f.label)}</p>`);
      out.push(`<div class="pub-prose">${html}</div>`);
      continue;
    }

    if (f.type === 'list') {
      const items = Array.isArray(val) ? val : [];
      const rendered = renderList(f, items);
      if (rendered) out.push(`<section class="pub-group"><p class="pub-label">${esc(f.label)}</p>${rendered}</section>`);
    }
  }
  return out.join('\n');
}

function renderList(field, items) {
  const style = field.itemStyle;

  if (style === 'notice') {
    const lis = items
      .map((it) => (it.text || '').trim())
      .filter(Boolean)
      .map((t) => `<li>${esc(t)}</li>`)
      .join('');
    return lis ? `<ul class="pub-notices">${lis}</ul>` : '';
  }

  if (style === 'ordered') {
    const lis = items
      .map((it) => proseHtml(it.text))
      .filter(Boolean)
      .map((h) => `<li><div class="pub-prose">${h}</div></li>`)
      .join('');
    return lis ? `<ol class="pub-ordered">${lis}</ol>` : '';
  }

  if (style === 'stat') {
    const blocks = items
      .filter((it) => (it.number || '').trim() || (it.label || '').trim() || (it.detail || '').trim())
      .map((it) => {
        const num = (it.number || '').trim();
        const lab = (it.label || '').trim();
        const det = proseHtml(it.detail);
        return `<div class="pub-stat">
          ${num ? `<span class="pub-num">${esc(num)}</span>` : ''}
          ${lab ? `<span class="pub-statlabel">${esc(lab)}</span>` : ''}
          ${det ? `<div class="pub-prose">${det}</div>` : ''}
        </div>`;
      })
      .join('');
    return blocks;
  }

  // 'article' (default): headline + body per item
  const blocks = items
    .filter((it) => (it.headline || it.title || '').trim() || (it.body || it.summary || '').trim())
    .map((it) => {
      const head = (it.headline || it.title || '').trim();
      const body = proseHtml(it.body || it.summary);
      return `<article class="pub-article">
        ${head ? `<h4 class="pub-subhead">${esc(head)}</h4>` : ''}
        ${body ? `<div class="pub-prose">${body}</div>` : ''}
      </article>`;
    })
    .join('');
  return blocks;
}
