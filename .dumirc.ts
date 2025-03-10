import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: 'laravel',
    logo: "https://laravel.com/img/favicon/favicon.ico",
    nav: {
      'zh-CN': []
    },
    showLineNum: true
  },
  locales: [
    {id: 'zh-CN', name: '中文', suffix: ''},
  ],
  alias: {
    'prism-themes/themes/prism-one-light.css': require.resolve('./static/css/prism.css'),
  }
});
