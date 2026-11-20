import React from 'react';

function renderInline(text) {
  // Split inline code, bold, and italics safely into React nodes
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[0.85em]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-[var(--lab-text)]">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 2) {
      return (
        <em key={i} className="italic text-[var(--lab-muted)]">
          {tok.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

export default function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  // Extract fenced code blocks first
  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-[var(--lab-text)]">
      {segments.map((segment, segIdx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const inner = segment.slice(3, -3).replace(/^[a-zA-Z0-9_-]*\n/, '');
          return (
            <pre
              key={segIdx}
              className="p-3 rounded-lg bg-slate-950/90 border border-cyan-500/20 text-xs font-mono text-cyan-200 overflow-x-auto"
            >
              <code>{inner}</code>
            </pre>
          );
        }

        const lines = segment.split('\n');
        const elements = [];
        let listBuffer = [];

        const flushList = (keyPrefix) => {
          if (listBuffer.length > 0) {
            elements.push(
              <ul key={`${keyPrefix}-list`} className="list-disc pl-5 space-y-1">
                {listBuffer.map((item, idx) => (
                  <li key={idx}>{renderInline(item)}</li>
                ))}
              </ul>
            );
            listBuffer = [];
          }
        };

        lines.forEach((rawLine, lineIdx) => {
          const line = rawLine.trimEnd();
          const trimmed = line.trim();

          if (!trimmed) {
            flushList(`${segIdx}-${lineIdx}`);
            return;
          }

          if (trimmed.startsWith('### ')) {
            flushList(`${segIdx}-${lineIdx}`);
            elements.push(
              <h4 key={`${segIdx}-${lineIdx}`} className="text-sm font-bold text-cyan-400 pt-1">
                {renderInline(trimmed.slice(4))}
              </h4>
            );
          } else if (trimmed.startsWith('## ')) {
            flushList(`${segIdx}-${lineIdx}`);
            elements.push(
              <h3 key={`${segIdx}-${lineIdx}`} className="text-base font-bold text-cyan-400 pt-1">
                {renderInline(trimmed.slice(3))}
              </h3>
            );
          } else if (/^[-*•]\s+/.test(trimmed)) {
            listBuffer.push(trimmed.replace(/^[-*•]\s+/, ''));
          } else if (/^\d+\.\s+/.test(trimmed)) {
            listBuffer.push(trimmed.replace(/^\d+\.\s+/, ''));
          } else {
            flushList(`${segIdx}-${lineIdx}`);
            elements.push(
              <p key={`${segIdx}-${lineIdx}`}>{renderInline(trimmed)}</p>
            );
          }
        });

        flushList(`${segIdx}-end`);
        return <React.Fragment key={segIdx}>{elements}</React.Fragment>;
      })}
    </div>
  );
}
