---
group: 序言
title: 升级指南
order: 1
toc: content
---
# 升级指南
## 从 11.x 升级到 12.0

#### 预计升级时间：5 分钟
> 我们尝试记录所有可能的重大更改。由于其中一些重大更改位于框架中不太显眼的部分，因此只有部分更改可能真正影响您的应用程序。想节省时间？您可以使用 [Laravel Shift](https://laravelshift.com/) 来帮助自动升级您的应用程序。

### 更新依赖项

**影响可能性：高**

您应该在应用程序的 `composer.json` 文件中更新以下依赖项：

- `laravel/framework` 到 `^12.0`
- `phpunit/phpunit` 到 `^11.0`
- `pestphp/pest` 到 `^3.0`

#### Carbon 3

**影响可能性：低**

已删除对 [Carbon 2.x](https://carbon.nesbot.com/docs/) 的支持。所有 Laravel 12 应用程序现在都需要 [Carbon 3.x](https://carbon.nesbot.com/docs/#api-carbon-3)。

### 更新 Laravel 安装程序

如果您使用 Laravel 安装程序 CLI 工具创建新的 Laravel 应用程序，则应更新安装程序安装以与 Laravel 12.x 和 [新的 Laravel 入门套件](https://laravel.com/starter-kits) 兼容。如果您通过 `composer global require` 安装了 Laravel 安装程序，则可以使用 `composer global update` 更新安装程序：

```shell
composer global update laravel/installer
```

如果您最初通过 `php.new` 安装了 PHP 和 Laravel，则只需重新运行操作系统的 `php.new` 安装命令即可安装最新版本的 PHP 和 Laravel 安装程序：

:::code-group

```shell [macOS] 
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.4)"
```

```shell [Windows PowerShell]
# 以管理员身份运行...
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.4'))
```

```shell [Linux]
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.4)"
```

:::
或者，如果您使用的是 [Laravel Herd](https://herd.laravel.com) 捆绑的 Laravel 安装程序副本，则应将 Herd 安装更新到最新版本。

### 并发

#### 并发结果索引映射

**影响可能性：低**

使用关联数组调用 `Concurrency::run` 方法时，并发操作的结果现在会与其关联键一起返回：

```php
$result = Concurrency::run([
  'task-1' => fn () => 1 + 1,
  'task-2' => fn () => 2 + 2,
]);

// ['task-1' => 2, 'task-2' => 4]
```

### 数据库

#### 多模式数据库检查

**影响可能性：低**

`Schema::getTables()`、`Schema::getViews()` 和 `Schema::getTypes()` 方法现在默认包含所有模式的结果。您可以传递 `schema` 参数来仅检索给定架构的结果：

```php
// 所有架构上的所有表...
$tables = Schema::getTables();

// “main”架构上的所有表...
$table = Schema::getTables(schema: 'main');

// “main”和“blog”架构上的所有表...
$table = Schema::getTables(schema: ['main', 'blog']);
```

`Schema::getTableListing()` 方法现在默认返回架构限定的表名。您可以传递 `schemaQualified` 参数来根据需要更改行为：

```php
$tables = Schema::getTableListing();
// ['main.migrations', 'main.users', 'blog.posts']

$table = Schema::getTableListing(schema: 'main');
// ['main.migrations', 'main.users']

$table = Schema::getTableListing(schema: 'main', schemaQualified: false);
// ['migrations', 'users']
```

`db:table` 和 `db:show` 命令现在输出 MySQL、MariaDB 和 SQLite 上所有架构的结果，就像 PostgreSQL 和 SQL Server 一样。

### Eloquent

#### 模型和 UUIDv7

**影响可能性：中等**

`HasUuids` 特征现在返回与 UUID 规范版本 7 兼容的 UUID（有序 UUID）。如果您想继续使用有序的 UUIDv4 字符串作为模型的 ID，您现在应该使用 `HasVersion4Uuids` 特征：

```php
- use Illuminate\Database\Eloquent\Concerns\HasUuids; 
+ use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids as HasUuids; 
```

`HasVersion7Uuids` 特征已被删除。如果您之前使用此特征，则应改用 `HasUuids` 特征，它现在提供相同的行为。

### 请求

#### 嵌套数组请求合并

**影响可能性：低**

`$request->mergeIfMissing()` 方法现在允许使用“点”符号合并嵌套数组数据。如果您以前依赖此方法创建包含“点”符号版本的键的顶级数组键，则可能需要调整应用程序以考虑此新行为：

```php
$request->mergeIfMissing([
'user.last_name' => 'Otwell',
]);
```

### 验证

#### 图像验证现在排除 SVG

`image` 验证规则默认不再允许 SVG 图像。如果您想在使用 `image` 规则时允许 SVG，则必须明确允许它们：

```php
use Illuminate\Validation\Rules\File;

'photo' => 'required|image:allow_svg'

// 或者...
'photo' => ['required', File::image(allowSvg: true)],
```

### 杂项

我们还鼓励您查看 `laravel/laravel` [GitHub 存储库](https://github.com/laravel/laravel) 中的更改。虽然其中许多更改不是必需的，但您可能希望将这些文件与您的应用程序保持同步。本升级指南将介绍其中一些更改，但其他更改（例如对配置文件或注释的更改）则不会介绍。您可以使用 [GitHub 比较工具](https://github.com/laravel/laravel/compare/11.x...12.x) 轻松查看更改，并选择对您来说重要的更新。
