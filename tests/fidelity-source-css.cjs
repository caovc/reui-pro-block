function decodeCSSEscapes(text) {
  return text.replace(
    /\\(?:([0-9a-fA-F]{1,6})[\t\n\f\r ]?|\r\n|[\n\r\f]|([^\n\r\f0-9a-fA-F]))/g,
    (match, hex, escaped) => {
      if (hex) {
        const code = Number.parseInt(hex, 16);
        return code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)
          ? "\ufffd"
          : String.fromCodePoint(code);
      }
      return escaped || "";
    },
  );
}

function quotedValue(text, start) {
  const quote = text[start];
  let end = start + 1;
  while (end < text.length) {
    if (text[end] === "\\") {
      end += text[end + 1] === "\r" && text[end + 2] === "\n" ? 3 : 2;
    } else if (text[end] === quote) {
      return { value: text.slice(start + 1, end), end: end + 1 };
    } else {
      end += 1;
    }
  }
  throw new Error("Unclosed CSS string while collecting dependencies");
}

function commentEnd(text, start) {
  const end = text.indexOf("*/", start + 2);
  if (end < 0) throw new Error("Unclosed CSS comment while collecting dependencies");
  return end + 2;
}

function whitespaceEnd(text, start) {
  let index = start;
  while (index < text.length) {
    if (/\s/.test(text[index])) index += 1;
    else if (text.startsWith("/*", index)) index = commentEnd(text, index);
    else break;
  }
  return index;
}

function cssURLs(value) {
  const targets = [];
  let index = 0;
  while (index < value.length) {
    const character = value[index];
    if (character === '"' || character === "'") {
      index = quotedValue(value, index).end;
      continue;
    }
    if (value.startsWith("/*", index)) {
      index = commentEnd(value, index);
      continue;
    }
    const name =
      /^(?:[-_a-zA-Z]|\\[^\r\n\f])(?:[-_a-zA-Z0-9]|\\(?:[0-9a-fA-F]{1,6}\s?|[^\r\n\f]))*/.exec(
        value.slice(index),
      );
    if (!name) {
      index += 1;
      continue;
    }
    const endName = index + name[0].length;
    if (decodeCSSEscapes(name[0]).toLowerCase() !== "url" || value[endName] !== "(") {
      index = endName;
      continue;
    }
    let cursor = whitespaceEnd(value, endName + 1);
    let target;
    if (value[cursor] === '"' || value[cursor] === "'") {
      const quoted = quotedValue(value, cursor);
      target = quoted.value;
      cursor = whitespaceEnd(value, quoted.end);
      if (value[cursor] !== ")") throw new Error("Invalid CSS URL trailing tokens");
    } else {
      const start = cursor;
      while (cursor < value.length && value[cursor] !== ")") {
        if (value[cursor] === "\\") cursor += 2;
        else cursor += 1;
      }
      if (cursor === value.length) throw new Error("Unclosed CSS URL");
      target = value.slice(start, cursor).trim();
    }
    if (target) targets.push(decodeCSSEscapes(target));
    // Consume the entire url(), including quoted data payload; never scan its
    // inner SVG text as a second CSS value or a second npm dependency.
    index = cursor + 1;
  }
  return targets;
}

function cssImportTargets(source, filename, postcss) {
  const root = postcss.parse(source, { from: filename });
  const targets = [];
  root.walkDecls((declaration) => targets.push(...cssURLs(declaration.value)));
  root.walkAtRules((rule) => {
    targets.push(...cssURLs(rule.params));
    if (rule.name.toLowerCase() !== "import") return;
    const start = whitespaceEnd(rule.params, 0);
    if (rule.params[start] === '"' || rule.params[start] === "'") {
      targets.push(decodeCSSEscapes(quotedValue(rule.params, start).value));
    }
  });
  return targets;
}

module.exports = { cssImportTargets };
