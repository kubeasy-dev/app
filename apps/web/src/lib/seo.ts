import { siteConfig } from "@/lib/constants";

/**
 * Generate JSON-LD structured data for SoftwareApplication (CLI tool)
 */
export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kubeasy CLI",
    description:
      "Command-line tool to set up local Kubernetes clusters and run hands-on challenges",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Linux, Windows",
    url: "https://www.npmjs.com/package/@kubeasy-dev/kubeasy-cli",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    downloadUrl: "https://www.npmjs.com/package/@kubeasy-dev/kubeasy-cli",
    softwareVersion: "1.0.0",
  };
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [siteConfig.links.github, siteConfig.links.twitter],
  };
}

/**
 * Generate JSON-LD structured data for website
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/challenges?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate JSON-LD structured data for educational course
 */
export function generateCourseSchema({
  name,
  description,
  provider = siteConfig.name,
  url,
}: {
  name: string;
  description: string;
  provider?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider,
      url: siteConfig.url,
    },
    url: url.startsWith("http") ? url : `${siteConfig.url}${url}`,
    educationalLevel: "Beginner to Advanced",
    inLanguage: "en",
    isAccessibleForFree: true,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      inLanguage: "en",
    },
  };
}

/**
 * Generate JSON-LD structured data for learning resource (challenge)
 */
export function generateLearningResourceSchema({
  name,
  description,
  url,
  difficulty,
  estimatedTime,
  theme,
}: {
  name: string;
  description: string;
  url: string;
  difficulty: string;
  estimatedTime: number;
  theme: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name,
    description,
    url: url.startsWith("http") ? url : `${siteConfig.url}${url}`,
    educationalLevel: difficulty,
    timeRequired: `PT${estimatedTime}M`,
    learningResourceType: "Hands-on Exercise",
    about: {
      "@type": "Thing",
      name: theme,
    },
    isAccessibleForFree: true,
    inLanguage: "en",
  };
}

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

/**
 * Generate JSON-LD structured data for a blog post
 */
export function generateBlogPostSchema({
  title,
  description,
  image,
  url,
  publishedAt,
  updatedAt,
  author,
  category,
  tags,
  wordCount,
}: {
  title: string;
  description: string;
  image?: string;
  url: string;
  publishedAt: string;
  updatedAt: string;
  author: { name: string; url?: string };
  category: string;
  tags: string[];
  wordCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: image || `${siteConfig.url}${siteConfig.ogImage}`,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      "@type": "Person",
      name: author.name,
      url: author.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}${url}`,
    },
    articleSection: category,
    keywords: tags.join(", "),
    ...(wordCount && { wordCount }),
  };
}

/**
 * Safely stringify JSON-LD data for use in dangerouslySetInnerHTML
 * Escapes characters that could be used for XSS attacks in script tags
 * - Escapes <, >, & to prevent HTML injection
 * - Escapes U+2028 and U+2029 line/paragraph separators that can break JS contexts
 * - Neutralizes </ sequences that could prematurely close script tags
 */
export function stringifyJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
