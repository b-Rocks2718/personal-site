// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/contrib/mhchem';

// https://astro.build/config
export default defineConfig({
    devToolbar: {
      enabled: false,
    },

    markdown: {
		  shikiConfig: {
			  theme: 'github-light',
		  },
	  },

    site: 'https://example.com',
    integrations: [
  	mdx({
			  remarkPlugins: [remarkGfm, remarkMath],
			  rehypePlugins: [rehypeKatex],
		  }),
		  sitemap(),
	  	react(),
  	],
    fonts: [
        {
            provider: fontProviders.local(),
            name: 'Atkinson',
            cssVariable: '--font-atkinson',
            fallbacks: ['sans-serif'],
            options: {
                variants: [
                    {
                        src: ['./src/assets/fonts/atkinson-regular.woff'],
                        weight: 400,
                        style: 'normal',
                        display: 'swap',
                    },
                    {
                        src: ['./src/assets/fonts/atkinson-bold.woff'],
                        weight: 700,
                        style: 'normal',
                        display: 'swap',
                    },
                ],
            },
        },
    ],
});
