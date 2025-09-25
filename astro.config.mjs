// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vue from "@astrojs/vue";


// 如果你的 repo 叫 dev-tools，請改成你的帳號與 repo
const owner = 'chenshihyuan';
const repo = 'dev-tools';

export default defineConfig({
    output: 'static',
    site: `https://${owner}.github.io/${repo}/`, 
    base: `/${repo}/`,
    integrations: [vue(), tailwind()],
    devToolbar: { enabled: false },
});
