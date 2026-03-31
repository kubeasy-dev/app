import { source } from '@/lib/source';

export const revalidate = false;

const BASE_URL = 'https://docs.kubeasy.dev';

export async function GET() {
  const pages = source.getPages();

  const content = `# Kubeasy Documentation

> Kubeasy is a platform to learn Kubernetes through hands-on challenges. Users solve real-world scenarios in a local environment using standard tools like kubectl.

## Documentation

${pages.map((page) => `- [${page.data.title}](${BASE_URL}${page.url}): ${page.data.description || 'No description'}`).join('\n')}

## Full Documentation

For the complete documentation content, see [llms-full.txt](${BASE_URL}/llms-full.txt)
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
