import type { ReactNode } from 'react'

/* 轻量语法高亮:单遍扫描,把源码切成带类型的 token,再由组件渲染为 span */

type Rule = { type: string; re: RegExp }
type Token = { type: string; text: string }

const RULES: Record<string, Rule[]> = {
  javascript: [
    { type: 'c', re: /^\/\/[^\n]*/ },
    { type: 'c', re: /^\/\*[\s\S]*?\*\// },
    { type: 's', re: /^(["'`])(?:\\.|(?!\1).)*\1/ },
    { type: 'k', re: /\b(var|let|const|function|return|if|else|for|while|new|typeof|this|class|export|import|from|default|async|await|of|in|switch|case|break|continue|try|catch|throw|extends|delete|void|instanceof)\b/ },
    { type: 'k', re: /\b(true|false|null|undefined|NaN)\b/ },
    { type: 'n', re: /\b\d+(\.\d+)?\b/ },
    { type: 'f', re: /[a-zA-Z_$][\w$]*(?=\s*\()/ },
  ],
  html: [
    { type: 'c', re: /^<!--[\s\S]*?-->/ },
    { type: 't', re: /^<\/?[a-zA-Z][\w-]*/ },
    { type: 'a', re: /\s[a-zA-Z-]+(?==)/ },
    { type: 's', re: /^"[^"]*"/ },
    { type: 's', re: /^'[^']*'/ },
  ],
  css: [
    { type: 'c', re: /^\/\*[\s\S]*?\*\// },
    { type: 's', re: /^"[^"]*"|^'[^']*'/ },
    { type: 'p', re: /^[a-zA-Z-]+(?=\s*:)/ },
    { type: 't', re: /^[.#:]?[a-zA-Z][\w-]*/ },
    { type: 'k', re: /\b(var|calc|url|none|important|solid|transparent)\b/ },
    { type: 'n', re: /\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms|pt|fr|deg)?/ },
  ],
  json: [
    { type: 'k', re: /^"|"$/ },
    { type: 's', re: /^"(?:\\.|[^"\\])*"(?=\s*:)/ },
    { type: 's', re: /^"(?:\\.|[^"\\])*"/ },
    { type: 'k', re: /\b(true|false|null)\b/ },
    { type: 'n', re: /-?\d+(\.\d+)?/ },
  ],
  markdown: [
    { type: 'k', re: /^#{1,6} .*/ },
    { type: 'c', re: /^```[\s\S]*?```/ },
    { type: 's', re: /^`[^`]+`/ },
    { type: 'k', re: /^\*\*[^*]+\*\*/ },
    { type: 'md', re: /^\[[^\]]*\]\([^)]*\)/ },
    { type: 'k', re: /^[-*] / },
  ],
}

function tokenize(code: string, lang: string): Token[] {
  const rules = RULES[lang] ?? RULES.javascript
  const tokens: Token[] = []
  let i = 0
  while (i < code.length) {
    let matched = false
    for (const r of rules) {
      const m = r.re.exec(code.slice(i))
      if (m && m[0]) {
        tokens.push({ type: r.type, text: m[0] })
        i += m[0].length
        matched = true
        break
      }
    }
    if (!matched) {
      tokens.push({ type: 'plain', text: code[i] })
      i += 1
    }
  }
  return tokens
}

const CLASS: Record<string, string> = {
  k: 'tok-k',
  s: 'tok-s',
  n: 'tok-n',
  c: 'tok-c',
  t: 'tok-t',
  a: 'tok-a',
  p: 'tok-p',
  f: 'tok-f',
  md: 'tok-md',
}

export function renderHighlighted(code: string, lang: string): ReactNode {
  const lines = code.split('\n')
  return lines.map((line, idx) => {
    const tokens = tokenize(line, lang)
    return (
      <div className="code-line" key={idx}>
        <span className="ln">{idx + 1}</span>
        <code>
          {tokens.map((tk, i) =>
            tk.type === 'plain' ? (
              <span key={i}>{tk.text}</span>
            ) : (
              <span key={i} className={CLASS[tk.type] ?? 'tok-t'}>
                {tk.text}
              </span>
            ),
          )}
        </code>
      </div>
    )
  })
}