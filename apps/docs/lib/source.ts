import { docs } from '@/.source/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import { createElement } from 'react';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;
    // Convert kebab-case to PascalCase for lucide-react icons
    const iconName = icon
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    if (iconName in icons) {
      return createElement(icons[iconName as keyof typeof icons]);
    }
  },
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
