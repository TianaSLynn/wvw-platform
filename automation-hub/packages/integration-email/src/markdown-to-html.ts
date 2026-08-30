/**
 * Minimal Markdown-to-HTML conversion covering exactly the syntax actually
 * used in COMMS-02 template bodies (### headers, **bold**, "- " bullet
 * lists, blank-line paragraphs, bare URLs) -- not a general-purpose
 * Markdown parser. Adding a full Markdown dependency for this narrow,
 * known input shape isn't warranted.
 */

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  return html;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const htmlParts: string[] = [];
  let listBuffer: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      htmlParts.push(`<ul>${listBuffer.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      listBuffer = [];
    }
  };

  // A paragraph is consecutive non-blank plain lines joined with <br> --
  // standard Markdown semantics (a blank line, not every newline, starts a
  // new paragraph). Needed so multi-line blocks like the signature render
  // as tight consecutive lines, not spaced-out separate paragraphs.
  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      htmlParts.push(`<p>${paragraphBuffer.map(inline).join("<br>")}</p>`);
      paragraphBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushList();
      flushParagraph();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      flushParagraph();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      listBuffer.push(bulletMatch[1]);
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }
  flushList();
  flushParagraph();

  return htmlParts.join("\n");
}
