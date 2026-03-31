import { getPageImage, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getGithubLastEdit } from 'fumadocs-core/content/github';
import { GitHubLink } from '@/components/github-link';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  const path = `/content/docs/${page.path}`;
  const branch = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_GIT_COMMIT_REF : "main";
  const time = await getGithubLastEdit({
    owner: 'kubeasy-dev',
    repo: 'documentation',
    sha: branch,
    path: path,
  });

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className='flex flex-row gap-2 items-center mb-8 border-b pb-6'>
        <span className='text-sm text-muted-foreground'>Last updated: {time ? new Date(time).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unknown"}</span>
        <GitHubLink url={`https://github.com/kubeasy-dev/documentation/blob/${branch}/${path}`} />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
