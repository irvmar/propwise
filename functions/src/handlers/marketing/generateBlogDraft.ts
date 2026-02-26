import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ZodError } from 'zod';
import { logger } from '../../utils/logger';
import { generateResponse } from '../../services/claude.service';
import { generateBlogDraftSchema } from '../../shared/validators';
import { getMarketingAdminEmails } from '../../shared/constants';

export const generateBlogDraft = onCall(
  { timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
    const email = request.auth.token.email;
    if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
      throw new HttpsError('permission-denied', 'Not authorized for marketing');
    }

    let data;
    try {
      data = generateBlogDraftSchema.parse(request.data);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new HttpsError('invalid-argument', e.errors.map((err) => err.message).join(', '));
      }
      throw e;
    }
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are an expert property management content writer. You write educational blog posts for property managers.

RULES:
- Write as a PM industry expert who manages hundreds of units
- Include real industry statistics and data points where relevant
- Weave target keywords naturally — never stuff or force them
- NO AI slop: avoid "in today's fast-paced world", "it's important to note", "in conclusion"
- Provide standalone value. The reader should learn something actionable
- NEVER mention PropWise in the body. This is thought leadership, not a sales pitch
- Use headers (##) to break up sections. Include a compelling intro paragraph
- Target word count: ~${data.wordCount} words

OUTPUT FORMAT:
Return complete MDX with frontmatter. Example structure:
---
title: "Your Title Here"
description: "A compelling 1-2 sentence description for SEO"
date: "${today}"
author: "PropWise Team"
tags: ["property management", "relevant tag"]
keywords: ["target", "keywords"]
---

Then the full article body in markdown.`;

    const userMessage = `Write a blog post about: ${data.topic}

Target keywords: ${data.targetKeywords.join(', ')}
${data.angle ? `Angle/perspective: ${data.angle}` : ''}
Target length: ~${data.wordCount} words`;

    const response = await generateResponse(systemPrompt, userMessage, undefined, { maxTokens: 4000 });

    logger.info('Blog draft generated', {
      topic: data.topic,
      tokensUsed: response.inputTokens + response.outputTokens,
    });

    return {
      mdxContent: response.text,
      tokensUsed: response.inputTokens + response.outputTokens,
    };
  },
);
