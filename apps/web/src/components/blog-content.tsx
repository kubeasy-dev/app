import type { NotionBlock, RichTextItem } from "@/lib/notion";

// ---- Rich text renderer ----

function renderRichText(items: RichTextItem[]): React.ReactNode {
  return items.map((item, i) => {
    let content: React.ReactNode = item.plain_text;

    if (item.annotations.bold) content = <strong key={i}>{content}</strong>;
    if (item.annotations.italic) content = <em key={i}>{content}</em>;
    if (item.annotations.strikethrough) content = <s key={i}>{content}</s>;
    if (item.annotations.underline) content = <u key={i}>{content}</u>;
    if (item.annotations.code)
      content = (
        <code
          key={i}
          className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
        >
          {content}
        </code>
      );

    if (item.text?.link?.url) {
      content = (
        <a
          key={i}
          href={item.text.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline"
        >
          {content}
        </a>
      );
    }

    return <span key={i}>{content}</span>;
  });
}

// ---- Block renderer ----

function BlockRenderer({ blocks }: { blocks: NotionBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockItem({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case "paragraph":
      if (!block.paragraph) return null;
      return (
        <p className="text-base leading-relaxed font-medium">
          {renderRichText(block.paragraph.rich_text)}
        </p>
      );

    case "heading_1":
      if (!block.heading_1) return null;
      return (
        <h2 className="text-3xl font-black mt-8 mb-4" id={block.id}>
          {renderRichText(block.heading_1.rich_text)}
        </h2>
      );

    case "heading_2":
      if (!block.heading_2) return null;
      return (
        <h3 className="text-2xl font-black mt-6 mb-3" id={block.id}>
          {renderRichText(block.heading_2.rich_text)}
        </h3>
      );

    case "heading_3":
      if (!block.heading_3) return null;
      return (
        <h4 className="text-xl font-black mt-4 mb-2" id={block.id}>
          {renderRichText(block.heading_3.rich_text)}
        </h4>
      );

    case "bulleted_list_item":
      if (!block.bulleted_list_item) return null;
      return (
        <li className="ml-6 list-disc">
          {renderRichText(block.bulleted_list_item.rich_text)}
          {block.children && <BlockRenderer blocks={block.children} />}
        </li>
      );

    case "numbered_list_item":
      if (!block.numbered_list_item) return null;
      return (
        <li className="ml-6 list-decimal">
          {renderRichText(block.numbered_list_item.rich_text)}
          {block.children && <BlockRenderer blocks={block.children} />}
        </li>
      );

    case "code":
      if (!block.code) return null;
      return (
        <pre className="bg-foreground text-background p-4 rounded-xl neo-border overflow-x-auto">
          <code className="text-sm font-mono">
            {block.code.rich_text.map((t) => t.plain_text).join("")}
          </code>
        </pre>
      );

    case "quote":
      if (!block.quote) return null;
      return (
        <blockquote className="border-l-4 border-primary pl-4 italic font-medium text-muted-foreground">
          {renderRichText(block.quote.rich_text)}
        </blockquote>
      );

    case "callout":
      if (!block.callout) return null;
      return (
        <div className="flex gap-3 p-4 rounded-lg bg-secondary neo-border">
          {block.callout.icon?.type === "emoji" && (
            <span className="text-xl">{block.callout.icon.emoji}</span>
          )}
          <div>{renderRichText(block.callout.rich_text)}</div>
        </div>
      );

    case "divider":
      return <hr className="border-border my-8" />;

    case "image": {
      if (!block.image) return null;
      const imageUrl =
        block.image.type === "file"
          ? block.image.file?.url
          : block.image.external?.url;
      if (!imageUrl) return null;
      const caption =
        block.image.caption?.map((t) => t.plain_text).join("") ?? "";
      return (
        <figure className="my-6">
          <img
            src={imageUrl}
            alt={caption}
            className="w-full rounded-lg neo-border"
          />
          {caption && (
            <figcaption className="text-center text-sm text-muted-foreground mt-2 font-medium">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "to_do":
      if (!block.to_do) return null;
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={block.to_do.checked}
            readOnly
            className="h-4 w-4"
          />
          <span
            className={
              block.to_do.checked ? "line-through text-muted-foreground" : ""
            }
          >
            {renderRichText(block.to_do.rich_text)}
          </span>
        </div>
      );

    default:
      return null;
  }
}

export default function BlogContent({ blocks }: { blocks: NotionBlock[] }) {
  return <BlockRenderer blocks={blocks} />;
}
