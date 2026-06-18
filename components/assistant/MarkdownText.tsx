import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Lightweight Markdown renderer for AI chat bubbles.
 *
 * Supports (on purpose — keep the surface small):
 *   • Headings:   #, ##, ###
 *   • Bold:       **text**
 *   • Italic:     *text* or _text_
 *   • Inline code: `text`
 *   • Bulleted lists: lines starting with "- ", "* ", or "• "
 *   • Numbered lists: lines starting with "1. ", "2. ", ...
 *   • Blockquotes: lines starting with "> "
 *   • Paragraphs separated by blank lines
 *
 * It is intentionally not a full CommonMark parser — it only handles the
 * constructs the Anthropic model realistically emits in chat answers, so we
 * avoid a native dependency and keep full theme control.
 */

type InlineSeg =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string };

// Inline-level tokenizer. Walks once; **, *, _, ` are recognized.
function tokenizeInline(input: string): InlineSeg[] {
  const out: InlineSeg[] = [];
  let i = 0;
  let buf = '';

  const flushText = () => {
    if (buf.length > 0) {
      out.push({ type: 'text', value: buf });
      buf = '';
    }
  };

  while (i < input.length) {
    const c = input[i];
    const next = input[i + 1];

    // **bold**
    if (c === '*' && next === '*') {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        flushText();
        out.push({ type: 'bold', value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // `code`
    if (c === '`') {
      const end = input.indexOf('`', i + 1);
      if (end !== -1) {
        flushText();
        out.push({ type: 'code', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // *italic* (single asterisk, not part of **)
    if (c === '*' && next !== '*') {
      const end = input.indexOf('*', i + 1);
      // Require the content to be non-empty and not start/end with space to
      // avoid swallowing bullet characters or multiplication.
      if (end !== -1 && end > i + 1) {
        const inner = input.slice(i + 1, end);
        if (inner.trim().length > 0 && !inner.startsWith(' ') && !inner.endsWith(' ')) {
          flushText();
          out.push({ type: 'italic', value: inner });
          i = end + 1;
          continue;
        }
      }
    }

    // _italic_
    if (c === '_') {
      const end = input.indexOf('_', i + 1);
      if (end !== -1 && end > i + 1) {
        const inner = input.slice(i + 1, end);
        if (inner.trim().length > 0 && !inner.startsWith(' ') && !inner.endsWith(' ')) {
          flushText();
          out.push({ type: 'italic', value: inner });
          i = end + 1;
          continue;
        }
      }
    }

    buf += c;
    i += 1;
  }

  flushText();
  return out;
}

function renderInline(segs: InlineSeg[], baseStyle: TextStyle, codeBg: string, codeColor: string): React.ReactNode[] {
  return segs.map((s, idx) => {
    if (s.type === 'bold') {
      return (
        <Text key={idx} style={[baseStyle, inlineStyles.bold]}>
          {s.value}
        </Text>
      );
    }
    if (s.type === 'italic') {
      return (
        <Text key={idx} style={[baseStyle, inlineStyles.italic]}>
          {s.value}
        </Text>
      );
    }
    if (s.type === 'code') {
      return (
        <Text
          key={idx}
          style={[
            baseStyle,
            inlineStyles.code,
            { backgroundColor: codeBg, color: codeColor },
          ]}
        >
          {' '}{s.value}{' '}
        </Text>
      );
    }
    return (
      <Text key={idx} style={baseStyle}>
        {s.value}
      </Text>
    );
  });
}

// Block-level classifier.
type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; index: number; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'spacer' };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraphBuf: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuf.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraphBuf.join(' ') });
      paragraphBuf = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph();
      // Collapse consecutive blanks into a single spacer.
      if (blocks[blocks.length - 1]?.kind !== 'spacer') {
        blocks.push({ kind: 'spacer' });
      }
      continue;
    }

    // Headings
    const h3 = /^###\s+(.*)$/.exec(line);
    const h2 = /^##\s+(.*)$/.exec(line);
    const h1 = /^#\s+(.*)$/.exec(line);
    if (h3) {
      flushParagraph();
      blocks.push({ kind: 'heading', level: 3, text: h3[1] });
      continue;
    }
    if (h2) {
      flushParagraph();
      blocks.push({ kind: 'heading', level: 2, text: h2[1] });
      continue;
    }
    if (h1) {
      flushParagraph();
      blocks.push({ kind: 'heading', level: 1, text: h1[1] });
      continue;
    }

    // Blockquote
    const q = /^>\s+(.*)$/.exec(line);
    if (q) {
      flushParagraph();
      blocks.push({ kind: 'quote', text: q[1] });
      continue;
    }

    // Numbered list: "1. text", "12) text"
    const num = /^(\d{1,3})[.)]\s+(.*)$/.exec(line);
    if (num) {
      flushParagraph();
      blocks.push({ kind: 'numbered', index: parseInt(num[1], 10), text: num[2] });
      continue;
    }

    // Bulleted list: "- x", "* x", "• x"
    const bul = /^[-*•]\s+(.*)$/.exec(line);
    if (bul) {
      flushParagraph();
      blocks.push({ kind: 'bullet', text: bul[1] });
      continue;
    }

    paragraphBuf.push(line);
  }

  flushParagraph();
  // Trim trailing spacer.
  while (blocks[blocks.length - 1]?.kind === 'spacer') blocks.pop();
  return blocks;
}

interface Props {
  content: string;
  color: string;
  /** Base font size; headings scale up from this. */
  size?: number;
  /** If true, renders a lighter accent color for headings (used on dark AI bubbles). */
  accentColor?: string;
}

export function MarkdownText({ content, color, size = 14, accentColor }: Props) {
  const { theme } = useTheme();
  const headingColor = accentColor ?? color;
  const codeBg = `${theme.teal}14`;
  const codeColor = theme.teal;

  const blocks = useMemo(() => parseBlocks(content), [content]);

  const baseText: TextStyle = { fontSize: size, lineHeight: Math.round(size * 1.5), color };

  return (
    <View>
      {blocks.map((b, i) => {
        if (b.kind === 'spacer') {
          return <View key={i} style={{ height: 6 }} />;
        }

        if (b.kind === 'heading') {
          const hSize = b.level === 1 ? size + 5 : b.level === 2 ? size + 3 : size + 1;
          const hStyle: TextStyle = {
            fontSize: hSize,
            lineHeight: Math.round(hSize * 1.35),
            fontWeight: '800',
            color: headingColor,
            letterSpacing: -0.3,
            marginTop: i === 0 ? 0 : 6,
            marginBottom: 2,
          };
          const inline = tokenizeInline(b.text);
          return (
            <Text key={i} style={hStyle}>
              {renderInline(inline, hStyle, codeBg, codeColor)}
            </Text>
          );
        }

        if (b.kind === 'bullet') {
          const inline = tokenizeInline(b.text);
          return (
            <View key={i} style={mdStyles.listRow}>
              <Text style={[baseText, { color: headingColor, fontWeight: '800' }]}>{'\u2022'}</Text>
              <Text style={[baseText, mdStyles.listText]}>
                {renderInline(inline, baseText, codeBg, codeColor)}
              </Text>
            </View>
          );
        }

        if (b.kind === 'numbered') {
          const inline = tokenizeInline(b.text);
          return (
            <View key={i} style={mdStyles.listRow}>
              <Text style={[baseText, { color: headingColor, fontWeight: '800', minWidth: 18 }]}>
                {b.index}.
              </Text>
              <Text style={[baseText, mdStyles.listText]}>
                {renderInline(inline, baseText, codeBg, codeColor)}
              </Text>
            </View>
          );
        }

        if (b.kind === 'quote') {
          const inline = tokenizeInline(b.text);
          return (
            <View
              key={i}
              style={[mdStyles.quote, { borderLeftColor: `${theme.teal}66` }]}
            >
              <Text style={[baseText, { fontStyle: 'italic', color: theme.text3 }]}>
                {renderInline(inline, baseText, codeBg, codeColor)}
              </Text>
            </View>
          );
        }

        const inline = tokenizeInline(b.text);
        return (
          <Text key={i} style={baseText}>
            {renderInline(inline, baseText, codeBg, codeColor)}
          </Text>
        );
      })}
    </View>
  );
}

const inlineStyles = StyleSheet.create({
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
  code: {
    fontFamily: 'Menlo',
    borderRadius: 4,
    fontSize: 13,
  },
});

const mdStyles = StyleSheet.create({
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 2,
    marginVertical: 1,
  },
  listText: { flex: 1 },
  quote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginVertical: 4,
  },
});
