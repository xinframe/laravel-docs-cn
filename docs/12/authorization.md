---
group: 安全
title: 授权
order: 1
toc: content
---

# 授权

## 介绍

除了提供内置的[认证](/12/authentication)服务外，Laravel 还提供了一种简单的方式来对用户操作进行授权。例如，即使用户已经通过认证，他们也可能无权更新或删除由您的应用程序管理的某些 Eloquent 模型或数据库记录。Laravel 的授权功能提供了一种简单、有序的方式来管理这些类型的授权检查。

Laravel 提供了两种主要的授权方式：[Gates](#gates) 和 [Policies](#创建策略)。可以将 Gates 和 Policies 类比为路由和控制器。Gates 提供了一种简单的、基于闭包的授权方式，而 Policies 则像控制器一样，将逻辑围绕特定模型或资源进行分组。在本文档中，我们将首先探讨 Gates，然后再研究 Policies。

在构建应用程序时，您不需要在仅使用 Gates 或仅使用 Policies 之间做出选择。大多数应用程序可能会混合使用 Gates 和 Policies，这是完全没问题的！Gates 最适用于与任何模型或资源无关的操作，例如查看管理员仪表板。相反，当您希望对特定模型或资源进行授权时，应使用 Policies。

<a name="gates"></a>

## Gates

<a name="编写-gates"></a>

### 编写 Gates

:::warning
Gates 是学习 Laravel 授权功能基础的好方法；然而，在构建健壮的 Laravel 应用程序时，您应该考虑使用 [Policies](#创建策略) 来组织您的授权规则。
:::

Gates 是简单的闭包，用于确定用户是否有权执行给定的操作。通常，Gates 在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中使用 `Gate` facade 进行定义。Gates 总是接收一个用户实例作为其第一个参数，并且可以选择接收其他参数，例如相关的 Eloquent 模型。

在这个例子中，我们将定义一个 Gate 来确定用户是否可以更新给定的 `App\Models\Post` 模型。该 Gate 将通过比较用户的 `id` 与创建帖子的用户的 `user_id` 来实现这一点：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
  * 引导任何应用程序服务。
  */
public function boot(): void
{
    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });
}
```

像控制器一样，Gates 也可以使用类回调数组来定义：

```php
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;

/**
  * 引导任何应用程序服务。
  */
public function boot(): void
{
    Gate::define('update-post', [PostPolicy::class, 'update']);
}
```

<a name="通过-gates-授权操作"></a>

### 授权操作

要使用 Gates 授权操作，您应该使用 `Gate` facade 提供的 `allows` 或 `denies` 方法。请注意，您不需要将当前认证的用户传递给这些方法。Laravel 会自动将用户传递给 Gate 闭包。通常在执行需要授权的操作之前，在应用程序的控制器中调用 Gate 授权方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新给定的帖子。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if (! Gate::allows('update-post', $post)) {
            abort(403);
        }

        // 更新帖子...

        return redirect('/posts');
    }
}
```

如果您想确定当前认证用户以外的用户是否有权执行某个操作，您可以使用 `Gate` facade 上的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // 用户可以更新帖子...
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // 用户不能更新帖子...
}
```

您可以使用 `any` 或 `none` 方法一次性授权多个操作：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // 用户可以更新或删除帖子...
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // 用户不能更新或删除帖子...
}
```

<a name="授权或抛出异常"></a>

#### 授权或抛出异常

如果您希望尝试授权操作，并在用户不允许执行给定操作时自动抛出 `Illuminate\Auth\Access\AuthorizationException`，您可以使用 `Gate` facade 的 `authorize` 方法。`AuthorizationException` 实例会自动被 Laravel 转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// 操作已授权...
```

<a name="提供额外的上下文"></a>

#### 提供额外的上下文

授权能力的 Gate 方法（`allows`、`denies`、`check`、`any`、`none`、`authorize`、`can`、`cannot`）和授权 [Blade 指令](#via-blade-templates)（`@can`、`@cannot`、`@canany`）可以接收一个数组作为第二个参数。这些数组元素将作为参数传递给 Gate 闭包，并可以在做出授权决策时提供额外的上下文：

```php
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::define('create-post', function (User $user, Category $category, bool $pinned) {
    if (! $user->canPublishToGroup($category->group)) {
        return false;
    } elseif ($pinned && ! $user->canPinPosts()) {
        return false;
    }

    return true;
});

if (Gate::check('create-post', [$category, $pinned])) {
    // 用户可以创建帖子...
}
```

<a name="gate-响应"></a>

### Gate 响应

到目前为止，我们只研究了返回简单布尔值的 Gates。然而，有时您可能希望返回更详细的响应，包括错误消息。为此，您可以从 Gate 返回一个 `Illuminate\Auth\Access\Response`：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::deny('您必须是管理员。');
});
```

即使您从 Gate 返回授权响应，`Gate::allows` 方法仍将返回一个简单的布尔值；但是，您可以使用 `Gate::inspect` 方法来获取 Gate 返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // 操作已授权...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法时，如果操作未被授权，则会抛出 `AuthorizationException`，并且授权响应中提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('edit-settings');

// 操作已授权...
```

<a name="自定义-gate-响应状态"></a>

#### 自定义 HTTP 响应状态

当通过 Gate 拒绝操作时，会返回 `403` HTTP 响应；然而，有时返回替代的 HTTP 状态代码可能很有用。您可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数来自定义授权失败时返回的 HTTP 状态代码：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        ? Response::denyWithStatus(404);
});
```

由于通过 `404` 响应隐藏资源是 Web 应用程序中的常见模式，因此提供了 `denyAsNotFound` 方法以方便使用：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::denyAsNotFound();
}
```

<a name="拦截-gate-检查"></a>

### 拦截 Gate 检查

有时，您可能希望为特定用户授予所有权限。您可以使用 `before` 方法定义一个在所有其他授权检查之前运行的闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user, string $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回一个非空结果，则该结果将被视为授权检查的结果。

您可以使用 `after` 方法定义一个在所有其他授权检查之后执行的闭包：

```php
use App\Models\User;

Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

`after` 闭包返回的值不会覆盖授权检查的结果，除非 Gate 或 Policy 返回 `null`。

<a name="内联授权"></a>

### 内联授权

有时，您可能希望在不对应于操作的专用 Gate 的情况下，确定当前认证的用户是否有权执行给定的操作。Laravel 允许您通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这些类型的“内联”授权检查。内联授权不会执行任何已定义的 ["before" 或 "after" 授权钩子](#拦截-gate-检查)：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn (User $user) => $user->isAdministrator());

Gate::denyIf(fn (User $user) => $user->banned());
```

如果操作未被授权，或者当前没有用户认证，Laravel 将自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常。`AuthorizationException` 实例会自动被 Laravel 的异常处理程序转换为 403 HTTP 响应。

<a name="创建策略"></a>

## 创建策略

<a name="生成策略"></a>

### 生成策略

策略是围绕特定模型或资源组织授权逻辑的类。例如，如果您的应用程序是一个博客，您可能有一个 `App\Models\Post` 模型和一个相应的 `App\Policies\PostPolicy` 来授权用户操作，例如创建或更新帖子。

您可以使用 `make:policy` Artisan 命令生成策略。生成的策略将放置在 `app/Policies` 目录中。如果您的应用程序中不存在此目录，Laravel 将为您创建它：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令将生成一个空的策略类。如果您希望生成包含与查看、创建、更新和删除资源相关的示例策略方法的类，您可以在执行命令时提供 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

<a name="注册策略"></a>

### 注册策略

<a name="策略发现"></a>

#### 策略发现

默认情况下，只要模型和策略遵循标准的 Laravel 命名约定，Laravel 会自动发现策略。具体来说，策略必须位于包含模型的目录中或之上的 `Policies` 目录中。因此，例如，模型可能位于 `app/Models` 目录中，而策略可能位于 `app/Policies` 目录中。在这种情况下，Laravel 将首先在 `app/Models/Policies` 中查找策略，然后在 `app/Policies` 中查找。此外，策略名称必须与模型名称匹配，并带有 `Policy` 后缀。因此，`User` 模型将对应于 `UserPolicy` 策略类。

如果您希望定义自己的策略发现逻辑，您可以使用 `Gate::guessPolicyNamesUsing` 方法注册自定义策略发现回调。通常，此方法应从应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function (string $modelClass) {
    // 返回给定模型的策略类名称...
});
```

<a name="手动注册策略"></a>

#### 手动注册策略

使用 `Gate` facade，您可以在应用程序的 `AppServiceProvider` 的 `boot` 方法中手动注册策略及其对应的模型：

```php
use App\Models\Order;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Gate::policy(Order::class, OrderPolicy::class);
}
```

<a name="编写策略"></a>

## 编写策略

<a name="策略方法"></a>

### 策略方法

一旦策略类被注册，您可以为它授权的每个操作添加方法。例如，让我们在 `PostPolicy` 上定义一个 `update` 方法，该方法确定给定的 `App\Models\User` 是否可以更新给定的 `App\Models\Post` 实例。

`update` 方法将接收一个 `User` 和一个 `Post` 实例作为其参数，并应返回 `true` 或 `false`，指示用户是否有权更新给定的 `Post`。因此，在这个例子中，我们将验证用户的 `id` 是否与帖子上的 `user_id` 匹配：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定用户是否可以更新给定的帖子。
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

您可以根据需要继续在策略上定义其他方法，以授权各种操作。例如，您可以定义 `view` 或 `delete` 方法来授权各种与 `Post` 相关的操作，但请记住，您可以自由地为策略方法命名。

如果您在通过 Artisan 控制台生成策略时使用了 `--model` 选项，则它已经包含了 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 操作的方法。

:::info
所有策略都是通过 Laravel [服务容器](/12/container) 解析的，允许您在策略的构造函数中类型提示任何需要的依赖项，以便自动注入它们。
:::

<a name="策略响应"></a>

### 策略响应

到目前为止，我们只研究了返回简单布尔值的策略方法。然而，有时您可能希望返回更详细的响应，包括错误消息。为此，您可以从策略方法返回一个 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定用户是否可以更新给定的帖子。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::deny('您不拥有此帖子。');
}
```

当从策略返回授权响应时，`Gate::allows` 方法仍将返回一个简单的布尔值；但是，您可以使用 `Gate::inspect` 方法来获取 Gate 返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // 操作已授权...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法时，如果操作未被授权，则会抛出 `AuthorizationException`，并且授权响应中提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('update', $post);

// 操作已授权...
```

<a name="自定义策略响应状态"></a>

#### 自定义 HTTP 响应状态

当通过策略方法拒绝操作时，会返回 `403` HTTP 响应；然而，有时返回替代的 HTTP 状态代码可能很有用。您可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造函数来自定义授权失败时返回的 HTTP 状态代码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定用户是否可以更新给定的帖子。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyWithStatus(404);
}
```

由于通过 `404` 响应隐藏资源是 Web 应用程序中的常见模式，因此提供了 `denyAsNotFound` 方法以方便使用：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 确定用户是否可以更新给定的帖子。
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyAsNotFound();
}
```

<a name="没有模型的方法"></a>

### 没有模型的方法

一些策略方法只接收当前认证用户的实例。这种情况在授权 `create` 操作时最为常见。例如，如果您正在创建一个博客，您可能希望确定用户是否有权创建任何帖子。在这些情况下，您的策略方法应该只期望接收一个用户实例：

```php
/**
 * 确定给定用户是否可以创建帖子。
 */
public function create(User $user): bool
{
    return $user->role == 'writer';
}
```

<a name="访客用户"></a>

### 访客用户

默认情况下，如果传入的 HTTP 请求不是由认证用户发起的，所有 Gates 和 Policies 会自动返回 `false`。然而，您可以通过声明“可选”类型提示或为用户参数定义提供 `null` 默认值，允许这些授权检查传递到您的 Gates 和 Policies：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 确定用户是否可以更新给定的帖子。
     */
    public function update(?User $user, Post $post): bool
    {
        return $user?->id === $post->user_id;
    }
}
```

<a name="策略过滤器"></a>

### 策略过滤器

对于某些用户，您可能希望授权给定策略中的所有操作。为此，请在策略上定义一个 `before` 方法。`before` 方法将在策略上的任何其他方法之前执行，使您有机会在调用预期的策略方法之前授权操作。此功能最常用于授权应用程序管理员执行任何操作：

```php
use App\Models\User;

/**
 * 执行预授权检查。
 */
public function before(User $user, string $ability): bool|null
{
    if ($user->isAdministrator()) {
        return true;
    }

    return null;
}
```

如果您希望拒绝特定类型用户的所有授权检查，则可以从 `before` 方法返回 `false`。如果返回 `null`，则授权检查将回退到策略方法。

:::warning
如果策略类不包含与正在检查的能力名称匹配的方法，则不会调用策略类的 `before` 方法。
:::

<a name="使用策略授权操作"></a>

## 使用策略授权操作

<a name="通过用户模型"></a>

### 通过用户模型

您的 Laravel 应用程序中包含的 `App\Models\User` 模型包含两个有用的方法来授权操作：`can` 和 `cannot`。`can` 和 `cannot` 方法接收您希望授权的操作的名称和相关模型。例如，让我们确定用户是否有权更新给定的 `App\Models\Post` 模型。通常，这将在控制器方法中完成：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 更新给定的帖子。
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if ($request->user()->cannot('update', $post)) {
            abort(403);
        }

        // 更新帖子...

        return redirect('/posts');
    }
}
```

如果为给定模型注册了 [策略](#注册策略)，`can` 方法将自动调用适当的策略并返回布尔结果。如果没有为模型注册策略，`can` 方法将尝试调用与给定操作名称匹配的基于闭包的 Gate。

<a name="不需要模型的操作"></a>

#### 不需要模型的操作

请记住，某些操作可能对应于 `create` 等策略方法，这些方法不需要模型实例。在这些情况下，您可以将类名传递给 `can` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * 创建帖子。
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->cannot('create', Post::class)) {
            abort(403);
        }

        // 创建帖子...

        return redirect('/posts);
    }
}
```

<a name="通过-gate-facade"></a>

### 通过 `Gate` Facade

除了 `App\Models\User` 模型上提供的有用方法外，您始终可以通过 `Gate` facade 的 `authorize` 方法授权操作。

与 `can` 方法一样，此方法接收您希望授权的操作的名称和相关模型。如果操作未被授权，`authorize` 方法将抛出 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 异常处理程序会自动将其转换为带有 403 状态代码的 HTTP 响应：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * 更新给定的博客帖子。
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        // 当前用户可以更新博客帖子...

        return redirect('/posts');
    }
}
```

<a name="不需要模型的操作"></a>

#### 不需要模型的操作

如前所述，一些策略方法如 `create` 不需要模型实例。在这些情况下，您应该将类名传递给 `authorize` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * 创建新的博客帖子。
 *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function create(Request $request): RedirectResponse
    {
        Gate::authorize('create', Post::class);

        // 当前用户可以创建博客帖子...

        return redirect('/posts');
    }
}
```

<a name="通过中间件"></a>

### 通过中间件

Laravel 包含一个中间件，可以在传入请求到达您的路由或控制器之前授权操作。默认情况下，`Illuminate\Auth\Middleware\Authorize` 中间件可以使用 `can` [中间件别名](/12/middleware#middleware-aliases) 附加到路由，该别名由 Laravel 自动注册。让我们探索一个使用 `can` 中间件授权用户更新帖子的示例：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新帖子...
})->middleware('can:update,post');
```

在这个例子中，我们向 `can` 中间件传递了两个参数。第一个是我们希望授权的操作的名称，第二个是我们希望传递给策略方法的路由参数。在这种情况下，由于我们使用 [隐式模型绑定](/12/routing#implicit-binding)，`App\Models\Post` 模型将被传递给策略方法。如果用户未被授权执行给定操作，中间件将返回带有 403 状态代码的 HTTP 响应。

为了方便起见，您还可以使用 `can` 方法将 `can` 中间件附加到您的路由：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // 当前用户可以更新帖子...
})->can('update', 'post');
```

<a name="不需要模型的操作"></a>

#### 不需要模型的操作

再次强调，一些策略方法如 `create` 不需要模型实例。在这些情况下，您可以将类名传递给中间件。类名将用于确定在授权操作时使用哪个策略：

```php
Route::post('/post', function () {
    // 当前用户可以创建帖子...
})->middleware('can:create,App\Models\Post');
```

在字符串中间件定义中指定整个类名可能会变得繁琐。因此，您可以选择使用 `can` 方法将 `can` 中间件附加到您的路由：

```php
use App\Models\Post;

Route::post('/post', function () {
    // 当前用户可以创建帖子...
})->can('create', Post::class);
```

<a name="通过-blade-模板"></a>

### 通过 Blade 模板

在编写 Blade 模板时，您可能希望仅在用户有权执行给定操作时显示页面的一部分。例如，您可能希望仅在用户确实可以更新帖子时显示博客帖子的更新表单。在这种情况下，您可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- 当前用户可以更新帖子... -->
@elsecan('create', App\Models\Post::class)
    <!-- 当前用户可以创建新帖子... -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- 当前用户不能更新帖子... -->
@elsecannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建新帖子... -->
@endcannot
```

这些指令是编写 `@if` 和 `@unless` 语句的便捷快捷方式。上面的 `@can` 和 `@cannot` 语句等同于以下语句：

```blade
@if (Auth::user()->can('update', $post))
    <!-- 当前用户可以更新帖子... -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- 当前用户不能更新帖子... -->
@endunless
```

您还可以确定用户是否有权执行给定数组中的任何操作。为此，请使用 `@canany` 指令：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- 当前用户可以更新、查看或删除帖子... -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- 当前用户可以创建帖子... -->
@endcanany
```

<a name="不需要模型的操作"></a>

#### 不需要模型的操作

与大多数其他授权方法一样，如果操作不需要模型实例，您可以将类名传递给 `@can` 和 `@cannot` 指令：

```blade
@can('create', App\Models\Post::class)
    <!-- 当前用户可以创建帖子... -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- 当前用户不能创建帖子... -->
@endcannot
```

<a name="提供额外的上下文"></a>

### 提供额外的上下文

使用策略授权操作时，您可以将数组作为第二个参数传递给各种授权函数和助手。数组的第一个元素将用于确定应调用哪个策略，而数组的其余元素将作为参数传递给策略方法，并可以在做出授权决策时用于提供额外的上下文。例如，考虑以下 `PostPolicy` 方法定义，其中包含一个额外的 `$category` 参数：

```php
/**
 * 确定用户是否可以更新给定的帖子。
 */
public function update(User $user, Post $post, int $category): bool
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

当尝试确定认证用户是否可以更新给定帖子时，我们可以像这样调用此策略方法：

```php
/**
 * 更新给定的博客帖子。
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function update(Request $request, Post $post): RedirectResponse
{
    Gate::authorize('update', [$post, $request->category]);

    // 当前用户可以更新博客帖子...

    return redirect('/posts');
}
```

<a name="授权与-inertia"></a>

## 授权与 Inertia

尽管授权必须始终在服务器端处理，但通常为了方便起见，向您的前端应用程序提供授权数据以正确渲染应用程序的 UI 是很有用的。Laravel 没有定义将授权信息暴露给 Inertia 驱动的前端的必需约定。

然而，如果您使用 Laravel 的基于 Inertia 的 [入门套件](/12/starter-kits)，您的应用程序已经包含一个 `HandleInertiaRequests` 中间件。在此中间件的 `share` 方法中，您可以返回将提供给应用程序中所有 Inertia 页面的共享数据。此共享数据可以作为定义用户授权信息的便捷位置：

```php
<?php

namespace App\Http\Middleware;

use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    // ...

    /**
     * 定义默认共享的属性。
     *
     * @return array<string, mixed>
     */
    public function share(Request $request)
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'permissions' => [
                    'post' => [
                        'create' => $request->user()->can('create', Post::class),
                    ],
                ],
            ],
        ];
    }
}
```
