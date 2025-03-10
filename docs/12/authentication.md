---
group:
  title: 安全
  order: 5
title: 认证
order: 0
toc: content
---

# 认证

## 介绍

许多 Web 应用程序为用户提供了一种与应用程序进行身份验证并“登录”的方式。在 Web 应用程序中实现此功能可能是一项复杂且具有潜在风险的任务。因此，Laravel 努力为您提供快速、安全且轻松地实现身份验证所需的工具。

Laravel 的身份验证功能核心由“守卫”和“提供者”组成。守卫定义了如何对每个请求进行用户身份验证。例如，Laravel 附带了一个 `session` 守卫，它使用会话存储和 cookie 来维护状态。

提供者定义了如何从持久存储中检索用户。Laravel 支持使用 [Eloquent](/12/eloquent) 和数据库查询构建器来检索用户。但是，您可以根据应用程序的需要自由定义其他提供者。

您的应用程序的身份验证配置文件位于 `config/auth.php`。该文件包含多个经过充分记录的选项，用于调整 Laravel 身份验证服务的行为。

:::info
守卫和提供者不应与“角色”和“权限”混淆。要了解有关通过权限授权用户操作的更多信息，请参阅 [授权](/12/authorization) 文档。
:::

### 入门套件

想要快速开始吗？在一个全新的 Laravel 应用程序中安装 [Laravel 应用程序入门套件](/12/starter-kits)。迁移数据库后，在浏览器中导航到 `/register` 或分配给您的应用程序的任何其他 URL。入门套件将负责搭建整个身份验证系统！

**即使您选择不在最终的 Laravel 应用程序中使用入门套件，安装 [入门套件](/12/starter-kits) 也是一个绝佳的机会，可以学习如何在实际的 Laravel 项目中实现 Laravel 的所有身份验证功能。** 由于 Laravel 入门套件包含身份验证控制器、路由和视图，您可以检查这些文件中的代码，以了解如何实现 Laravel 的身份验证功能。

### 数据库注意事项

默认情况下，Laravel 在您的 `app/Models` 目录中包含一个 `App\Models\User` [Eloquent 模型](/12/eloquent)。该模型可以与默认的 Eloquent 身份验证驱动程序一起使用。

如果您的应用程序不使用 Eloquent，您可以使用 `database` 身份验证提供者，它使用 Laravel 查询构建器。如果您的应用程序使用 MongoDB，请查看 MongoDB 官方的 [Laravel 用户身份验证文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/user-authentication/)。

在为 `App\Models\User` 模型构建数据库模式时，请确保密码列的长度至少为 60 个字符。当然，新 Laravel 应用程序中包含的 `users` 表迁移已经创建了一个超过此长度的列。

此外，您应该验证您的 `users`（或等效的）表是否包含一个可为空的字符串 `remember_token` 列，长度为 100 个字符。该列将用于存储选择“记住我”选项登录应用程序的用户的令牌。同样，新 Laravel 应用程序中包含的默认 `users` 表迁移已经包含此列。

### 生态系统概述

Laravel 提供了多个与身份验证相关的包。在继续之前，我们将回顾 Laravel 中的一般身份验证生态系统，并讨论每个包的预期用途。

首先，考虑身份验证的工作原理。当使用 Web 浏览器时，用户将通过登录表单提供其用户名和密码。如果这些凭据正确，应用程序将在用户的 [会话](/12/session) 中存储有关已认证用户的信息。颁发给浏览器的 cookie 包含会话 ID，以便后续对应用程序的请求可以将用户与正确的会话关联起来。在收到会话 cookie 后，应用程序将根据会话 ID 检索会话数据，注意身份验证信息已存储在会话中，并将用户视为“已认证”。

当远程服务需要身份验证以访问 API 时，通常不会使用 cookie 进行身份验证，因为没有 Web 浏览器。相反，远程服务在每个请求中向 API 发送一个 API 令牌。应用程序可以根据有效的 API 令牌表验证传入的令牌，并将请求“认证”为与该 API 令牌关联的用户执行的请求。

#### Laravel 的内置浏览器身份验证服务

Laravel 包括内置的身份验证和会话服务，通常通过 `Auth` 和 `Session` Facade 访问。这些功能为从 Web 浏览器发起的请求提供基于 cookie 的身份验证。它们提供了允许您验证用户凭据并对用户进行身份验证的方法。此外，这些服务会自动将正确的身份验证数据存储在用户的会话中，并颁发用户的会话 cookie。本文档中包含有关如何使用这些服务的讨论。

**应用程序入门套件**

如本文档所述，您可以手动与这些身份验证服务交互，以构建应用程序自己的身份验证层。但是，为了帮助您更快地入门，我们发布了 [免费入门套件](/12/starter-kits)，它们提供了整个身份验证层的强大、现代化的脚手架。

#### Laravel 的 API 身份验证服务

Laravel 提供了两个可选的包来帮助您管理 API 令牌和使用 API 令牌进行身份验证的请求：[Passport](/12/passport) 和 [Sanctum](/12/sanctum)。请注意，这些库与 Laravel 内置的基于 cookie 的身份验证库并不互斥。这些库主要关注 API 令牌身份验证，而内置的身份验证服务则关注基于 cookie 的浏览器身份验证。许多应用程序将同时使用 Laravel 内置的基于 cookie 的身份验证服务和 Laravel 的 API 身份验证包之一。

**Passport**

Passport 是一个 OAuth2 身份验证提供者，提供了多种 OAuth2 “授权类型”，允许您颁发各种类型的令牌。通常，这是一个强大且复杂的 API 身份验证包。然而，大多数应用程序不需要 OAuth2 规范提供的复杂功能，这可能会让用户和开发人员感到困惑。此外，开发人员历来对如何使用 OAuth2 身份验证提供者（如 Passport）对 SPA 应用程序或移动应用程序进行身份验证感到困惑。

**Sanctum**

为了应对 OAuth2 的复杂性和开发人员的困惑，我们着手构建一个更简单、更精简的身份验证包，可以处理来自 Web 浏览器的第一方 Web 请求和通过令牌的 API 请求。这一目标随着 [Laravel Sanctum](/12/sanctum) 的发布而实现，它应被视为提供第一方 Web UI 和 API 的应用程序的首选和推荐身份验证包，或者由与后端 Laravel 应用程序分离的单页应用程序（SPA）提供支持，或者提供移动客户端的应用程序。

Laravel Sanctum 是一个混合 Web / API 身份验证包，可以管理应用程序的整个身份验证过程。这是可能的，因为当基于 Sanctum 的应用程序收到请求时，Sanctum 将首先确定请求是否包含引用已认证会话的会话 cookie。Sanctum 通过调用我们之前讨论过的 Laravel 内置身份验证服务来实现这一点。如果请求未通过会话 cookie 进行身份验证，Sanctum 将检查请求中是否存在 API 令牌。如果存在 API 令牌，Sanctum 将使用该令牌对请求进行身份验证。要了解有关此过程的更多信息，请参阅 Sanctum 的 [“工作原理”](/12/sanctum#how-it-works) 文档。

#### 总结与选择您的技术栈

总之，如果您的应用程序将通过浏览器访问，并且您正在构建一个单体 Laravel 应用程序，您的应用程序将使用 Laravel 内置的身份验证服务。

接下来，如果您的应用程序提供了一个将被第三方使用的 API，您将在 [Passport](/12/passport) 和 [Sanctum](/12/sanctum) 之间进行选择，以为您的应用程序提供 API 令牌身份验证。通常，应尽可能选择 Sanctum，因为它是一个简单、完整的 API 身份验证、SPA 身份验证和移动身份验证解决方案，包括对“范围”或“能力”的支持。

如果您正在构建一个由 Laravel 后端支持的单页应用程序（SPA），您应该使用 [Laravel Sanctum](/12/sanctum)。使用 Sanctum 时，您需要 [手动实现自己的后端身份验证路由](#authenticating-users) 或使用 [Laravel Fortify](/12/fortify) 作为无头身份验证后端服务，提供注册、密码重置、电子邮件验证等功能的路由和控制器。

当您的应用程序绝对需要 OAuth2 规范提供的所有功能时，可以选择 Passport。

如果您希望快速入门，我们很高兴推荐 [我们的应用程序入门套件](/12/starter-kits) 作为启动新 Laravel 应用程序的快速方式，该应用程序已经使用我们首选的 Laravel 内置身份验证服务技术栈。

## 身份验证快速入门

:::warning
本文档的这一部分讨论了通过 [Laravel 应用程序入门套件](/12/starter-kits) 对用户进行身份验证，其中包括 UI 脚手架以帮助您快速入门。如果您希望直接与 Laravel 的身份验证系统集成，请查看有关 [手动对用户进行身份验证](#authenticating-users) 的文档。
:::

### 安装入门套件

首先，您应该 [安装 Laravel 应用程序入门套件](/12/starter-kits)。我们的入门套件提供了精美的设计起点，用于将身份验证集成到您的新 Laravel 应用程序中。

### 检索已认证用户

从入门套件创建应用程序并允许用户注册并通过您的应用程序进行身份验证后，您通常需要与当前已认证的用户进行交互。在处理传入请求时，您可以通过 `Auth` Facade 的 `user` 方法访问已认证的用户：

```php
use Illuminate\Support\Facades\Auth;

// 检索当前已认证的用户...
$user = Auth::user();

// 检索当前已认证用户的 ID...
$id = Auth::id();
```

或者，一旦用户通过身份验证，您可以通过 `Illuminate\Http\Request` 实例访问已认证的用户。请记住，类型提示的类将自动注入到您的控制器方法中。通过对 `Illuminate\Http\Request` 对象进行类型提示，您可以通过请求的 `user` 方法从应用程序中的任何控制器方法方便地访问已认证的用户：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 更新现有航班的航班信息。
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        // ...

        return redirect('/flights');
    }
}
```

#### 确定当前用户是否已认证

要确定发出传入 HTTP 请求的用户是否已认证，您可以使用 `Auth` Facade 上的 `check` 方法。如果用户已认证，此方法将返回 `true`：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::check()) {
    // 用户已登录...
}
```

:::info
尽管可以使用 `check` 方法确定用户是否已认证，但您通常会使用中间件来验证用户是否已认证，然后再允许用户访问某些路由 / 控制器。要了解更多信息，请查看有关 [保护路由](/12/authentication#protecting-routes) 的文档。
:::

### 保护路由

[路由中间件](/12/middleware) 可用于仅允许已认证的用户访问给定路由。Laravel 附带了一个 `auth` 中间件，它是 `Illuminate\Auth\Middleware\Authenticate` 类的 [中间件别名](/12/middleware#middleware-aliases)。由于此中间件已在 Laravel 内部进行了别名化，您只需将中间件附加到路由定义中：

```php
Route::get('/flights', function () {
    // 仅允许已认证的用户访问此路由...
})->middleware('auth');
```

#### 重定向未认证用户

当 `auth` 中间件检测到未认证的用户时，它将用户重定向到 `login` [命名路由](/12/routing#named-routes)。您可以使用应用程序的 `bootstrap/app.php` 文件中的 `redirectGuestsTo` 方法修改此行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware) {
    $middleware->redirectGuestsTo('/login');

    // 使用闭包...
    $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
})
```

#### 指定守卫

将 `auth` 中间件附加到路由时，您还可以指定应使用哪个“守卫”来对用户进行身份验证。指定的守卫应对应于 `auth.php` 配置文件中 `guards` 数组中的一个键：

```php
Route::get('/flights', function () {
    // 仅允许已认证的用户访问此路由...
})->middleware('auth:admin');
```

### 登录限流

如果您使用的是我们的 [应用程序入门套件](/12/starter-kits)，登录尝试将自动应用速率限制。默认情况下，如果用户在多次尝试后未能提供正确的凭据，他们将无法在一分钟内登录。限流是针对用户的用户名 / 电子邮件地址及其 IP 地址的唯一限制。

:::info
如果您希望对应用程序中的其他路由进行速率限制，请查看 [速率限制文档](/12/routing#rate-limiting)。
:::

## 手动对用户进行身份验证

您不需要使用 Laravel 的 [应用程序入门套件](/12/starter-kits) 中包含的身份验证脚手架。如果您选择不使用此脚手架，您将需要直接使用 Laravel 身份验证类来管理用户身份验证。别担心，这很简单！

我们将通过 `Auth` [Facade](/12/facades) 访问 Laravel 的身份验证服务，因此我们需要确保在类的顶部导入 `Auth` Facade。接下来，让我们看看 `attempt` 方法。`attempt` 方法通常用于处理来自应用程序“登录”表单的身份验证尝试。如果身份验证成功，您应该重新生成用户的 [会话](/12/session) 以防止 [会话固定](https://en.wikipedia.org/wiki/Session_fixation)：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * 处理身份验证尝试。
     */
    public function authenticate(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended('dashboard');
        }

        return back()->withErrors([
            'email' => '提供的凭据与我们的记录不匹配。',
        ])->onlyInput('email');
    }
}
```

`attempt` 方法接受一个键/值对数组作为其第一个参数。数组中的值将用于在数据库表中查找用户。因此，在上面的示例中，用户将通过 `email` 列的值进行检索。如果找到用户，存储在数据库中的哈希密码将与通过数组传递给方法的 `password` 值进行比较。您不应哈希传入请求的 `password` 值，因为框架会在将其与数据库中的哈希密码进行比较之前自动哈希该值。如果两个哈希密码匹配，将为用户启动一个已认证的会话。

请记住，Laravel 的身份验证服务将根据您的身份验证守卫的“提供者”配置从数据库中检索用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent 用户提供者，并指示它在检索用户时使用 `App\Models\User` 模型。您可以根据应用程序的需要在配置文件中更改这些值。

如果身份验证成功，`attempt` 方法将返回 `true`。否则，将返回 `false`。

Laravel 的重定向器提供的 `intended` 方法将用户重定向到他们在被身份验证中间件拦截之前尝试访问的 URL。如果预期的目标不可用，可以向此方法提供一个回退 URI。

#### 指定额外条件

如果您愿意，除了用户的电子邮件和密码之外，您还可以向身份验证查询添加额外的查询条件。为此，我们可以简单地将查询条件添加到传递给 `attempt` 方法的数组中。例如，我们可以验证用户是否标记为“active”：

```php
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
    // 身份验证成功...
}
```

对于复杂的查询条件，您可以在凭据数组中提供一个闭包。此闭包将使用查询实例调用，允许您根据应用程序的需要自定义查询：

```php
use Illuminate\Database\Eloquent\Builder;

if (Auth::attempt([
    'email' => $email,
    'password' => $password,
    fn (Builder $query) => $query->has('activeSubscription'),
])) {
    // 身份验证成功...
}
```

:::warning  
在这些示例中，`email` 不是一个必需的选项，它仅用作示例。您应该使用与数据库表中的“用户名”对应的任何列名。
:::

`attemptWhen` 方法接收一个闭包作为其第二个参数，可用于在实际对用户进行身份验证之前对潜在用户进行更广泛的检查。闭包接收潜在用户，并应返回 `true` 或 `false` 以指示是否可以对用户进行身份验证：

```php
if (Auth::attemptWhen([
    'email' => $email,
    'password' => $password,
], function (User $user) {
    return $user->isNotBanned();
})) {
    // 身份验证成功...
}
```

#### 访问特定的守卫实例

通过 `Auth` Facade 的 `guard` 方法，您可以指定在身份验证用户时要使用的守卫实例。这允许您使用完全独立的可认证模型或用户表来管理应用程序不同部分的身份验证。

传递给 `guard` 方法的守卫名称应对应于 `auth.php` 配置文件中配置的守卫之一：

```php
if (Auth::guard('admin')->attempt($credentials)) {
// ...
}
```

### 记住用户

许多 Web 应用程序在其登录表单上提供了一个“记住我”复选框。如果您希望在应用程序中提供“记住我”功能，可以将布尔值作为第二个参数传递给 `attempt` 方法。

当此值为 `true` 时，Laravel 将无限期地保持用户身份验证，直到他们手动注销。您的 `users` 表必须包含一个字符串 `remember_token` 列，该列将用于存储“记住我”令牌。新 Laravel 应用程序中包含的 `users` 表迁移已经包含此列：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
// 用户正在被记住...
}
```

如果您的应用程序提供“记住我”功能，您可以使用 `viaRemember` 方法来确定当前已认证的用户是否是通过“记住我” cookie 进行身份验证的：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::viaRemember()) {
// ...
}
```

### 其他身份验证方法

#### 对用户实例进行身份验证

如果您需要将现有用户实例设置为当前已认证的用户，可以将用户实例传递给 `Auth` Facade 的 `login` 方法。给定的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [契约](/docs/{{version}}/contracts) 的实现。Laravel 包含的 `App\Models\User` 模型已经实现了此接口。当您已经有一个有效的用户实例时（例如在用户注册后立即使用），这种身份验证方法非常有用：

```php
use Illuminate\Support\Facades\Auth;

Auth::login($user);
```

您可以将布尔值作为第二个参数传递给 `login` 方法。此值指示是否希望为已认证的会话启用“记住我”功能。请记住，这意味着会话将无限期地保持身份验证，直到用户手动注销应用程序：

```php
Auth::login($user, $remember = true);
```

如果需要，您可以在调用 `login` 方法之前指定身份验证守卫：

```php
Auth::guard('admin')->login($user);
```

#### 通过 ID 对用户进行身份验证

要使用用户的数据库记录的主键对用户进行身份验证，您可以使用 `loginUsingId` 方法。此方法接受您希望进行身份验证的用户的主键：

```php
Auth::loginUsingId(1);
```

您可以将布尔值传递给 `loginUsingId` 方法的 `remember` 参数。此值指示是否希望为已认证的会话启用“记住我”功能。请记住，这意味着会话将无限期地保持身份验证，直到用户手动注销应用程序：

```php
Auth::loginUsingId(1, remember: true);
```

#### 一次性对用户进行身份验证

您可以使用 `once` 方法对用户进行一次性身份验证。调用此方法时，不会使用会话或 cookie：

```php
if (Auth::once($credentials)) {
// ...
}
```

## HTTP 基本身份验证

[HTTP 基本身份验证](https://en.wikipedia.org/wiki/Basic_access_authentication) 提供了一种快速的方式，无需设置专用的“登录”页面即可对应用程序的用户进行身份验证。要开始使用，请将 `auth.basic` [中间件](/docs/{{version}}/middleware) 附加到路由。`auth.basic` 中间件包含在 Laravel 框架中，因此您无需定义它：

```php
Route::get('/profile', function () {
// 仅允许已认证的用户访问此路由...
})->middleware('auth.basic');
```

将中间件附加到路由后，当您在浏览器中访问该路由时，系统会自动提示您输入凭据。默认情况下，`auth.basic` 中间件会假定 `users` 数据库表中的 `email` 列是用户的“用户名”。

#### 关于 FastCGI 的说明

如果您使用 PHP FastCGI 和 Apache 来提供 Laravel 应用程序，HTTP 基本身份验证可能无法正常工作。要解决此问题，可以将以下行添加到应用程序的 `.htaccess` 文件中：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

<a name="stateless-http-basic-authentication"></a>

### 无状态 HTTP 基本身份验证

您还可以在不设置会话中的用户标识符 cookie 的情况下使用 HTTP 基本身份验证。如果您选择使用 HTTP 身份验证来对应用程序的 API 请求进行身份验证，这主要是有帮助的。为此，[定义一个中间件](/docs/{{version}}/middleware)，该中间件调用 `onceBasic` 方法。如果 `onceBasic` 方法没有返回响应，则请求可以进一步传递到应用程序中：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateOnceWithBasicAuth
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return Auth::onceBasic() ?: $next($request);
    }

}
```

接下来，将中间件附加到路由：

```php
Route::get('/api/user', function () {
    // 仅允许已认证的用户访问此路由...
})->middleware(AuthenticateOnceWithBasicAuth::class);
```

<a name="logging-out"></a>

## 注销

要手动将用户从应用程序中注销，您可以使用 `Auth` Facade 提供的 `logout` 方法。这将从用户的会话中删除身份验证信息，以便后续请求不会被认证。

除了调用 `logout` 方法外，建议您使用户的会话无效并重新生成其 [CSRF 令牌](/docs/{{version}}/csrf)。注销用户后，通常会将用户重定向到应用程序的根目录：

```php
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * 将用户从应用程序中注销。
 */
public function logout(Request $request): RedirectResponse
{
    Auth::logout();

    $request->session()->invalidate();

    $request->session()->regenerateToken();

    return redirect('/');
}
```

<a name="invalidating-sessions-on-other-devices"></a>

### 使其他设备上的会话无效

Laravel 还提供了一种机制，可以在不使当前设备上的会话无效的情况下，使其他设备上的用户会话无效并“注销”。此功能通常在用户更改或更新其密码时使用，您希望使其他设备上的会话无效，同时保持当前设备的身份验证。

在开始之前，您应确保 `Illuminate\Session\Middleware\AuthenticateSession` 中间件包含在应接收会话身份验证的路由上。通常，您应将此中间件放在路由组定义上，以便它可以应用于大多数应用程序路由。默认情况下，可以使用 `auth.session` [中间件别名](/docs/{{version}}/middleware#middleware-aliases) 将 `AuthenticateSession` 中间件附加到路由：

```php
Route::middleware(['auth', 'auth.session'])->group(function () {
    Route::get('/', function () {
        // ...
    });
});
```

然后，您可以使用 `Auth` Facade 提供的 `logoutOtherDevices` 方法。此方法要求用户确认其当前密码，您的应用程序应通过输入表单接受该密码：

```php
use Illuminate\Support\Facades\Auth;

Auth::logoutOtherDevices($currentPassword);
```

当调用 `logoutOtherDevices` 方法时，用户的其他会话将完全无效，这意味着他们将从之前通过身份验证的所有守卫中“注销”。

<a name="password-confirmation"></a>

## 密码确认

在构建应用程序时，您可能偶尔会有一些操作，这些操作应在执行操作或将用户重定向到应用程序的敏感区域之前要求用户确认其密码。Laravel 包含内置的中间件，使此过程变得轻而易举。实现此功能需要您定义两条路由：一条路由用于显示要求用户确认其密码的视图，另一条路由用于确认密码有效并将用户重定向到其预期目的地。

> [!NOTE]  
> 以下文档讨论了如何直接与 Laravel 的密码确认功能集成；但是，如果您希望更快地入门，[Laravel 应用程序入门套件](/docs/{{version}}/starter-kits) 包含对此功能的支持！

<a name="password-confirmation-configuration"></a>

### 配置

确认密码后，用户在三小时内不会再次被要求确认其密码。但是，您可以通过更改应用程序的 `config/auth.php` 配置文件中的 `password_timeout` 配置值来配置用户被重新提示输入密码的时间长度。

<a name="password-confirmation-routing"></a>

### 路由

<a name="the-password-confirmation-form"></a>

#### 密码确认表单

首先，我们将定义一条路由以显示要求用户确认其密码的视图：

```php
Route::get('/confirm-password', function () {
    return view('auth.confirm-password');
})->middleware('auth')->name('password.confirm');
```

正如您所期望的那样，此路由返回的视图应包含一个带有 `password` 字段的表单。此外，请随意在视图中包含文本，解释用户正在进入应用程序的受保护区域，并且必须确认其密码。

<a name="confirming-the-password"></a>

#### 确认密码

接下来，我们将定义一条路由来处理来自“确认密码”视图的表单请求。此路由将负责验证密码并将用户重定向到其预期目的地：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;

Route::post('/confirm-password', function (Request $request) {
    if (! Hash::check($request->password, $request->user()->password)) {
        return back()->withErrors([
            'password' => ['提供的密码与我们的记录不匹配。']
        ]);
    }

    $request->session()->passwordConfirmed();

    return redirect()->intended();
})->middleware(['auth', 'throttle:6,1']);
```

在继续之前，让我们更详细地检查此路由。首先，确定请求的 `password` 字段是否确实与已认证用户的密码匹配。如果密码有效，我们需要通知 Laravel 的会话用户已确认其密码。`passwordConfirmed` 方法将在用户的会话中设置一个时间戳，Laravel 可以使用该时间戳来确定用户上次确认其密码的时间。最后，我们可以将用户重定向到其预期目的地。

<a name="password-confirmation-protecting-routes"></a>

### 保护路由

您应确保任何执行需要最近密码确认的操作的路由都分配了 `password.confirm` 中间件。此中间件包含在 Laravel 的默认安装中，并将自动将用户的预期目的地存储在会话中，以便用户可以在确认密码后重定向到该位置。将用户的预期目的地存储在会话中后，中间件会将用户重定向到 `password.confirm` [命名路由](/docs/{{version}}/routing#named-routes)：

```php
Route::get('/settings', function () {
    // ...
})->middleware(['password.confirm']);

Route::post('/settings', function () {
    // ...
})->middleware(['password.confirm']);
```

<a name="adding-custom-guards"></a>

## 添加自定义守卫

您可以使用 `Auth` Facade 上的 `extend` 方法定义自己的身份验证守卫。您应将 `extend` 方法的调用放在 [服务提供者](/docs/{{version}}/providers) 中。由于 Laravel 已经附带了一个 `AppServiceProvider`，我们可以将代码放在该提供者中：

```php
<?php

namespace App\Providers;

use App\Services\Auth\JwtGuard;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * 启动任何应用程序服务。
     */
    public function boot(): void
    {
        Auth::extend('jwt', function (Application $app, string $name, array $config) {
            // 返回 Illuminate\Contracts\Auth\Guard 的实例...

            return new JwtGuard(Auth::createUserProvider($config['provider']));
        });
    }
}
```

如上面的示例所示，传递给 `extend` 方法的回调应返回 `Illuminate\Contracts\Auth\Guard` 的实现。此接口包含一些您需要实现的方法，以定义自定义守卫。定义自定义守卫后，您可以在 `auth.php` 配置文件的 `guards` 配置中引用该守卫：

```php
'guards' => [
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],
```

<a name="closure-request-guards"></a>

### 闭包请求守卫

实现自定义的基于 HTTP 请求的身份验证系统的最简单方法是使用 `Auth::viaRequest` 方法。此方法允许您使用单个闭包快速定义身份验证过程。

要开始使用，请在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用 `Auth::viaRequest` 方法。`viaRequest` 方法接受身份验证驱动程序名称作为其第一个参数。此名称可以是描述您的自定义守卫的任何字符串。传递给该方法的第二个参数应是一个闭包，该闭包接收传入的 HTTP 请求并返回用户实例，如果身份验证失败，则返回 `null`：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * 启动任何应用程序服务。
 */
public function boot(): void
{
    Auth::viaRequest('custom-token', function (Request $request) {
        return User::where('token', (string) $request->token)->first();
    });
}
```

定义自定义身份验证驱动程序后，您可以将其配置为 `auth.php` 配置文件的 `guards` 配置中的驱动程序：

```php
'guards' => [
    'api' => [
        'driver' => 'custom-token',
    ],
],
```

最后，您可以在将身份验证中间件分配给路由时引用该守卫：

```php
Route::middleware('auth:api')->group(function () {
    // ...
});
```

<a name="adding-custom-user-providers"></a>

## 添加自定义用户提供者

如果您不使用传统的关系数据库来存储用户，则需要使用自己的身份验证用户提供者扩展 Laravel。我们将使用 `Auth` Facade 上的 `provider` 方法定义自定义用户提供者。用户提供者解析器应返回 `Illuminate\Contracts\Auth\UserProvider` 的实现：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoUserProvider;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * 启动任何应用程序服务。
     */
    public function boot(): void
    {
        Auth::provider('mongo', function (Application $app, array $config) {
            // 返回 Illuminate\Contracts\Auth\UserProvider 的实例...

            return new MongoUserProvider($app->make('mongo.connection'));
        });
    }
}
```

使用 `provider` 方法注册提供者后，您可以在 `auth.php` 配置文件中切换到新的用户提供者。首先，定义一个使用新驱动程序的 `provider`：

```php
'providers' => [
    'users' => [
        'driver' => 'mongo',
    ],
],
```

最后，您可以在 `guards` 配置中引用此提供者：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
],
```

<a name="the-user-provider-contract"></a>

### 用户提供者契约

`Illuminate\Contracts\Auth\UserProvider` 实现负责从持久存储系统（如 MySQL、MongoDB 等）中获取 `Illuminate\Contracts\Auth\Authenticatable` 实现。这两个接口允许 Laravel 身份验证机制继续运行，无论用户数据如何存储或使用何种类型的类来表示已认证的用户：

让我们看一下 `Illuminate\Contracts\Auth\UserProvider` 契约：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface UserProvider
{
    public function retrieveById($identifier);
    public function retrieveByToken($identifier, $token);
    public function updateRememberToken(Authenticatable $user, $token);
    public function retrieveByCredentials(array $credentials);
    public function validateCredentials(Authenticatable $user, array $credentials);
    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false);
}
```

`retrieveById` 函数通常接收一个表示用户的键，例如 MySQL 数据库中的自增 ID。应检索并返回与该 ID 匹配的 `Authenticatable` 实现。

`retrieveByToken` 函数通过其唯一的 `$identifier` 和“记住我” `$token` 检索用户，通常存储在数据库列（如 `remember_token`）中。与前面的方法一样，应返回具有匹配令牌值的 `Authenticatable` 实现。

`updateRememberToken` 方法使用新的 `$token` 更新 `$user` 实例的 `remember_token`。在成功的“记住我”身份验证尝试或用户注销时，会为用户分配一个新的令牌。

`retrieveByCredentials` 方法接收传递给 `Auth::attempt` 方法的凭据数组，用于尝试对应用程序进行身份验证。然后，该方法应“查询”底层持久存储以查找与这些凭据匹配的用户。通常，此方法将运行一个带有“where”条件的查询，以搜索与 `$credentials['username']` 值匹配的用户记录。该方法应返回一个 `Authenticatable` 的实现。**此方法不应尝试进行任何密码验证或身份验证。**

`validateCredentials` 方法应将给定的 `$user` 与 `$credentials` 进行比较以验证用户身份。例如，此方法通常使用 `Hash::check` 方法将 `$user->getAuthPassword()` 的值与 `$credentials['password']` 的值进行比较。此方法应返回 `true` 或 `false`，指示密码是否有效。

`rehashPasswordIfRequired` 方法应在需要且支持的情况下重新哈希给定 `$user` 的密码。例如，此方法通常使用 `Hash::needsRehash` 方法来确定 `$credentials['password']` 值是否需要重新哈希。如果密码需要重新哈希，该方法应使用 `Hash::make` 方法重新哈希密码，并更新底层持久存储中的用户记录。

<a name="the-authenticatable-contract"></a>

### Authenticatable 契约

现在我们已经探讨了 `UserProvider` 上的每个方法，让我们来看看 `Authenticatable` 契约。请记住，用户提供者应从 `retrieveById`、`retrieveByToken` 和 `retrieveByCredentials` 方法返回此接口的实现：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface Authenticatable
{
    public function getAuthIdentifierName();
    public function getAuthIdentifier();
    public function getAuthPasswordName();
    public function getAuthPassword();
    public function getRememberToken();
    public function setRememberToken($value);
    public function getRememberTokenName();
}
```

这个接口很简单。`getAuthIdentifierName` 方法应返回用户的“主键”列的名称，`getAuthIdentifier` 方法应返回用户的“主键”。在使用 MySQL 后端时，这可能是分配给用户记录的自增主键。`getAuthPasswordName` 方法应返回用户密码列的名称。`getAuthPassword` 方法应返回用户的哈希密码。

此接口允许身份验证系统与任何“用户”类一起工作，无论您使用什么 ORM 或存储抽象层。默认情况下，Laravel 在 `app/Models` 目录中包含一个 `App\Models\User` 类，该类实现了此接口。

<a name="automatic-password-rehashing"></a>

## 自动密码重新哈希

Laravel 的默认密码哈希算法是 bcrypt。可以通过应用程序的 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量调整 bcrypt 哈希的“工作因子”。

通常，随着 CPU / GPU 处理能力的提高，bcrypt 工作因子应随着时间的推移而增加。如果您为应用程序增加了 bcrypt 工作因子，Laravel 将在用户通过 Laravel 入门套件进行身份验证时，或在您通过 `attempt` 方法 [手动对用户进行身份验证](#authenticating-users) 时，优雅且自动地重新哈希用户密码。

通常，自动密码重新哈希不应中断您的应用程序；但是，您可以通过发布 `hashing` 配置文件来禁用此行为：

```shell
php artisan config:publish hashing
```

发布配置文件后，您可以将 `rehash_on_login` 配置值设置为 `false`：

```php
'rehash_on_login' => false,
```

<a name="events"></a>

## 事件

Laravel 在身份验证过程中会派发各种 [事件](/12/events)。您可以为以下任何事件 [定义监听器](/12/events)：

<div class="overflow-auto">

| Event Name                                   |
| -------------------------------------------- |
| `Illuminate\Auth\Events\Registered`          |
| `Illuminate\Auth\Events\Attempting`          |
| `Illuminate\Auth\Events\Authenticated`       |
| `Illuminate\Auth\Events\Login`               |
| `Illuminate\Auth\Events\Failed`              |
| `Illuminate\Auth\Events\Validated`           |
| `Illuminate\Auth\Events\Verified`            |
| `Illuminate\Auth\Events\Logout`              |
| `Illuminate\Auth\Events\CurrentDeviceLogout` |
| `Illuminate\Auth\Events\OtherDeviceLogout`   |
| `Illuminate\Auth\Events\Lockout`             |
| `Illuminate\Auth\Events\PasswordReset`       |

</div>
