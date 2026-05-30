import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articleSchema = ({ image }) =>
	z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: image().optional(),
		draft: z.boolean().optional().default(false),
	});

const math = defineCollection({
	loader: glob({ base: './src/content/math', pattern: '**/*.{md,mdx}' }),
	schema: articleSchema,
});

const cs = defineCollection({
	loader: glob({ base: './src/content/cs', pattern: '**/*.{md,mdx}' }),
	schema: articleSchema,
});

const chem = defineCollection({
	loader: glob({ base: './src/content/chem', pattern: '**/*.{md,mdx}' }),
	schema: articleSchema,
});


export const collections = { math, cs, chem };
