# dsh-notebook

**NoteBook 学习区** —— DeepSeek Harness 的封闭知识箱插件。导入资料，基于资料提问、出题、记笔记，全部数据留在本地。

> 当前版本 **0.2.2** · 数据仅存于本机

---

## 它是什么

NoteBook 是挂载在 DeepSeek Harness 侧边栏的一个学习工作区。每个「学习区」是一个独立知识箱：资料、问答、笔记、错题互相关联，回答只依据箱内内容，不联网检索。

四个分区：

| 分区 | 作用 |
|---|---|
| **资料** | 导入 Markdown / 纯文本 / PDF，支持多文件与整个文件夹；右侧可查看原文并跳转定位 |
| **问答** | 基于箱内资料回答并标注出处；可选中任意文字「就这段提问」 |
| **笔记** | 自动分区记录，可编辑、打标签、合并导出 Markdown |
| **做题** | 按题型与难度出题，错题自动进入错题本 |

## 特性

- **多文件导入**：一次选多个文件或整个文件夹，PDF 与文本混合导入
- **批量管理**：资料 / 笔记 / 聊天支持多选批量删除，删除后自动退出多选
- **批量导出**：笔记可合并导出为单个 Markdown 文件
- **聊天侧栏**：会话列表可收起，新增聊天自动跳转
- **字体可配**：正文、代码、公式分别设置，可导入本地字体
- **原生风格**：使用 DSH 的设计令牌，深浅色主题自动适配

## 安装

1. 下载 `NoteBook <version> Setup.exe`
2. 运行安装器，它会自动定位 `~/.dsh` 配置目录（找不到可手动选择）
3. 重启 DeepSeek Harness，侧边栏点击「学习区」

安装完成后会自动打开产品介绍页。

## 开发

插件由两部分组成：

```
plugin/
  index.js           宿主侧：路由 /notebook、SSE 流式问答、JSON 接口、文件落盘
  client.js          客户端：window.__ModuleLoader__ 手写 bundle，React 渲染四个分区
  pdf.js             轻量 PDF 文本提取（FlateDecode + 文本算子）
  locale/*.json      中英文案
  vendor/katex/      公式渲染
  cordis.patch.yml   Cordis 挂载声明
docs/index.html      产品介绍页（随安装包分发）
```

宿主侧通过 `webServer` 注册前缀路由，客户端只允许 `require('react')`。所有数据写入 `$DSH_HOME/storages/notebook/`。

本地调试：修改 `plugin/` 下的文件后，把目录同步到 profile 的 `node_modules/@local/dsh-notebook/`，再重启插件。

## 数据与隐私

- 资料正文、笔记、问答记录全部保存在本地存储目录
- 不向任何服务器上传内容
- 删除学习区会连同其资料、笔记、错题一并移除

## 已知限制

- PDF 仅支持**带文字层**的版本；扫描件（纯图片）无法提取文字，建议先 OCR 或直接粘贴文本
- PDF 提取依赖 FlateDecode，LZW 等压缩方式不支持
- 加密 PDF 无法导入

## 版本

见 [CHANGELOG.md](./CHANGELOG.md)。

## 许可

内部项目，暂未开源授权。
