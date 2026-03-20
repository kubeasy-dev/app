// Blog types for Notion-powered blog system

export interface Author {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  twitter?: string;
  github?: string;
}

export interface CategoryInfo {
  name: string;
  color: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover: string;
  category: CategoryInfo;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  isPinned: boolean;
  author: Author;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export interface BlogPostWithContent extends BlogPost {
  blocks: NotionBlock[];
  headings: TableOfContentsItem[];
}

// Notion block types
export type NotionBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "to_do"
  | "toggle"
  | "code"
  | "quote"
  | "callout"
  | "divider"
  | "image"
  | "video"
  | "bookmark"
  | "table"
  | "table_row"
  | "column_list"
  | "column";

export interface RichTextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

export interface RichTextItem {
  type: "text" | "mention" | "equation";
  text?: {
    content: string;
    link?: { url: string } | null;
  };
  annotations: RichTextAnnotations;
  plain_text: string;
  href?: string | null;
}

export interface NotionBlock {
  id: string;
  type: NotionBlockType;
  has_children: boolean;
  children?: NotionBlock[];
  // Block-specific content
  paragraph?: { rich_text: RichTextItem[] };
  heading_1?: { rich_text: RichTextItem[]; is_toggleable: boolean };
  heading_2?: { rich_text: RichTextItem[]; is_toggleable: boolean };
  heading_3?: { rich_text: RichTextItem[]; is_toggleable: boolean };
  bulleted_list_item?: { rich_text: RichTextItem[] };
  numbered_list_item?: { rich_text: RichTextItem[] };
  to_do?: { rich_text: RichTextItem[]; checked: boolean };
  toggle?: { rich_text: RichTextItem[] };
  code?: {
    rich_text: RichTextItem[];
    language: string;
    caption: RichTextItem[];
  };
  quote?: { rich_text: RichTextItem[] };
  callout?: {
    rich_text: RichTextItem[];
    icon?:
      | { type: "emoji"; emoji: string }
      | { type: "external"; external: { url: string } };
    color: string;
  };
  divider?: object;
  image?: {
    type: "file" | "external";
    file?: { url: string; expiry_time: string };
    external?: { url: string };
    caption: RichTextItem[];
  };
  video?: {
    type: "file" | "external";
    file?: { url: string };
    external?: { url: string };
  };
  bookmark?: { url: string; caption: RichTextItem[] };
  table?: {
    table_width: number;
    has_column_header: boolean;
    has_row_header: boolean;
  };
  table_row?: { cells: RichTextItem[][] };
  column_list?: object;
  column?: object;
}

// Pagination types
export interface PaginatedBlogPosts {
  posts: BlogPost[];
  totalPages: number;
  currentPage: number;
  totalPosts: number;
}

// Search result type for Fuse.js
export interface BlogSearchResult {
  item: BlogPost;
  refIndex: number;
  score?: number;
}

// Category with count for filters
export interface CategoryWithCount {
  name: string;
  color: string;
  count: number;
}
