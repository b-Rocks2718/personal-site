import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	const mathPosts = await getCollection('math');
  const csPosts = await getCollection('cs');
  const chemPosts = await getCollection('chem');

  const posts = [
	  ...mathPosts.map((post) => ({ ...post, section: 'math' })),
	  ...csPosts.map((post) => ({ ...post, section: 'cs' })),
	  ...chemPosts.map((post) => ({ ...post, section: 'chem' })),
  ].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());



	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/${post.section}/${post.id}/`,
		})),
	});
}
