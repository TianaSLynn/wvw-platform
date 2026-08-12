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

  const flushList = () => {
    if (listBuffer.length > 0) {
      htmlParts.push(`<ul>${listBuffer.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      listBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      continue;
    }

    flushList();
    htmlParts.push(`<p>${inline(line)}</p>`);
  }
  flushList();

  return htmlParts.join("\n");
}
