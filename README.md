# NoteBook 学习区

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![version](https://img.shields.io/badge/version-0.2.3-informational.svg)](./CHANGELOG.md)
[![platform](https://img.shields.io/badge/DSH-Web%20%E9%A2%84%E8%A7%88%E7%89%88-6f42c1.svg)](#兼容性)

**把一堆资料变成一个能提问、能出题、能记笔记的学习区。** 导入 Markdown / 纯文本 / PDF，回答只引用你导入的内容，
数据全部留在本机，不经过任何中间服务器。

> 分类：学习工具 · 效率　｜　平台：DeepSeek Harness（Web 预览版）　｜　许可证：MIT　｜　当前版本 0.2.3

## 它解决什么

复习时的资料是散的：讲义、笔记、题库各在一处，问 AI 又容易得到「看起来对但和你资料不符」的答案。
NoteBook 把每个学习主题做成一个**封闭知识箱**——问答只依据箱内资料并标注出处，出题只出箱内的内容，
笔记和错题自动归档，最后能一键导出成 Markdown 放进 Obsidian。

## 四个分区

| 分区 | 能做什么 |
|---|---|
| **资料** | 导入 Markdown / 纯文本 / PDF，支持多文件与整个文件夹；右侧查看原文并跳转定位；导入时自动生成一句话「资料画像」 |
| **问答** | 按「资料画像 + 命中片段」回答并标注 `[资料名#片段]`；命中不足时自动扩大范围并提示；选中任意文字可按「就这段提问」 |
| **笔记** | 自动分区记录，可编辑、打标签；批量导出 Markdown（知识点 / 练习题 / 错题本 / 问答 / 合并） |
| **做题** | 按题型、难度、范围出题，逐题生成逐题保存，关掉不丢；作答前不给答案，答错才给改法与参考答案；错题自动进错题本 |

## 安装

### 插件市场 / CLI（推荐）

```bash
dsh plugin --profile web add github:Rebebberd/dsh-notebook
```

安装后重启 profile，侧边栏出现「学习区」图标。

> `--profile web` 换成你实际使用的 profile 名即可（例如 `desktop`）。仓库根目录就是插件包（`package.json` 已声明 `dsh.bundle.patch`），无需额外参数。
>
> 在「添加插件」对话框里直接粘贴 `https://github.com/Rebebberd/dsh-notebook`。**不要只填 npm 包名 `dsh-notebook`**——这个名字在 npm 上被一个占位包占用，装到的不是本插件。

### Windows 安装包

从 [Releases](https://github.com/Rebebberd/dsh-notebook/releases) 下载 `NoteBook-<version>-Setup.exe`，
双击运行，它会自动定位 `~/.dsh` 配置目录并写入 profile。

## 兼容性

| 项目 | 说明 |
|---|---|
| 目标宿主 | DeepSeek Harness 预览版（Web profile） |
| 已验证版本 | DSH desktop **0.2.0-rc.2**（Node 24 / pnpm 11） |
| 客户端平台 | `dsh.client.platform = web` |
| 依赖的契约 | 插件标准 `apply(ctx)`；通过 `webServer` 注册 `/notebook` 前缀路由 |
| 构建产物 | 源码即产物（ESM，无需构建），安装后直接可加载；无 `postinstall` 脚本 |
| 原生依赖 | 无 |

## 权限与外部依赖

上架前需要说清「它会碰什么」，这里逐项列出：

- **文件**：只读取你主动导入的文件（文本、PDF），不做目录扫描；写入只发生在 `$DSH_HOME/storages/notebook/`
- **网络**：默认**不出网**。只有在出题/答题时勾选「联网参考」，才会调用 DSH 提供的 Web 搜索能力
- **模型**：使用你在 DSH 里配置的模型（可在四个分区切换，包括你自己接入的第三方 API）；插件不内置、不转发任何 Key
- **凭据**：插件本身不保存任何 API Key 或账号信息
- **命令**：不执行系统命令，不加载远程代码

## 数据与隐私

- 资料正文、问答记录、笔记、错题全部保存在本机 `$DSH_HOME/storages/notebook/`
- 没有服务端，不上传任何内容
- 删除一个学习区会连同其资料、笔记、错题一并删除（不可恢复）

## 已知限制

- PDF 只支持**带文字层**的版本；扫描件（纯图片）需要先 OCR 或直接粘贴文本
- PDF 提取依赖 FlateDecode，LZW 等其它压缩方式不支持
- 加密 PDF 无法导入
- 单份资料过长会按片段切分，问答时只把检索到的片段送进模型

## 开发

仓库根目录即插件包：

```
index.js             宿主侧：路由、SSE 流式问答、JSON 接口、文件落盘
client.js            客户端：window.__ModuleLoader__ bundle，React 渲染四个分区
pdf.js               轻量 PDF 文本提取（FlateDecode + 文本算子）
locale/*.json        中英文案
vendor/katex/        公式渲染
cordis.patch.yml     Cordis 挂载声明
package.json         声明 dsh.bundle.patch 与 Web 客户端注入
docs/index.html      产品介绍页
```

宿主侧通过 `webServer` 注册前缀路由，客户端只允许 `require('react')`。本地调试：改完根目录下的文件后，
把仓库内容同步到 profile 的 `node_modules/dsh-notebook/`，再重启插件。

## 版本

见 [CHANGELOG.md](./CHANGELOG.md)。

## 许可

[MIT](./LICENSE)
