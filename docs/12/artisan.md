---
group:
  title: 深入了解
  order: 4
title: 控制台命令
order: 0
toc: content
---

# Artisan 控制台

## 介绍

Artisan 是 Laravel 内置的命令行界面。Artisan 存在于应用程序的根目录下，作为 `artisan` 脚本存在，并提供了一系列有助于构建应用程序的有用命令。要查看所有可用 Artisan 命令的列表，您可以使用 `list` 命令：

```shell
php artisan list
```

每个命令还有一个“帮助”屏幕，该屏幕会显示并描述命令的可用参数和选项。要查看帮助屏幕，请在命令名称前加上 `help`：

```shell
php artisan help migrate
```

### Laravel Sail

如果您正在使用 [Laravel Sail](/12/sail) 作为本地开发环境，请记住使用 `sail` 命令行来调用 Artisan 命令。Sail 将在您的应用程序的 Docker 容器内执行 Artisan 命令：

```shell
./vendor/bin/sail artisan list
```

### Tinker (REPL)

Laravel Tinker 是一个功能强大的 Laravel 框架 REPL，由 [PsySH](https://github.com/bobthecow/psysh) 包支持。

##### 安装

所有 Laravel 应用程序默认都包含 Tinker。但是，如果您之前从应用程序中删除了它，可以通过 Composer 安装 Tinker：

```bash
composer require laravel/tinker
```

:::info
寻找热重载、多行代码编辑和自动完成功能？请查看 [Tinkerwell](https://tinkerwell.app/)！
:::

##### 使用方法

Tinker 允许您在命令行上与整个 Laravel 应用程序交互，包括 Eloquent 模型、任务、事件等。要进入 Tinker 环境，请运行以下 Artisan 命令：

```bash
php artisan tinker
```

您可以使用 `vendor:publish` 命令发布 Tinker 的配置文件：

```shell
php artisan vendor:publish --provider="Laravel\Tinker\TinkerServiceProvider"
```

:::warning
`dispatch` 辅助函数和 `Dispatchable` 类上的 `dispatch` 方法依赖垃圾回收机制将任务放到队列中。因此，在使用 tinker 时，建议使用 `Bus::dispatch` 或 `Queue::push` 来分发任务。
:::

##### 命令允许列表

Tinker 使用一个“允许”列表来确定可以在其 shell 中运行哪些 Artisan 命令。默认情况下，您可以运行 `clear-compiled`、`down`、`env`、`inspire`、`migrate`、`migrate:install`、`up` 和 `optimize` 命令。如果您想允许更多命令，可以在 `tinker.php` 配置文件中的 `commands` 数组中添加它们：

```php
'commands' => [
    // App\Console\Commands\ExampleCommand::class,
],
```

##### 不应被别名的类

通常，Tinker 会在您与 Tinker 中的类交互时自动为其设置别名。但是，您可能希望某些类永远不会被别名化。您可以通过在 `tinker.php` 配置文件中的 `dont_alias` 数组中列出这些类来实现这一点：

```php
'dont_alias' => [
    App\Models\User::class,
],
```

## 编写命令

除了 Artisan 提供的命令外，您还可以构建自己的自定义命令。命令通常存储在 `app/Console/Commands` 目录中；不过，您可以自由选择其他存储位置，只要您的命令可以通过 Composer 加载即可。

### 生成命令

要创建新命令，您可以使用 `make:command` Artisan 命令。此命令将在 `app/Console/Commands` 目录中创建一个新的命令类。如果此目录在您的应用程序中不存在，则它将在第一次运行 `make:command` Artisan 命令时创建：

```php
php artisan make:command SendEmails
```

### 命令结构

在生成命令后，您应该为类的 `signature` 和 `description` 属性定义适当的值。这些属性将在显示于 `list` 屏幕时使用。`signature` 属性还允许您[定义命令的输入期望](#定义输入期望)。当命令被执行时，`handle` 方法将被调用。您可以在该方法中放置命令逻辑。

让我们来看一个示例命令。请注意，我们可以通过命令的 `handle` 方法请求任何所需的依赖项。Laravel 的[服务容器](/12/container)将自动注入在此方法签名中类型提示的所有依赖项：

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\DripEmailer;
use Illuminate\Console\Command;

class SendEmails extends Command
{
    /**
     * 命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user}';

    /**
     * 命令的描述。
     *
     * @var string
     */
    protected $description = '向用户发送营销邮件';

    /**
     * 执行控制台命令。
     */
    public function handle(DripEmailer $drip): void
    {
        $drip->send(User::find($this->argument('user')));
    }
}
```

:::info
为了提高代码复用性，建议保持控制台命令轻量化，并让它们委托给应用程序服务以完成任务。在上面的例子中，请注意我们注入了一个服务类来完成发送电子邮件的“繁重工作”。
:::

##### 退出代码

如果 `handle` 方法未返回任何内容且命令成功执行，则命令将以 `0` 退出码退出，表示成功。然而，`handle` 方法可以选择返回一个整数以手动指定命令的退出码：

```php
$this->error('发生错误。');

return 1;
```

如果您希望从命令中的任何方法“失败”，可以使用 `fail` 方法。`fail` 方法将立即终止命令的执行，并返回退出码 `1`：

```php
$this->fail('发生错误。');
```

### 闭包命令

基于闭包的命令提供了另一种定义控制台命令的方式。就像路由闭包是控制器的替代方案一样，您可以将闭包命令视为命令类的替代方案。

尽管 `routes/console.php` 文件不定义 HTTP 路由，但它定义了进入应用程序的基于控制台的入口点（路由）。在此文件中，您可以使用 `Artisan::command` 方法定义所有基于闭包的控制台命令。`command` 方法接受两个参数：命令签名和接收命令参数和选项的闭包：

```php
Artisan::command('mail:send {user}', function (string $user) {
    $this->info("正在向 {$user} 发送邮件！");
});
```

闭包绑定到底层命令实例上，因此您能够访问命令类上通常可以访问的所有辅助方法。

##### 依赖注入

除了接收命令的参数和选项外，命令闭包还可以通过[服务容器](/12/container)解析出您想要的其他依赖项：

```php
use App\Models\User;
use App\Support\DripEmailer;

Artisan::command('mail:send {user}', function (DripEmailer $drip, string $user) {
    $drip->send(User::find($user));
});
```

##### 闭包命令描述

在定义基于闭包的命令时，您可以使用 `purpose` 方法为命令添加描述。此描述将在运行 `php artisan list` 或 `php artisan help` 命令时显示：

```php
Artisan::command('mail:send {user}', function (string $user) {
    // ...
})->purpose('向用户发送营销邮件');
```

### 隔离命令

:::warning
要使用此功能，您的应用程序必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动程序作为应用程序的默认缓存驱动程序。此外，所有服务器必须与同一中央缓存服务器通信。
:::
有时，您可能希望确保在同一时间只能运行一个命令实例。要实现这一点，可以在命令类上实现 `Illuminate\Contracts\Console\Isolatable` 接口：

```php

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;

class SendEmails extends Command implements Isolatable
{
    / /
}
```

当一个命令被标记为 `Isolatable` 时，Laravel 会自动为该命令添加一个 `--isolated` 选项。当命令使用该选项调用时，Laravel 会确保没有其他实例同时运行该命令。Laravel 通过尝试使用应用程序的默认缓存驱动程序获取原子锁来实现这一点。如果其他实例正在运行，则命令不会执行；但是，命令仍将以成功的退出状态码退出：

```shell
php artisan mail:send 1 --isolated
```

如果您希望指定命令无法执行时应返回的退出状态码，可以通过 `isolated` 选项提供所需的退出状态码：

```shell
php artisan mail:send 1 --isolated=12
```

##### 锁 ID

默认情况下，Laravel 将使用命令的名称来生成用于在应用程序缓存中获取原子锁的字符串键。但是，您可以通过在 Artisan 命令类上定义 `isolatableId` 方法来自定义此键，从而允许将命令的参数或选项集成到键中：

```php
/**
 * 获取命令的隔离 ID。
 */
public function isolatableId(): string
{
    return $this->argument('user');
}
```

##### 锁过期时间

默认情况下，隔离锁在命令完成后过期。或者，如果命令中断且无法完成，则锁将在一小时后过期。但是，您可以通过在命令上定义 `isolationLockExpiresAt` 方法来调整锁的过期时间：

```php
use DateTimeInterface;
use DateInterval;

/**
 * 确定命令隔离锁何时过期。
 */
public function isolationLockExpiresAt(): DateTimeInterface|DateInterval
{
    return now()->addMinutes(5);
}
```

## 定义输入期望

在编写控制台命令时，通常会通过参数或选项从用户那里收集输入。Laravel 使用命令的 `signature` 属性非常方便地定义您期望从用户那里获得的输入。`signature` 属性允许您以单个、表达性强的、类似路由的语法定义命令的名称、参数和选项。

### 参数

所有用户提供的参数和选项都用大括号包裹。在下面的示例中，命令定义了一个必需的参数：`user`：

```php
/**
 * 命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user}';
```

您也可以使参数可选或为参数定义默认值：

```php
// 可选参数...
'mail:send {user?}'

// 带默认值的可选参数...
'mail:send {user=foo}'
```

### 选项

选项与参数一样，是另一种形式的用户输入。选项在通过命令行提供时以两个连字符（`--`）开头。选项有两种类型：一种是接收值的选项，另一种是不接收值的选项。不接收值的选项充当布尔“开关”。让我们来看一个这种类型的选项的例子：

```php
/**
 * 命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue}';
```

在这个例子中，当调用 Artisan 命令时，可以指定 `--queue` 开关。如果传递了 `--queue` 开关，则选项的值将是 `true`。否则，值将是 `false`：

```shell
php artisan mail:send 1 --queue
```

##### 带值的选项

接下来，让我们看看一个需要值的选项。如果用户必须为选项指定值，您应该在选项名称后面加上 `=` 符号：

```php
/**
 * 命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send {user} {--queue=}';
```

在这个例子中，用户可以通过以下方式传递选项的值。如果在调用命令时未指定选项，则其值将为 `null`：

```sehll
php artisan mail:send 1 --queue=default
```

您可以通过在选项名称后指定默认值来为选项分配默认值。如果用户未指定选项值，则将使用默认值：

```php
'mail:send {user} {--queue=default}'
```

##### 选项快捷方式

在定义选项时，您可以指定快捷方式并在选项名称前使用 `|` 字符作为分隔符来分隔快捷方式和完整选项名称：

```php
'mail:send {user} {--Q|queue}'
```

在终端上调用命令时，选项快捷方式应以单个连字符开头，且不应包含 `=` 字符，当指定选项值时：

```shell
php artisan mail:send 1 -Qdefault
```

### 输入数组

如果您希望定义参数或选项以期望多个输入值，可以使用 `*` 字符。首先，让我们看一个指定此类参数的示例：

```php
'mail:send {user*}'
```

调用此方法时，`user` 参数可以在命令行中按顺序传递。例如，以下命令将把 `user` 的值设置为具有 `1` 和 `2` 作为其值的数组：

```shell
php artisan mail:send 1 2
```

这个 `*` 字符可以与可选参数定义结合使用，以允许零个或多个参数实例：

```php
'mail:send {user?*}'
```

##### 选项数组

在定义需要多个输入值的选项时，传递给命令的每个选项值应以选项名称为前缀：

```php
'mail:send {--id=*}'
```

这样的命令可以通过传递多个 `--id` 参数来调用：

```shell
php artisan mail:send --id=1 --id=2
```

### 输入描述

您可以为输入参数和选项分配描述，通过用冒号分隔参数名称和描述来实现。如果您需要一些额外的空间来定义命令，可以随意将定义扩展到多行：

```php
/**
 * 命令的名称和签名。
 *
 * @var string
 */
protected $signature = 'mail:send
                       {user : 用户ID}
                       {--queue : 是否应将作业排队}';
```

### 提示缺失输入

如果您的命令包含必需的参数，而用户未提供它们，则会收到错误消息。或者，您可以配置命令在缺少必需参数时自动提示用户。为此，请在命令中实现 `PromptsForMissingInput` 接口：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\PromptsForMissingInput;

class SendEmails extends Command implements PromptsForMissingInput
{
    /**
     * 命令的名称和签名。
     *
     * @var string
     */
    protected $signature = 'mail:send {user}';

    // ...
}
```

如果 Laravel 需要从用户那里获取必需的参数，它将通过智能地使用参数名称或描述来提问，自动询问用户参数。如果您希望自定义用于收集必需参数的问题，可以实现 `promptForMissingArgumentsUsing` 方法，返回一个以参数名称为键的问题数组：

```php
/**
 * 使用返回的问题提示缺失的输入参数。
 *
 * @return array<string, string>
 */
protected function promptForMissingArgumentsUsing(): array
{
    return [
        'user' => '哪个用户 ID 应该接收邮件？',
    ];
}
```

您还可以通过使用包含问题和占位符的元组来提供占位符文本：

```php
return [
    'user' => [['哪个用户 ID 应该接收邮件？', '例如：123']],
];
```

如果您希望完全控制提示，可以提供一个应该提示用户并返回其答案的闭包：

```php
use App\Models\User;
use function Laravel\Prompts\search;

// ...

return [
    'user' => fn () => search(
        label: '搜索用户：',
        placeholder: '例如：Taylor Otwell',
        options: fn ($value) => strlen($value) > 0
            ? User::where('name', 'like', "%{$value}%")->pluck('name', 'id')->all()
            : []
    ),
];
```

:::info
《[Laravel Prompts](/12/prompts)》文档包括有关可用提示及其用法的更多信息。
:::

如果您希望提示用户选择或输入[选项](#选项)，可以在命令的 `handle` 方法中包含提示。但是，如果您只想在用户也被自动提示缺失参数时提示他们，则可以实现 `afterPromptingForMissingArguments` 方法：

```php
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use function Laravel\Prompts\confirm;

// ...

/**
 * 在用户被提示缺失参数后执行操作。
 */
protected function afterPromptingForMissingArguments(InputInterface $input, OutputInterface $output): void
{
    $input->setOption('queue', confirm(
        label: '您是否希望将邮件排队？',
        default: $this->option('queue')
    ));
}
```

## 命令 I/O

### 检索输入

在命令执行期间，您很可能需要访问命令接受的参数和选项的值。为此，您可以使用 `argument` 和 `option` 方法。如果参数或选项不存在，则返回 `null`：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $userId = $this->argument('user');
}
```

如果您需要将所有参数作为数组检索，可以调用 `arguments` 方法：

```php
$arguments = $this->arguments();
```

选项可以像参数一样轻松检索，使用 `option` 方法。要将所有选项作为数组检索，可以调用 `options` 方法：

```php
// 检索特定选项...
$queueName = $this->option('queue');

// 将所有选项作为数组检索...
$options = $this->options();
```

### 提示输入

:::info
[Laravel Prompts](/12/prompts) 是一个 PHP 包，用于为命令行应用程序添加美观且用户友好的表单，具有浏览器一样的功能，包括占位符文本和验证。
:::
除了显示输出外，您还可以在命令执行过程中提示用户提供输入。`ask` 方法将提示用户给出问题，接受他们的输入，然后将用户的输入返回到命令：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $name = $this->ask('您的名字是什么？');

    // ...
}
```

`ask` 方法还接受一个可选的第二个参数，该参数指定如果用户未提供输入时应返回的默认值：

```php
$name = $this->ask('您的名字是什么？', 'Taylor');
```

`secret` 方法类似于 `ask`，但用户在控制台中输入时看不到他们的输入。此方法适用于询问敏感信息，如密码：

```php
$password = $this->secret('密码是什么？');
```

##### 确认

如果您需要向用户询问简单的“是或否”确认，可以使用 `confirm` 方法。默认情况下，此方法将返回 `false`。但是，如果用户对提示输入 `y` 或 `yes`，该方法将返回 `true`。

```php
if ($this->confirm('您是否希望继续？')) {
    // ...
}
```

如有必要，您可以通过将 `true` 作为 `confirm` 方法的第二个参数传递来指定确认提示应默认返回 `true`：

```php
if ($this->confirm('您是否希望继续？', true)) {
    // ...
}
```

##### 自动完成

`anticipate` 方法可用于为可能的选择提供自动完成。用户仍然可以提供任何答案，无论自动完成提示如何：

```php
$name = $this->anticipate('您的名字是什么？', ['Taylor', 'Dayle']);
```

或者，您可以将闭包作为第二个参数传递给 `anticipate` 方法。每次用户输入字符时都会调用该闭包。闭包应接受一个包含用户当前输入的字符串参数，并返回一个自动完成选项数组：

```php
$name = $this->anticipate('您的地址是什么？', function (string $input) {
    // 返回自动完成选项...
});
```

##### 多项选择题

如果您需要在提问时为用户提供预定义的一组选择，可以使用 `choice` 方法。您可以通过将默认值的数组索引作为第三个参数传递给方法来设置如果未选择选项时应返回的默认值：

```php
$name = $this->choice(
    '您的名字是什么？',
    ['Taylor', 'Dayle'],
    $defaultIndex
);
```

此外，`choice` 方法接受可选的第四和第五个参数，用于确定选择有效响应的最大尝试次数以及是否允许多次选择：

```php
$name = $this->choice(
    '您的名字是什么？',
    ['Taylor', 'Dayle'],
    $defaultIndex,
    $maxAttempts = null,
    $allowMultipleSelections = false
);
```

### 写输出

要将输出发送到控制台，您可以使用 `line`、`info`、`comment`、`question`、`warn` 和 `error` 方法。每个方法都会为其用途使用适当的 ANSI 颜色。例如，让我们向用户显示一些一般信息。通常，`info` 方法将以绿色文本显示在控制台上：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    // ...

    $this->info('命令成功！');
}
```

要显示错误消息，使用 `error` 方法。错误消息文本通常以红色显示：

```php
$this->error('发生错误！');
```

您可以使用 `line` 方法显示纯文本，不带颜色：

```php
$this->line('在屏幕上显示此内容');
```

您可以使用 `newLine` 方法显示空白行：

```php
// 显示一行空白...
$this->newLine();

// 显示三行空白...
$this->newLine(3);
```

##### 表格

`table` 方法可以轻松正确格式化多行/多列数据。您只需提供列名和表格的数据，Laravel 将自动为您计算表格的适当宽度和高度：

```php
use App\Models\User;

$this->table(
    ['姓名', '电子邮件'],
    User::all(['name', 'email'])->toArray()
);
```

##### 进度条

对于长时间运行的任务，显示一个进度条以通知用户任务的完成情况是有帮助的。使用 `withProgressBar` 方法，Laravel 将显示一个进度条并在给定的可迭代值的每次迭代中前进其进度：

```php
use App\Models\User;

$users = $this->withProgressBar(User::all(), function (User $user) {
    $this->performTask($user);
});
```

有时，您可能需要更手动地控制进度条的前进方式。首先，定义过程将迭代的总步数。然后，在处理每个项目后前进进度条：

```php
$users = App\Models\User::all();

$bar = $this->output->createProgressBar(count($users));

$bar->start();

foreach ($users as $user) {
    $this->performTask($user);

    $bar->advance();
}

$bar->finish();
```

:::warning
如需更多高级选项，请参阅《[Symfony 进度条组件文档](https://symfony.com/doc/7.0/components/console/helpers/progressbar.html)》。
:::

## 注册命令

默认情况下，Laravel 自动注册 `app/Console/Commands` 目录中的所有命令。但是，您可以使用应用程序的 `bootstrap/app.php` 文件中的 `withCommands` 方法指示 Laravel 扫描其他目录以查找 Artisan 命令：

```php
->withCommands([
    __DIR__.'/../app/Domain/Orders/Commands',
])
```

如果有需要，您还可以通过将命令的类名提供给 `withCommands` 方法手动注册命令：

```php
use App\Domain\Orders\Commands\SendEmails;

->withCommands([
    SendEmails::class,
])
```

当 Artisan 启动时，应用程序中的所有命令都将通过[服务容器](/12/container)解析并注册到 Artisan。

## 程序化执行命令

有时，您可能希望在命令行之外执行 Artisan 命令。例如，您可能希望从路由或控制器中执行 Artisan 命令。您可以使用 `Artisan` Facade 上的 `call` 方法来实现这一点。`call` 方法接受命令的签名名称或类名为第一个参数，以及命令参数的数组为第二个参数。返回退出码：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/user/{user}/mail', function (string $user) {
    $exitCode = Artisan::call('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    // ...
});
```

或者，您可以将完整的 Artisan 命令作为字符串传递给 `call` 方法：

```php
Artisan::call('mail:send 1 --queue=default');
```

##### 传递数组值

如果您的命令定义了一个接受数组的选项，您可以将数组值传递给该选项：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/mail', function () {
    $exitCode = Artisan::call('mail:send', [
        '--id' => [5, 13]
    ]);
});
```

##### 传递布尔值

如果需要指定不接受字符串值的选项的值，例如 `migrate:refresh` 命令的 `--force` 标志，您应该将 `true` 或 `false` 作为选项的值传递：
$exitCode = Artisan::call('migrate:refresh', [
'--force' => true,
]);

##### 队列 Artisan 命令

使用 `Artisan` Facade 上的 `queue` 方法 [queue workers](/12/queues)，您甚至可以将 Artisan 命令排队，以便它们由队列工作者在后台处理。在使用此方法之前，请确保已配置队列并正在运行队列监听器：

```php
use Illuminate\Support\Facades\Artisan;

Route::post('/user/{user}/mail', function (string $user) {
    Artisan::queue('mail:send', [
        'user' => $user, '--queue' => 'default'
    ]);

    // ...
});
```

使用 `onConnection` 和 `onQueue` 方法，您可以指定 Artisan 命令应派发到的连接或队列：

```php
Artisan::queue('mail:send', [
    'user' => 1, '--queue' => 'default'
])->onConnection('redis')->onQueue('commands');
```

### 从其他命令调用命令

有时，您可能希望从现有的 Artisan 命令中调用其他命令。您可以使用 `call` 方法来实现这一点。`call` 方法接受命令名称和命令参数/选项数组：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $this->call('mail:send', [
        'user' => 1, '--queue' => 'default'
    ]);

    // ...
}
```

如果您希望从另一个控制台命令中调用命令并抑制其所有输出，可以使用 `callSilently` 方法。`callSilently` 方法的签名与 `call` 方法相同：

```php
$this->callSilently('mail:send', [
    'user' => 1, '--queue' => 'default'
]);
```

## 信号处理

如您所知，操作系统允许向运行中的进程发送信号。例如，`SIGTERM` 信号是操作系统请求程序终止的方式。如果您希望在 Artisan 控制台命令中监听信号并执行相应的代码，可以使用 `trap` 方法：

```php
/**
 * 执行控制台命令。
 */
public function handle(): void
{
    $this->trap(SIGTERM, fn () => $this->shouldKeepRunning = false);

    while ($this->shouldKeepRunning) {
        // ...
    }
}
```

要同时监听多个信号，您可以向 `trap` 方法提供一个信号数组：

```php
$this->trap([SIGTERM, SIGQUIT], function (int $signal) {
    $this->shouldKeepRunning = false;

    dump($signal); // SIGTERM / SIGQUIT
});
```

### 模板定制

Artisan 控制台的 `make` 命令用于创建各种类，例如控制器、任务、迁移和测试。这些类是使用“模板”文件生成的，这些文件基于您的输入填充了值。但是，如果您希望对 Artisan 生成的文件进行小改动，可以使用 `stub:publish` 命令将最常见的模板发布到您的应用程序中，以便您可以自定义它们：

```shell
php artisan stub:publish
```

发布的模板将位于应用程序根目录下的 `stubs` 目录中。对这些模板所做的任何更改都将在使用 Artisan 的 `make` 命令生成相应类时反映出来。

### 事件

Artisan 在运行命令时会触发三个事件：`Illuminate\Console\Events\ArtisanStarting`、`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished`。`ArtisanStarting` 事件在 Artisan 启动时立即触发。接下来，`CommandStarting` 事件在命令运行前立即触发。最后，`CommandFinished` 事件在命令执行完毕后触发。
