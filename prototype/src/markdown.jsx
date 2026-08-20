// markdown.jsx — full markdown rendering for Knowledge notes.
//
// marked + DOMPurify run eagerly (small). mermaid (~500KB) and highlight.js are
// dynamically imported *only* when a note actually contains a diagram or a code
// block, so opening a plain note never pays for them — this matters a lot on
// mobile over cellular.
import { useEffect, useRef, useState } from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import { FONT, MONO } from './theme.jsx';

// Mermaid sources are pulled out before markdown parsing and replaced with a
// placeholder, so marked never mangles the diagram text and DOMPurify never
// sees (and strips) raw SVG. They're re-inserted after render.
function extractMermaid(src) {
  const blocks = [];
  const replaced = src.replace(/^```mermaid[ \t]*\n([\s\S]*?)^```[ \t]*$/gm, (_m, code) => {
    blocks.push(code);
    return `\n<div class="forge-mermaid" data-idx="${blocks.length - 1}"></div>\n`;
  });
  return { replaced, blocks };
}

const marked = new Marked({ gfm: true, breaks: false });

export function Markdown({ source, theme }) {
  const hostRef = useRef(null);
  const [html, setHtml] = useState('');
  const blocksRef = useRef([]);

  useEffect(() => {
    const { replaced, blocks } = extractMermaid(source || '');
    blocksRef.current = blocks;
    const raw = marked.parse(replaced);
    // Allow the placeholder div's data-idx through; everything else is default-safe.
    setHtml(
      DOMPurify.sanitize(raw, {
        ADD_ATTR: ['data-idx', 'target'],
        ADD_TAGS: ['input'], // GFM task list checkboxes
      }),
    );
  }, [source]);

  // After the HTML lands, enhance it: highlight code, render diagrams.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !html) return;
    let cancelled = false;

    (async () => {
      // ── syntax highlighting ──
      const codes = host.querySelectorAll('pre > code');
      if (codes.length) {
        // `highlight.js/lib/common` is ~40 common languages (~120KB) vs the full
        // build's ~190 languages (~950KB). Everything these notes use — bash,
        // js, ts, sql, python, json, yaml, diff — is in common.
        const hljs = (await import('highlight.js/lib/common')).default;
        if (cancelled) return;
        codes.forEach((el) => {
          try {
            hljs.highlightElement(el);
          } catch {
            /* unknown language — leave it plain rather than breaking the note */
          }
        });
      }

      // ── mermaid diagrams ──
      const nodes = host.querySelectorAll('.forge-mermaid');
      if (nodes.length) {
        const mermaid = (await import('mermaid')).default;
        if (cancelled) return;
        mermaid.initialize({
          startOnLoad: false,
          theme: theme.dark ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: FONT,
        });
        for (const node of nodes) {
          const src = blocksRef.current[Number(node.dataset.idx)];
          if (src == null) continue;
          try {
            const id = 'mmd' + Math.random().toString(36).slice(2);
            const { svg } = await mermaid.render(id, src);
            if (cancelled) return;
            node.innerHTML = svg;
          } catch (e) {
            // A malformed diagram shouldn't blank the note — show the source.
            node.innerHTML = '';
            const pre = document.createElement('pre');
            pre.textContent = src;
            node.appendChild(pre);
            node.setAttribute('data-error', String(e?.message || e));
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html, theme.dark]);

  return (
    <>
      <MarkdownStyles theme={theme} />
      <div ref={hostRef} className="forge-md" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

// Scoped styles for rendered markdown. Injected once per mount; cheap and keeps
// the note styling next to the renderer instead of in the global sheet.
function MarkdownStyles({ theme: t }) {
  const css = `
.forge-md { font-family: ${FONT}; font-size: 15.5px; line-height: 1.68; color: ${t.text};
  overflow-wrap: break-word; word-break: break-word; }
.forge-md > *:first-child { margin-top: 0; }
.forge-md h1, .forge-md h2, .forge-md h3, .forge-md h4 {
  line-height: 1.3; font-weight: 680; margin: 1.6em 0 .6em; letter-spacing: -0.01em; }
.forge-md h1 { font-size: 25px; }
.forge-md h2 { font-size: 20px; padding-bottom: .3em; border-bottom: 1px solid ${t.border}; }
.forge-md h3 { font-size: 17px; }
.forge-md h4 { font-size: 15.5px; color: ${t.text2}; }
.forge-md p { margin: 0 0 1em; }
.forge-md a { color: ${t.accent.solid}; text-decoration: none; border-bottom: 1px solid ${t.accent.solid}55; }
.forge-md strong { font-weight: 650; }
.forge-md ul, .forge-md ol { margin: 0 0 1em; padding-left: 1.35em; }
.forge-md li { margin: .3em 0; }
.forge-md li::marker { color: ${t.text3}; }
.forge-md blockquote { margin: 1em 0; padding: .1px 0 .1px 14px;
  border-left: 3px solid ${t.accent.solid}66; color: ${t.text2}; }
.forge-md code { font-family: ${MONO}; font-size: 13px; background: ${t.surface2};
  border: 1px solid ${t.border}; padding: 1.5px 5px; border-radius: 6px; }
.forge-md pre { background: ${t.surface2}; border: 1px solid ${t.border}; border-radius: 14px;
  padding: 13px 14px; overflow-x: auto; margin: 0 0 1.1em;
  -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; }
.forge-md pre code { background: none; border: none; padding: 0; font-size: 12.8px; line-height: 1.55; }
.forge-md img { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 1em 0; }
.forge-md hr { border: none; border-top: 1px solid ${t.border}; margin: 1.8em 0; }
.forge-md table { width: 100%; border-collapse: collapse; margin: 0 0 1.2em; font-size: 14px; display: block;
  overflow-x: auto; -webkit-overflow-scrolling: touch; }
.forge-md th, .forge-md td { border: 1px solid ${t.border}; padding: 8px 10px; text-align: left; }
.forge-md th { background: ${t.surface2}; font-weight: 620; }
.forge-md input[type=checkbox] { margin-right: .5em; accent-color: ${t.accent.solid}; }
.forge-md li:has(> input[type=checkbox]) { list-style: none; margin-left: -1.1em; }
.forge-md .forge-mermaid { margin: 1.2em 0; overflow-x: auto; text-align: center;
  -webkit-overflow-scrolling: touch; }
.forge-md .forge-mermaid svg { max-width: 100%; height: auto; }
.forge-md .forge-mermaid[data-error] { border: 1px solid ${t.border2}; border-radius: 12px; padding: 10px;
  text-align: left; }

/* highlight.js — minimal token palette derived from the app theme so code
   blocks belong to the design rather than importing a foreign stylesheet. */
.forge-md .hljs-keyword, .forge-md .hljs-selector-tag, .forge-md .hljs-built_in { color: ${t.accent.solid}; }
.forge-md .hljs-string, .forge-md .hljs-attr { color: ${t.hue.burn}; }
.forge-md .hljs-number, .forge-md .hljs-literal { color: ${t.hue.carbs}; }
.forge-md .hljs-comment, .forge-md .hljs-quote { color: ${t.text3}; font-style: italic; }
.forge-md .hljs-title, .forge-md .hljs-function { color: ${t.hue.protein}; }
.forge-md .hljs-variable, .forge-md .hljs-template-variable { color: ${t.hue.fat}; }
`;
  return <style>{css}</style>;
}
