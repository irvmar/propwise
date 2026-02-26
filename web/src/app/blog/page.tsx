import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Property management insights, tips, and industry trends from the PropWise team.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-[var(--pw-cream)]">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-heading text-[var(--pw-ink)] mb-2">Blog</h1>
        <p className="text-[var(--pw-slate)] font-body mb-12">
          Property management insights, tips, and industry trends.
        </p>

        {posts.length === 0 ? (
          <p className="text-[var(--pw-slate)] font-body">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block p-6 bg-white rounded-xl border border-[var(--pw-border)] hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs font-body px-2 py-0.5 rounded-full bg-[var(--pw-accent)]/10 text-[var(--pw-accent)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-heading text-[var(--pw-ink)] mb-2">{post.title}</h2>
                <p className="text-sm text-[var(--pw-slate)] font-body mb-3">{post.description}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--pw-slate)] font-body">
                  <span>{post.author}</span>
                  <span>&middot;</span>
                  <time>{post.date}</time>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
