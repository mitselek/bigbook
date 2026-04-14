import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'static',
  site: 'https://mitselek.github.io/bigbook/',
  base: '/bigbook',
  trailingSlash: 'always',
})
