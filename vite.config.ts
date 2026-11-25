import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [{
    name: 'service-hub-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(
          /<!-- pages:start -->[\s\S]*?<!-- pages:end -->/,
          '<script type="module" src="/src/main.tsx"></script>',
        )
      },
    },
  }],
})
