import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

export default defineConfig({
  output: 'static',
  site: 'https://mitselek.github.io/bigbook/',
  base: '/bigbook',
  trailingSlash: 'always',
  integrations: [svelte()],
})
