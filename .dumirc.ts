import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: 'laravel',
    logo: "https://laravel.com/img/favicon/favicon.ico",
    nav: {
      'zh-CN': []
    }
  },
  locales: [
    {id: 'zh-CN', name: '中文', suffix: ''},
  ],
});
