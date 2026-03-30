import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug } from '@/lib/blog';

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'PropWise AI',
      url: 'https://propwise.ai',
    },
    keywords: post.keywords.join(', '),
  };

  return (
    <div className="min-h-screen bg-[var(--pw-cream)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs font-body px-2 py-0.5 rounded-full bg-[var(--pw-accent)]/10 text-[var(--pw-accent)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-heading text-[var(--pw-ink)] mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-[var(--pw-slate)] font-body">
            <span>{post.author}</span>
            <span>&middot;</span>
            <time>{post.date}</time>
          </div>
        </header>

        {/* Body */}
        <div
          className="prose prose-slate max-w-none font-body
            prose-headings:font-heading prose-headings:text-[var(--pw-ink)]
            prose-a:text-[var(--pw-accent)] prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.htmlContent }}
        />
      </article>
    </div>
  );
}
