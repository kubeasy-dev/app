import type { NotionBlock, RichTextItem } from "@/lib/notion";

function richTextToMd(items: RichTextItem[]): string {
  return items
    .map((item) => {
      let text = item.plain_text;
      if (!text) return "";

      if (item.annotations.code) text = `\`${text}\``;
      if (item.annotations.bold) text = `**${text}**`;
      if (item.annotations.italic) text = `*${text}*`;
      if (item.annotations.strikethrough) text = `~~${text}~~`;

      const url = item.text?.link?.url ?? item.href;
      if (url) text = `[${text}](${url})`;

      return text;
    })
    .join("");
}

function blockToMd(block: NotionBlock, depth = 0): string {
  const indent = "  ".repeat(depth);

  switch (block.type) {
    case "paragraph":
      if (!block.paragraph?.rich_text.length) return "";
      return richTextToMd(block.paragraph.rich_text);

    case "heading_1":
      if (!block.heading_1) return "";
      return `## ${richTextToMd(block.heading_1.rich_text)}`;

    case "heading_2":
      if (!block.heading_2) return "";
      return `### ${richTextToMd(block.heading_2.rich_text)}`;

    case "heading_3":
      if (!block.heading_3) return "";
      return `#### ${richTextToMd(block.heading_3.rich_text)}`;

    case "bulleted_list_item": {
      if (!block.bulleted_list_item) return "";
      const text = richTextToMd(block.bulleted_list_item.rich_text);
      const children = block.children
        ? block.children.map((c) => blockToMd(c, depth + 1)).filter(Boolean)
        : [];
      return [`${indent}- ${text}`, ...children].join("\n");
    }

    case "numbered_list_item": {
      if (!block.numbered_list_item) return "";
      const text = richTextToMd(block.numbered_list_item.rich_text);
      const children = block.children
        ? block.children.map((c) => blockToMd(c, depth + 1)).filter(Boolean)
        : [];
      return [`${indent}1. ${text}`, ...children].join("\n");
    }

    case "to_do": {
      if (!block.to_do) return "";
      const checked = block.to_do.checked ? "x" : " ";
      return `- [${checked}] ${richTextToMd(block.to_do.rich_text)}`;
    }

    case "code": {
      if (!block.code) return "";
      const lang = block.code.language ?? "";
      const content = block.code.rich_text.map((t) => t.plain_text).join("");
      return `\`\`\`${lang}\n${content}\n\`\`\``;
    }

    case "quote":
      if (!block.quote) return "";
      return `> ${richTextToMd(block.quote.rich_text)}`;

    case "callout": {
      if (!block.callout) return "";
      const emoji =
        block.callout.icon?.type === "emoji"
          ? `${block.callout.icon.emoji} `
          : "";
      return `> ${emoji}${richTextToMd(block.callout.rich_text)}`;
    }

    case "divider":
      return "---";

    case "image": {
      if (!block.image) return "";
      const url =
        block.image.type === "file"
          ? block.image.file?.url
          : block.image.external?.url;
      if (!url) return "";
      const caption =
        block.image.caption?.map((t) => t.plain_text).join("") ?? "";
      return `![${caption}](${url})`;
    }

    case "bookmark":
      if (!block.bookmark) return "";
      return `[${block.bookmark.url}](${block.bookmark.url})`;

    default:
      return "";
  }
}

export function notionBlocksToMarkdown(blocks: NotionBlock[]): string {
  const lines: string[] = [];

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];

    if (
      block.type === "bulleted_list_item" ||
      block.type === "numbered_list_item"
    ) {
      const listLines: string[] = [];
      const listType = block.type;
      while (i < blocks.length && blocks[i].type === listType) {
        listLines.push(blockToMd(blocks[i]));
        i++;
      }
      lines.push(listLines.join("\n"));
    } else {
      const line = blockToMd(block);
      if (line) lines.push(line);
      i++;
    }
  }

  return lines.join("\n\n");
}
