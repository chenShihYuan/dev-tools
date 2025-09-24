// @ts-check
import { defineConfig } from 'astro/config';;
import vue from "@astrojs/vue";
import tailwind from "@astrojs/tailwind";


// 如果你的 repo 叫 dev-tools，請改成你的帳號與 repo
const owner = 'chenshihyuan';
const repo = 'dev-tools';

export default defineConfig({
    integrations: [vue(), tailwind()],
    output: 'static',
    site: `https://${owner}.github.io/${repo}/`, 
    base: `/${repo}/`,
});