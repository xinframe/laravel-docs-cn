---
group: 
  title: 序言
  order: 0
title: 发行说明
order: 0
toc: content
---
# 发行说明

## 版本号规则

Laravel 及其其他第一方软件包遵循 [语义版本控制](https://semver.org)。主要框架版本每年发布一次（~Q1），而次要版本和补丁版本可能每周发布一次。次要版本和补丁版本 **绝不** 包含重大更改。

从您的应用程序或软件包引用 Laravel 框架或其组件时，您应始终使用版本约束，例如 `^11.0`，因为 Laravel 的主要版本确实包含重大更改。但是，我们始终努力确保您可以在一天或更短的时间内更新到新的主要版本。

#### 命名参数

[命名参数](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments) 不受 Laravel 向后兼容性指南的约束。我们可能会在必要时选择重命名函数参数，以改进 Laravel 代码库。因此，在调用 Laravel 方法时使用命名参数应谨慎，并要了解参数名称将来可能会发生变化。

## 支持政策

对于所有 Laravel 版本，提供 18 个月的错误修复和 2 年的安全修复。对于所有其他库（包括 Lumen），只有最新的主要版本才会收到错误修复。此外，请查看 [Laravel 支持的](/docs/{{version}}/database#introduction) 的数据库版本。

| Version | PHP版本     | 发布日期            | 错误修复支持截止日期      | 安全修复支持截止日期      |
|---------|-----------|-----------------|-----------------|-----------------|
| 9       | 8.0 - 8.2 | 2022 年 2 月 8 日  | 2023 年 8 月 8 日  | 2024 年 2 月 6 日  |
| 10      | 8.1 - 8.3 | 2023 年 2 月 14 日 | 2024 年 8 月 6 日  | 2025 年 2 月 4 日  |
| 11      | 8.2 - 8.4 | 2024 年 3 月 12 日 | 2025 年 9 月 3 日  | 2026 年 3 月 12 日 |
| 12      | 8.2 - 8.4 | 2025 年 2 月 24 日 | 2026 年 8 月 12 日 | 2027 年 2 月 24 日 |

## Laravel 12
Laravel 12 继续改进了 Laravel 11.x，更新了上游依赖项并引入了针对 React、Vue 和 Livewire 的新入门套件，包括使用 [WorkOS AuthKit](https://authkit.com) 进行用户身份验证的选项。我们的入门套件的 WorkOS 版本提供社交身份验证、密钥和 SSO 支持。

### 最小程度的重大变化
在此发布周期中，我们主要关注的是尽量减少重大更改。相反，我们致力于在全年持续提供质量改进，而不会破坏现有应用程序。

因此，Laravel 12 版本是一个相对较小的“维护版本”，用于升级现有依赖项。鉴于此，大多数 Laravel 应用程序可以升级到 Laravel 12，而无需更改任何应用程序代码。

### 新应用入门套件

Laravel 12 为 React、Vue 和 Livewire 引入了新的 [应用程序入门套件](/docs/{{version}}/starter-kits)。React 和 Vue 入门套件使用 Inertia 2、TypeScript、[shadcn/ui](https://ui.shadcn.com) 和 Tailwind，而 Livewire 入门套件使用基于 Tailwind 的 [Flux UI](https://fluxui.dev) 组件库和 Laravel Volt。

React、Vue 和 Livewire 入门套件均使用 Laravel 的内置身份验证系统来提供登录、注册、密码重置、电子邮件验证等功能。此外，我们还推出了每个入门套件的 [WorkOS AuthKit 驱动](https://authkit.com) 变体，提供社交身份验证、密钥和 SSO 支持。WorkOS 为每月活跃用户数高达 100 万的应用程序提供免费身份验证。

随着我们推出新的应用程序入门套件，Laravel Breeze 和 Laravel Jetstream 将不再收到其他更新。

要开始使用我们的新入门套件，请查看 [入门套件文档](/docs/{{version}}/starter-kits)。
