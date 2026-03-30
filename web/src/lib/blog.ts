import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { getAdminFirestore } from './firebase-admin';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  keywords: string[];
  content: string;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const db = getAdminFirestore();

    const snap = await db
      .collection('blogDrafts')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .get();

    if (snap.empty) return [];

    return snap.docs.map((doc) => {
      const data = doc.data();
      const { data: fm, content } = matter(data.mdxContent || '');

      return {
        slug: data.slug || doc.id,
        title: typeof fm.title === 'string' ? fm.title : data.topic || doc.id,
        description: typeof fm.description === 'string' ? fm.description : '',
        date: safeDate(fm.date) || formatTimestamp(data.publishedAt || data.createdAt),
        author: typeof fm.author === 'string' ? fm.author : 'PropWise Team',
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        keywords: Array.isArray(fm.keywords) ? fm.keywords : Array.isArray(data.targetKeywords) ? data.targetKeywords : [],
        content,
      };
    });
  } catch (err) {
    console.error('Failed to fetch blog posts from Firestore:', err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<(BlogPost & { htmlContent: string }) | null> {
  try {
    const db = getAdminFirestore();

    const snap = await db
      .collection('blogDrafts')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    const data = doc.data();
    const { data: frontmatter, content } = matter(data.mdxContent || '');

    const result = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .process(content);

    return {
      slug: data.slug || doc.id,
      title: typeof frontmatter.title === 'string' ? frontmatter.title : data.topic || doc.id,
      description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
      date: safeDate(frontmatter.date) || formatTimestamp(data.publishedAt || data.createdAt),
      author: typeof frontmatter.author === 'string' ? frontmatter.author : 'PropWise Team',
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : Array.isArray(data.targetKeywords) ? data.targetKeywords : [],
      content,
      htmlContent: result.toString(),
    };
  } catch (err) {
    console.error('Failed to fetch blog post from Firestore:', err);
    return null;
  }
}

function safeDate(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return '';
}

function formatTimestamp(ts: unknown): string {
  if (!ts || typeof ts !== 'object') return '';
  const obj = ts as Record<string, unknown>;
  if (typeof obj.toDate === 'function') return (obj.toDate as () => Date)().toISOString().split('T')[0];
  const seconds = typeof obj._seconds === 'number' ? obj._seconds : typeof obj.seconds === 'number' ? obj.seconds : 0;
  return seconds > 0 ? new Date(seconds * 1000).toISOString().split('T')[0] : '';
}
