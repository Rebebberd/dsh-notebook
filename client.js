/**
 * Client half of the NoteBook bundle.
 *
 * Registers a full-page panel (`main` keyed by the sidebar panel id) and its
 * sidebar icon. Data comes from the Host half over the private `/notebook`
 * route; answers stream back as Server-Sent Events. This file talks to no other
 * network endpoint and imports no other Harness Client package.
 */
window.__ModuleLoader__.load({
  id: 'dsh-notebook',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Dictionary namespace owned by this plugin. */
    const NS = 'notebook'
    /** The id shared by the sidebar entry and the main panel it opens. */
    const PANEL_ID = 'notebook'
    /** Private Host route, resolved against the page so a mounted deployment still works. */
    const CHANNEL = 'notebook'
    /** Largest PDF accepted from the browser, before base64 expansion. */
    const MAX_PDF_BYTES = 12 * 1024 * 1024

    const zh = {
      'panel': '学习区',
      'title': 'NoteBook 学习区',
      'delete.title': '删除学习区',
      'delete.body': '确定要删除「{name}」吗？删除后该学习区的资料、问答、笔记和错题都会一并移除，且无法恢复。',
      'delete.dontAsk': '不再提醒',
      'rail.heading': '学习区',
      'rail.collapse': '收起学习区列表',
      'rail.expand': '展开学习区列表',      'rail.new': '新建学习区',
      'rail.empty': '还没有学习区，先新建一个。',
      'rail.materials': '资料',
      'rail.notes': '笔记',
      'rail.wrong': '错题',
      'state.connecting': '连接中…',
      'queue.count': '已排队 {n} 条，当前回答结束后自动发送',
      'queue.full': '队列已满（最多 4 条），等当前回答结束后再发。',
      'settings.stopClearsQueue': '点停止时清空排队的问题',
      'think.start': '深度求索中…',
      'think.waiting': '深度求索中，用时 {s} 秒…',
      'state.ready': '已就绪',
      'state.error': '连接失败',
      'action.create': '新建',
      'action.cancel': '取消',
      'action.delete': '删除',
      'action.multiSelect': '多选',
      'action.deleteConfirm': '确认删除',
      'action.retry': '重试',
      'action.close': '关闭',
      'action.collapse': '收起侧栏',
      'action.send': '发送',
      'action.stop': '停止',
      'action.extend': '延伸拓展',
      'action.hint': '给点提示',
      'action.copy': '复制',
      'action.quote': '引用',
      'action.saveNote': '存为笔记',
      'action.importFile': '导入文件',
      'action.importFolder': '导入文件夹',
      'action.importPdf': '导入 PDF',
      'action.paste': '粘贴文本',
      'action.add': '加入箱子',
      'action.view': '查看',
      'action.askSelection': '待发送',
      'field.name.placeholder': '学习区名称，例如「考研数学·高数」',
      'field.pasteName': '资料名称',
      'field.pasteText': '把题目、笔记或教材片段粘贴到这里',
      'field.question': '问点什么，或先在上方资料里选中一段话',
      'field.questionPending': '补充一个问题，连同待发送内容一起发送',
      'hint.send': 'Enter 发送 · Shift + Enter 换行',
      'empty.title': '选择或新建一个学习区',
      'empty.body': '导入资料后就能提问，也可以让助手出题练习。',
      'mat.view': '查看',
      'mat.reveal': '打开文件位置',
      'mat.indexed': '已索引',
      'mat.unindexed': '待索引',
      'mat.reindex': '重建索引',
      'mat.reindexed': '已重建索引',
      'empty.materials': '还没有资料，导入文件或粘贴文本即可开始。',
      'empty.messages': '还没有问答记录。问一句试试。',
      'tab.materials': '资料',
      'tab.ask': '问答',
      'tab.notes': '笔记',
      'tab.practice': '做题',
      'box.created': '创建于',
      'box.pending': '这块还没做，先看资料和问答。',
      'box.noMaterialsHint': '先加一份资料，回答才有据可依。',
      'msg.sources': '依据',
      'action.openFile': '查看资料',
      'action.more': '更多',
      'action.attach': '附加资料',
      'action.detach': '移除',
      'attach.empty': '没有可附加的资料了，先去「资料」里导入。',
      'attach.hint': '导入后会加入资料库，并附加到这条提问。',
      'notes.heading': '笔记',
      'notes.new': '新建',
      'notes.empty': '还没有笔记。可以把回答「存为笔记」，或点「新建」。',
      'notes.pick': '从左边选一条笔记，或新建一条。',
      'notes.title': '标题',
      'notes.section': '分区（如：今日知识点）',
      'notes.sectionPreset': '常用分区',
      'notes.sectionToday': '今日知识点',
      'notes.sectionTypical': '典型题目/错题',
      'notes.sectionCustom': '自定义',
      'notes.tags': '标签，用空格分隔',
      'notes.body': '正文，支持 Markdown 与公式',
      'notes.preview': '预览',
      'notes.edit': '编辑',
      'notes.saved': '已保存',
      'notes.exportOne': '导出',
      'notes.remove': '删除',
      'notes.removeBody': '确定要删除 {name} 吗？删除后无法恢复。',
      'notes.removeManyBody': '确定要删除所选 {count} 篇笔记吗？删除后无法恢复。',
      'notes.removed': '已删除',
      'notes.untitled': '未命名笔记',
      'notes.daily': '今日总结',      'notes.summarize': '辅助总结',
      'reader.resize': '拖动调整侧栏宽度',
      'notes.drag': '拖动调整编辑区高度',
      'notes.digest': '辅助总结',
      'notes.insert': '插入到正文',
      'notes.replace': '替换正文',
      'wrong.heading': '错题本',
      'wrong.add': '记为错题',
      'practice.count': '题目数',
      'practice.topic': '考察范围（可留空）',
      'practice.web': '联网参考',
      'practice.generate': '出题',
      'practice.generating': '出题中…',
      'practice.progress': '已生成 {done}/{total} 道，出题中…',
      'practice.resume': '继续出题',
      'practice.importNote': '导入笔记',
      'practice.importPick': '勾选要导入笔记的题目',
      'practice.importAll': '全选',
      'practice.importNone': '全不选',
      'practice.importConfirm': '导入所选',
      'practice.imported': '已导入笔记',
      'practice.empty': '还没有题目。选好题目数，点「出题」。',
      'practice.reveal': '参考答案与评分要点',
      'practice.answerLabel': '参考答案',
      'practice.rubricLabel': '评分要点',
      'practice.scope': '范围',
      'practice.scopeAll': '全部资料',
      'practice.correct': '✓ 答对了',
      'practice.wrong': '✗ 答错了，已收进错题本',
      'practice.chosen': '你选了',
      'practice.kind': '题型',
      'practice.kindMixed': '混合',
      'practice.kindChoice': '选择',
      'practice.kindOpen': '开放',
      'practice.difficulty': '难度',
      'practice.levelBasic': '基础',
      'practice.levelMedium': '中等',
      'practice.levelAdvanced': '进阶',
      'practice.levelAny': '不限',
      'practice.inputMode': '作答方式',
      'practice.modeCode': '代码',
      'practice.modeText': '文本',
      'practice.answerPlaceholder': '写下你的答案；代码题可直接贴代码',
      'practice.submit': '提交',
      'practice.yours': '你的答案',
      'practice.still': '✗ 还是不对，看看错误处',
      'wrong.redo': '重做',
      'wrong.empty': '还没有错题。',
      'wrong.todo': '待复习',
      'wrong.reviewed': '已复习',
      'wrong.markReviewed': '标记已复习',
      'wrong.markTodo': '标记待复习',
      'settings.label': '设置',
      'chat.saveNote': '存到学习区',
      'chat.saveHint': '把这条回答存成哪个学习区的笔记？',
      'chat.noText': '拿不到这条回答的正文，请到学习区里操作。',
      'chat.noBox': '还没有学习区，先去侧边栏新建一个。',
      'chat.saveFailed': '保存失败，请重试。',      'settings.section': '默认笔记分区',
      'settings.kind': '默认题型',
      'settings.kindHint': '出题时默认使用的题型',
      'settings.difficulty': '默认难度',
      'settings.difficultyHint': '出题时的默认难度',
      'settings.qaScope': '问答检索范围',
      'settings.qaScopeHint': '每次提问送入模型的资料片段数，越多越慢但更全',
      'settings.web': '出题默认联网参考',
      'settings.groupNote': '笔记',
      'settings.groupPractice': '题目',
      'settings.multiSelect': '保存笔记时允许选择多个分区',
      'export.label': '导出',
      'export.batch': '批量导出',
      'chat.label': '聊天',
      'chat.new': '新聊天',
      'chat.rename': '重命名聊天',
      'chat.delete': '删除聊天',
      'chat.name': '聊天名称',
      'notes.append': '补充到笔记',
      'notes.appended': '已补充',
      'notes.latest': '最新笔记',
      'notes.defaultTarget': '默认',
      'settings.appendTarget': '摘录默认补充到',
      'settings.groupFont': '字体',
      'settings.fontBody': '正文字体',
      'settings.fontBodyHint': '正文与笔记显示所用的字体',
      'settings.fontFamily': '字体',
      'settings.fontCode': '代码块字体',
      'settings.fontCodeHint': '代码块、公式与编辑框所用的字体',
      'settings.fontPreviewRow': '示例文字：行列式的定义与计算，参考上文继续提问。',
      'settings.fontSerif': '宋体',
      'settings.fontCount': '已导入 {n} 个字体',
      'settings.fontRename': '重命名',
      'settings.fontRemove': '删除',
      'settings.fontSize': '字号',
      'settings.fontSizeHint': '仅影响学习区的字号',
      'settings.fontCodeSizeHint': '代码块与公式的字号',
      'settings.appendTargetHint': '摘录补充时默认写入的笔记',
      'settings.fontSystem': '系统默认',
      'settings.fontSans': '黑体',
      'settings.fontMono': '等宽',
      'settings.fontCustom': '自定义（已导入）',
      'settings.importFont': '导入字体文件',
      'settings.fontImported': '已导入 {name}',
      'settings.groupChat': '问答',
      'export.hint': '导出为 Markdown，可直接放进 Obsidian。',
      'export.notes': '知识点笔记',
      'export.practice': '练习题',
      'export.wrong': '错题本',
      'export.qa': '今日问答',
      'export.extend': '知识扩展',
      'export.all': '合并导出',
      'action.save': '保存',
      'nav.label': '问答定位',
      'nav.jump': '定位',
      'msg.history': '参考了上文',
      'msg.extendOf': '延伸',
      'msg.hintOf': '提示',
      'msg.followups': '接着问',
      'model.label': '模型',
      'model.default': '默认',
      'model.unknown': '未指定',
      'effort.label': '推理等级',
      'effort.default': '默认',
      'history.label': '上文',
      'history.auto': '自动',
      'history.with': '带上',
      'history.without': '不带',
      'error.boundary': '面板渲染出错',
      'error.noText': '这个文件读不出文本，请先转成 txt/md 或直接粘贴内容。',
      'error.pdfTooBig': 'PDF 太大（上限 12MB），请拆分后再导入。',
      'error.pdfEmpty': '这个 PDF 提取不出文字，可能是扫描件。',
      'selection.askPassage': '就这段提问',
      'selection.chat': '对话内容',
      'selection.practice': '题目',
      'qa.fallback': '检索命中不足，本次按整箱范围回答',
      'qa.overview': '整体性问题，本次按全书目录逐章回答',
      'pending.tag': '待发送',
      'pending.hint': '选中内容已待发送，可在下方补充问题',
      'hint.selection': '已选中',
      'hint.clearSelection': '清除',
      'hint.reading': '正在阅读：',
      'hint.chars': '字',
      'hint.chunks': '段',
      'code.copy': '复制',
      'code.copied': '已复制',
      'math.failed': '公式渲染组件未加载，下面显示原始 LaTeX（可直接复制）',
      'action.source': '原文',
      'action.render': '渲染',
    }

    const en = {
      'panel': 'NoteBook',
      'title': 'NoteBook Study Spaces',
      'delete.title': 'Delete study space',
      'delete.body': 'Delete "{name}"? Its materials, questions, notes and wrong answers are removed with it and cannot be recovered.',
      'delete.dontAsk': 'Do not ask again',
      'rail.heading': 'Study spaces',
      'rail.collapse': 'Hide the study space list',
      'rail.expand': 'Show the study space list',
      'rail.new': 'New study space',
      'rail.empty': 'No study space yet. Create one first.',
      'rail.materials': 'materials',
      'rail.notes': 'notes',
      'rail.wrong': 'wrong',
      'state.connecting': 'Connecting…',
      'queue.count': '{n} queued — sent when this answer finishes',
      'queue.full': 'Queue is full (4 max); wait for this answer to finish.',
      'settings.stopClearsQueue': 'Clear the queue when I stop',
      'think.start': 'Thinking…',
      'think.waiting': 'Thinking — {s}s elapsed…',
      'state.ready': 'Ready',
      'state.error': 'Connection failed',
      'action.create': 'Create',
      'action.cancel': 'Cancel',
      'action.delete': 'Delete',
      'action.multiSelect': 'Select',
      'action.deleteConfirm': 'Confirm delete',
      'action.retry': 'Retry',
      'action.close': 'Close',
      'action.collapse': 'Collapse',
      'action.send': 'Send',
      'action.stop': 'Stop',
      'action.extend': 'Go deeper',
      'action.hint': 'Give a hint',
      'action.copy': '复制',
      'action.quote': '引用',
      'action.saveNote': 'Save as note',
      'action.importFile': 'Import files',
      'action.importFolder': 'Import folder',
      'action.importPdf': 'Import PDF',
      'action.paste': 'Paste text',
      'action.add': 'Add to box',
      'action.view': 'View',
      'action.askSelection': 'Pin to send',
      'field.name.placeholder': 'Study space name, e.g. "Calculus for the entrance exam"',
      'field.pasteName': 'Material name',
      'field.pasteText': 'Paste a problem set, notes, or a textbook excerpt here',
      'field.question': 'Ask something, or select a passage in a material first',
      'field.questionPending': 'Add a question to send with the pinned text',
      'hint.send': 'Enter to send · Shift + Enter for a new line',
      'empty.title': 'Pick or create a study space',
      'empty.body': 'Import materials to start asking, or ask for practice problems.',
      'mat.view': 'Open',
      'mat.reveal': 'Show in folder',
      'mat.indexed': 'Indexed',
      'mat.unindexed': 'Not indexed',
      'mat.reindex': 'Rebuild index',
      'mat.reindexed': 'Index rebuilt',
      'empty.materials': 'No materials yet. Import a file or paste text to begin.',
      'empty.messages': 'No questions yet. Try one.',
      'tab.materials': 'Materials',
      'tab.ask': 'Ask',
      'tab.notes': 'Notes',
      'tab.practice': 'Practice',
      'box.created': 'Created',
      'box.pending': 'Not built yet — materials and ask are ready.',
      'box.noMaterialsHint': 'Add a material first so answers have something to go on.',
      'msg.sources': 'Sources',
      'action.openFile': 'Open material',
      'action.more': 'More',
      'action.attach': 'Attach material',
      'action.detach': 'Remove',
      'attach.empty': 'Nothing left to attach — import a material first.',
      'attach.hint': 'Imported materials join the box and attach to this question.',
      'nav.label': 'Answer outline',
      'nav.jump': 'Jump',
      'notes.heading': 'Notes',
      'notes.new': 'New',
      'notes.empty': 'No notes yet. Save an answer, or create one.',
      'notes.pick': 'Pick a note on the left, or create one.',
      'notes.title': 'Title',
      'notes.section': 'Section (e.g. Today)',
      'notes.sectionPreset': 'Preset sections',
      'notes.sectionToday': '今日知识点',
      'notes.sectionTypical': '典型题目/错题',
      'notes.sectionCustom': 'Custom',
      'notes.tags': 'Tags, space separated',
      'notes.body': 'Body — Markdown and math supported',
      'notes.preview': 'Preview',
      'notes.edit': 'Edit',
      'notes.saved': 'Saved',
      'notes.exportOne': 'Export',
      'notes.remove': 'Delete',
      'notes.removeBody': 'Delete {name}? This cannot be undone.',
      'notes.removeManyBody': 'Delete the {count} selected notes? This cannot be undone.',
      'notes.removed': 'Deleted',
      'notes.untitled': 'Untitled note',
      'notes.daily': 'Daily summary',
      'notes.summarize': 'Summarise',
      'reader.resize': 'Drag to resize this panel',
      'notes.drag': 'Drag to resize the editor',
      'notes.digest': 'Assistant digest',
      'notes.insert': 'Insert',
      'notes.replace': 'Replace',
      'wrong.heading': 'Wrong answers',
      'wrong.add': 'Mark wrong',
      'practice.count': 'Questions',
      'practice.topic': 'Topic (optional)',
      'practice.web': 'Use web',
      'practice.generate': 'Generate',
      'practice.generating': 'Generating…',
      'practice.progress': '{done}/{total} generated, still going…',
      'practice.resume': 'Resume',
      'practice.importNote': 'Import as note',
      'practice.importPick': 'Pick the questions to import',
      'practice.importAll': 'Select all',
      'practice.importNone': 'Select none',
      'practice.importConfirm': 'Import selected',
      'practice.imported': 'Imported as a note',
      'practice.empty': 'No questions yet. Pick a count and generate.',
      'practice.reveal': 'Reference answer & rubric',
      'practice.answerLabel': 'Reference answer',
      'practice.rubricLabel': 'Graded on',
      'practice.scope': 'Scope',
      'practice.scopeAll': 'All materials',
      'practice.correct': '✓ Correct',
      'practice.wrong': '✗ Wrong — filed into the wrong-answer book',
      'practice.chosen': 'You picked',
      'practice.kind': 'Type',
      'practice.kindMixed': 'Mixed',
      'practice.kindChoice': 'Choice',
      'practice.kindOpen': 'Open',
      'practice.difficulty': 'Level',
      'practice.levelBasic': 'Basic',
      'practice.levelMedium': 'Medium',
      'practice.levelAdvanced': 'Advanced',
      'practice.levelAny': 'Any',
      'practice.inputMode': '作答方式',
      'practice.modeCode': '代码',
      'practice.modeText': '文本',
      'practice.answerPlaceholder': 'Write your answer — code is fine too',
      'practice.submit': 'Submit',
      'practice.yours': 'Your answer',
      'practice.still': '✗ Still wrong — see the issues',
      'wrong.redo': 'Redo',
      'wrong.empty': 'No wrong answers yet.',
      'wrong.todo': 'To review',
      'wrong.reviewed': 'Reviewed',
      'wrong.markReviewed': 'Mark reviewed',
      'wrong.markTodo': 'Mark to review',
      'settings.label': 'Settings',
      'chat.saveNote': 'Save to study box',
      'chat.saveHint': 'Which study box should keep this answer?',
      'chat.noText': 'Could not read this answer; use the study panel instead.',
      'chat.noBox': 'No study box yet — create one in the sidebar first.',
      'chat.saveFailed': 'Saving failed. Try again.',
      'settings.section': 'Default note section',
      'settings.kind': 'Default question type',
      'settings.kindHint': 'Question type used when generating',
      'settings.difficulty': 'Default difficulty',
      'settings.difficultyHint': 'Default difficulty when generating',
      'settings.qaScope': 'Retrieval width',
      'settings.qaScopeHint': 'Material chunks sent per question — wider is slower but more complete',
      'settings.web': 'Use web when generating',
      'settings.groupNote': 'Notes',
      'settings.groupPractice': 'Practice',
      'settings.multiSelect': 'Allow multiple sections when saving notes',
      'export.label': 'Export',
      'export.batch': 'Batch export',
      'chat.label': 'Chat',
      'chat.new': 'New chat',
      'chat.rename': 'Rename chat',
      'chat.delete': 'Delete chat',
      'chat.name': 'Chat name',
      'notes.append': 'Append to note',
      'notes.appended': 'Added',
      'notes.latest': 'Latest note',
      'notes.defaultTarget': 'Default',
      'settings.appendTarget': 'Append selections to',
      'settings.groupFont': 'Font',
      'settings.fontBody': 'Body font',
      'settings.fontBodyHint': 'Font used for body text and notes',
      'settings.fontFamily': 'Family',
      'settings.fontCode': 'Code font',
      'settings.fontCodeHint': 'Font used for code blocks, formulas and editors',
      'settings.fontPreviewRow': 'Sample text: determinants, definitions and worked examples.',
      'settings.fontSerif': 'Serif',
      'settings.fontCount': '{n} imported',
      'settings.fontRename': 'Rename',
      'settings.fontRemove': 'Remove',
      'settings.fontSize': 'Size',
      'settings.fontSizeHint': 'Affects the study area only',
      'settings.fontCodeSizeHint': 'Size of code blocks and formulas',
      'settings.appendTargetHint': 'Note that excerpts are appended to',
      'settings.fontSystem': 'System default',
      'settings.fontSans': 'Sans serif',
      'settings.fontMono': 'Monospace',
      'settings.fontCustom': 'Custom (imported)',
      'settings.importFont': 'Import a font file',
      'settings.fontImported': 'Imported {name}',
      'settings.groupChat': 'Chat',
      'export.hint': 'Exports Markdown, ready for Obsidian.',
      'export.notes': 'Notes',
      'export.practice': 'Practice',
      'export.wrong': 'Wrong answers',
      'export.qa': 'Today’s Q&A',
      'export.extend': 'Extensions',
      'export.all': 'Combined export',
      'action.save': 'Save',
      'msg.history': 'used context',
      'msg.extendOf': 'Extension',
      'msg.hintOf': 'Hint',
      'msg.followups': 'Ask next',
      'model.label': 'Model',
      'model.default': 'Default',
      'model.unknown': 'not set',
      'effort.label': 'Reasoning',
      'effort.default': 'Default',
      'history.label': 'Context',
      'history.auto': 'Auto',
      'history.with': 'With',
      'history.without': 'Without',
      'error.boundary': 'This panel failed to render',
      'error.noText': 'No text could be read from this file. Convert it to txt/md or paste the content.',
      'error.pdfTooBig': 'This PDF is larger than 12MB; split it first.',
      'error.pdfEmpty': 'No text could be extracted from this PDF; it may be a scan.',
      'selection.askPassage': 'Ask about this',
      'selection.chat': 'Chat excerpt',
      'selection.practice': 'Question',
      'qa.fallback': 'Nothing matched closely — this answer used the whole box',
      'qa.overview': 'Whole-box question — this answer walked every chapter',
      'pending.tag': 'Pin to send',
      'pending.hint': 'Pinned — add a question below to send it together',
      'hint.selection': 'Selected',
      'hint.clearSelection': 'Clear',
      'hint.reading': 'Reading: ',
      'hint.chars': 'chars',
      'hint.chunks': 'chunks',
      'code.copy': 'Copy',
      'code.copied': 'Copied',
      'math.failed': 'The math renderer did not load; showing raw LaTeX (copyable)',
      'action.source': 'Source',
      'action.render': 'Rendered',
    }

    // -----------------------------------------------------------------------
    // Host transport
    // -----------------------------------------------------------------------

    /**
     * Browser-side facade over the private Host route.
     * Every call resolves to the Host value or throws a readable Error.
     */
    function createApi() {
      let url
      const endpointUrl = () => {
        if (url === undefined) url = new URL(CHANNEL, document.baseURI).toString()
        return url
      }
      const post = (body, signal) => fetch(endpointUrl(), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        ...(signal === undefined ? {} : { signal }),
      })
      const call = async (endpoint, payload) => {
        const response = await post({ endpoint, payload })
        if (!response.ok) throw new Error(`NoteBook Host answered HTTP ${response.status}`)
        const result = await response.json()
        if (result !== null && typeof result === 'object' && result.ok === true) return result.value
        const failure = result !== null && typeof result === 'object' ? result.error : undefined
        const message = failure !== null && typeof failure === 'object' && typeof failure.message === 'string'
          ? failure.message
          : `request "${endpoint}" failed`
        throw new Error(message)
      }
      return {
        ping: () => call('ping', {}),
        list: () => call('list', {}),
        get: (id) => call('get', { id }),
        create: (name) => call('create', { name }),
        rename: (id, name) => call('rename', { id, name }),
        remove: (id) => call('remove', { id }),
        models: () => call('models', {}),
        addMaterial: (boxId, material) => call('addMaterial', { boxId, ...material }),
        pickMaterials: (boxId, mode) => call('pickMaterials', { boxId, mode }),
        createConversation: (boxId) => call('createConversation', { boxId }),
        conversationTitle: (boxId, conversationId, model) => call('conversationTitle', { boxId, conversationId, ...model }),
        renameConversation: (boxId, conversationId, title) => call('renameConversation', { boxId, conversationId, title }),
        removeConversation: (boxId, conversationId) => call('removeConversation', { boxId, conversationId }),
        appendNote: (boxId, text, noteId, materialId) => call('appendNote', { boxId, text, noteId, materialId }),
        removeMaterial: (boxId, materialId) => call('removeMaterial', { boxId, materialId }),
  removeMany: (boxId, kind, ids) => call('removeMany', { boxId, kind, ids }),
        materialText: (boxId, materialId) => call('materialText', { boxId, materialId }),
        revealMaterial: (boxId, materialId) => call('revealMaterial', { boxId, materialId }),
        ensureIndex: (boxId, model) => call('ensureIndex', { boxId, ...(model ?? {}) }),
        reindex: (boxId, model) => call('reindex', { boxId, ...(model ?? {}) }),
        hint: (boxId, question, model) => call('hint', { boxId, question, ...(model ?? {}) }),
        followups: (boxId, messageId, model) => call('followups', { boxId, messageId, ...(model ?? {}) }),
        efforts: (provider, model) => call('efforts', { provider, model }),
        notes: (boxId) => call('notes', { boxId }),
        addNote: (boxId, note) => call('addNote', { boxId, ...note }),
        updateNote: (boxId, noteId, patch) => call('updateNote', { boxId, noteId, ...patch }),
        removeNote: (boxId, noteId) => call('removeNote', { boxId, noteId }),
        addWrong: (boxId, messageId) => call('addWrong', { boxId, messageId }),
        updateWrong: (boxId, wrongId, reviewed) => call('updateWrong', { boxId, wrongId, reviewed }),
        removeWrong: (boxId, wrongId) => call('removeWrong', { boxId, wrongId }),
        exportMarkdown: (boxId, scope, noteId) => call('exportMarkdown', { boxId, scope, noteId }),
        summarize: (boxId, text, model) => call('summarize', { boxId, text, ...(model ?? {}) }),
        dailySummary: (boxId, model) => call('dailySummary', { boxId, ...(model ?? {}) }),
        practice: (boxId) => call('practice', { boxId }),
        beginQuiz: (boxId, options) => call('beginQuiz', { boxId, ...options }),
        quizNext: (boxId, practiceId, model) => call('quizNext', { boxId, practiceId, ...(model ?? {}) }),
        answerQuestion: (boxId, practiceId, questionId, choice, text, model) => call('answerQuestion', { boxId, practiceId, questionId, choice, text, ...(model ?? {}) }),
        regradeWrong: (boxId, wrongId, payload) => call('regradeWrong', { boxId, wrongId, ...payload }),
        updateSettings: (boxId, patch) => call('updateSettings', { boxId, patch }),
        extend: (boxId, messageId, model) => call('extend', { boxId, messageId, ...(model ?? {}) }),
        /**
         * Stream one grounded answer. Frames are `delta`, then `done` or `error`.
         * @param handlers - onDelta / onDone / onError / signal.
         */
        async askStream(boxId, question, options, handlers) {
          const response = await post({ endpoint: 'askStream', payload: { boxId, question, ...options } }, handlers.signal)
          if (!response.ok) throw new Error(`NoteBook Host answered HTTP ${response.status}`)
          if (response.body === null) throw new Error('NoteBook Host returned no body to stream')
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          for (;;) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            let at = buffer.indexOf('\n\n')
            while (at !== -1) {
              const raw = buffer.slice(0, at)
              buffer = buffer.slice(at + 2)
              const line = raw.split('\n').find((entry) => entry.startsWith('data: '))
              if (line !== undefined) {
                let frame
                try {
                  frame = JSON.parse(line.slice(6))
                } catch {
                  frame = undefined
                }
                if (frame !== undefined) {
                  if (frame.type === 'delta') handlers.onDelta(frame.text)
                  else if (frame.type === 'done') handlers.onDone(frame)
                  else if (frame.type === 'error') handlers.onError(frame.message)
                }
              }
              at = buffer.indexOf('\n\n')
            }
          }
        },
      }
    }

    /** One shared facade for the module; it needs nothing from the plugin context. */
    const API = createApi()

    // -----------------------------------------------------------------------
    // Math (vendored KaTeX, served by the Host route)
    // -----------------------------------------------------------------------

    const math = { ready: false, failed: false, reason: '' }
    const mathListeners = new Set()
    let mathStarted = false

    /** Load KaTeX once: its stylesheet, then its UMD bundle. */
    function loadMath() {
      if (mathStarted || typeof document === 'undefined') return
      mathStarted = true
      const base = new URL(CHANNEL, document.baseURI).href
      const jsUrl = `${base}/asset/katex/katex.min.js`
      const settle = (ok, reason) => {
        math.ready = ok && typeof window.katex !== 'undefined'
        math.failed = !math.ready
        math.reason = math.ready ? '' : (reason || 'unknown')
        for (const listener of mathListeners) listener()
      }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `${base}/asset/katex/katex.min.css`
      link.dataset.notebookKatex = 'css'
      document.head.appendChild(link)

      // Probe the asset first so a failure reports a status instead of silence.
      fetch(jsUrl, { method: 'HEAD', credentials: 'same-origin' }).then((probe) => {
        if (!probe.ok) {
          settle(false, `HTTP ${probe.status}`)
          return
        }
        const script = document.createElement('script')
        script.src = jsUrl
        script.async = true
        script.dataset.notebookKatex = 'js'
        script.addEventListener('load', () => settle(true), { once: true })
        script.addEventListener('error', () => settle(false, 'script blocked'), { once: true })
        document.head.appendChild(script)
      }, (error) => {
        settle(false, error instanceof Error ? error.message : 'network error')
      })
    }

    /** Re-render once KaTeX finishes loading, and expose why it did not. */
    function useMathReady() {
      const [state, setState] = React.useState({ ready: math.ready, failed: math.failed, reason: math.reason })
      React.useEffect(() => {
        if (state.ready || state.failed) return undefined
        const listener = () => setState({ ready: math.ready, failed: math.failed, reason: math.reason })
        mathListeners.add(listener)
        return () => {
          mathListeners.delete(listener)
        }
      }, [state.ready, state.failed])
      return state
    }

    /**
     * Render one TeX expression to HTML, or `undefined` when KaTeX is not ready.
     * KaTeX escapes its own output; the caller injects the returned string.
     * @param source - TeX source without delimiters.
     * @param display - display (block) mode.
     */
    const mathCache = new Map()
    function mathHtml(source, display) {
      const katex = window.katex
      if (katex === undefined || katex === null || typeof katex.renderToString !== 'function') return undefined
      const cacheKey = `${display}:${source}`
      if (mathCache.has(cacheKey)) return mathCache.get(cacheKey)
      try {
        const html = katex.renderToString(source, {
          displayMode: display,
          // A truncated or malformed formula must fall back to plain text
          // instead of KaTeX's red error markup.
          throwOnError: true,
          strict: 'ignore',
          output: 'html',
          trust: false,
        })
        if (mathCache.size >= 256) mathCache.delete(mathCache.keys().next().value)
        mathCache.set(cacheKey, html)
        return html
      } catch {
        return undefined
      }
    }

    // -----------------------------------------------------------------------
    // Markdown
    // -----------------------------------------------------------------------

    /** Split one table row into trimmed cells, ignoring pipes inside code spans. */
    function splitRow(line) {
      const trimmed = line.trim().replace(/^\|/u, '').replace(/\|$/u, '')
      const cells = []
      let current = ''
      let inCode = false
      for (let at = 0; at < trimmed.length; at += 1) {
        const char = trimmed[at]
        if (char === '\\' && trimmed[at + 1] === '|') {
          current += '|'
          at += 1
          continue
        }
        if (char === '`') inCode = !inCode
        if (char === '|' && !inCode) {
          cells.push(current.trim())
          current = ''
          continue
        }
        current += char
      }
      cells.push(current.trim())
      return cells
    }

    /**
     * Render inline markdown as React nodes. Never builds HTML strings, so
     * model output cannot inject markup.
     * @param text - inline markdown source.
     * @param prefix - React key prefix.
     */
    /** Obsidian colour names → theme-safe inline colours. */
    const COLOURS = {
      red: '#d64545', orange: '#d97706', yellow: '#b8860b', green: '#2f9e44',
      cyan: '#0e8f8f', blue: '#3b7dd8', purple: '#8b5cf6', pink: '#d63384',
      gray: '#6b7280', grey: '#6b7280', brown: '#8b5e3c', white: '#f8f9fa', black: '#1b1f24',
    }

    function inlineNodes(text, prefix) {
      const nodes = []
      const pattern = /(\uE000[^\uE001]*\uE001)|(\\begin\{(?<env>[a-zA-Z*]+)\}[\s\S]*?\\end\{\k<env>\})|(~=\{[a-zA-Z]+\}[\s\S]*?=~)|(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))|(\$\$[^$\n]+\$\$)|(\$[^$\n]+\$)|(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(~~[^~\n]+~~)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))|(\[[^\]\n]+\.(?:md|markdown|pdf|txt|json|csv)#\d+\])|(#(?:[\w\u4e00-\u9fa5]|[-_/])[\w\u4e00-\u9fa5\-_/]*)/gu
      let last = 0
      let index = 0
      let match = pattern.exec(text)
      while (match !== null) {
        if (match.index > last) nodes.push(text.slice(last, match.index))
        const token = match[0]
        const key = `${prefix}-${index}`
        index += 1
        if (token.startsWith('\uE000')) {
          const tex = decodeURIComponent(token.slice(1, -1))
          const html = mathHtml(tex, true)
          nodes.push(html === undefined ? h(MathBlock, { key, tex }) : h(MathBlock, { key, tex }))
        } else if (token.startsWith('\\begin{')) {
          const html = mathHtml(token, true)
          nodes.push(html === undefined ? h('span', { key, className: 'nb-md-math' }, token)
            : h(MathBlock, { key, tex }))
        } else if (token.startsWith('~={')) {
          // Obsidian-style coloured text: ~={red}attention=~
          const coloured = /^~=\{([a-zA-Z]+)\}([\s\S]*?)=~$/u.exec(token)
          const name = coloured === null ? 'red' : coloured[1].toLowerCase()
          const body = coloured === null ? token : coloured[2]
          nodes.push(h('span', {
            key,
            className: 'nb-md-color',
            style: { color: COLOURS[name] ?? COLOURS.red },
          }, inlineNodes(body, `${key}-c`)))
        } else if (token.startsWith('$$')) {
          const tex = token.slice(2, -2)
          const html = mathHtml(tex, true)
          nodes.push(html === undefined ? h(MathBlock, { key, tex })
            : h(MathBlock, { key, tex }))
        } else if (token.startsWith('\\[')) {
          const tex = token.slice(2, -2)
          const html = mathHtml(tex, true)
          nodes.push(html === undefined
            ? h('span', { key, className: 'nb-md-math' }, tex)
            : h(MathBlock, { key, tex }))
        } else if (token.startsWith('$') || token.startsWith('\\(')) {
          const tex = token.startsWith('\\(') ? token.slice(2, -2) : token.slice(1, -1)
          if (tex.trim() === '') {
            nodes.push(token)
          } else {
            const html = mathHtml(tex, false)
            nodes.push(html === undefined
              ? h('span', { key, className: 'nb-md-math' }, tex)
              : h('span', { key, className: 'nb-md-math is-rendered', dangerouslySetInnerHTML: { __html: html } }))
          }
        } else if (token.startsWith('`')) nodes.push(h('code', { key, className: 'nb-md-code' }, token.slice(1, -1)))
        else if (token.startsWith('**') || token.startsWith('__')) nodes.push(...wrapInline('strong', token.slice(2, -2), key, `${key}-b`))
        else if (token.startsWith('#')) nodes.push(h('span', { key, className: 'nb-md-tag' }, token.slice(1)))
        else if (token.startsWith('[') && !token.includes('](')) {
          const cite = token.slice(1, -1)
          nodes.push(h('span', {
            key,
            className: 'nb-cite',
            title: cite,
            onClick: () => {
              if (typeof citeHandler === 'function') citeHandler(cite.split('#')[0].trim())
            },
          }, cite))
        }
        else if (token.startsWith('~~')) nodes.push(...wrapInline('del', token.slice(2, -2), key, `${key}-d`))
        else if (token.startsWith('[')) {
          const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/u.exec(token)
          nodes.push(h('a', { key, href: link[2], target: '_blank', rel: 'noreferrer noopener' }, link[1]))
        } else nodes.push(...wrapInline('em', token.slice(1, -1), key, `${key}-e`))
        last = match.index + token.length
        match = pattern.exec(text)
      }
      if (last < text.length) nodes.push(text.slice(last))
      return nodes
    }

    /**
     * Wrap formatted text (`**bold**` / `*em*` / `~~del~~`) around its
     * re-parsed contents, so maths nested inside still renders — before this,
     * `**$\frac12$**` came out as the literal placeholder.
     * A lone display block has nothing to style and `<strong><div>` is invalid
     * markup, so in that one case the wrapper is dropped and the formula kept.
     * @param tag - element to wrap with.
     * @param inner - markdown source between the delimiters.
     * @param key - React key for the wrapper.
     * @param prefix - key prefix for the nested nodes.
     */
    function wrapInline(tag, inner, key, prefix) {
      const children = inlineNodes(inner, prefix)
      const meaningful = children.filter((child) => typeof child !== 'string' || child.trim() !== '')
      const onlyMath = meaningful.length > 0 && meaningful.every((child) => (
        typeof child === 'object' && child !== null && child.type === MathBlock
      ))
      return onlyMath ? children : [h(tag, { key }, children)]
    }

    /** Languages whose `#` starts a comment rather than a directive. */
    const HASH_COMMENT_LANGS = /^(py|python|sh|bash|shell|zsh|yaml|yml|rb|ruby|toml|ini|conf|r|ps1|powershell)$/u

    /** Keywords worth emphasising across the common teaching languages. */
    const KEYWORD_PATTERN = '\\b(?:const|let|var|function|return|if|else|elif|for|while|do|switch|case|break|continue|import|from|export|default|class|extends|new|this|super|async|await|yield|try|catch|finally|throw|typeof|instanceof|def|lambda|pass|raise|with|as|None|True|False|self|print|fn|mut|pub|use|match|impl|struct|enum|interface|type|void|public|private|static|int|float|double|char|bool|string|true|false|null|nil|undefined)\\b'

    /**
     * Colour comments, strings, numbers and keywords inside a code block.
     * Conservative on purpose: it only wraps matched spans in elements, so the
     * original text always survives and nothing is executed.
     * @param code - raw code.
     * @param lang - fence info string, lower-cased.
     */
    function highlightCode(code, lang) {
      const hash = HASH_COMMENT_LANGS.test(lang) ? '|#[^\\n]*' : ''
      const pattern = new RegExp(
        '("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')'
        + `|(//[^\\n]*|/\\*[\\s\\S]*?\\*/${hash})`
        + '|(\\b\\d+(?:\\.\\d+)?\\b)'
        + `|(${KEYWORD_PATTERN})`,
        'gu',
      )
      const nodes = []
      let last = 0
      let match = pattern.exec(code)
      while (match !== null) {
        if (match.index > last) nodes.push(code.slice(last, match.index))
        const token = match[0]
        const className = match[1] !== undefined
          ? 'nb-tok-str'
          : match[2] !== undefined
            ? 'nb-tok-com'
            : match[3] !== undefined
              ? 'nb-tok-num'
              : 'nb-tok-kw'
        nodes.push(h('span', { key: `c${match.index}`, className }, token))
        last = match.index + token.length
        match = pattern.exec(code)
      }
      if (last < code.length) nodes.push(code.slice(last))
      return nodes
    }

    /** Display math in a copyable card; the copy payload stays valid LaTeX. */
    /** Translator in scope for deeply nested render helpers. */
    let activeT = (key) => key

    function MathBlock({ tex, t = activeT }) {
      const [copied, setCopied] = React.useState(false)
      const mathState = useMathReady()
      const html = mathHtml(tex, true)
      const payload = `$$\n${tex}\n$$`
      const copy = () => {
        const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard
        if (clipboard === undefined) return
        clipboard.writeText(payload).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        }, () => undefined)
      }
      const notice = html === undefined && mathState.failed
        ? h('div', { className: 'nb-math-note' }, `${t('math.failed')}${mathState.reason === '' ? '' : ` (${mathState.reason})`}`)
        : null
      return h('div', { className: 'nb-math-block' },
        h('div', { className: 'nb-math-head' },
          h('span', { className: 'nb-math-lang' }, 'LaTeX'),
          h('button', { type: 'button', className: 'nb-code-copy', onClick: copy }, copied ? t('code.copied') : t('code.copy')),
        ),
        h('div', { className: 'nb-math-body' },
          html === undefined
            ? h('pre', { className: 'nb-math-raw' }, payload)
            : h('div', { dangerouslySetInnerHTML: { __html: html } })),
        notice,
      )
    }

    /** Fenced code block with a language tag and a copy action. */
    function CodeBlock({ code, lang, t }) {
      const [copied, setCopied] = React.useState(false)
      const copy = () => {
        const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard
        if (clipboard === undefined) return
        clipboard.writeText(code).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        }, () => undefined)
      }
      return h('div', { className: 'nb-code' },
        h('div', { className: 'nb-code-head' },
          h('span', { className: 'nb-code-lang' }, lang === '' ? 'code' : lang),
          h('button', { type: 'button', className: 'nb-code-copy', onClick: copy }, copied ? t('code.copied') : t('code.copy')),
        ),
        h('pre', { className: 'nb-md-pre' }, h('code', null, highlightCode(code, lang))),
      )
    }

    /** Environments that are valid display math without any surrounding `$$`. */
    const MATH_ENVIRONMENT = /^\\begin\{([a-zA-Z*]+)\}/u

    /**
     * Read one display-math block starting at `start`, accepting every
     * delimiter shape models actually emit: `$$…$$` on its own lines or inline,
     * LaTeX-native `\[…\]`, and a bare `\begin{env}…\end{env}`.
     * @param lines - document lines.
     * @param start - index of the first line to inspect.
     * @returns the TeX body and the next index, or `undefined` when this is not math.
     */
    function readDisplayMath(lines, start) {
      const line = lines[start]
      const trimmed = line.trim()

      if (trimmed.startsWith('$$')) {
        const body = []
        const rest = trimmed.slice(2)
        if (/\$\$\s*$/u.test(rest)) {
          body.push(rest.replace(/\$\$\s*$/u, ''))
          return { tex: body.join('\n').trim(), next: start + 1 }
        }
        if (rest.length > 0) body.push(rest)
        let index = start + 1
        while (index < lines.length && !/\$\$\s*$/u.test(lines[index])) {
          body.push(lines[index])
          index += 1
        }
        if (index < lines.length) {
          body.push(lines[index].replace(/\$\$\s*$/u, ''))
          index += 1
        }
        return { tex: body.join('\n').trim(), next: index }
      }

      if (trimmed.startsWith('\\[')) {
        const body = []
        const rest = trimmed.slice(2)
        const sameLine = rest.indexOf('\\]')
        if (sameLine !== -1) {
          body.push(rest.slice(0, sameLine))
          return { tex: body.join('\n').trim(), next: start + 1 }
        }
        if (rest.length > 0) body.push(rest)
        let index = start + 1
        while (index < lines.length && !lines[index].includes('\\]')) {
          body.push(lines[index])
          index += 1
        }
        if (index < lines.length) {
          body.push(lines[index].slice(0, lines[index].indexOf('\\]')))
          index += 1
        }
        return { tex: body.join('\n').trim(), next: index }
      }

      const environment = MATH_ENVIRONMENT.exec(trimmed)
      if (environment !== null) {
        const closing = `\\end{${environment[1]}}`
        const body = []
        let index = start
        while (index < lines.length) {
          body.push(lines[index])
          const done = lines[index].includes(closing)
          index += 1
          if (done) break
        }
        return { tex: body.join('\n').trim(), next: index }
      }

      return undefined
    }

    function markdownNodes(source, keyPrefix = 'md', t) {
      if (typeof t === 'function') activeT = t
      // Inline maths must never be split by a paragraph break, or the closing
      // delimiter lands in another block and the TeX leaks to the page.
      const normalised = String(source ?? '')
        .replace(/\r\n?/gu, '\n')
        .replace(/\\\([\s\S]*?\\\)/gu, (match) => match.replace(/\n+/gu, ' '))
        .replace(/```[^\n]*\n[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[^$\n]+\$|\\begin\{(?<environment>[a-zA-Z*]+)\}[\s\S]*?\\end\{\k<environment>\}/gu, (match) => {
          if (match.startsWith('```') || match.startsWith('\\(') || (match.startsWith('$') && !match.startsWith('$$'))) return match
          const tex = match.startsWith('$$') || match.startsWith('\\[') ? match.slice(2, -2) : match
          return `\uE000${encodeURIComponent(tex)}\uE001`
        })
      const lines = normalised.split('\n')
      const blocks = []
      let index = 0
      let key = 0
      const nextKey = () => `${keyPrefix}-${key++}`

      while (index < lines.length) {
        const line = lines[index]
        const mathToken = /^\s*\uE000([^\uE001]*)\uE001\s*$/u.exec(line)
        if (mathToken) {
          blocks.push(h(MathBlock, { key: nextKey(), tex: decodeURIComponent(mathToken[1]), t: (key) => typeof t === 'function' ? t(key) : key }))
          index += 1
          continue
        }
        if (line.trim() === '' || /^\|[\s|]*$/u.test(line)) {
          index += 1
          continue
        }

        if (/^\s*```/u.test(line)) {
          const fence = /^\s*```(\S*)\s*$/u.exec(line)
          const body = []
          index += 1
          while (index < lines.length && !/^\s*```\s*$/u.test(lines[index])) {
            body.push(lines[index])
            index += 1
          }
          index += 1
          const code = body.join('\n')
          const mathFence = /^(?:math|latex|tex)$/iu.test(fence?.[1] ?? '')
            || /^(?:\$\$|\\\[|\\begin\{)/u.test(code.trim())
          if (mathFence) {
            const tex = code.trim().replace(/^\$\$|\$\$$/gu, '').replace(/^\\\[|\\\]$/gu, '').trim()
            blocks.push(h(MathBlock, { key: nextKey(), tex, t: (key) => typeof t === 'function' ? t(key) : key }))
          } else blocks.push(h(CodeBlock, {
            key: nextKey(),
            code: body.join('\n'),
            lang: (fence?.[1] ?? '').toLowerCase(),
            t: (key) => (typeof t === 'function' ? t(key) : key),
          }))
          continue
        }

        // $$...$$ on one line is a display block, not inline maths.
        const singleLineDisplay = /^\s*(.*?)\$\$([\s\S]+?)\$\$(.*)$/u.exec(line)
        if (singleLineDisplay !== null && singleLineDisplay[2].trim() !== '') {
          const before = singleLineDisplay[1].trim()
          const after = singleLineDisplay[3].trim()
          if (before !== '') blocks.push(h('p', { key: nextKey(), className: 'nb-md-p' }, inlineNodes(before, nextKey(), t)))
          blocks.push(h(MathBlock, {
            key: nextKey(),
            tex: singleLineDisplay[2],
            t: (key) => (typeof t === 'function' ? t(key) : key),
          }))
          if (after !== '') blocks.push(h('p', { key: nextKey(), className: 'nb-md-p' }, inlineNodes(after, nextKey(), t)))
          index += 1
          continue
        }

        const displayMath = readDisplayMath(lines, index)
        if (displayMath !== undefined && displayMath.tex !== '') {
          blocks.push(h(MathBlock, {
            key: nextKey(),
            tex: displayMath.tex,
            t: (key) => (typeof t === 'function' ? t(key) : key),
          }))
          index = displayMath.next
          continue
        }

        const heading = /^(#{1,6})\s+(.*)$/u.exec(line)
        if (heading !== null) {
          const level = Math.min(6, heading[1].length)
          blocks.push(h(`h${level}`, { key: nextKey(), className: `nb-md-h nb-md-h${level}` }, inlineNodes(heading[2], nextKey())))
          index += 1
          continue
        }

        if (/^\s*([-*_])\1{2,}\s*$/u.test(line)) {
          blocks.push(h('hr', { key: nextKey(), className: 'nb-md-hr' }))
          index += 1
          continue
        }

        if (/^\s*>/u.test(line)) {
          const body = []
          while (index < lines.length && /^\s*>/u.test(lines[index])) {
            body.push(lines[index].replace(/^\s*>\s?/u, ''))
            index += 1
          }
          blocks.push(h('blockquote', { key: nextKey(), className: 'nb-md-quote' }, markdownNodes(body.join('\n'), nextKey(), t)))
          continue
        }

        if (line.includes('|') && index + 1 < lines.length && /^[\s:|-]+$/u.test(lines[index + 1]) && lines[index + 1].includes('-')) {
          const header = splitRow(line)
          const rows = []
          index += 2
          while (index < lines.length && lines[index].includes('|') && lines[index].trim() !== '') {
            rows.push(splitRow(lines[index]))
            index += 1
          }
          blocks.push(h('div', { key: nextKey(), className: 'nb-md-table-wrap' },
            h('table', { className: 'nb-md-table' },
              h('thead', null, h('tr', null, header.map((cell, at) => h('th', { key: at }, inlineNodes(cell, nextKey()))))),
              h('tbody', null, rows.map((row, rowAt) => h('tr', { key: rowAt }, row.map((cell, at) => h('td', { key: at }, inlineNodes(cell, nextKey())))))),
            )))
          continue
        }

        const bullet = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/u.exec(line)
        if (bullet !== null) {
          const ordered = /\d/u.test(bullet[2])
          const items = []
          while (index < lines.length) {
            const item = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/u.exec(lines[index])
            if (item === null) {
              if (items.length > 0 && lines[index].trim() !== '' && /^\s{2,}/u.test(lines[index])) {
                items[items.length - 1] = `${items[items.length - 1]} ${lines[index].trim()}`
                index += 1
                continue
              }
              break
            }
            items.push(item[3])
            index += 1
          }
          const ListTag = ordered ? 'ol' : 'ul'
          blocks.push(h(ListTag, { key: nextKey(), className: 'nb-md-list' },
            items.map((item, at) => {
              // Obsidian allows a heading inside a list item: "- ### 定理 1".
              const heading = /^(#{1,6})\s+(.*)$/u.exec(item.trim())
              return h('li', { key: at },
                heading === null
                  ? inlineNodes(item, nextKey())
                  : h('span', { className: `nb-md-h nb-md-h${heading[1].length} is-in-item` }, inlineNodes(heading[2], nextKey())),
              )
            })))
          continue
        }

        const paragraph = []
        while (index < lines.length && lines[index].trim() !== ''
          && !/^\s*(```|#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\$\$|\\\[|\\begin\{)/u.test(lines[index])) {
          paragraph.push(lines[index])
          index += 1
        }
        if (paragraph.length === 0) {
          index += 1
          continue
        }
        blocks.push(h('p', { key: nextKey(), className: 'nb-md-p' }, inlineNodes(paragraph.join('\n'), nextKey())))
      }

      return blocks
    }

    // -----------------------------------------------------------------------
    // Streaming typewriter
    // -----------------------------------------------------------------------

    /**
     * Pace streamed text so it reads as steady typing instead of bursts.
     * Chunks land in a buffer; a 16ms loop moves a few characters into state and
     * fires `onFinish` once the stream ended and the buffer drained.
     */
    function useTypewriter() {
      const [text, setText] = React.useState('')
      const buffer = React.useRef(''), outcome = React.useRef(), finish = React.useRef(), timer = React.useRef(0), last = React.useRef(0)
      const drain = React.useCallback((now) => {
        timer.current = requestAnimationFrame(drain)
        if (now - last.current < 32) return
        last.current = now
        const pending = buffer.current
        if (pending) {
          let take = Math.min(pending.length, Math.max(3, Math.min(48, Math.ceil(pending.length / 10))))
          if (take < pending.length && /[\uD800-\uDBFF]/u.test(pending[take - 1])) take++
          buffer.current = pending.slice(take)
          setText((current) => current + pending.slice(0, take))
        } else if (outcome.current !== undefined) {
          cancelAnimationFrame(timer.current); timer.current = 0
          const result = outcome.current; outcome.current = undefined; finish.current?.(result)
        }
      }, [])
      const start = React.useCallback((callback) => {
        cancelAnimationFrame(timer.current); buffer.current = ''; outcome.current = undefined; finish.current = callback; last.current = 0; setText('')
        timer.current = requestAnimationFrame(drain)
      }, [drain])
      const push = React.useCallback((chunk) => { buffer.current += chunk }, [])
      const end = React.useCallback((result) => { outcome.current = result }, [])
      const flush = React.useCallback(() => { cancelAnimationFrame(timer.current); timer.current = 0; buffer.current = ''; outcome.current = undefined; finish.current = undefined }, [])
      React.useEffect(() => flush, [flush])
      return { text, start, push, end, flush }
    }

    // -----------------------------------------------------------------------
    // Icons
    // -----------------------------------------------------------------------

    /** Inline icon set; artwork only, so colors are literal. */
    function Icon(props) {
      const { path: d, size = 16, className } = props
      return h('svg', {
        className,
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        'aria-hidden': true,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'block', flex: 'none' },
      }, h('path', { d }))
    }

    /** Ring spinner drawn as an SVG arc so it can never render as a square. */
    function Spinner({ size = 16 }) {
      return h('svg', {
        className: 'nb-spinner',
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        'aria-hidden': true,
        focusable: 'false',
        style: { display: 'block', flex: 'none' },
      },
        h('circle', {
          cx: 12,
          cy: 12,
          r: 9,
          fill: 'none',
          stroke: 'var(--dsw-alias-label-tertiary, #9aa3ae)',
          strokeWidth: 2.5,
          strokeLinecap: 'round',
          strokeDasharray: '14 43',
        }),
      )
    }

    const ICONS = {
      book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z',
      plus: 'M12 5v14 M5 12h14',
      trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
      close: 'M6 6l12 12 M18 6L6 18',
      circle: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
      newChat: 'M12 3.5a8.5 8.5 0 1 0 4.9 15.5l3.6 1.4-1.2-3.6A8.5 8.5 0 0 0 12 3.5z M12 9v6 M9 12h6',
      square: 'M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z M8.5 12l2.5 2.5L16 9',
      check: 'M5 12l4 4L19 6',
      checkSquare: 'M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z M8 12l3 3 5-6',
      checkCircle: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12l3 3 5-6',
      refresh: 'M20 12a8 8 0 1 1-2.34-5.66 M20 4v5h-5',
      spark: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
      note: 'M6 3h9l4 4v14H6z M14 3v5h5',
      copy: 'M9 9h10v10H9z M5 15V5h10',
      quote: 'M8 7h11v9H8z M8 7L4 10v8h4 M11 11h5 M11 14h3',
      chevron: 'M6 9l6 6 6-6',
      send: 'M4 12l16-8-6 16-3.2-6.8z',
      file: 'M7 3h7l4 4v14H7z M13 3v5h5',
      folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      list: 'M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01',
      flag: 'M5 21V4 M5 5h11l-1.5 3.5L16 12H5',
      gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.11A1.7 1.7 0 0 0 15 4.7a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.3 9v.1a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.03z',
      attach: 'M12 5v14 M5 12h14',
      pdf: 'M7 3h7l4 4v14H7z M13 3v5h5 M9 13h1.5a1.5 1.5 0 0 1 0 3H9z M9 13v6',
      eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
      bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.7h5.4c.1-.7.4-1.3.9-1.7A6 6 0 0 0 12 3z',
    }

    /**
     * Sidebar icon: a book with two cut-out rules, drawn on a 20-unit grid so it
     * stays crisp at the owner's requested edge length.
     */
    function NotebookIcon({ size = 18, active = false }) {
      const edge = Math.max(14, Math.round(Number(size) || 18))
      // Same glyph as the panel header, at the sidebar's icon size.
      return h('svg', {
        viewBox: '0 0 24 24',
        width: edge,
        height: edge,
        'aria-hidden': true,
        focusable: 'false',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: {
          display: 'block',
          flex: 'none',
          color: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
          shapeRendering: 'geometricPrecision',
        },
      }, h('path', { d: ICONS.book }))
    }

    /** Small anchored popover that closes on outside click or Escape. */
    function Popover({ t, onClose, children, align = 'left', below = false }) {
      const ref = React.useRef(null)
      React.useLayoutEffect(() => {
        const node = ref.current
        let frame = 0
        const position = () => {
          frame = 0
          if (typeof node.showPopover === 'function') {
            if (!node.hasAttribute('popover')) { node.setAttribute('popover', 'manual'); node.showPopover() }
            const anchor = node.parentElement.getBoundingClientRect()
            Object.assign(node.style, { position: 'fixed', margin: '0', inset: 'auto', transform: 'none' })
            const size = node.getBoundingClientRect()
            node.style.left = `${Math.max(8, Math.min(window.innerWidth - size.width - 8, align === 'right' ? anchor.right - size.width : anchor.left))}px`
            // Never crawl into the window chrome: flip below when the space
            // above the anchor is too tight for the panel.
            const gap = 8
            const titleBar = 40
            const openBelow = below === true || anchor.top - gap < size.height + titleBar
            node.style.top = `${Math.max(titleBar, Math.min(window.innerHeight - size.height - 8, openBelow ? anchor.bottom + gap : anchor.top - size.height - gap))}px`
            return
          }
          node.style.transform = 'none'
          const rect = node.getBoundingClientRect()
          const x = Math.max(8 - rect.left, Math.min(0, window.innerWidth - 8 - rect.right))
          const y = Math.max(40 - rect.top, Math.min(0, window.innerHeight - 8 - rect.bottom))
          node.style.transform = `translate(${x}px, ${y}px)`
        }
        const schedule = () => { if (!frame) frame = requestAnimationFrame(position) }
        const observer = new ResizeObserver(schedule)
        observer.observe(node)
        window.addEventListener('resize', schedule)
        position()
        return () => { observer.disconnect(); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame) }
      }, [align, below])
      React.useEffect(() => {
        const onPointer = (event) => {
          if (ref.current !== null && !ref.current.contains(event.target)) onClose()
        }
        const onKey = (event) => {
          if (event.key === 'Escape') onClose()
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('mousedown', onPointer)
          document.removeEventListener('keydown', onKey)
        }
      }, [onClose])
      return h('div', {
        ref,
        className: `nb-popover${align === 'right' ? ' is-right' : ''}${below === true ? ' is-below' : ''}`,
        role: 'dialog',
        'aria-label': t('action.more'),
      }, children)
    }

    /** Host-style dropdown: borderless trigger plus an anchored menu. */
    function Select({ t, label, desc, value, options, onChange, disabled, testId, below = false, tone = 'plain', onContextMenu }) {
      const [open, setOpen] = React.useState(false)
      const active = options.find((option) => option.value === value) ?? options[0]
      return h('span', { className: 'nb-select', 'data-nb-select': testId },
        label === undefined || label === ''
    ? null
    : h('span', { className: 'nb-select-label' },
      h('span', null, label),
      typeof desc === 'string' && desc !== '' ? h('span', { className: 'nb-select-desc' }, desc) : null,
    ),
        h('span', { className: 'nb-pop-wrap' },
          h('button', {
            type: 'button',
            className: `nb-select-trigger${tone === 'field' ? ' is-field' : ''}`,
            disabled: disabled === true,
            'aria-haspopup': 'listbox',
            'aria-expanded': open,
            onClick: () => setOpen((current) => !current),
            onContextMenu: onContextMenu ? (event) => onContextMenu(event, value) : undefined,
          },
            h('span', { className: 'nb-select-value' }, active === undefined ? '' : active.label),
            h('span', { className: 'nb-select-chevron' }, h(Icon, { path: ICONS.chevron, size: 12 })),
          ),
          open
            ? h(Popover, { t, below, onClose: () => setOpen(false) },
              h('div', { className: 'nb-select-menu', role: 'listbox' },
                options.map((option) => h('button', {
                  key: option.value,
                  type: 'button',
                  role: 'option',
                  'aria-selected': option.value === value,
                  onContextMenu: onContextMenu ? (event) => onContextMenu(event, option.value) : undefined,
                  className: `nb-select-option${option.value === value ? ' is-active' : ''}`,
                  onClick: () => {
                    onChange(option.value)
                    setOpen(false)
                  },
                },
                  h('span', { className: 'nb-select-check' }, option.value === value ? h(Icon, { path: 'M5 12l5 5L20 7', size: 12 }) : null),
                  h('span', { className: 'nb-pop-label' }, option.label),
                )))
            )
            : null,
        ),
      )
    }

    function ModalBackdrop({ children, className = 'nb-modal-backdrop', ...props }) {
      return h('div', { ...props, className, popover: 'manual', ref: (node) => {
        if (node && typeof node.showPopover === 'function' && !node.matches(':popover-open')) node.showPopover()
      } }, children)
    }

    /** Read a file input once, reset it, and hand the files to the caller. */
    const pickFiles = (input, onFiles) => {
      const files = Array.from(input?.files ?? [])
      if (input !== null && input !== undefined) input.value = ''
      if (files.length > 0) onFiles(files)
    }

    /** Shared modal title bar with the standard close button. */
    function ModalHead({ t, title, onClose, disabled }) {
      return h('div', { className: 'nb-modal-head' },
        h('h3', { className: 'nb-modal-title' }, title),
        h('button', {
          type: 'button',
          className: 'nb-btn',
          disabled: disabled === true,
          'aria-label': t('action.close'),
          onClick: onClose,
        }, t('action.close')),
      )
    }

    /**
     * Destructive confirmation shell: backdrop, title bar, body text and the
     * cancel/delete pair. Call sites only build the body and wire onConfirm.
     */
    function ConfirmModal({ t, title, body, busy, onCancel, onConfirm, backdropStyle }) {
      return h(ModalBackdrop, {
        className: 'nb-modal-backdrop',
        style: backdropStyle,
        onMouseDown: (event) => { if (event.target === event.currentTarget && busy !== true) onCancel() },
      },
        h('div', { className: 'nb-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
          h(ModalHead, { t, title, onClose: onCancel, disabled: busy }),
          h('p', { className: 'nb-modal-text' }, body),
          h('div', { className: 'nb-modal-actions' },
            h('button', { type: 'button', className: 'nb-btn', disabled: busy, onClick: onCancel }, t('action.cancel')),
            h('button', { type: 'button', className: 'nb-btn is-danger', disabled: busy, onClick: onConfirm }, t('action.delete')),
          ),
        ),
      )
    }

    function ConversationControls({ t, conversations, value, disabled, onChange, onCreate, onRename, onRemove, onRemoveMany }) {
      const [menu, setMenu] = React.useState(undefined)
      const [selecting, setSelecting] = React.useState(false)
      const [picked, setPicked] = React.useState([])
      const [rename, setRename] = React.useState(undefined)
      const [confirmChat, setConfirmChat] = React.useState(undefined)
      const [collapsed, setCollapsed] = React.useState(false)
      const [pending, setPending] = React.useState(false)
      const sidebarRef = React.useRef(null)
      const listRef = React.useRef(null)
      React.useLayoutEffect(() => {
        const sidebar = sidebarRef.current
        const scroller = sidebar?.closest('.nb-box-main')
        if (!scroller) return undefined
        const resize = () => sidebar.style.setProperty('--nb-chat-height', `${scroller.clientHeight}px`)
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(scroller)
        return () => observer.disconnect()
      }, [])
      React.useEffect(() => {
        setPicked((current) => current.filter((id) => conversations.some((entry) => entry.id === id)))
      }, [conversations])
      React.useEffect(() => {
        const list = listRef.current
        const active = list?.querySelector('[aria-current="true"]')
        if (!active) return
        const row = active.getBoundingClientRect(), bounds = list.getBoundingClientRect()
        if (row.top < bounds.top) list.scrollTop += row.top - bounds.top
        else if (row.bottom > bounds.bottom) list.scrollTop += row.bottom - bounds.bottom
      }, [value, conversations])
      React.useEffect(() => {
        if (!menu && !rename) return undefined
        const dismiss = (event) => { if (!event.target.closest?.('.nb-chat-context')) setMenu(undefined) }
        const onKey = (event) => { if (event.key === 'Escape' && !pending) { setMenu(undefined); setRename(undefined) } }
        document.addEventListener('mousedown', dismiss)
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('mousedown', dismiss); document.removeEventListener('keydown', onKey) }
      }, [menu, rename, pending])
      const context = (event, id) => {
        event.preventDefault()
        if (disabled || pending) return
        setMenu({ id, x: Math.max(8, Math.min(event.clientX, window.innerWidth - 180)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - 95)) })
      }
      return h('aside', { ref: sidebarRef, className: 'nb-conversations nb-chat-sidebar' + (collapsed ? ' is-collapsed' : ''), 'aria-label': t('chat.label') },
        h('div', { className: 'nb-chat-sidebar-head' },
          h('button', {
          type: 'button',
          className: 'nb-icon-btn nb-sidebar-toggle',
          title: collapsed ? '展开聊天列表' : '收起聊天列表',
          'aria-expanded': !collapsed,
          onClick: () => setCollapsed((on) => !on),
        }, h(Icon, { path: ICONS.chevron, size: 14, className: collapsed ? undefined : 'is-flipped' })),
        collapsed ? null : h('span', { className: 'nb-notes-title' }, t('chat.label')),
          h('div', { className: 'nb-chat-tools' },
            h('button', { type: 'button', className: 'nb-icon-btn is-multi nb-new-chat', title: t('chat.new'), 'aria-label': t('chat.new'), disabled: disabled || pending, onClick: onCreate },
              h(Icon, { path: ICONS.newChat, size: 22 })),
            h('button', { type: 'button', className: 'nb-icon-btn is-multi' + (selecting ? ' is-active' : ''), title: t('action.multiSelect'), 'aria-label': t('action.multiSelect'), 'aria-pressed': selecting, disabled: disabled || pending,
              onClick: () => { setSelecting((on) => !on); setPicked([]) } }, h(Icon, { path: selecting ? ICONS.checkSquare : ICONS.square, size: 20 })),
          ),
        ),
        selecting ? h('div', { className: 'nb-chat-selection-actions' },
          h('span', { className: 'nb-muted' }, '已选 ' + picked.length),
          h('button', { type: 'button', className: 'nb-btn is-danger', disabled: !picked.length || disabled || pending,
            onClick: () => setConfirmChat({ ids: picked.slice(), title: '' }) }, t('action.delete')),
        ) : null,
        h('div', { ref: listRef, className: 'nb-chat-list', role: 'list' }, conversations.map((entry) => h('button', {
          key: entry.id, type: 'button', role: 'listitem', title: entry.title,
          className: 'nb-chat-row' + (entry.id === value ? ' is-active' : '') + (picked.includes(entry.id) ? ' is-picked' : ''),
          disabled: disabled || pending, 'aria-current': entry.id === value ? 'true' : undefined,
          onClick: () => selecting ? setPicked((current) => current.includes(entry.id) ? current.filter((id) => id !== entry.id) : [...current, entry.id]) : onChange(entry.id),
          onContextMenu: (event) => context(event, entry.id),
        }, h('span', { className: 'nb-chat-row-title' }, entry.title)))),
        menu ? h('div', {
          className: 'nb-context-menu nb-chat-context',
          role: 'menu',
          popover: 'manual',
          // Keep the context menu above the scrolling sidebar.
          ref: (node) => {
            if (node === null) return
            if (typeof node.showPopover !== 'function') return
            if (node.matches(':popover-open')) return
            node.showPopover()
          },
          style: { left: `${menu.x}px`, top: `${menu.y}px` },
        },
          h('button', { type: 'button', role: 'menuitem', className: 'nb-pop-item', onClick: () => { setRename({ id: menu.id, title: conversations.find((entry) => entry.id === menu.id)?.title ?? '' }); setMenu(undefined) } }, t('chat.rename')),
          h('button', { type: 'button', role: 'menuitem', className: 'nb-pop-item', onClick: () => {
            const entry = conversations.find((item) => item.id === menu.id)
            const batch = selecting && picked.includes(menu.id) && picked.length > 1 ? picked.slice() : undefined
            setMenu(undefined)
            if (batch !== undefined) {
              setConfirmChat({ ids: batch, title: '' })
              return
            }
            setConfirmChat({ ids: [menu.id], title: entry === undefined ? '' : entry.title })
          } }, t('chat.delete')),
        ) : null,
        confirmChat === undefined
          ? null
          : h(ConfirmModal, {
            t,
            title: t('chat.delete'),
            busy: pending,
            backdropStyle: { zIndex: 9600 },
            onCancel: () => setConfirmChat(undefined),
            onConfirm: async () => {
              const ids = confirmChat.ids
              setPending(true)
              try {
                const removed = ids.length > 1 && typeof onRemoveMany === 'function' ? await onRemoveMany(ids) : await onRemove(ids[0])
                if (removed !== false) { setConfirmChat(undefined); setPicked([]); setSelecting(false) }
              } finally { setPending(false) }
            },
            body: confirmChat.ids.length > 1
              ? '确定要删除所选 ' + confirmChat.ids.length + ' 个聊天吗？删除后无法恢复。'
              : h(React.Fragment, null, '确定要删除 ', h('span', { className: 'nb-name-chip' }, confirmChat.title || (conversations.find((entry) => entry.id === (confirmChat.ids ?? [])[0]) ?? {}).title || ''), ' 吗？删除后无法恢复。'),
          }),
        rename ? h(ModalBackdrop, { className: 'nb-modal-backdrop', onMouseDown: (event) => { if (event.target === event.currentTarget && !pending) setRename(undefined) } },
          h('form', { className: 'nb-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('chat.rename'), onSubmit: async (event) => {
            event.preventDefault(); if (!rename.title.trim() || pending) return
            setPending(true)
            try { if (await onRename(rename.id, rename.title.trim())) setRename(undefined) } finally { setPending(false) }
          } },
            h(ModalHead, { t, title: t('chat.rename'), onClose: () => setRename(undefined), disabled: pending }),
            h('input', { className: 'nb-input', 'aria-label': t('chat.name'), value: rename.title, maxLength: 120, autoFocus: true, disabled: pending, onChange: (event) => setRename({ ...rename, title: event.target.value }) }),
            h('div', { className: 'nb-modal-actions' },
              h('button', { type: 'button', className: 'nb-btn', disabled: pending, onClick: () => setRename(undefined) }, t('action.cancel')),
              h('button', { type: 'submit', className: 'nb-btn', disabled: pending || !rename.title.trim() }, t('action.save')),
            ),
          ),
        ) : null,
      )
    }

    function SelectionNoteAction({ t, text, materialId, notes = [], settings = {}, onAppend, below = false }) {
      const [target, setTarget] = React.useState('default')
      const [pending, setPending] = React.useState(false)
      const [saved, setSaved] = React.useState(false)
      React.useEffect(() => { setSaved(false); setTarget('default') }, [text])
      const defaultId = notes.some((note) => note.id === settings.defaultAppendNoteId) ? settings.defaultAppendNoteId : 'latest'
      const defaultTitle = notes.find((note) => note.id === defaultId)?.title ?? t('notes.latest')
      return h('span', { className: 'nb-selection-note-action' },
        h('button', { type: 'button', className: 'nb-btn', disabled: pending || saved, onClick: async () => {
          setPending(true)
          try { setSaved(await onAppend(text, target === 'default' ? defaultId : target, materialId)) } finally { setPending(false) }
        } }, saved ? t('notes.appended') : t('notes.append')),
        h(Select, { t, value: target === 'latest' || notes.some((note) => note.id === target) ? target : 'default', disabled: pending, below,
          testId: 'append-note-target', options: [{ value: 'default', label: `${t('notes.defaultTarget')} · ${defaultTitle}` }, { value: 'latest', label: t('notes.latest') }, ...notes.map((note) => ({ value: note.id, label: note.title }))], onChange: (next) => { setTarget(next); setSaved(false) } }),
      )
    }

    /** Contain render failures so a bug cannot blank the whole slot. */
    class Boundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: undefined }
      }
      static getDerivedStateFromError(error) {
        return { error }
      }
      render() {
        if (this.state.error === undefined) return this.props.children
        return h('div', { className: 'nb-fatal' },
          h('strong', null, this.props.t('error.boundary')),
          h('pre', null, String(this.state.error?.message ?? this.state.error)),
        )
      }
    }

    function StatusDot({ state }) {
      const color = state === 'ready'
        ? 'var(--dsw-alias-state-success-primary)'
        : state === 'error'
          ? 'var(--dsw-alias-state-error-primary)'
          : 'var(--dsw-alias-state-idle-primary)'
      return h('span', { className: 'nb-dot', style: { background: color } })
    }

    // -----------------------------------------------------------------------
    // Rail
    // -----------------------------------------------------------------------

    /** Size choices for body text and for code blocks. */
    const SIZES = ['12.5', '13.5', '15', '16.5'].map((value) => ({ value, label: value }))
    const CODE_SIZES = ['11.5', '12.5', '13.5', '15'].map((value) => ({ value, label: value }))

    /** Preset note sections; the sentinel keeps a hand-typed section visible. */
    const SECTION_CUSTOM = '__custom__'
    const sectionPresets = (t) => [
      { value: SECTION_CUSTOM, label: t('notes.sectionCustom') },
      { value: '今日知识点', label: t('notes.sectionToday') },
      { value: '典型题目/错题', label: t('notes.sectionTypical') },
    ]

    /** Icons for the settings sections, mirroring the host dialog. */
    const NAV_ICONS = { notes: 'note', chat: 'bulb', practice: 'flag', font: 'spark' }

/** Current build, used to decide whether to show the changelog once. */
    const APP_VERSION = '0.2.3'
    const CHANGELOG = [
      {
        version: 'v0.2.3',
        groups: [
          {
            title: '更新内容',
            items: [
              '「资料区」新增资料画像，导入时自动生成概括，资料行显示「已索引 / 待索引」，右键可「重建索引」',
              '「问答区」改为按资料画像与命中片段回答，命中不足时自动改用整箱资料并提示',
              '「问答区」新增选区提问，选中内容以黑色小框显示在输入框上方，可补充问题后一起发送',
              '「笔记区」分区新增「典型题目/错题」类型，编辑笔记时可直接选择',
              '「笔记区」批量导出新增「练习题」与「错题本」，可单独导出题目、答案与解析',
              '「做题区」新增「导入笔记」，可多选已出的题目导入为「典型题目/错题」笔记',
              '「做题区」改为逐题出题、逐题保存，中途关闭后可「继续出题」，已出题目不会丢失',
              '「做题区」新增出题范围选择，解析与「参考答案与评分要点」在提交作答后可见',
              '「做题区」可选中题目文字「就这段提问」，与聊天里的选区提问一致',
              '「做题区」判题改为针对本次作答生成解析，选择题会说明所选选项为何不成立；答错给改法提示，答对只补充要点、不展示参考答案',
              '「设置」新增「问答检索范围」，可调整每次提问送入模型的资料片段数',
              '「资料区」「笔记区」「问答区」「做题区」均可切换模型，接入的第三方 API 会按服务分组显示',
              '安装包与源码已发布到 GitHub Releases（v0.2.3），可从仓库 Releases 页直接下载',
            ],
          },
          {
            title: '修复内容',
            items: [
              '修复了「做题区」选择题重复点击会反复提交的问题，目前同一题只允许提交一次',
              '修复了「做题区」与「笔记区」控件较多时挤压变形的问题，目前会自动换行显示',
            ],
          },
        ],
      },
      {
        version: 'v0.2.2',
        groups: [
          {
            title: '更新内容',
            items: ['合并 PDF 导入及文件导入功能', '更新了安装的网页显示内容，现在可以在网页查看显示了'],
          },
          {
            title: '修复内容',
            items: [
              '修复了「笔记区」位置的图标显示，目前图标可正常显示',
              '修复了「笔记区」位置的删除功能，目前笔记可正常删除',
              '修复了「问答区」的显示逻辑，目前聊天栏可正常收纳',
              '修复了「问答区」聊天栏的使用，目前新增聊天会自动跳转到新聊天',
              '修复了「问答区」聊天自动命名的逻辑，目前仅会自动命名一次且不会覆盖主动命名',
              '修复了「资料区」多选时删除失败的问题',
              '修复了「资料区」多选的退出逻辑问题，目前可正常自动退出',
              '修复了删除提示弹窗关闭字样未居中的问题',
              '修复了部分字体渲染的问题',
              '修复了更新日志的滑动问题，历史更新记录的显示问题，目前可正常显示',
            ],
          },
        ],
      },
      {
        version: 'v0.2.1',
        groups: [
          {
            title: '更新内容',
            items: [
              '新增了更新日志弹窗提示',
              '更新批量导入资料，批量删除资料、笔记、聊天，批量导出所选笔记等功能',
              '更新问答区聊天框部署位置，使其更贴合 DSH 风格',
              '更新了部分文案内容，使内容得到统一',
              '修改了问答区聊天排布，添加了对话列表收纳功能',
            ],
          },
          {
            title: '修复内容',
            items: ['本次更新暂未修复 bug'],
          },
        ],
      },
    ]



    /** Built-in faces offered for body and code text. */
    const BUILT_IN_FONTS = [
      { id: 'system', label: 'settings.fontSystem' },
      { id: 'sans', label: 'settings.fontSans' },
      { id: 'serif', label: 'settings.fontSerif' },
      { id: 'consolas', label: 'Consolas' },
    ]

    /** Stacks for the built-in faces; imported ones resolve by their id. */
    function fontStackOf(id) {
      if (id === 'sans') return '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif'
      if (id === 'serif') return 'Georgia, "Songti SC", "SimSun", serif'
      if (id === 'consolas') return 'Consolas, Menlo, Monaco, "Courier New", monospace'
      if (id === 'code') return 'Consolas, "JetBrains Mono", "Cascadia Code", Menlo, monospace'
      if (id === 'system') return ''
      return '"' + id + '", "PingFang SC", "Microsoft YaHei", sans-serif'
    }

    /** Read the imported-font library from local storage. */
    function readFonts() {
      try {
        const raw = window.localStorage.getItem('notebook.fonts')
        const parsed = raw === null ? [] : JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    /** Persist the library. */
    function writeFonts(list) {
      try {
        window.localStorage.setItem('notebook.fonts', JSON.stringify(list))
      } catch {
        /* quota or private mode */
      }
    }

    /** Register one stored face with the document. */
    function registerFont(entry) {
      try {
        if (document.fonts.check('12px "' + entry.id + '"')) return
        const bytes = Uint8Array.from(atob(entry.data), (char) => char.charCodeAt(0))
        const face = new window.FontFace(entry.id, bytes.buffer)
        document.fonts.add(face)
        void face.load().catch(() => undefined)
      } catch {
        /* skip a corrupt face */
      }
    }

    /** One rail row: name, counts, and a two-step delete. */
    function BoxRow({ box, selected, t, onSelect, onRemove }) {
      const [confirming, setConfirming] = React.useState(false)
      React.useEffect(() => {
        if (!confirming) return undefined
        const timer = setTimeout(() => setConfirming(false), 4000)
        return () => clearTimeout(timer)
      }, [confirming])

      const meta = [
        `${box.materialCount} ${t('rail.materials')}`,
        `${box.noteCount} ${t('rail.notes')}`,
        box.wrongCount > 0 ? `${box.wrongCount} ${t('rail.wrong')}` : undefined,
      ].filter((part) => part !== undefined).join(' · ')

      return h('div', { className: `nb-row${selected ? ' is-selected' : ''}` },
        h('button', {
          type: 'button',
          className: 'nb-row-main',
          onClick: () => onSelect(box.id),
          title: box.name,
        },
          h('span', { className: 'nb-row-name' }, box.name),
          h('span', { className: 'nb-row-meta' }, meta),
        ),
        h('button', {
          type: 'button',
          className: 'nb-row-action',
          'aria-label': t('action.delete'),
          title: t('action.delete'),
          onClick: (event) => {
            event.stopPropagation()
            setConfirming(false)
            onRemove(box.id)
          },
        }, h(Icon, { path: ICONS.trash, size: 14 })),
      )
    }

    /** New-box composer shown at the rail foot. */
    function CreateForm({ t, busy, onCreate, onCancel }) {
      const [name, setName] = React.useState('')
      const submit = () => {
        if (busy) return
        onCreate(name.trim())
      }
      return h('div', { className: 'nb-create' },
        h('input', {
          className: 'nb-input',
          type: 'text',
          autoFocus: true,
          value: name,
          placeholder: t('field.name.placeholder'),
          maxLength: 120,
          disabled: busy,
          onChange: (event) => setName(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter') submit()
            if (event.key === 'Escape') onCancel()
          },
        }),
        h('div', { className: 'nb-create-actions' },
          h('button', { type: 'button', className: 'nb-btn is-primary', disabled: busy, onClick: submit }, t('action.create')),
          h('button', { type: 'button', className: 'nb-btn', disabled: busy, onClick: onCancel }, t('action.cancel')),
        ),
      )
    }

    // -----------------------------------------------------------------------
    // Materials
    // -----------------------------------------------------------------------

    /** Read one browser File into text or base64 payload. */
    async function readFileForImport(file, t) {
      const isPdf = /\.pdf$/iu.test(file.name)
      if (file.size > MAX_PDF_BYTES) throw new Error(`${file.name}: ${t('error.pdfTooBig')}`)
      const bytes = new Uint8Array(await file.arrayBuffer())
        let binary = ''
        for (let at = 0; at < bytes.length; at += 0x8000) {
          binary += String.fromCharCode.apply(undefined, bytes.subarray(at, at + 0x8000))
        }
      if (isPdf) {
        return { name: file.name, kind: 'pdf', base64: btoa(binary), bytes: file.size }
      }
      const text = await file.text()
      if (text.trim().length === 0) throw new Error(`${file.name}: ${t('error.noText')}`)
      return { name: file.name, kind: 'file', text, base64: btoa(binary), bytes: file.size }
    }

    /** File viewer reused by the materials tab and the chat side panel. */
    const MaterialReader = React.memo(function MaterialReader({ t, reading, onSelectionAsk, onAppend, notes, settings, compact }) {
      const [selection, setSelection] = React.useState(undefined)
      const readerRef = React.useRef(null)
      const mathState = useMathReady()
      const content = React.useMemo(() => markdownNodes(reading.text, `read-${reading.id}`, t), [reading.text, reading.id, t, mathState.ready])

      React.useEffect(() => {
        setSelection(undefined)
      }, [reading.id])

      const readSelection = () => {
        const container = readerRef.current
        if (container === null) return
        const active = window.getSelection()
        if (active === null || active.rangeCount === 0) {
          setSelection(undefined)
          return
        }
        const text = active.toString().trim()
        if (text.length < 2 || !container.contains(active.anchorNode)) {
          setSelection(undefined)
          return
        }
        setSelection(text)
      }

      return h('div', { className: `nb-reader${compact === true ? ' is-compact' : ''}` },
        h('div', { className: 'nb-reader-head' },
          h('span', { className: 'nb-reader-title' }, reading.name),
        ),
        h('div', {
          ref: readerRef,
          className: 'nb-reader-body is-md',
          onMouseUp: readSelection,
          onKeyUp: readSelection,
        }, h('div', { className: 'nb-md' }, content)),
        selection !== undefined
          ? h('div', { className: 'nb-selection-bar' },
            h('span', { className: 'nb-selection-label' }, `${t('hint.selection')} ${selection.length} ${t('hint.chars')}`),
            h('button', { type: 'button', className: 'nb-btn is-primary', onClick: () => onSelectionAsk(reading, selection) },
              h(Icon, { path: ICONS.spark, size: 13 }), h('span', null, t('action.askSelection'))),
            onAppend ? h(SelectionNoteAction, { t, text: selection, materialId: reading.id, notes, settings, onAppend }) : null,
            h('button', { type: 'button', className: 'nb-btn', onClick: () => setSelection(undefined) }, t('hint.clearSelection')),
          )
          : null,
      )
    })

    /** Materials list plus the selectable reader used for "ask about this passage". */
    function MaterialsPane({ t, materials, reading, onRead, onImport, onPickImport, onPaste, onRemove, onRemoveMany, onSelectionAsk, onReveal, onReindex, models, model, efforts, effort, onModelChange, onEffortChange, busy }) {
      const fileRef = React.useRef(null)
      const folderRef = React.useRef(null)
      const [menu, setMenu] = React.useState(undefined)
      // Click anywhere outside the material menu — or scroll, or press Escape — closes it.
      React.useEffect(() => {
        if (menu === undefined) return undefined
        const dismiss = (event) => {
          const target = event.target
          if (target instanceof Element && target.closest('.nb-context-menu') !== null) return
          setMenu(undefined)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') setMenu(undefined)
        }
        document.addEventListener('mousedown', dismiss, true)
        document.addEventListener('keydown', onKey)
        window.addEventListener('scroll', dismiss, true)
        return () => {
          document.removeEventListener('mousedown', dismiss, true)
          document.removeEventListener('keydown', onKey)
          window.removeEventListener('scroll', dismiss, true)
        }
      }, [menu])
      const [pasting, setPasting] = React.useState(false)
      const [selecting, setSelecting] = React.useState(false)
      const [picked, setPicked] = React.useState([])
      // Leaving multi-select as soon as the picked rows are gone (batch delete).
      React.useEffect(() => {
        if (!selecting || picked.length === 0) return
        const alive = picked.filter((id) => materials.some((entry) => entry.id === id))
        if (alive.length === 0) {
          setPicked([])
          setSelecting(false)
        }
      }, [materials, selecting, picked])
      const [pasteName, setPasteName] = React.useState('')
      const [pasteText, setPasteText] = React.useState('')
      React.useEffect(() => {
        setPicked((current) => current.filter((id) => materials.some((entry) => entry.id === id)))
      }, [materials])

      const pick = (ref) => {
        if (onPickImport) { onPickImport(ref === folderRef ? 'folder' : 'file'); return }
        if (ref.current !== null) ref.current.click()
      }

      return h('div', { className: 'nb-pane' },
        h('div', { className: 'nb-toolbar' },
          h('button', { type: 'button', className: 'nb-btn', disabled: busy, onClick: () => pick(fileRef) },
            h(Icon, { path: ICONS.file, size: 14 }), h('span', null, t('action.importFile'))),
          h('button', { type: 'button', className: 'nb-btn', disabled: busy, onClick: () => pick(folderRef) },
            h(Icon, { path: ICONS.folder, size: 14 }), h('span', null, t('action.importFolder'))),
          h('button', { type: 'button', className: 'nb-btn', disabled: busy, onClick: () => setPasting((open) => !open) },
            h(Icon, { path: ICONS.plus, size: 14 }), h('span', null, t('action.paste'))),
          h('button', {
            type: 'button',
            className: `nb-icon-btn${selecting ? ' is-active' : ''}`,
            title: t('action.multiSelect'),
            'aria-label': t('action.multiSelect'),
            'aria-pressed': selecting,
            onClick: () => {
              setSelecting((on) => !on)
              setPicked([])
            },
          }, h(Icon, { path: selecting ? ICONS.checkSquare : ICONS.square, size: 20 })),
          picked.length === 0
            ? null
            : h('button', {
              type: 'button',
              className: 'nb-btn is-danger',
              disabled: busy,
              onClick: () => {
                const ids = picked.slice()
                void onRemoveMany(ids)
              },
            }, h(Icon, { path: ICONS.trash, size: 14 }), h('span', null, `${t('action.delete')} ${picked.length}`)),
          models === undefined
            ? null
            : h(ModelMenu, {
              t,
              models,
              model,
              efforts,
              effort,
              disabled: busy,
              onChangeModel: (next) => onModelChange(next),
              onChangeEffort: (next) => onEffortChange(next),
            }),
          h('input', {
            ref: fileRef,
            type: 'file',
            multiple: true,
            accept: '.txt,.md,.markdown,.csv,.json,.log,.text,.pdf,text/plain,text/markdown,application/pdf',
            style: { display: 'none' },
            onChange: (event) => pickFiles(event.target, onImport),
          }),
          h('input', {
            ref: folderRef,
            type: 'file',
            multiple: true,
            webkitdirectory: '',
            directory: '',
            style: { display: 'none' },
            onChange: (event) => pickFiles(event.target, onImport),
          }),
        ),
        pasting
          ? h('div', { className: 'nb-paste' },
            h('input', {
              className: 'nb-input',
              placeholder: t('field.pasteName'),
              value: pasteName,
              onChange: (event) => setPasteName(event.target.value),
            }),
            h('textarea', {
              className: 'nb-textarea',
              rows: 6,
              placeholder: t('field.pasteText'),
              value: pasteText,
              onChange: (event) => setPasteText(event.target.value),
            }),
            h('div', { className: 'nb-create-actions' },
              h('button', {
                type: 'button',
                className: 'nb-btn is-primary',
                disabled: busy || pasteText.trim().length === 0,
                onClick: () => {
                  onPaste(pasteName, pasteText)
                  setPasteName('')
                  setPasteText('')
                  setPasting(false)
                },
              }, t('action.add')),
              h('button', {
                type: 'button',
                className: 'nb-btn',
                onClick: () => {
                  setPasting(false)
                  setPasteName('')
                  setPasteText('')
                },
              }, t('action.cancel')),
            ),
          )
          : null,
        h('div', { className: 'nb-mat-split' },
          h('div', { className: 'nb-mat-scroll' },
        materials.length === 0
          ? h('p', { className: 'nb-muted nb-pane-empty' }, t('empty.materials'))
          : h('ul', { className: 'nb-mat-list' },
            materials.map((material) => h('li', { key: material.id, className: `nb-mat${reading?.id === material.id && !selecting ? ' is-active' : ''}${picked.includes(material.id) ? ' is-picked' : ''}` },
              h('button', {
                type: 'button',
                className: 'nb-mat-main',
                onClick: () => {
                  if (!selecting) { onRead(reading?.id === material.id ? undefined : material.id); return }
                  setPicked((current) => (current.includes(material.id) ? current.filter((id) => id !== material.id) : [...current, material.id]))
                },
                onContextMenu: (event) => {
                  event.preventDefault()
                  setMenu({ id: material.id, name: material.name, x: event.clientX, y: event.clientY })
                },
              },
                h('span', { className: 'nb-mat-name' }, material.name),
                h('span', { className: 'nb-mat-meta' }, `${material.chars} ${t('hint.chars')} · ${material.chunks} ${t('hint.chunks')} · ${material.indexed === false ? t('mat.unindexed') : t('mat.indexed')}`),
              ),
            )),
          ),
          ),
        ),
        menu === undefined
          ? null
          : h('div', { className: 'nb-context-menu', style: { left: menu.x + 'px', top: menu.y + 'px' } },
            h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { onRead(menu.id); setMenu(undefined) } }, t('mat.view')),
            h('button', { type: 'button', className: 'nb-pop-item', onClick: () => {
              const ids = selecting && picked.includes(menu.id) && picked.length > 1 ? picked.slice() : [menu.id]
              setMenu(undefined)
              if (ids.length > 1) { void onRemoveMany(ids) } else onRemove(ids[0])
            } }, t('action.delete')),
            h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { void onReveal(menu.id); setMenu(undefined) } }, t('mat.reveal')),
            onReindex === undefined
              ? null
              : h('button', {
                type: 'button',
                className: 'nb-pop-item',
                disabled: busy,
                onClick: () => { setMenu(undefined); void onReindex() },
              }, busy ? '…' : t('mat.reindex')),
          ),
      )
    }

    // -----------------------------------------------------------------------
    // Transcript
    // -----------------------------------------------------------------------

    /** Handler installed by the box view: inline citations call it with a material name. */
    let citeHandler
    /** Install (or clear) the citation handler; returns nothing. */
    function setCiteHandler(handler) {
      citeHandler = handler
    }

    /** One stored message: markdown body, action row, sources, follow-ups. */
    function MessageItem({ message, t, onExtend, onAsk, extending, onOpenMaterial, flash, onSaveNote, saved, onMarkWrong, onQuote, onNotify }) {
      const isUser = message.role === 'user'
      const [showSources, setShowSources] = React.useState(false)
      const mathState = useMathReady()
      const body = React.useMemo(() => markdownNodes(message.text, message.id, t), [message.text, message.id, t, mathState.ready])
      const sources = React.useMemo(() => {
        const list = Array.isArray(message.sources) ? message.sources : []
        const seen = new Set()
        const unique = []
        for (const source of list) {
          if (source === null || typeof source !== 'object') continue
          const key = `${source.materialId}#${source.index}`
          if (seen.has(key)) continue
          seen.add(key)
          unique.push(source)
        }
        return unique
      }, [message.sources])
      const followups = Array.isArray(message.followups) ? message.followups : []
      const attachments = Array.isArray(message.attachments) ? message.attachments : []
      const anchor = `nb-msg-${message.id}`
      const rootClass = `nb-msg${isUser ? ' is-user' : ' is-ai'}${flash === true ? ' is-flash' : ''}`

      if (isUser) {
        return h('div', { className: rootClass, id: anchor },
          h('div', { className: 'nb-msg-user' }, message.text),
          attachments.length > 0
            ? h('div', { className: 'nb-msg-attach' }, attachments.map((entry) => h('button', {
              key: entry.id,
              type: 'button',
              className: 'nb-file-link',
              onClick: () => onOpenMaterial(entry.id, entry.name),
            }, entry.name)))
            : null,
        )
      }

      const tag = message.kind === 'extend'
        ? t('msg.extendOf')
        : message.kind === 'hint'
          ? t('msg.hintOf')
          : undefined

      return h('div', { className: rootClass, id: anchor },
        h('div', { className: 'nb-msg-meta' },
          tag !== undefined ? h('span', { className: 'nb-tag' }, tag) : null,
          message.usedHistory === true ? h('span', { className: 'nb-tag' }, t('msg.history')) : null,
          message.usedFullText === true ? h('span', { className: 'nb-tag is-warn' }, t('qa.fallback')) : null,
          message.usedOverview === true ? h('span', { className: 'nb-tag' }, t('qa.overview')) : null,
        ),
        h('div', { className: 'nb-md' }, body),
        h('div', { className: 'nb-msg-actions' },
          sources.length > 0
            ? h('button', {
              type: 'button',
              className: `nb-chip${showSources ? ' is-on' : ''}`,
              'aria-expanded': showSources,
              onClick: () => setShowSources((open) => !open),
            }, h(Icon, { path: ICONS.eye, size: 13 }), h('span', null, `${t('msg.sources')} ${sources.length}`))
            : null,
          message.kind === 'hint'
            ? null
            : h('button', {
              type: 'button',
              className: 'nb-chip',
              disabled: extending === message.id,
              onClick: () => onExtend(message.id),
            }, h(Icon, { path: ICONS.spark, size: 13 }), h('span', null, extending === message.id ? '…' : t('action.extend'))),
          h('button', {
            type: 'button',
            className: 'nb-chip',
            disabled: saved === true,
            title: t('action.saveNote'),
            onClick: () => onSaveNote(message),
          }, h(Icon, { path: ICONS.note, size: 13 }), h('span', null, saved === true ? t('notes.saved') : t('action.saveNote'))),
          h('button', {
            type: 'button',
            className: 'nb-chip',
            title: t('wrong.add'),
            onClick: () => onMarkWrong(message),
          }, h(Icon, { path: ICONS.flag, size: 13 }), h('span', null, t('wrong.add'))),
          h('button', {
            type: 'button',
            className: 'nb-chip',
            title: t('action.copy'),
            onClick: () => {
              const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard
              if (clipboard !== undefined) void clipboard.writeText(message.text).then(() => onNotify?.('已复制'), () => onNotify?.('复制失败，请重试'))
            },
          }, h(Icon, { path: ICONS.copy, size: 13 }), h('span', null, t('action.copy'))),
          typeof onQuote === 'function'
            ? h('button', {
              type: 'button',
              className: 'nb-chip',
              title: t('action.quote'),
              onClick: () => onQuote(message.text),
            }, h(Icon, { path: ICONS.quote, size: 13 }), h('span', null, t('action.quote')))
            : null,
        ),
        showSources && sources.length > 0
          ? h('ul', { className: 'nb-src-list' }, sources.map((source, index) => h('li', { key: `${message.id}-${index}` },
            h('button', {
              type: 'button',
              className: 'nb-file-link',
              title: t('action.openFile'),
              onClick: () => onOpenMaterial(source.materialId, source.materialName),
            },
              h(Icon, { path: ICONS.file, size: 12 }),
              h('span', { className: 'nb-file-name' }, source.materialName),
              h('span', { className: 'nb-src-index' }, `#${source.index + 1}`),
            ),
            h('div', { className: 'nb-src-snippet nb-md is-small' }, markdownNodes(source.snippet ?? '', `${message.id}-s${index}`, t)),
          )))
          : null,
        followups.length > 0
          ? h('div', { className: 'nb-followups' },
            h('span', { className: 'nb-followups-label' }, t('msg.followups')),
            followups.map((question, index) => h('button', {
              key: `${message.id}-f${index}`,
              type: 'button',
              className: 'nb-followup',
              onClick: () => onAsk(question, {}),
            }, question)),
          )
          : null,
      )
    }

    /** The streaming answer, rendered as markdown while it types. */
    function StreamingItem({ t, question, text }) {
      useMathReady()
      return h('div', { className: 'nb-msg is-ai is-streaming' },
        question !== undefined && question !== ''
          ? h('div', { className: 'nb-msg is-user' }, h('div', { className: 'nb-msg-user' }, question))
          : null,
        text.length === 0
          ? h('div', { className: 'nb-thinking' }, h(Spinner, { size: 15 }))
          : h('div', { className: 'nb-md' }, markdownNodes(text, 'stream', t)),
      )
    }

    // -----------------------------------------------------------------------
    // Composer
    // -----------------------------------------------------------------------

    /**
     * Recover one assistant message's text from the Chat snapshot.
     * Mirrors how the shipped chat resolves `closing.finalNode.messageId`.
     * Returns '' when the shape is not what we expect.
     */
    function extractAssistantText(snapshot, messageId) {
      try {
        const timeline = snapshot?.timeline
        const raw = timeline?.nodes ?? snapshot?.nodes
        const nodes = Array.isArray(raw) ? raw : Object.values(raw ?? {})
        for (const node of nodes) {
          const closing = node?.data?.closing
          if (closing === undefined || closing === null) continue
          if (closing.finalNode?.messageId !== messageId) continue
          const blocks = Array.isArray(closing.blocks) ? closing.blocks : []
          return blocks
            .filter((block) => block?.kind === 'text' && typeof block.text === 'string')
            .map((block) => block.text)
            .join('\n')
            .trim()
        }
      } catch {
        return ''
      }
      return ''
    }

    /** No-op stand-in so the hook order never depends on an optional prop. */
    const readNoSnapshot = (selector) => selector(undefined)

    /** Per-message action in the Host chat: file one answer into a study box. */
    function ChatSaveAction({ messageId, t, useChat }) {
      const [open, setOpen] = React.useState(false)
      const [boxes, setBoxes] = React.useState(undefined)
      const [state, setState] = React.useState('idle')
      const readText = React.useCallback((snapshot) => extractAssistantText(snapshot, messageId), [messageId])
      const useSnapshot = typeof useChat === 'function' ? useChat : readNoSnapshot
      const text = useSnapshot(readText)

      const toggle = async () => {
        const next = !open
        setOpen(next)
        if (!next || boxes !== undefined) return
        try {
          const result = await API.list()
          setBoxes(Array.isArray(result?.boxes) ? result.boxes : [])
        } catch {
          setBoxes([])
        }
      }

      const save = async (boxId) => {
        setState('saving')
        try {
          await API.addNote(boxId, {
            title: text.split('\n').find((line) => line.trim().length > 0)?.replace(/[#*`>]/gu, '').slice(0, 40) ?? t('notes.untitled'),
            body: text,
            tags: [],
            refs: [],
          })
          setState('saved')
          window.setTimeout(() => {
            setState('idle')
            setOpen(false)
          }, 1400)
        } catch {
          setState('error')
        }
      }

      return h('span', { className: 'nb-pop-wrap' },
        h('button', {
          type: 'button',
          className: 'nb-icon-btn',
          title: t('chat.saveNote'),
          'aria-label': t('chat.saveNote'),
          onClick: () => void toggle(),
        }, h(Icon, { path: ICONS.note, size: 14 })),
        open
          ? h(Popover, { t, align: 'right', onClose: () => setOpen(false) },
            h('div', { className: 'nb-import-menu' },
              h('p', { className: 'nb-pop-empty' }, t('chat.saveHint')),
              state === 'saved'
                ? h('p', { className: 'nb-pop-empty' }, t('notes.saved'))
                : state === 'error'
                  ? h('p', { className: 'nb-pop-empty' }, t('chat.saveFailed'))
                  : state === 'saving'
                    ? h('p', { className: 'nb-pop-empty' }, '…')
                    : text === ''
                      ? h('p', { className: 'nb-pop-empty' }, t('chat.noText'))
                      : boxes === undefined
                        ? h('p', { className: 'nb-pop-empty' }, '…')
                        : boxes.length === 0
                          ? h('p', { className: 'nb-pop-empty' }, t('chat.noBox'))
                          : boxes.map((box) => h('button', {
                            key: box.id,
                            type: 'button',
                            className: 'nb-pop-item',
                            onClick: () => void save(box.id),
                          }, h(Icon, { path: ICONS.book, size: 13 }), h('span', { className: 'nb-pop-label' }, box.name)))),
          )
          : null,
      )
    }


    /** Evenly spaced question ticks, tracking the real scroll container. */
    function MessageNav({ t, items, onJump }) {
      const railRef = React.useRef(null)
      const hoverTimer = React.useRef(0)
      useMathReady()
      React.useEffect(() => () => clearTimeout(hoverTimer.current), [])
      const [hover, setHover] = React.useState(undefined)
      const [current, setCurrent] = React.useState(0)
      const ids = items.map((item) => item.id).join('|')
      React.useLayoutEffect(() => {
        const rail = railRef.current
        const scroller = rail.closest('.nb-box-main')
        const transcript = scroller.querySelector('.nb-transcript')
        const composer = scroller.querySelector('.nb-composer')
        let offsets = [], scrollFrame = 0, measureFrame = 0
        const update = () => {
          scrollFrame = 0
          const readingTop = scroller.scrollTop + Math.min(100, scroller.clientHeight * .2)
          let low = 0, high = offsets.length - 1
          while (low < high) { const mid = Math.ceil((low + high) / 2); if (offsets[mid] <= readingTop) low = mid; else high = mid - 1 }
          setCurrent(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop < 8 ? items.length - 1 : low)
        }
        const measure = () => {
          measureFrame = 0
          const bounds = scroller.getBoundingClientRect()
          const composerTop = composer.getBoundingClientRect().top
          const available = Math.max(64, Math.min(bounds.bottom, composerTop) - bounds.top - 40)
          const step = Math.max(8, Math.min(20, (available - 8) / Math.max(1, items.length)))
          rail.style.setProperty('--nb-step', step + 'px')
          rail.style.right = Math.max(8, window.innerWidth - bounds.right + 10) + 'px'
          rail.style.top = bounds.top + 20 + available / 2 + 'px'
          rail.style.maxHeight = available + 'px'
          offsets = items.map((item) => {
            const node = document.getElementById('nb-msg-' + item.id)
            return node ? node.getBoundingClientRect().top - bounds.top + scroller.scrollTop : Infinity
          })
          update()
        }
        const schedule = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(update) }
        const scheduleMeasure = () => { if (!measureFrame) measureFrame = requestAnimationFrame(measure) }
        const observer = new ResizeObserver(scheduleMeasure)
        observer.observe(scroller); observer.observe(transcript); observer.observe(composer)
        scroller.addEventListener('scroll', schedule, { passive: true })
        window.addEventListener('resize', scheduleMeasure)
        measure()
        return () => {
          observer.disconnect(); scroller.removeEventListener('scroll', schedule)
          window.removeEventListener('resize', scheduleMeasure)
          cancelAnimationFrame(scrollFrame); cancelAnimationFrame(measureFrame)
        }
      }, [ids])
      return h(React.Fragment, null,
        h('nav', { ref: railRef, className: 'nb-nav', 'aria-label': t('nav.label'), onMouseEnter: () => clearTimeout(hoverTimer.current), onMouseLeave: () => { hoverTimer.current = setTimeout(() => setHover(undefined), 120) } },
          h('span', { className: 'nb-nav-indicator', style: { '--nb-index': current }, 'aria-hidden': true }),
          items.map((item, index) => h('span', { key: item.id, className: 'nb-nav-item' },
            h('button', { type: 'button', className: 'nb-nav-tick' + (index === current ? ' is-current' : ''),
              'aria-label': item.question, 'aria-current': index === current ? 'location' : undefined,
              onMouseEnter: (event) => { const rect = event.currentTarget.getBoundingClientRect(); setHover({ index, x: rect.left - 264, y: Math.min(window.innerHeight - 200, Math.max(8, rect.top - 80)) }) },
              onFocus: (event) => { const rect = event.currentTarget.getBoundingClientRect(); setHover({ index, x: rect.left - 264, y: Math.min(window.innerHeight - 200, Math.max(8, rect.top - 80)) }) },
              onBlur: () => setHover(undefined), onClick: () => onJump(item.id),
            }),
          )),
        ),
        hover && items[hover.index] ? h('div', { className: 'nb-nav-preview', role: 'tooltip', onMouseEnter: () => clearTimeout(hoverTimer.current), onMouseLeave: () => setHover(undefined), style: { position: 'fixed', left: Math.max(8, hover.x) + 'px', top: Math.min(hover.y, window.innerHeight - 260) + 'px', right: 'auto', transform: 'none' } },
          h('div', { className: 'nb-nav-preview-q' }, inlineNodes((hover.index + 1) + '. ' + items[hover.index].question, 'nav-question')),
          items[hover.index].answer ? h('div', { className: 'nb-nav-preview-a nb-md' }, markdownNodes(items[hover.index].answer, 'nav-answer', t)) : null,
        ) : null,
      )
    }

    /** One compact control: model and effort live behind two menu rows. */
    function ModelMenu({ t, models, model, efforts, effort, onChangeModel, onChangeEffort, disabled }) {
      const [open, setOpen] = React.useState(false)
      const [page, setPage] = React.useState('root')
      // Group the catalogue by service, so models coming from third-party APIs
      // a user wired into the host are distinguishable from the built-in one.
      const groups = (models?.providers ?? [])
        .map((provider) => ({
          id: provider.id,
          name: provider.name,
          entries: provider.models.map((entry) => ({ key: `${provider.id}\u0000${entry.id}`, provider: provider.id, id: entry.id, name: entry.name })),
        }))
        .filter((group) => group.entries.length > 0)
      const catalogue = groups.flatMap((group) => group.entries)
      const multiProvider = groups.length > 1
      const fallback = models?.current
      const isDefault = model === undefined
        || (fallback !== undefined && model.provider === fallback.provider && model.model === fallback.model)
      const current = isDefault
        ? catalogue.find((entry) => entry.provider === fallback?.provider && entry.id === fallback?.model)
        : catalogue.find((entry) => entry.provider === model.provider && entry.id === model.model)
      const effortList = Array.isArray(efforts) ? efforts : []
      const providerName = current === undefined
        ? ''
        : (groups.find((group) => group.entries.some((entry) => entry.key === current.key))?.name ?? '')
      const effortLabel = effort === undefined
        ? t('effort.default')
        : (effortList.find((entry) => entry.id === effort)?.name ?? effort)
      const close = () => {
        setOpen(false)
        setPage('root')
      }
      const modelRow = (entry) => h('button', {
        key: entry.key,
        type: 'button',
        className: `nb-menu-item${current !== undefined && current.key === entry.key ? ' is-active' : ''}`,
        onClick: () => {
          if (entry.provider === fallback?.provider && entry.id === fallback?.model) onChangeModel(undefined)
          else onChangeModel({ provider: entry.provider, model: entry.id })
          close()
        },
      }, h('span', { className: 'nb-pop-label' }, entry.name))

      return h('span', { className: 'nb-pop-wrap' },
        h('button', {
          type: 'button',
          className: 'nb-model-trigger is-field',
          disabled,
          title: current === undefined || providerName === '' ? undefined : `${providerName} · ${current.name}`,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          onClick: () => {
            setPage('root')
            setOpen((value) => !value)
          },
        },
          h('span', { className: 'nb-model-name' }, current === undefined ? t('model.unknown') : current.name),
          h('span', { className: 'nb-model-effort' }, effortLabel),
          h(Icon, { path: ICONS.chevron, size: 12 }),
        ),
        open
          ? h(Popover, { t, onClose: close },
            page === 'root'
              ? h('div', { className: 'nb-menu-card' },
                h('button', { type: 'button', className: 'nb-menu-row', onClick: () => setPage('model') },
                  h('span', { className: 'nb-menu-row-label' }, t('model.label')),
                  h('span', { className: 'nb-menu-row-value' }, current === undefined ? t('model.unknown') : current.name),
                  h(Icon, { path: ICONS.chevron, size: 12, className: 'nb-menu-chevron' }),
                ),
                h('button', { type: 'button', className: 'nb-menu-row', onClick: () => setPage('effort') },
                  h('span', { className: 'nb-menu-row-label' }, t('effort.label')),
                  h('span', { className: 'nb-menu-row-value' }, effortLabel),
                  h(Icon, { path: ICONS.chevron, size: 12, className: 'nb-menu-chevron' }),
                ),
              )
              : h('div', { className: 'nb-menu-list' },
                h('button', { type: 'button', className: 'nb-menu-back', onClick: () => setPage('root') },
                  '‹ ', page === 'model' ? t('model.label') : t('effort.label')),
                page === 'model'
                  ? multiProvider
                    ? groups.map((group) => h('div', { key: group.id, className: 'nb-menu-group' },
                      h('div', { className: 'nb-menu-group-label' }, group.name),
                      group.entries.map(modelRow),
                    ))
                    : catalogue.map(modelRow)
                  : [h('button', {
                    key: '__default',
                    type: 'button',
                    className: `nb-menu-item${effort === undefined ? ' is-active' : ''}`,
                    onClick: () => {
                      onChangeEffort(undefined)
                      close()
                    },
                  }, h('span', { className: 'nb-pop-label' }, t('effort.default')))].concat(
                    effortList.map((entry) => h('button', {
                      key: entry.id,
                      type: 'button',
                      className: `nb-menu-item${effort === entry.id ? ' is-active' : ''}`,
                      onClick: () => {
                        onChangeEffort(entry.id)
                        close()
                      },
                    }, h('span', { className: 'nb-pop-label' }, entry.name))),
                  ),
              ),
          )
          : null,
      )
    }

    /** Ask tab: transcript, streaming answer, and the grounded composer. */
    function AskPane(props) {
      const {
        t, messages, asking, streaming, onAsk, onStop, onHint, onExtend, extending,
        pendingSelection, onClearSelection, onSelectText, queued = 0, models, model, onModelChange,
        efforts, effort, onEffortChange, materials, onOpenMaterial, onAppend, notes, settings,
        attached = [], onDetach, onImportMaterial, savedNotes = [], onSaveNote, onMarkWrong, onNotify,
      } = props
      const [waiting, setWaiting] = React.useState(0)
      const [chatSelection, setChatSelection] = React.useState(undefined)
      const [question, setQuestion] = React.useState('')
      const [historyMode, setHistoryMode] = React.useState('auto')
      const [pickerOpen, setPickerOpen] = React.useState(false)
      const [pasteOpen, setPasteOpen] = React.useState(false)
      const [pasteName, setPasteName] = React.useState('')
      const [pasteText, setPasteText] = React.useState('')
      const [navOpen, setNavOpen] = React.useState(false)
      const [flashId, setFlashId] = React.useState(undefined)
      const scrollRef = React.useRef(null)
      const textRef = React.useRef(null)
      const flashTimer = React.useRef(0)
      const scrollAnimation = React.useRef(undefined)
      const followLatest = React.useRef(true)
      React.useEffect(() => {
        const scroller = scrollRef.current?.closest('.nb-box-main')
        if (!scroller) return undefined
        const track = () => { followLatest.current = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop < 48 }
        scroller.addEventListener('scroll', track, { passive: true })
        return () => { scroller.removeEventListener('scroll', track); scrollAnimation.current?.() }
      }, [])

      const lastLength = messages.length
      const followupCount = messages.reduce((total, message) => total + (Array.isArray(message.followups) ? message.followups.length : 0), 0)

      // The selection pill disappears as soon as it is not relevant.
      React.useEffect(() => {
        if (chatSelection === undefined) return undefined
        const dismiss = (event) => {
          if (event.target instanceof Element && event.target.closest('.nb-ask-selection') !== null) return
          setChatSelection(undefined)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') setChatSelection(undefined)
        }
        document.addEventListener('mousedown', dismiss)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('mousedown', dismiss)
          document.removeEventListener('keydown', onKey)
        }
      }, [chatSelection])
      // Live wait timer, like the host's thinking indicator.
      React.useEffect(() => {
        if (!asking) {
          setWaiting(0)
          return undefined
        }
        const started = Date.now()
        const timer = window.setInterval(() => {
          setWaiting(Math.max(1, Math.round((Date.now() - started) / 1000)))
        }, 1000)
        return () => window.clearInterval(timer)
      }, [asking])

      // Scroll the transcript, or the panel column when the reader moved the scroll there.
      const scrollToEnd = () => {
        if (!followLatest.current || scrollAnimation.current) return
        const node = scrollRef.current
        if (node === null) return
        const main = node.closest('.nb-box-main')
        const target = main !== null && main.scrollHeight > main.clientHeight + 4 ? main : node
        target.scrollTop = target.scrollHeight
      }

      React.useEffect(() => {
        scrollToEnd()
        window.requestAnimationFrame(scrollToEnd)
      }, [lastLength, followupCount, asking, streaming?.text])

      // Grow the composer with its content, up to the CSS max-height.
      React.useEffect(() => {
        const node = textRef.current
        if (node === null) return
        node.style.height = 'auto'
        node.style.height = `${Math.max(Math.min(node.scrollHeight, 240), 46)}px`
        node.style.overflowY = node.scrollHeight > 240 ? 'auto' : 'hidden'
      }, [question])

      const submit = () => {
        const text = question.trim()
        if (text.length === 0) return
        followLatest.current = true
        scrollAnimation.current?.()
        setQuestion('')
        window.requestAnimationFrame(scrollToEnd)
        onAsk(text, {
          selection: pendingSelection,
          includeHistory: historyMode === 'auto' ? undefined : historyMode === 'with',
          ...(model === undefined ? {} : { provider: model.provider, model: model.model }),
          ...(effort === undefined ? {} : { reasoningEffort: effort }),
          ...(attached.length === 0 ? {} : { attachments: attached.map((entry) => entry.id) }),
        })
        // A pinned passage is consumed by the send: it stops being pending.
        if (pendingSelection !== undefined) onClearSelection()
      }

      /** Jump to an earlier message and flash it briefly. */
      const jumpTo = (messageId) => {
        const node = document.getElementById(`nb-msg-${messageId}`)
        const scroller = scrollRef.current?.closest('.nb-box-main')
        scrollAnimation.current?.()
        followLatest.current = false
        if (node && scroller) {
          const start = scroller.scrollTop
          const target = Math.max(0, Math.min(scroller.scrollHeight - scroller.clientHeight, node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + start - 24))
          const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.min(520, 240 + Math.abs(target - start) * .08)
          let frame = 0
          const started = performance.now()
          const cancel = () => {
            cancelAnimationFrame(frame)
            scroller.removeEventListener('wheel', cancel)
            scroller.removeEventListener('touchstart', cancel)
            scroller.removeEventListener('pointerdown', cancel)
            window.removeEventListener('keydown', cancel)
            scrollAnimation.current = undefined
          }
          const animate = (now) => {
            const progress = duration ? Math.min(1, (now - started) / duration) : 1
            scroller.scrollTop = start + (target - start) * (1 - Math.pow(1 - progress, 3))
            if (progress < 1) frame = requestAnimationFrame(animate)
            else cancel()
          }
          scrollAnimation.current = cancel
          scroller.addEventListener('wheel', cancel, { passive: true })
          scroller.addEventListener('touchstart', cancel, { passive: true })
          scroller.addEventListener('pointerdown', cancel, { passive: true })
          window.addEventListener('keydown', cancel)
          frame = requestAnimationFrame(animate)
        }
        setFlashId(messageId)
        window.clearTimeout(flashTimer.current)
        flashTimer.current = window.setTimeout(() => setFlashId(undefined), 1500)
      }

      React.useEffect(() => () => window.clearTimeout(flashTimer.current), [])

      const asked = messages.filter((message) => message.role === 'user')
      const navigable = messages.length >= 6 && asked.length >= 3
      // Name the model that will actually be used when nothing is picked.
      const fallback = models?.current
      // 提示 works on whatever the user last asked, even with an empty composer.
      const hintText = question.trim().length > 0
        ? question.trim()
        : (asked.length > 0 ? asked[asked.length - 1].text : '')

      const effortList = Array.isArray(efforts) ? efforts : []

      return h('div', { className: 'nb-pane is-ask' },
        navigable
          ? h('div', { className: 'nb-nav-slot' },
            h(MessageNav, {
              t,
              items: asked.map((message) => ({
                id: message.id,
                question: message.text,
                answer: messages.find((entry) => entry.parentId === message.id)?.text ?? '',
              })),
              onJump: jumpTo,
            }),
          )
          : null,
        h('div', { className: 'nb-ask-row' },
        h('div', {
          className: 'nb-transcript',
          ref: scrollRef,
          onMouseUp: (event) => {
            if (typeof onSelectText !== 'function') return
            const selection = window.getSelection()
            if (selection === null || selection.isCollapsed) return
            const text = selection.toString().trim()
            if (text.length < 2) return
            const node = selection.getRangeAt(0).commonAncestorContainer
            const element = node.nodeType === 1 ? node : node.parentElement
            if (element === null || !scrollRef.current?.contains(element)) return
            const rect = selection.getRangeAt(0).getBoundingClientRect()
            setChatSelection({ text, x: Math.min(window.innerWidth - 210, Math.max(210, rect.left + rect.width / 2)), y: rect.top })
            event.stopPropagation()
          },
        },
          messages.length === 0 && streaming === undefined
            ? h('p', { className: 'nb-muted nb-pane-empty' }, t('empty.messages'))
            : messages.map((message) => h(MessageItem, {
              key: message.id,
              message,
              t,
              onExtend,
              onAsk,
              extending,
              onOpenMaterial,
              onSaveNote,
              onMarkWrong,
              onNotify,
              saved: Array.isArray(savedNotes) && savedNotes.includes(message.id),
              flash: message.id === flashId,
            })),
          streaming !== undefined
            ? h(StreamingItem, { t, question: streaming.question, text: streaming.text })
            : asking
              ? h('div', { className: 'nb-thinking' },
                h(Icon, { path: ICONS.send, size: 14 }),
                h('span', null, waiting > 0
                  ? t('think.waiting').replace('{s}', String(waiting))
                  : t('think.start')),
              )
              : null,
        ),
        ),
        chatSelection === undefined
          ? null
          : h('div', {
            className: 'nb-ask-selection',
            style: { left: chatSelection.x + 'px', top: Math.max(8, chatSelection.y - 44) + 'px' },
            onMouseDown: (event) => event.preventDefault(),
          }, h('button', { type: 'button', className: 'nb-btn', onClick: () => {
              onSelectText(chatSelection.text)
              setChatSelection(undefined)
              window.getSelection()?.removeAllRanges()
            } }, h(Icon, { path: ICONS.bulb, size: 13 }), h('span', null, t('selection.askPassage'))),
            onAppend && Array.isArray(notes) ? h(SelectionNoteAction, { t, text: chatSelection.text, notes, settings: settings ?? {}, onAppend, below: true }) : null,
          ),
        h('div', { className: 'nb-divider' }),
        h('div', { className: 'nb-composer' },
          queued > 0
            ? h('div', { className: 'nb-queued-row' }, h('span', { className: 'nb-queued' }, t('queue.count').replace('{n}', String(queued))))
            : null,
          pendingSelection !== undefined
            ? h('div', { className: 'nb-pending', title: t('pending.hint') },
              h('span', { className: 'nb-pending-tag' },
                h(Icon, { path: ICONS.send, size: 11 }),
                h('span', null, t('pending.tag')),
              ),
              h('span', { className: 'nb-pending-source' }, pendingSelection.materialName ?? t('selection.chat')),
              h('span', { className: 'nb-pending-text' }, pendingSelection.text.slice(0, 160)),
              h('button', {
                type: 'button',
                className: 'nb-pending-close',
                'aria-label': t('hint.clearSelection'),
                title: t('hint.clearSelection'),
                onClick: onClearSelection,
              }, h(Icon, { path: ICONS.close, size: 12 })),
            )
            : null,
          attached.length > 0
            ? h('div', { className: 'nb-attach-row' }, attached.map((entry) => h('span', { key: entry.id, className: 'nb-attach-chip' },
              h('button', { type: 'button', className: 'nb-file-link', onClick: () => onOpenMaterial(entry.id, entry.name) }, entry.name),
              h('button', {
                type: 'button',
                className: 'nb-attach-remove',
                'aria-label': t('action.detach'),
                onClick: () => onDetach(entry.id),
              }, h(Icon, { path: ICONS.close, size: 11 })),
            )))
            : null,
          h('textarea', {
            ref: textRef,
            className: 'nb-textarea is-question',
            rows: 1,
            value: question,
            placeholder: pendingSelection === undefined ? t('field.question') : t('field.questionPending'),
            disabled: asking,
            onChange: (event) => setQuestion(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter' && !event.shiftKey && event.nativeEvent.isComposing !== true) {
                event.preventDefault()
                submit()
              }
            },
          }),
          h('div', { className: 'nb-composer-row' },
            h('span', { className: 'nb-pop-wrap' },
              h('button', {
                type: 'button',
                className: 'nb-icon-btn',
                title: t('action.attach'),
                'aria-label': t('action.attach'),
                disabled: asking,
                onClick: () => setPickerOpen((open) => !open),
              }, h(Icon, { path: ICONS.attach, size: 15 })),
              pickerOpen
                ? h(Popover, { t, onClose: () => setPickerOpen(false) },
                  pasteOpen
                    ? h('div', { className: 'nb-import-form' },
                      h('input', {
                        className: 'nb-input',
                        placeholder: t('field.pasteName'),
                        value: pasteName,
                        onChange: (event) => setPasteName(event.target.value),
                      }),
                      h('textarea', {
                        className: 'nb-textarea',
                        rows: 4,
                        placeholder: t('field.pasteText'),
                        value: pasteText,
                        onChange: (event) => setPasteText(event.target.value),
                      }),
                      h('div', { className: 'nb-create-actions' },
                        h('button', {
                          type: 'button',
                          className: 'nb-btn is-primary',
                          disabled: pasteText.trim().length === 0,
                          onClick: () => {
                            onImportMaterial('paste', { name: pasteName, text: pasteText })
                            setPasteName('')
                            setPasteText('')
                            setPasteOpen(false)
                            setPickerOpen(false)
                          },
                        }, t('action.add')),
                        h('button', { type: 'button', className: 'nb-btn', onClick: () => setPasteOpen(false) }, t('action.cancel')),
                      ),
                    )
                    : h('div', { className: 'nb-import-menu' },
                      h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setPickerOpen(false); onImportMaterial('file') } },
                        h(Icon, { path: ICONS.file, size: 13 }), h('span', { className: 'nb-pop-label' }, t('action.importFile'))),
                      h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setPickerOpen(false); onImportMaterial('folder') } },
                        h(Icon, { path: ICONS.folder, size: 13 }), h('span', { className: 'nb-pop-label' }, t('action.importFolder'))),
                      h('button', { type: 'button', className: 'nb-pop-item', onClick: () => setPasteOpen(true) },
                        h(Icon, { path: ICONS.note, size: 13 }), h('span', { className: 'nb-pop-label' }, t('action.paste'))),
                    ))
                : null,
            ),
            models !== undefined && models.providers.length > 0
              ? h(ModelMenu, {
                t,
                models,
                model,
                efforts: effortList,
                effort,
                disabled: asking,
                onChangeModel: onModelChange,
                onChangeEffort: onEffortChange,
              })
              : null,
            h(Select, {
              t,
              label: t('history.label'),
              testId: 'history',
              disabled: asking,
              value: historyMode,
              options: [
                { value: 'auto', label: t('history.auto') },
                { value: 'with', label: t('history.with') },
                { value: 'without', label: t('history.without') },
              ],
              onChange: setHistoryMode,
            }),
            h('button', {
              type: 'button',
              className: 'nb-btn',
              disabled: asking || hintText.length === 0,
              title: t('action.hint'),
              onClick: () => onHint(hintText, model),
            }, h(Icon, { path: ICONS.bulb, size: 13 }), h('span', null, t('action.hint'))),
            asking
              ? h('button', { type: 'button', className: 'nb-btn', onClick: onStop }, t('action.stop'))
              : h('button', {
                type: 'button',
                className: 'nb-btn is-primary',
                disabled: question.trim().length === 0,
                onClick: submit,
              }, h(Icon, { path: ICONS.send, size: 13 }), h('span', null, t('action.send'))),
          ),
        ),
      )
    }

    // -----------------------------------------------------------------------
    // Box
    // -----------------------------------------------------------------------

    /** Push a generated Markdown file to the browser's download flow. */
    function downloadMarkdown(filename, text) {
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    }

    /** Notes tab: section-grouped list plus a Markdown editor with preview. */
    function NotesPane({ t, notes, busy, onCreate, onSave, onRemove, onRemoveMany, onSummarize, onDailySummary, focusNoteId, onExport, models, model, efforts, effort, onModelChange, onEffortChange }) {
      const [activeId, setActiveId] = React.useState(notes.length > 0 ? notes[0].id : undefined)
      const [menu, setMenu] = React.useState(undefined)
      const [selecting, setSelecting] = React.useState(false)
      const [picked, setPicked] = React.useState([])
      const [confirmNote, setConfirmNote] = React.useState(undefined)
      const [deleting, setDeleting] = React.useState(false)
      const [toast, setToast] = React.useState('')
      React.useEffect(() => {
        if (menu === undefined) return undefined
        const dismiss = (event) => {
          const target = event.target
          if (target instanceof Element && target.closest('.nb-context-menu') !== null) return
          setMenu(undefined)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') setMenu(undefined)
        }
        document.addEventListener('mousedown', dismiss, true)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('mousedown', dismiss, true)
          document.removeEventListener('keydown', onKey)
        }
      }, [menu])
      const exportNote = (note) => {
        const lines = ['# ' + note.title, '', '分区：' + note.section]
        if (Array.isArray(note.tags) && note.tags.length > 0) lines.push('标签：' + note.tags.map((tag) => '#' + tag).join(' '))
        lines.push('', note.body ?? '')
        const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = (note.title || 'note').replace(/[\\\\/:*?"<>|]/g, '_') + '.md'
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      const active = notes.find((note) => note.id === activeId)
      const [draft, setDraft] = React.useState(() => (active === undefined
        ? undefined
        : {
          title: active.title,
          section: active.section,
          tags: Array.isArray(active.tags) ? active.tags.join(' ') : '',
          body: active.body,
        }))
      const [preview, setPreview] = React.useState(true)
      const [digest, setDigest] = React.useState(undefined)
      const [exportOpen, setExportOpen] = React.useState(false)
      const previousNotes = React.useRef(notes)
      React.useEffect(() => {
        if (activeId !== undefined && !notes.some((note) => note.id === activeId)) {
          const position = previousNotes.current.findIndex((note) => note.id === activeId)
          const remaining = new Set(notes.map((note) => note.id))
          const next = previousNotes.current.slice(position + 1).find((note) => remaining.has(note.id))
            ?? previousNotes.current.slice(0, position).reverse().find((note) => remaining.has(note.id))
            ?? notes[0]
          setActiveId(next?.id)
        }
        setPicked((current) => current.filter((id) => notes.some((note) => note.id === id)))
        previousNotes.current = notes
      }, [notes, activeId])
      React.useEffect(() => { setDigest(undefined) }, [activeId])

      React.useEffect(() => {
        if (active === undefined) {
          setDraft(undefined)
          return
        }
        setDraft({
          title: active.title,
          section: active.section,
          tags: Array.isArray(active.tags) ? active.tags.join(' ') : '',
          body: active.body,
        })
      }, [activeId, active?.updatedAt])

      // Only an explicit request moves the selection: creating a note focuses
      // the NEW one instead of jumping back to the first entry.
      React.useEffect(() => {
        if (focusNoteId !== undefined && focusNoteId !== activeId && notes.some((note) => note.id === focusNoteId)) {
          setActiveId(focusNoteId)
        }
      }, [focusNoteId])

      /** Ask the Host to digest the current draft into a structured summary. */
      const runSummary = async () => {
        if (draft === undefined || draft.body.trim().length === 0) return
        setDigest({ loading: true, text: '' })
        try {
          const result = await onSummarize(draft.body)
          setDigest({ loading: false, text: result.markdown === 'NO_KNOWLEDGE' ? '没有可整理的学习知识点。' : (result.markdown ?? '') })
        } catch (cause) {
          setDigest({ loading: false, text: '', error: cause instanceof Error ? cause.message : String(cause) })
        }
      }

      const dirty = draft !== undefined && active !== undefined
        && (draft.title !== active.title
          || draft.section !== active.section
          || draft.body !== active.body
          || draft.tags !== (Array.isArray(active.tags) ? active.tags.join(' ') : ''))

      return h('div', { className: 'nb-pane is-notes' },
        toast === '' ? null : h('div', { className: 'nb-toast', role: 'status' }, toast),
        h('div', { className: 'nb-notes-layout' },
          h('div', { className: 'nb-notes-list' },
            h('div', { className: 'nb-notes-head' },
              h('div', { className: 'nb-notes-title-row' },
                h('span', { className: 'nb-notes-title' }, t('notes.heading') + ' · ' + notes.length),
                h('button', {
                  type: 'button',
                  className: 'nb-icon-btn is-multi' + (selecting ? ' is-active' : ''),
                  title: t('action.multiSelect'),
                  'aria-label': t('action.multiSelect'),
                  'aria-pressed': selecting,
                  onClick: () => { setSelecting((on) => !on); setPicked([]) },
                }, h(Icon, { path: selecting ? ICONS.checkSquare : ICONS.square, size: 20 })),
              ),
              h('div', { className: 'nb-notes-head-actions' },
                models === undefined
                  ? null
                  : h(ModelMenu, {
                    t,
                    models,
                    model,
                    efforts,
                    effort,
                    disabled: busy,
                    onChangeModel: (next) => onModelChange(next),
                    onChangeEffort: (next) => onEffortChange(next),
                  }),
                h('button', { type: 'button', className: 'nb-btn', disabled: busy, onClick: () => void onDailySummary() }, t('notes.daily')),
                h('button', { type: 'button', className: 'nb-btn', disabled: busy, onClick: onCreate }, t('notes.new')),
                selecting && picked.length > 0
                  ? h('button', {
                    type: 'button',
                    className: 'nb-btn',
                    disabled: busy,
                    onClick: () => {
                      const chosen = notes.filter((note) => picked.includes(note.id))
                      const text = chosen.map((note) => {
                        const head = ['# ' + note.title, '', '分区：' + note.section]
                        if (Array.isArray(note.tags) && note.tags.length > 0) head.push('标签：' + note.tags.map((tag) => '#' + tag).join(' '))
                        head.push('', note.body ?? '')
                        return head.join('\n')
                      }).join('\n\n---\n\n')
                      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = '笔记导出-' + chosen.length + '篇.md'
                      link.click()
                      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
                    },
                  }, h(Icon, { path: ICONS.note, size: 14 }), h('span', null, t('export.label') + ' ' + picked.length))
                  : null,
                picked.length === 0
                  ? null
                  : h('button', {
                    type: 'button',
                    className: 'nb-btn is-danger',
                    disabled: busy,
                    onClick: () => {
                      const ids = picked.slice()
                      setConfirmNote({ ids, title: '' })
                    },
                  }, h(Icon, { path: ICONS.trash, size: 14 }), h('span', null, `${t('action.delete')} ${picked.length}`)),
                selecting && picked.length > 0 ? null : h('span', { className: 'nb-pop-wrap' },
                  h('button', {
                    type: 'button', className: 'nb-btn', disabled: active === undefined || busy || dirty,
                    title: dirty ? '请先保存修改再导出' : '导出当前选中的笔记',
                    onClick: () => onExport('note', active.id),
                  }, t('export.label')),
                  h('button', {
                    type: 'button',
                    className: 'nb-btn',
                    'aria-expanded': exportOpen,
                    onClick: () => setExportOpen((open) => !open),
                  }, t('export.batch')),
                  exportOpen
                    ? h(ModalBackdrop, { className: 'nb-modal-backdrop', onMouseDown: (event) => { if (event.target === event.currentTarget) setExportOpen(false) } },
                      h('div', { className: 'nb-modal nb-export-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('export.batch') },
                        h(ModalHead, { t, title: t('export.batch'), onClose: () => setExportOpen(false) }),
                        h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setExportOpen(false); onExport('notes') } }, t('export.notes')),
                        h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setExportOpen(false); onExport('practice') } }, t('export.practice')),
                        h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setExportOpen(false); onExport('wrong') } }, t('export.wrong')),
                        h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setExportOpen(false); onExport('qa') } }, t('export.qa')),
                        h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setExportOpen(false); onExport('extend') } }, t('export.extend')),
                        h('button', { type: 'button', className: 'nb-pop-item', onClick: () => { setExportOpen(false); onExport('all') } }, t('export.all')),
                      ))
                    : null,
                ),
              ),
            ),
            notes.length === 0
              ? h('p', { className: 'nb-muted nb-pane-empty' }, t('notes.empty'))
              : notes.map((note) => h('button', {
                key: note.id,
                type: 'button',
                className: `nb-note-row${note.id === activeId && !selecting ? ' is-active' : ''}${picked.includes(note.id) ? ' is-picked' : ''}`,
                onClick: () => {
                  if (!selecting) { setActiveId(note.id === activeId ? undefined : note.id); return }
                  setPicked((current) => (current.includes(note.id) ? current.filter((id) => id !== note.id) : [...current, note.id]))
                },
                onContextMenu: (event) => {
                  event.preventDefault()
                  setMenu({
                    id: note.id,
                    x: Math.min(event.clientX, window.innerWidth - 190),
                    y: Math.min(event.clientY, window.innerHeight - 90),
                  })
                },
              },
                h('span', { className: 'nb-note-body' },
                  h('span', { className: 'nb-note-title' }, note.title),
                  h('span', { className: 'nb-note-meta' }, note.section + (Array.isArray(note.tags) && note.tags.length > 0 ? ' · ' + note.tags.map((tag) => '#' + tag).join(' ') : ''))),
              )),
            confirmNote === undefined
              ? null
              : h(ConfirmModal, {
                t,
                title: t('notes.remove'),
                busy: deleting,
                onCancel: () => setConfirmNote(undefined),
                onConfirm: async () => {
                  const target = confirmNote
                  setDeleting(true)
                  try {
                    const removed = Array.isArray(target.ids) ? await onRemoveMany(target.ids) : await onRemove(target.id)
                    if (removed === false) return
                    setConfirmNote(undefined)
                    setPicked([])
                    setSelecting(false)
                    if (!Array.isArray(target.ids)) {
                      setToast(t('notes.removed'))
                      window.setTimeout(() => setToast(''), 2000)
                    }
                  } finally { setDeleting(false) }
                },
                body: Array.isArray(confirmNote.ids) && confirmNote.ids.length > 1
                  ? '确定要删除所选 ' + confirmNote.ids.length + ' 篇笔记吗？删除后无法恢复。'
                  : h(React.Fragment, null, '确定要删除 ', h('span', { className: 'nb-name-chip' }, confirmNote.title || (notes.find((entry) => entry.id === (confirmNote.ids ?? [])[0]) ?? {}).title || ''), ' 吗？删除后无法恢复。'),
              }),
              menu === undefined
              ? null
              : h('div', {
                className: 'nb-context-menu',
                role: 'menu',
                style: { left: menu.x + 'px', top: menu.y + 'px' },
              },
                h('button', {
                  type: 'button',
                  role: 'menuitem',
                  className: 'nb-pop-item',
                  onClick: () => {
                    const note = notes.find((entry) => entry.id === menu.id)
                    setMenu(undefined)
                    if (note !== undefined) exportNote(note)
                  },
                }, t('notes.exportOne')),
                h('button', {
                  type: 'button',
                  role: 'menuitem',
                  className: 'nb-pop-item',
                  onClick: () => {
                    const note = notes.find((entry) => entry.id === menu.id)
                    setMenu(undefined)
                    if (selecting && picked.includes(menu.id) && picked.length > 1) {
                      const ids = picked.slice()
                      setConfirmNote({ ids, title: '' })
                      return
                    }
                    setConfirmNote({ id: menu.id, title: note === undefined ? '' : note.title })
                  },
                }, t('notes.remove')),
          ),
          ),
          h('div', { className: 'nb-notes-editor' },
            draft === undefined
              ? h('p', { className: 'nb-muted nb-pane-empty' }, t('notes.pick'))
              : h(React.Fragment, null,
                h('div', { className: 'nb-notes-topbar' },
                  h('button', { type: 'button', className: 'nb-btn', onClick: () => setPreview((value) => !value) },
                    preview ? t('notes.edit') : t('notes.preview')),
                  h('button', {
                    type: 'button',
                    className: 'nb-btn',
                    disabled: busy,
                    onClick: () => setConfirmNote({ id: active.id, title: active.title }),
                  }, t('action.delete')),
                ),
                h('input', {
                  className: 'nb-input',
                  value: draft.title,
                  placeholder: t('notes.title'),
                  onChange: (event) => setDraft({ ...draft, title: event.target.value }),
                }),
                h('div', { className: 'nb-notes-meta-row' },
                  h(Select, {
                    t,
                    label: t('notes.sectionPreset'),
                    tone: 'field',
                    value: sectionPresets(t).some((entry) => entry.value === draft.section) ? draft.section : SECTION_CUSTOM,
                    options: sectionPresets(t),
                    onChange: (next) => {
                      if (next !== SECTION_CUSTOM) setDraft({ ...draft, section: next })
                    },
                  }),
                  h('input', {
                    className: 'nb-input',
                    value: draft.section,
                    placeholder: t('notes.section'),
                    onChange: (event) => setDraft({ ...draft, section: event.target.value }),
                  }),
                  h('input', {
                    className: 'nb-input',
                    value: draft.tags,
                    placeholder: t('notes.tags'),
                    onChange: (event) => setDraft({ ...draft, tags: event.target.value }),
                  }),
                ),
                h('div', {
                  className: `nb-note-split${preview ? ' is-preview' : ''}`,
                },
                  preview
                    ? h('div', { className: 'nb-notes-preview nb-md' }, markdownNodes(draft.body, `note-${activeId}`, t))
                    : h('textarea', {
                      className: 'nb-textarea nb-notes-body',
                      rows: 12,
                      value: draft.body,
                      placeholder: t('notes.body'),
                      onChange: (event) => setDraft({ ...draft, body: event.target.value }),
                    }),
                ),
                h('div', { className: 'nb-notes-actions' },
                  h('button', {
                    type: 'button',
                    className: 'nb-btn',
                    disabled: busy || draft.body.trim().length === 0,
                    onClick: () => void runSummary(),
                  }, t('notes.summarize')),
                  h('button', {
                    type: 'button',
                    className: 'nb-btn is-primary',
                    disabled: busy || !dirty,
                    onClick: () => onSave(active.id, {
                      title: draft.title,
                      section: draft.section,
                      tags: draft.tags.split(/[\s,，]+/u).filter((tag) => tag.length > 0),
                      body: draft.body,
                    }),
                  }, dirty ? t('action.save') : t('notes.saved')),
                ),
                digest === undefined
                  ? null
                  : h('div', { className: 'nb-digest' },
                    h('div', { className: 'nb-digest-head' },
                      h('span', null, t('notes.digest')),
                      h('button', {
                        type: 'button',
                        className: 'nb-icon-btn',
                        'aria-label': t('action.close'),
                        onClick: () => setDigest(undefined),
                      }, h(Icon, { path: ICONS.close, size: 12 })),
                    ),
                    digest.loading === true
                      ? h('div', { className: 'nb-thinking' }, h(Spinner, { size: 15 }))
                      : digest.error !== undefined
                        ? h('p', { className: 'nb-muted' }, digest.error)
                        : h('div', { className: 'nb-digest-body nb-md' }, markdownNodes(digest.text, 'digest', t)),
                    digest.loading === true || digest.text === ''
                      ? null
                      : h('div', { className: 'nb-digest-actions' },
                        h('button', {
                          type: 'button',
                          className: 'nb-btn',
                          onClick: () => {
                            setDraft({ ...draft, body: `${draft.body.trimEnd()}\n\n${digest.text}` })
                            setDigest(undefined)
                          },
                        }, t('notes.insert')),
                        h('button', {
                          type: 'button',
                          className: 'nb-btn is-primary',
                          onClick: () => {
                            setDraft({ ...draft, body: digest.text })
                            setDigest(undefined)
                          },
                        }, t('notes.replace')),
                      ),
                  ),
              ),
          ),
        ),
      )
    }

/** Open-answer input with a code / plain-markdown switch. */
function AnswerInput({ t, value, onChange, placeholder, rows = 4 }) {
  const [mode, setMode] = React.useState('code')
  return h('div', { className: 'nb-answer-input' },
    h('div', { className: 'nb-mode-switch', role: 'group', 'aria-label': t('practice.inputMode') },
      h('button', {
        type: 'button',
        className: 'nb-mode-btn' + (mode === 'code' ? ' is-active' : ''),
        onClick: () => setMode('code'),
      }, t('practice.modeCode')),
      h('button', {
        type: 'button',
        className: 'nb-mode-btn' + (mode === 'text' ? ' is-active' : ''),
        onClick: () => setMode('text'),
      }, t('practice.modeText')),
    ),
    mode === 'code'
      ? h(CodeInput, { value, onChange, placeholder, rows })
      : h('textarea', {
        className: 'nb-textarea is-markdown',
        rows,
        value,
        placeholder,
        onChange: (event) => onChange(event.target.value),
      }),
  )
}

    /**
     * Code editor for open answers: a highlighted mirror behind a transparent
     * textarea, with Tab inserting four spaces on the current line(s).
     */
    function CodeInput({ value, onChange, placeholder, rows }) {
      const areaRef = React.useRef(null)
      const mirrorRef = React.useRef(null)
      const indent = '    '

      const syncScroll = () => {
        const area = areaRef.current
        const mirror = mirrorRef.current
        if (area === null || mirror === null) return
        mirror.scrollTop = area.scrollTop
        mirror.scrollLeft = area.scrollLeft
      }

      const onKeyDown = (event) => {
        if (event.key !== 'Tab' || event.shiftKey || event.ctrlKey || event.altKey) return
        event.preventDefault()
        const area = event.currentTarget
        const start = area.selectionStart
        const end = area.selectionEnd
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const spansLines = value.slice(start, end).includes('\n')
        let next
        let caret
        if (spansLines || start === lineStart) {
          // Indent the whole current block so pasted code keeps its shape.
          const lineEnd = value.indexOf('\n', spansLines ? end : start)
          const stop = lineEnd === -1 ? value.length : lineEnd
          const block = value.slice(lineStart, stop)
          const indented = block.split('\n').map((line) => `${indent}${line}`).join('\n')
          next = `${value.slice(0, lineStart)}${indented}${value.slice(stop)}`
          caret = start + indent.length
        } else {
          next = `${value.slice(0, start)}${indent}${value.slice(end)}`
          caret = start + indent.length
        }
        onChange(next)
        window.requestAnimationFrame(() => {
          const node = areaRef.current
          if (node === null) return
          node.selectionStart = caret
          node.selectionEnd = caret
        })
      }

      return h('div', { className: 'nb-code-edit' },
        h('pre', { ref: mirrorRef, className: 'nb-code-mirror', 'aria-hidden': true },
          h('code', null, highlightCode(value, 'py')),
          value === '' ? h('span', { className: 'nb-code-ph' }, placeholder ?? '') : null),
        h('textarea', {
          ref: areaRef,
          className: 'nb-code-area',
          rows: rows ?? 6,
          value,
          spellCheck: false,
          'aria-label': placeholder ?? 'answer',
          onKeyDown,
          onScroll: syncScroll,
          onChange: (event) => onChange(event.target.value),
        }),
      )
    }

    /** "B" for option index 1, matching the letters shown on the cards. */
    const optionKey = (index) => String.fromCharCode(65 + index)

    /** "B. option text" for one option, tolerant of missing options. */
    const optionText = (question, index) => {
      const options = Array.isArray(question?.options) ? question.options : []
      const value = typeof options[index] === 'string' ? options[index].trim() : ''
      return value === '' ? optionKey(index) : `${optionKey(index)}. ${value}`
    }

    /**
     * One-line preview of a question stem. Formulas collapse to a marker: an
     * excerpt that starts mid-TeX reads like noise in a picker row, and
     * rendering maths there would also blow the row height up.
     */
    const stemPreview = (stem, limit = 60) => {
      const text = String(stem ?? '')
        .replace(/\$\$[\s\S]*?\$\$/gu, '〔式〕')
        .replace(/\\\[[\s\S]*?\\\]/gu, '〔式〕')
        .replace(/\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/gu, '〔式〕')
        .replace(/\\\([\s\S]*?\\\)/gu, '〔式〕')
        .replace(/\$[^$\n]*\$/gu, '〔式〕')
        .replace(/```[a-zA-Z0-9]*/gu, ' ')
        .replace(/`[^`\n]*`/gu, ' ')
        .replace(/[ \t\u3000]+/gu, ' ')
        .replace(/\s*\n\s*/gu, ' ')
        .trim()
      return text.length > limit ? `${text.slice(0, limit)}…` : text
    }

    /**
     * 用户手打的 `*` 是乘号：先换成 ×，避免被 Markdown 当成强调吞掉
     * （奇数个星号时整段符号都会凭空消失）。
     */
    const answerPlain = (text) => String(text ?? '')
      .replace(/(\w)\s*\*\s*(\w)/gu, '$1×$2')

    /** 老版本错题可能把整段判题 JSON 存进了答案字段，渲染前剥掉。 */
    /**
     * 老版本可能把整段判题 JSON 存进解析字段。渲染前还原成可读文本：
     * 前置正文保留，JSON 里的 explanation / issues 抠出来拼接。
     */
    const cleanVerdictNoise = (text) => {
      const raw = String(text ?? '')
      const at = raw.indexOf('{"correct":')
      if (at < 0) return raw.trim()
      const head = raw.slice(0, at).trim()
      const tail = raw.slice(at)
      const unescape = (value) => value
        .replace(/\\\\/gu, '\u0000')
        .replace(/\\n/gu, '\n')
        .replace(/\\"/gu, '"')
        .replace(/\u0000/gu, '\\')
        .trim()
      const note = /"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"\s*[},]/u.exec(tail)
      const explanation = note === null ? '' : unescape(note[1])
      const issues = []
      const issuePattern = /\{"where"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"what"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/gu
      let match
      while ((match = issuePattern.exec(tail)) !== null) {
        const where = unescape(match[1])
        const what = unescape(match[2])
        if (where !== '' || what !== '') issues.push(where === '' ? what : `${where}：${what}`)
      }
      const parts = []
      if (head !== '') parts.push(head)
      if (explanation !== '') parts.push(explanation)
      if (issues.length > 0) parts.push(issues.join('\n\n'))
      return parts.length === 0 ? raw.trim() : parts.join('\n\n')
    }

    /** Render picked practice questions as one Markdown note body. */
    const questionNoteBody = (questions) => {
      const lines = []
      questions.forEach((question, index) => {
        lines.push(`## ${index + 1}. ${question.stem}`, '')
        if (question.type === 'choice') {
          question.options.forEach((option, optionIndex) => {
            lines.push(`- ${optionText(question, optionIndex)}`)
          })
          lines.push('', `**答案：** ${optionText(question, question.answerIndex)}`)
        } else {
          lines.push('**参考答案：**', '', question.referenceAnswer === undefined || question.referenceAnswer === '' ? '（无）' : question.referenceAnswer)
          if (Array.isArray(question.rubric) && question.rubric.length > 0) {
            lines.push('', '**评分要点：**')
            question.rubric.forEach((item, itemIndex) => lines.push(`${itemIndex + 1}. ${item}`))
          }
        }
        if (question.explanation !== undefined && question.explanation !== '') lines.push('', `**解析：** ${question.explanation}`)
        lines.push('')
      })
      return lines.join('\n').trim()
    }

    /** Practice tab: generate a quiz, answer it, and review the wrong book. */
    function PracticePane({ t, practice, wrong, materials = [], models, model, efforts, effort, onModelChange, onEffortChange, onAskSelection, busy, generating, onGenerate, onAnswer, onHint, onToggleWrong, onRemoveWrong, onRegrade, onImportNotes, onResume, defaults }) {
      const [count, setCount] = React.useState('3')
      const [kind, setKind] = React.useState(typeof defaults?.defaultQuestionKind === 'string' ? defaults.defaultQuestionKind : 'mixed')
      const [difficulty, setDifficulty] = React.useState(typeof defaults?.defaultDifficulty === 'string' ? defaults.defaultDifficulty : 'medium')
      const [topic, setTopic] = React.useState('')
      const [scopeId, setScopeId] = React.useState('')
      const [useWeb, setUseWeb] = React.useState(defaults?.defaultUseWeb === true)
      const [drafts, setDrafts] = React.useState({})
      const [revealed, setRevealed] = React.useState({})
      const quizRef = React.useRef(null)
      const [askSelection, setAskSelection] = React.useState(undefined)

      // Floating "pin to send" chip, same gesture as selecting text in the chat.
      React.useEffect(() => {
        if (askSelection === undefined) return undefined
        const dismiss = (event) => {
          if (event.target instanceof Element && event.target.closest('.nb-ask-selection') !== null) return
          setAskSelection(undefined)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') setAskSelection(undefined)
        }
        document.addEventListener('mousedown', dismiss)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('mousedown', dismiss)
          document.removeEventListener('keydown', onKey)
        }
      }, [askSelection])

      /** Remember a selection inside the question list so it can be pinned. */
      const readQuizSelection = () => {
        if (typeof onAskSelection !== 'function') return
        const selection = window.getSelection()
        if (selection === null || selection.isCollapsed) return
        const text = selection.toString().trim()
        if (text.length < 2) return
        const node = selection.getRangeAt(0).commonAncestorContainer
        const element = node.nodeType === 1 ? node : node.parentElement
        if (element === null || !quizRef.current?.contains(element)) return
        const rect = selection.getRangeAt(0).getBoundingClientRect()
        setAskSelection({ text, x: Math.min(window.innerWidth - 210, Math.max(210, rect.left + rect.width / 2)), y: rect.top })
      }
      const [redo, setRedo] = React.useState(undefined)
      const [redoResult, setRedoResult] = React.useState(undefined)
      const [working, setWorking] = React.useState(undefined)
      const [importOpen, setImportOpen] = React.useState(false)
      const [importPicked, setImportPicked] = React.useState([])
      // One in-flight submission at a time: the same question cannot be sent twice.
      const [submitting, setSubmitting] = React.useState(undefined)
      const responses = practice?.responses ?? {}
      const plan = practice?.plan
      const doneCount = practice?.questions?.length ?? 0
      const totalCount = typeof plan?.count === 'number' ? plan.count : 0
      const canResume = plan !== undefined && practice?.done !== true

      /** Send one answer; a question accepts a single in-flight submission. */
      const submitAnswer = async (question, choice, text) => {
        if (submitting !== undefined) return
        setSubmitting(question.id)
        try {
          await onAnswer(question.id, choice, text)
        } finally {
          setSubmitting(undefined)
        }
      }

      const submitOpen = (question) => {
        const text = (drafts[question.id] ?? '').trim()
        if (text.length === 0) return
        void submitAnswer(question, undefined, text)
      }

      /** Verdict, error list and explanation for one graded answer. */
      const renderResult = (result, prefix, wrongLabel, fallback) => {
        const explanation = cleanVerdictNoise(result.explanation === undefined || result.explanation === '' ? (fallback ?? '') : result.explanation)
        return h(React.Fragment, null,
          h('p', { className: `nb-answer-verdict${result.correct ? ' is-ok' : ' is-bad'}` },
            result.correct ? t('practice.correct') : wrongLabel),
          Array.isArray(result.issues) && result.issues.length > 0
            ? h('ul', { className: 'nb-issues' }, result.issues.map((issue, index) => h('li', { key: index },
              issue.where === '' ? null : h('strong', null, `${issue.where}：`),
              inlineNodes(issue.what, `${prefix}-issue-${index}`),
            )))
            : null,
          explanation === ''
            ? null
            : h('div', { className: 'nb-md is-small' }, markdownNodes(explanation, prefix, t)),
        )
      }

      /**
       * Reference answer and rubric, offered only after the student submits —
       * before that they would simply read the answer instead of trying.
       */
      const renderReference = (question) => {
        const hasAnswer = typeof question.referenceAnswer === 'string' && question.referenceAnswer.trim() !== ''
        const hasRubric = Array.isArray(question.rubric) && question.rubric.length > 0
        if (!hasAnswer && !hasRubric) return null
        const show = revealed[question.id] === true
        return h('div', { className: 'nb-peek' },
          h('button', {
            type: 'button',
            className: `nb-chip${show ? ' is-on' : ''}`,
            'aria-expanded': show,
            onClick: () => setRevealed((current) => ({ ...current, [question.id]: current[question.id] !== true })),
          }, h(Icon, { path: ICONS.eye, size: 13 }), h('span', null, t('practice.reveal'))),
          show
            ? h('div', { className: 'nb-peek-body' },
              hasAnswer
                ? h('div', { className: 'nb-peek-block' },
                  h('div', { className: 'nb-peek-label' }, t('practice.answerLabel')),
                  h('div', { className: 'nb-md is-small' }, markdownNodes(question.referenceAnswer, `ans-${question.id}`, t)))
                : null,
              hasRubric
                ? h('div', { className: 'nb-peek-block' },
                  h('div', { className: 'nb-peek-label' }, t('practice.rubricLabel')),
                  h('ol', { className: 'nb-peek-rubric' }, question.rubric.map((item, index) => h('li', { key: index },
                    inlineNodes(item, `rub-${question.id}-${index}`)))))
                : null,
            )
            : null,
        )
      }

      const runRegrade = async (entry, payload) => {
        setWorking(entry.id)
        try {
          const result = await onRegrade(entry.id, payload)
          setRedoResult({ wrongId: entry.id, ...result })
          if (result.correct) setRedo(undefined)
        } finally {
          setWorking(undefined)
        }
      }

      return h('div', { className: 'nb-pane is-practice' },
        h('div', { className: 'nb-practice-bar' },
          h(Select, {
            t,
            label: t('practice.count'),
            testId: 'quiz-count',
            below: true,
            value: count,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((value) => ({ value, label: value })),
            onChange: setCount,
          }),
          h(Select, {
            t,
            label: t('practice.kind'),
            testId: 'quiz-kind',
            below: true,
            value: kind,
            options: [
              { value: 'mixed', label: t('practice.kindMixed') },
              { value: 'choice', label: t('practice.kindChoice') },
              { value: 'open', label: t('practice.kindOpen') },
            ],
            onChange: setKind,
          }),
          h(Select, {
            t,
            label: t('practice.difficulty'),
            testId: 'quiz-difficulty',
            below: true,
            value: difficulty,
            options: [
              { value: 'basic', label: t('practice.levelBasic') },
              { value: 'medium', label: t('practice.levelMedium') },
              { value: 'advanced', label: t('practice.levelAdvanced') },
              { value: 'any', label: t('practice.levelAny') },
            ],
            onChange: setDifficulty,
          }),
          h('input', {
            className: 'nb-input nb-practice-topic',
            value: topic,
            placeholder: t('practice.topic'),
            onChange: (event) => setTopic(event.target.value),
          }),
          materials.length > 1
            ? h(Select, {
              t,
              label: t('practice.scope'),
              testId: 'quiz-scope',
              below: true,
              value: scopeId,
              options: [{ value: '', label: t('practice.scopeAll') }, ...materials.map((material) => ({ value: material.id, label: material.name }))],
              onChange: setScopeId,
            })
            : null,
          h('label', { className: 'nb-check' },
            h('input', {
              type: 'checkbox',
              checked: useWeb,
              onChange: (event) => setUseWeb(event.target.checked),
            }),
            h('span', null, t('practice.web')),
          ),
          models === undefined
            ? null
            : h(ModelMenu, {
              t,
              models,
              model,
              efforts,
              effort,
              disabled: busy || generating,
              onChangeModel: (next) => onModelChange(next),
              onChangeEffort: (next) => onEffortChange(next),
            }),
          h('button', {
            type: 'button',
            className: 'nb-btn is-primary',
            disabled: busy || generating,
            onClick: () => onGenerate({ count: Number(count), topic: topic.trim(), useWeb, questionKind: kind, difficulty, materialId: scopeId }),
          }, generating ? t('practice.generating') : t('practice.generate')),
          h('button', {
            type: 'button',
            className: 'nb-btn',
            disabled: busy || generating || doneCount === 0,
            onClick: () => {
              setImportPicked((practice?.questions ?? []).map((question) => question.id))
              setImportOpen(true)
            },
          }, h(Icon, { path: ICONS.note, size: 14 }), h('span', null, t('practice.importNote'))),
          canResume && !generating
            ? h('button', {
              type: 'button',
              className: 'nb-btn',
              disabled: busy,
              onClick: () => onResume(),
            }, h(Icon, { path: ICONS.refresh, size: 14 }), h('span', null, `${t('practice.resume')} ${doneCount}/${totalCount}`))
            : null,
        ),

        generating && totalCount > 0
          ? h('p', { className: 'nb-muted nb-pane-empty' }, t('practice.progress').replace('{done}', String(doneCount)).replace('{total}', String(totalCount)))
          : null,

        practice === null || practice === undefined
          ? h('p', { className: 'nb-muted nb-pane-empty' }, t('practice.empty'))
          : h('div', {
            className: 'nb-quiz',
            ref: quizRef,
            onMouseUp: readQuizSelection,
            onKeyUp: readQuizSelection,
          },
            practice.questions.map((question, index) => {
              const response = responses[question.id]
              const isOpen = question.type === 'open'
              return h('div', { key: question.id, className: 'nb-question' },
                h('div', { className: 'nb-question-head' },
                  h('span', { className: 'nb-question-index' }, `${index + 1}`),
                  h('div', { className: 'nb-md nb-question-stem' }, markdownNodes(question.stem, `q-${question.id}`, t)),
                ),
                isOpen
                  ? h('div', { className: 'nb-open' },
                    response === undefined
                      ? h(React.Fragment, null,
                        h(AnswerInput, {
                          t,
                          value: drafts[question.id] ?? '',
                          onChange: (next) => setDrafts({ ...drafts, [question.id]: next }),
                          placeholder: t('practice.answerPlaceholder'),
                        }),
                        h('button', {
                          type: 'button',
                          className: 'nb-btn is-primary',
                          disabled: busy || submitting !== undefined || (drafts[question.id] ?? '').trim().length === 0,
                          onClick: () => void submitOpen(question),
                        }, submitting === question.id ? '…' : t('practice.submit')),
                      )
                      : h('div', { className: 'nb-open-given nb-md is-small' }, markdownNodes(answerPlain(response.text ?? ''), `q-${question.id}-g`, t)))
                  : h('div', { className: 'nb-options' }, question.options.map((option, optionIndex) => {
                    const chosen = response?.choice === optionIndex
                    const isAnswer = response !== undefined && optionIndex === question.answerIndex
                    const className = `nb-option${chosen ? ' is-chosen' : ''}${isAnswer ? ' is-answer' : ''}${response !== undefined && chosen && !isAnswer ? ' is-wrong' : ''}`
                    return h('button', {
                      key: optionIndex,
                      type: 'button',
                      className,
                      disabled: busy || submitting !== undefined || response !== undefined,
                      onClick: () => void submitAnswer(question, optionIndex, undefined),
                    },
                      h('span', { className: 'nb-option-key' }, optionKey(optionIndex)),
                      h('span', { className: 'nb-option-text' }, inlineNodes(option, `opt-${question.id}-${optionIndex}`)),
                    )
                  })),
                response === undefined
                  ? h('button', {
                    type: 'button',
                    className: 'nb-chip',
                    disabled: busy || submitting !== undefined,
                    onClick: () => onHint(question.stem),
                  }, h(Icon, { path: ICONS.bulb, size: 13 }), h('span', null, t('action.hint')))
                  : h('div', { className: 'nb-answer' },
                    renderResult(response, `q-${question.id}-e`, t('practice.wrong'), question.explanation),
                    // A correct answer needs no reference: only a supplement.
                    isOpen && response.correct !== true ? renderReference(question) : null,
                  ),
              )
            }),
          ),

        h('div', { className: 'nb-notes-head' },
          h('span', null, `${t('wrong.heading')} · ${wrong.length}`),
        ),
        wrong.length === 0
          ? h('p', { className: 'nb-muted nb-pane-empty' }, t('wrong.empty'))
          : h('ul', { className: 'nb-wrong-list' }, wrong.map((entry) => {
            const result = redoResult !== undefined && redoResult.wrongId === entry.id ? redoResult : undefined
            const isRedoing = redo !== undefined && redo.wrongId === entry.id
            return h('li', { key: entry.id, className: `nb-wrong${entry.reviewed ? ' is-reviewed' : ''}` },
              h('div', { className: 'nb-wrong-head' },
                h('span', { className: 'nb-wrong-tag' }, entry.reviewed ? t('wrong.reviewed') : t('wrong.todo')),
                h('div', { className: 'nb-wrong-actions' },
                  entry.questionId === undefined
                    ? null
                    : h('button', {
                      type: 'button',
                      className: 'nb-btn',
                      disabled: busy || working === entry.id,
                      onClick: () => {
                        setRedoResult(undefined)
                        setRedo(isRedoing ? undefined : { wrongId: entry.id, text: '', choice: undefined })
                      },
                    }, isRedoing ? t('action.cancel') : t('wrong.redo')),
                  h('button', {
                    type: 'button',
                    className: 'nb-btn',
                    disabled: busy,
                    onClick: () => onToggleWrong(entry.id, !entry.reviewed),
                  }, entry.reviewed ? t('wrong.markTodo') : t('wrong.markReviewed')),
                  h('button', {
                    type: 'button',
                    className: 'nb-btn',
                    disabled: busy,
                    onClick: () => onRemoveWrong(entry.id),
                  }, t('action.delete')),
                ),
              ),
              entry.question === '' ? null : h('div', { className: 'nb-wrong-q nb-md is-small' }, markdownNodes(entry.question, `w-${entry.id}-q`, t)),
              entry.given === undefined || entry.given === null || entry.given === ''
                ? null
                : h('div', { className: 'nb-wrong-given nb-md is-small' }, `${t('practice.yours')}：`, markdownNodes(answerPlain(entry.given), `w-${entry.id}-g`, t)),
              Array.isArray(entry.issues) && entry.issues.length > 0
                ? h('ul', { className: 'nb-issues' }, entry.issues.map((issue, index) => h('li', { key: index },
                  issue.where === '' ? null : h('strong', null, `${issue.where}：`),
                  inlineNodes(issue.what, `w-${entry.id}-issue-${index}`),
                )))
                : null,
              h('div', { className: 'nb-md is-small' }, markdownNodes(cleanVerdictNoise(entry.answer), `wrong-${entry.id}`, t)),

              isRedoing
                ? h('div', { className: 'nb-redo' },
                  entry.kind === 'open'
                    ? h(AnswerInput, {
                      t,
                      value: redo.text,
                      onChange: (next) => setRedo({ ...redo, text: next }),
                      placeholder: t('practice.answerPlaceholder'),
                      rows: 5,
                    })
                    : h('div', { className: 'nb-options' }, (entry.options ?? []).map((option, optionIndex) => h('button', {
                      key: optionIndex,
                      type: 'button',
                      className: `nb-option${redo.choice === optionIndex ? ' is-chosen' : ''}`,
                      onClick: () => setRedo({ ...redo, choice: optionIndex }),
                    },
                      h('span', { className: 'nb-option-key' }, optionKey(optionIndex)),
                      h('span', { className: 'nb-option-text' }, inlineNodes(option, `redo-${entry.id}-${optionIndex}`)),
                    ))),
                  h('button', {
                    type: 'button',
                    className: 'nb-btn is-primary',
                    disabled: working === entry.id || (entry.kind === 'open' ? redo.text.trim().length === 0 : redo.choice === undefined),
                    onClick: () => void runRegrade(entry, entry.kind === 'open' ? { text: redo.text } : { choice: redo.choice }),
                  }, working === entry.id ? '…' : t('practice.submit')),
                )
                : null,

              result === undefined
                ? null
                : h('div', { className: 'nb-redo-result' },
                  renderResult(result, `rr-${entry.id}`, t('practice.still')),
                ),
            )
          })),

        askSelection === undefined
          ? null
          : h('button', {
            type: 'button',
            className: 'nb-ask-selection is-action',
            style: { left: askSelection.x + 'px', top: Math.max(8, askSelection.y - 40) + 'px' },
            onMouseDown: (event) => event.preventDefault(),
            onClick: () => {
              onAskSelection(askSelection.text)
              setAskSelection(undefined)
              window.getSelection()?.removeAllRanges()
            },
          }, h(Icon, { path: ICONS.bulb, size: 13 }), h('span', null, t('selection.askPassage'))),

        importOpen
          ? h(ModalBackdrop, {
            className: 'nb-modal-backdrop',
            onMouseDown: (event) => { if (event.target === event.currentTarget) setImportOpen(false) },
          },
            h('div', { className: 'nb-modal nb-import-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('practice.importNote') },
              h(ModalHead, { t, title: t('practice.importPick'), onClose: () => setImportOpen(false) }),
              h('div', { className: 'nb-import-list' },
                (practice?.questions ?? []).map((question, index) => h('label', {
                  key: question.id,
                  className: `nb-import-row${importPicked.includes(question.id) ? ' is-picked' : ''}`,
                },
                  h('input', {
                    type: 'checkbox',
                    checked: importPicked.includes(question.id),
                    onChange: () => setImportPicked((current) => (current.includes(question.id)
                      ? current.filter((id) => id !== question.id)
                      : [...current, question.id])),
                  }),
                  h('span', { className: 'nb-import-index' }, `${index + 1}`),
                  h('span', { className: 'nb-import-stem' }, stemPreview(question.stem)),
                  h('span', { className: 'nb-import-kind' }, question.type === 'open' ? t('practice.kindOpen') : t('practice.kindChoice')),
                )),
              ),
              h('div', { className: 'nb-modal-actions' },
                h('button', {
                  type: 'button',
                  className: 'nb-btn',
                  onClick: () => setImportPicked(importPicked.length === doneCount ? [] : (practice?.questions ?? []).map((question) => question.id)),
                }, importPicked.length === doneCount ? t('practice.importNone') : t('practice.importAll')),
                h('button', { type: 'button', className: 'nb-btn', onClick: () => setImportOpen(false) }, t('action.cancel')),
                h('button', {
                  type: 'button',
                  className: 'nb-btn is-primary',
                  disabled: importPicked.length === 0,
                  onClick: () => {
                    const ids = importPicked.slice()
                    setImportOpen(false)
                    onImportNotes(ids)
                  },
                }, t('practice.importConfirm')),
              ),
            ))
          : null,
      )
    }

    /** Detail surface for the selected box. */
    function BoxView({ box, t, api, onSummary, focusMessage, tab, onTab, openSettings }) {
      const [materials, setMaterials] = React.useState(box.materials ?? [])
      const [messages, setMessages] = React.useState(box.messages ?? [])
      const [conversations, setConversations] = React.useState(box.conversations ?? [{ id: 'default', title: '原有聊天' }])
      const titledRef = React.useRef(new Set((box.conversations ?? []).filter((entry) => entry.manualTitle || entry.titleSummarized).map((entry) => entry.id)))
      const [conversationId, setConversationId] = React.useState(box.conversations?.[0]?.id ?? 'default')
      const [readingId, setReadingId] = React.useState(undefined)
      const [reading, setReading] = React.useState(undefined)
      const [pendingSelection, setPendingSelection] = React.useState(undefined)
      const [busy, setBusy] = React.useState(false)
      const [asking, setAsking] = React.useState(false)
      const [queued, setQueued] = React.useState(0)
      const queueRef = React.useRef([])
      const busyRef = React.useRef(false)
      const [streaming, setStreaming] = React.useState(undefined)
      const [extending, setExtending] = React.useState(undefined)
      const [error, setError] = React.useState(undefined)
      const [models, setModels] = React.useState(undefined)
      const [model, setModel] = React.useState(undefined)
      const [efforts, setEfforts] = React.useState([])
      const [effort, setEffort] = React.useState(undefined)
      const [viewer, setViewer] = React.useState(undefined)
      const [readerWidth, setReaderWidth] = React.useState(() => {
        try {
          const saved = Number(window.localStorage.getItem('notebook.readerWidth'))
          return Number.isFinite(saved) && saved >= 300 ? Math.max(520, saved) : 520
        } catch {
          return 460
        }
      })
      // Animate live widths in one frame loop, without React or DOM reads on each move.
      const resizeCleanup = React.useRef(undefined)
      React.useEffect(() => () => resizeCleanup.current?.(), [])
      const startReaderResize = (event) => {
        event.preventDefault()
        resizeCleanup.current?.()
        const aside = event.currentTarget.parentElement
        const body = aside.parentElement
        const startX = event.clientX
        const startWidth = aside.getBoundingClientRect().width
        const limit = Math.max(320, Math.min(body.clientWidth * 0.72, body.clientWidth - 470))
        let target = startWidth, painted = startWidth, frame = 0, lastTime = performance.now()
        const applyWidth = (width) => {
          aside.style.width = width + 'px'
          body.style.setProperty('--nb-pad', width + 'px')
        }
        const paint = (now) => {
          frame = 0
          const elapsed = Math.min(64, now - lastTime); lastTime = now
          painted += (target - painted) * (1 - Math.exp(-elapsed / 24))
          if (Math.abs(target - painted) < 0.25) painted = target
          applyWidth(painted)
          if (painted !== target) frame = requestAnimationFrame(paint)
        }
        const move = (e) => {
          target = Math.min(Math.max(320, startWidth + startX - e.clientX), limit)
          if (!frame) { lastTime = performance.now() - 16; frame = requestAnimationFrame(paint) }
        }
        const cleanup = () => {
          document.removeEventListener('mousemove', move)
          document.removeEventListener('mouseup', up)
          window.removeEventListener('blur', up)
          if (frame) cancelAnimationFrame(frame)
          document.body.classList.remove('nb-dragging')
          resizeCleanup.current = undefined
        }
        const up = () => {
          cleanup(); applyWidth(target); setReaderWidth(target)
          try { window.localStorage.setItem('notebook.readerWidth', String(target)) } catch {}
        }
        resizeCleanup.current = cleanup
        document.body.classList.add('nb-dragging')
        document.addEventListener('mousemove', move)
        document.addEventListener('mouseup', up)
        window.addEventListener('blur', up)
      }

      const [attached, setAttached] = React.useState([])
      const [notes, setNotes] = React.useState(box.notes ?? [])
      const [wrong, setWrong] = React.useState(box.wrong ?? [])
      const [savedNotes, setSavedNotes] = React.useState([])
      const [focusNote, setFocusNote] = React.useState(undefined)
      const [practice, setPractice] = React.useState(box.practice ?? null)
      const [generating, setGenerating] = React.useState(false)
      const [settings, setSettings] = React.useState(box.settings ?? {})
      const [settingsOpen, setSettingsOpen] = React.useState(false)
      const [settingsSection, setSettingsSection] = React.useState('notes')
      const settingsContentRef = React.useRef(null)
      // The settings body is one flat list; group its children by the section
      // headings and show only the active group.
      React.useEffect(() => {
        const root = settingsContentRef.current
        if (root === null) return
        const groups = new Map()
        let current
        for (const child of Array.from(root.children)) {
          if (child.id.startsWith('nb-sec-')) current = child.id.slice('nb-sec-'.length)
          if (current === undefined) continue
          const list = groups.get(current) ?? []
          list.push(child)
          groups.set(current, list)
        }
        for (const [id, nodes] of groups) {
          for (const node of nodes) node.hidden = settingsSection !== id
        }
      }, [settingsSection, settingsOpen])
      const [fonts, setFonts] = React.useState(() => readFonts())
      const refreshFonts = (next) => {
        writeFonts(next)
        setFonts(next)
      }
      const fontOptions = (translate) => [
        ...BUILT_IN_FONTS.map((entry) => ({ value: entry.id, label: translate(entry.label) })),
        ...fonts.map((entry) => ({ value: entry.id, label: entry.label })),
      ]
      const importFont = async (chosen, slot = 'fontBody') => {
        try {
          const buffer = await chosen.arrayBuffer()
          const id = 'nb-' + Date.now().toString(36)
          const face = new window.FontFace(id, buffer)
          document.fonts.add(face)
          await face.load()
          const bytes = new Uint8Array(buffer)
          let binary = ''
          for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index])
          const label = chosen.name.replace(/\.[^.]+$/, '')
          refreshFonts([...fonts, { id, label, data: btoa(binary) }])
          await updateSettings(slot === 'fontCode' ? { fontCode: id } : { fontBody: id })
        } catch {
          /* the face could not be parsed */
        }
      }
      const renameFont = (id, label) => refreshFonts(fonts.map((entry) => (entry.id === id ? { ...entry, label } : entry)))
      const removeFont = (id) => refreshFonts(fonts.filter((entry) => entry.id !== id))
      // Re-register every imported face once per mount.
      React.useEffect(() => {
        for (const entry of readFonts()) registerFont(entry)
      }, [])
      // Body font, code font and size come from the box settings only.
      React.useEffect(() => {
        const root = document.querySelector('.nb-root')
        if (root === null) return
        // A face that is listed but never registered falls back synthetically and
        // renders blurry, so probe the document before trusting the setting.
        const usable = (id, fallback) => {
          if (typeof id !== 'string' || id === '') return fallback
          if (BUILT_IN_FONTS.some((entry) => entry.id === id)) return id
          if (!fonts.some((entry) => entry.id === id)) return fallback
          if (typeof document.fonts?.check !== 'function') return id
          return document.fonts.check('12px "' + id + '"') ? id : fallback
        }
        const bodyId = usable(settings.fontBody, 'system')
        const codeId = usable(settings.fontCode, 'consolas')
        root.style.setProperty('--nb-font-body', fontStackOf(bodyId))
        root.style.setProperty('--nb-font-code', fontStackOf(codeId))
        root.style.setProperty('--nb-font-size', String(settings.fontBodySize ?? '13.5') + 'px')
        root.style.setProperty('--nb-font-code-size', String(settings.fontCodeSize ?? '12.5') + 'px')
      }, [settings.fontBody, settings.fontBodySize, settings.fontCode, settings.fontCodeSize, fonts])
      const [toast, setToast] = React.useState('')
      const [confirmMaterial, setConfirmMaterial] = React.useState(undefined)
      React.useEffect(() => {
        if (!confirmMaterial) return undefined
        const close = (event) => { if (event.key === 'Escape' && !busy) setConfirmMaterial(undefined) }
        document.addEventListener('keydown', close)
        return () => document.removeEventListener('keydown', close)
      }, [confirmMaterial, busy])
      const [notice, setNotice] = React.useState(undefined)
      const notify = (text) => setNotice({ text, id: Date.now() })
      React.useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(undefined), 2800); return () => clearTimeout(timer) }, [notice])
      const [exportOpen, setExportOpen] = React.useState(false)
      const [defaultSection, setDefaultSection] = React.useState(
        typeof box.settings?.defaultNoteSection === 'string' ? box.settings.defaultNoteSection : '今日知识点',
      )
      const askFileRef = React.useRef(null)
      const askFolderRef = React.useRef(null)
      const typer = useTypewriter()
      const abortRef = React.useRef(undefined)

      // Only reserve space for the reader when the chat column cannot keep its width.
      React.useEffect(() => {
        const body = document.querySelector('.nb-box-body')
        if (body === null) return
        const apply = () => {
          if (viewer === undefined) {
            body.style.setProperty('--nb-pad', '0px')
            return
          }
          // Always reserve the reader so the chat column reflows instead of being covered.
          body.style.setProperty('--nb-reader-w', readerWidth + 'px')
          const room = Math.max(470, body.clientWidth - 470)
          body.style.setProperty('--nb-pad', Math.min(readerWidth, room) + 'px')
        }
        apply()
        const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(apply) : undefined
        if (observer !== undefined) observer.observe(body)
        return () => {
          if (observer !== undefined) observer.disconnect()
        }
      }, [viewer, readerWidth])
      // Inline citations resolve a material name and open it in the reader.
      React.useEffect(() => {
        const normalise = (value) => value.replace(/\s+/g, '')
        setCiteHandler((name) => {
          const target = (materials ?? []).find((entry) => entry.name === name || normalise(entry.name) === normalise(name))
          if (target !== undefined) void openViewer(target.id)
          else flashToast('这份资料已删除')
        })
        return () => setCiteHandler(undefined)
      }, [materials])

      // Switching tabs dismisses the reader: it belongs to the tab that opened it.
      React.useEffect(() => {
        setViewer(undefined)
      }, [tab])

      // The header gear opens this box's settings dialog. A remount (switching
      // boxes) must not replay a signal that was already consumed, so only an
      // actual change counts.
      const settingsSignalRef = React.useRef(openSettings)
      React.useEffect(() => {
        if (typeof openSettings === 'number' && openSettings > 0 && openSettings !== settingsSignalRef.current) {
          setSettingsOpen(true)
        }
        settingsSignalRef.current = openSettings
      }, [openSettings])

      // A rail history click opens the answer tab and scrolls to that question.
      const focusRef = React.useRef(focusMessage)
      React.useEffect(() => {
        if (focusMessage === undefined || focusMessage === focusRef.current) return
        focusRef.current = focusMessage
        setConversationId(messages.find((message) => message.id === focusMessage)?.conversationId ?? 'default')
        onTab('ask')
        const timer = window.setTimeout(() => {
          const node = document.getElementById(`nb-msg-${focusMessage}`)
          if (node !== null) node.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }, 80)
        return () => window.clearTimeout(timer)
      }, [focusMessage])

      React.useEffect(() => {
        setMaterials(box.materials ?? [])
        setMessages(box.messages ?? [])
        setConversations(box.conversations ?? [{ id: 'default', title: '原有聊天' }])
        setConversationId(box.conversations?.[0]?.id ?? 'default')
        setReadingId(undefined)
        setReading(undefined)
        setPendingSelection(undefined)
        setViewer(undefined)
        setAttached([])
        setNotes(box.notes ?? [])
        setWrong(box.wrong ?? [])
        setSavedNotes([])
        setPractice(box.practice ?? null)
        setSettings(box.settings ?? {})
        setError(undefined)
      }, [box.id])

      // Lazy indexing: profile any material imported before profiles existed.
      // New imports are profiled at import time, so this only backfills.
      React.useEffect(() => {
        if (!materials.some((material) => material.indexed === false)) return undefined
        let cancelled = false
        api.ensureIndex(box.id, model === undefined ? undefined : { provider: model.provider, model: model.model }).then((result) => {
          if (cancelled || !Array.isArray(result?.ids) || result.ids.length === 0) return
          const done = new Set(result.ids)
          setMaterials((current) => current.map((material) => (done.has(material.id) ? { ...material, indexed: true } : material)))
        }).catch(() => {
          // A failed profile keeps the 待索引 badge; rebuild from the context menu.
        })
        return () => { cancelled = true }
      }, [materials, api, box.id])

      React.useEffect(() => {
        let cancelled = false
        api.models().then(
          (catalogue) => {
            if (cancelled) return
            setModels(catalogue)
            const current = catalogue?.current
            if (current !== undefined && typeof current.provider === 'string') setModel(current)
          },
          () => undefined,
        )
        return () => {
          cancelled = true
        }
      }, [api])

      // Reasoning efforts belong to one exact model route, so refetch on switch.
      React.useEffect(() => {
        if (model === undefined) return undefined
        let cancelled = false
        setEffort(undefined)
        api.efforts(model.provider, model.model).then(
          (result) => {
            if (cancelled) return
            const list = Array.isArray(result?.efforts) ? result.efforts : []
            setEfforts(list)
            // Start at the model's middle setting so a first answer cannot burn the top tier.
            const middle = list.find((entry) => entry.id === 'medium')
            if (middle !== undefined) setEffort('medium')
          },
          () => {
            if (!cancelled) setEfforts([])
          },
        )
        return () => {
          cancelled = true
        }
      }, [api, model?.provider, model?.model])

      // Escape collapses the side panel without disturbing the composer.
      React.useEffect(() => {
        if (viewer === undefined) return undefined
        const onKey = (event) => {
          if (event.key === 'Escape') setViewer(undefined)
        }
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('keydown', onKey)
        }
      }, [viewer])

      /** Open (or collapse) one material in the chat side panel. */
      const openViewer = async (materialId) => {
        setError(undefined)
        // A cited source may be one of the user's own notes: jump to it instead.
        if (typeof materialId === 'string' && materialId.startsWith('note:')) {
          setViewer(undefined)
          setFocusNote(materialId.slice(5))
          onTab('notes')
          return
        }
        if (materialId === undefined) {
          setViewer(undefined)
          return
        }
        if (viewer !== undefined && viewer.id === materialId) {
          setViewer(undefined)
          return
        }
        try {
          const material = await api.materialText(box.id, materialId)
          setViewer(material)
        } catch (cause) {
          flashToast('这份资料已删除')
        setViewer(undefined)
        }
      }

      const pickLocalMaterials = async (mode, attach = false) => {
        setBusy(true)
        setError(undefined)
        try {
          const result = await api.pickMaterials(box.id, mode)
          setMaterials((current) => [...current, ...result.materials])
          if (attach) setAttached((current) => [...current, ...result.materials.map((entry) => ({ id: entry.id, name: entry.name }))])
          if (result.summary) onSummary(result.summary)
          if (result.errors?.length) setError(result.errors.join('\n'))
        } catch (error) { setError(String(error.message ?? error)) }
        finally { setBusy(false) }
      }
      const newConversation = async () => {
        if (asking || busy || queued) return
        setBusy(true)
        try {
          const result = await api.createConversation(box.id)
          setConversations((current) => [...current, result.conversation])
          setConversationId(result.conversation.id)
          setViewer(undefined)
          setPendingSelection(undefined)
          setAttached([])
        } catch (error) { setError(String(error.message ?? error)) }
        finally { setBusy(false) }
      }
      const renameConversation = async (id, title) => {
        try {
          const result = await api.renameConversation(box.id, id, title)
          setConversations((current) => current.map((entry) => entry.id === id ? result.conversation : entry))
          return true
        } catch (error) { setError(String(error.message ?? error)); return false }
      }
      const flashToast = (text) => {
        setToast(text)
        window.setTimeout(() => setToast(''), 2000)
      }
      const removeConversation = async (id) => {
        try {
          const result = await api.removeConversation(box.id, id)
          setConversations(result.conversations)
          setMessages((current) => current.filter((message) => (message.conversationId ?? 'default') !== id))
          if (id === conversationId) { setConversationId(result.nextId); setViewer(undefined); setPendingSelection(undefined); setAttached([]) }
          if (result.summary) onSummary(result.summary)
          flashToast('已删除')
          return true
        } catch (error) { setError(String(error.message ?? error)); return false }
      }
      const removeManyItems = async (kind, ids) => {
        if (ids.length === 0) return false
        setBusy(true)
        setError(undefined)
        try {
          const result = await api.removeMany(box.id, kind, ids)
          const removed = new Set(ids)
          if (kind === 'material') {
            setMaterials((current) => current.filter((item) => !removed.has(item.id)))
            setAttached((current) => current.filter((item) => !removed.has(item.id)))
            if (removed.has(readingId)) { setReadingId(undefined); setReading(undefined) }
            if (removed.has(viewer?.id)) setViewer(undefined)
          } else if (kind === 'note') {
            setNotes((current) => current.filter((item) => !removed.has(item.id)))
          } else if (kind === 'conversation') {
            setConversations(result.conversations)
            setMessages((current) => current.filter((message) => !removed.has(message.conversationId ?? 'default')))
            if (removed.has(conversationId)) {
              const at = conversations.findIndex((item) => item.id === conversationId)
              const next = conversations.slice(at + 1).find((item) => !removed.has(item.id))
                ?? conversations.slice(0, at).reverse().find((item) => !removed.has(item.id))
                ?? result.conversations[0]
              setConversationId(next.id)
              setViewer(undefined); setPendingSelection(undefined); setAttached([])
            }
          }
          if (result.summary) onSummary(result.summary)
          flashToast('已删除')
          return true
        } catch (error) { setError(String(error.message ?? error)); return false }
        finally { setBusy(false) }
      }
      const appendSelection = async (text, noteId, materialId) => {
        try {
          const result = await api.appendNote(box.id, text, noteId, materialId)
          setNotes((current) => current.some((entry) => entry.id === result.note.id)
            ? current.map((entry) => entry.id === result.note.id ? result.note : entry) : [...current, result.note])
          if (result.summary) onSummary(result.summary)
          return true
        } catch (error) { setError(String(error.message ?? error)); return false }
      }
      const importFiles = async (files, options) => {
        if (files.length === 0) return
        setBusy(true)
        setError(undefined)
        const created = []
        try {
          for (const file of files) {
            if (/(^|[\\/])\.[^\\/]/u.test(file.name)) continue
            let payload
            try {
              payload = await readFileForImport(file, t)
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : String(cause))
              continue
            }
            try {
              const result = await api.addMaterial(box.id, payload)
              setMaterials((current) => [...current, result.material])
              if (result.summary !== undefined) onSummary(result.summary)
              created.push({ id: result.material.id, name: result.material.name })
            } catch (cause) {
              setError(`${file.name}: ${cause instanceof Error ? cause.message : String(cause)}`)
            }
          }
          if (options?.attach === true && created.length > 0) {
            setAttached((current) => [...current, ...created])
          }
        } finally {
          setBusy(false)
        }
      }

      /** Rebuild every material profile; answers get sharper after this. */
      const reindexBox = async () => {
        setBusy(true)
        setError(undefined)
        try {
          const result = await api.reindex(box.id, model === undefined ? undefined : { provider: model.provider, model: model.model })
          if (result.summary !== undefined) onSummary(result.summary)
          setMaterials((current) => current.map((material) => ({ ...material, indexed: true })))
          notify(t('mat.reindexed'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      const addPasted = async (name, text, options) => {
        setBusy(true)
        setError(undefined)
        try {
          const result = await api.addMaterial(box.id, {
            name: name.trim() === '' ? '粘贴的资料' : name.trim(),
            text,
            kind: 'paste',
          })
          setMaterials((current) => [...current, result.material])
          if (result.summary !== undefined) onSummary(result.summary)
          if (options?.attach === true) {
            setAttached((current) => [...current, { id: result.material.id, name: result.material.name }])
          }
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      const removeMaterial = async (materialId) => {
        setBusy(true)
        setError(undefined)
        try {
          const result = await api.removeMaterial(box.id, materialId)
          setMaterials((current) => current.filter((material) => material.id !== materialId))
          flashToast('已删除')
          if (readingId === materialId) {
            setReadingId(undefined)
            setReading(undefined)
          }
          if (viewer?.id === materialId) setViewer(undefined)
          setAttached((current) => current.filter((entry) => entry.id !== materialId))
          if (result.summary !== undefined) onSummary(result.summary)
          return true
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
          return false
        } finally { setBusy(false) }
      }

      const loadFollowups = React.useCallback(async (messageId) => {
        try {
          const result = await api.followups(box.id, messageId, model)
          const questions = Array.isArray(result?.questions) ? result.questions : []
          if (questions.length === 0) return
          setMessages((current) => current.map((message) => (
            message.id === messageId ? { ...message, followups: questions } : message
          )))
        } catch {
          // Suggestions are optional; a failure must not disturb the answer.
        }
      }, [api, box.id, model])

      const ask = (question, options) => {
        options = { ...options, conversationId: options?.conversationId ?? conversationId }
        if (busyRef.current) {
          if (queueRef.current.length >= 4) {
            setError(t('queue.full'))
            return
          }
          queueRef.current.push({ question, options })
          setQueued(queueRef.current.length)
          return
        }
        busyRef.current = true
        setAttached([])
        setAsking(true)
        setStreaming({ question, text: '' })
        typer.start((settled) => {
          setAsking(false)
          setStreaming(undefined)
          busyRef.current = false
          if (settled.ok) {
            if (settled.result.conversation) setConversations((current) => current.map((entry) => entry.id === settled.result.conversation.id ? settled.result.conversation : entry))
            // Name the chat from its content at most once; later turns leave the title alone.
            const titleKey = options.conversationId ?? 'default'
            if (!titledRef.current.has(titleKey)) {
              titledRef.current.add(titleKey)
              void api.conversationTitle?.(box.id, titleKey, model).then((result) => {
                if (result?.conversation) setConversations((current) => current.map((entry) => entry.id === result.conversation.id ? result.conversation : entry))
              }).catch(() => {
                titledRef.current.delete(titleKey)
              })
            }
            setMessages((current) => [...current, settled.result.question, settled.result.message])
            if (settled.result.summary !== undefined) onSummary(settled.result.summary)
            void loadFollowups(settled.result.message.id)
          } else {
            setError(settled.message)
          }
          const next = queueRef.current.shift()
          setQueued(queueRef.current.length)
          if (next !== undefined) window.setTimeout(() => ask(next.question, next.options), 0)
        })
        const controller = new AbortController()
        abortRef.current = controller
        api.askStream(box.id, question, options ?? {}, {
          signal: controller.signal,
          onDelta: (text) => typer.push(text),
          onDone: (frame) => typer.end({
            ok: true,
            result: { question: frame.question, message: frame.message, summary: frame.summary, conversation: frame.conversation },
          }),
          onError: (message) => typer.end({ ok: false, message }),
        }).catch((cause) => {
          if (cause?.name === 'AbortError') {
            typer.flush()
            setAsking(false)
            setStreaming(undefined)
            return
          }
          typer.end({ ok: false, message: cause instanceof Error ? cause.message : String(cause) })
        }).finally(() => {
          abortRef.current = undefined
        })
      }

      const stop = () => {
        abortRef.current?.abort()
        busyRef.current = false
        if (settings.stopClearsQueue !== false) {
          queueRef.current = []
          setQueued(0)
        }
        abortRef.current = undefined
        typer.flush()
        setAsking(false)
        setStreaming(undefined)
      }

      const hint = async (question, chosen) => {
        if (asking) return
        setAsking(true)
        setError(undefined)
        try {
          const result = await api.hint(box.id, question, {
            conversationId,
            ...(chosen ?? {}),
            ...(effort === undefined ? {} : { reasoningEffort: effort }),
          })
          setMessages((current) => [...current, result.message])
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setAsking(false)
        }
      }

      const extend = async (messageId) => {
        setExtending(messageId)
        setError(undefined)
        try {
          const result = await api.extend(box.id, messageId, model)
          setMessages((current) => [...current, result.message])
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setExtending(undefined)
        }
      }

      /** File one assistant answer into the notes, keeping its sources as refs. */
      const saveNoteFromMessage = async (message) => {
        setError(undefined)
        try {
          const refs = (Array.isArray(message.sources) ? message.sources : [])
            .filter((source) => typeof source.materialId === 'string' && !source.materialId.startsWith('note:'))
            .map((source) => ({ id: source.materialId, name: source.materialName }))
          const unique = []
          for (const ref of refs) {
            if (!unique.some((entry) => entry.id === ref.id)) unique.push(ref)
          }
          const result = await api.addNote(box.id, {
            title: (message.text.split('\n').find((line) => line.trim().length > 0) ?? '笔记').replace(/[#*`>]/gu, '').slice(0, 40),
            section: defaultSection,
            tags: [],
            body: message.text,
            refs: unique,
          })
          setNotes((current) => [...current, result.note])
          setSavedNotes((current) => [...current, message.id])
          notify('已记为笔记')
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const saveNote = async (noteId, patch) => {
        setError(undefined)
        try {
          const result = await api.updateNote(box.id, noteId, patch)
          setNotes((current) => current.map((note) => (note.id === noteId ? result.note : note)))
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const createNote = async () => {
        setError(undefined)
        try {
          const result = await api.addNote(box.id, {
            title: t('notes.untitled'),
            section: defaultSection,
            tags: [],
            body: '',
            refs: [],
          })
          setNotes((current) => [...current, result.note])
          setFocusNote(result.note.id)
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      /** Re-read the practice set so a half-done quiz stays resumable. */
      const refreshPractice = async () => {
        try {
          const result = await api.practice(box.id)
          setPractice(result.practice ?? null)
          if (Array.isArray(result.wrong)) setWrong(result.wrong)
        } catch {
          // A failed refresh keeps the current state; the banner already says why.
        }
      }

      /** The model route questions should be generated with. */
      const quizModel = () => (model === undefined ? {} : { provider: model.provider, model: model.model })

      /**
       * Walk a practice set to completion, one question per call. Each question
       * is saved as it lands, so closing the panel mid-way keeps everything
       * generated so far instead of losing the set.
       */
      const runQuiz = async (first) => {
        let result = first
        let guard = 0
        while (result !== undefined) {
          setPractice(result.practice)
          if (result.summary !== undefined) onSummary(result.summary)
          if (result.done === true || guard >= 16) return
          guard += 1
          result = await api.quizNext(box.id, result.practice.id, quizModel())
        }
      }

      /** Generate a fresh quiz from the box, one question at a time. */
      const generateQuiz = async (options) => {
        setGenerating(true)
        setError(undefined)
        try {
          await runQuiz(await api.beginQuiz(box.id, { ...options, ...quizModel() }))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
          await refreshPractice()
        } finally {
          setGenerating(false)
        }
      }

      /** Resume an unfinished set: keep asking for the next question. */
      const resumeQuiz = async () => {
        if (practice === null || practice.done === true) return
        setGenerating(true)
        setError(undefined)
        try {
          await runQuiz(await api.quizNext(box.id, practice.id, quizModel()))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
          await refreshPractice()
        } finally {
          setGenerating(false)
        }
      }

      const answerQuestion = async (questionId, choice, text) => {
        if (practice === null) return
        setError(undefined)
        try {
          const result = await api.answerQuestion(box.id, practice.id, questionId, choice, text, {
            ...(model === undefined ? {} : { provider: model.provider, model: model.model }),
            ...(effort === undefined ? {} : { reasoningEffort: effort }),
          })
          setPractice((current) => (current === null ? current : {
            ...current,
            responses: {
              ...(current.responses ?? {}),
              [questionId]: {
                choice,
                text,
                correct: result.correct,
                issues: result.issues ?? [],
                explanation: result.explanation,
              },
            },
          }))
          if (Array.isArray(result.wrong)) setWrong(result.wrong)
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      /** Re-attempt one wrong-book entry; a correct retry marks it reviewed. */
      const regradeWrong = async (wrongId, payload) => {
        setError(undefined)
        try {
          const result = await api.regradeWrong(box.id, wrongId, payload)
          if (Array.isArray(result.wrong)) setWrong(result.wrong)
          if (result.summary !== undefined) onSummary(result.summary)
          return result
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
          return { correct: false, issues: [], explanation: '' }
        }
      }

      /** Digest the note being edited; the editor offers insert or replace. */
      const summarizeNote = (text) => api.summarize(box.id, text, model)

      /** Fold today's questions and notes into a new note, then focus it. */
      const dailySummary = async () => {
        setError(undefined)
        try {
          const result = await api.dailySummary(box.id, model)
          setNotes((current) => [...current, result.note])
          setFocusNote(result.note.id)
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const removeNote = async (noteId) => {
        setError(undefined)
        try {
          const result = await api.removeNote(box.id, noteId)
          setNotes((current) => current.filter((note) => note.id !== noteId))
          if (result.summary !== undefined) onSummary(result.summary)
          return true
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
          return false
        }
      }

      /** File the picked practice questions into a new typical-problem note. */
      const importQuestions = async (questionIds) => {
        if (practice === null || questionIds.length === 0) return
        setBusy(true)
        setError(undefined)
        try {
          const picked = practice.questions.filter((question) => questionIds.includes(question.id))
          const result = await api.addNote(box.id, {
            title: `典型题目 · ${practice.topic ? practice.topic : '本次练习'}`,
            section: '典型题目/错题',
            tags: ['题目'],
            body: questionNoteBody(picked),
            refs: [],
          })
          setNotes((current) => [...current, result.note])
          setFocusNote(result.note.id)
          onTab('notes')
          if (result.summary !== undefined) onSummary(result.summary)
          notify(t('practice.imported'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      const markWrong = async (message) => {
        setError(undefined)
        try {
          const result = await api.addWrong(box.id, message.id)
          if (result.entry !== undefined) {
            setWrong((current) => (current.some((entry) => entry.id === result.entry.id) ? current : [...current, result.entry]))
          }
          if (result.summary !== undefined) onSummary(result.summary)
          notify('已加入错题本')
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const toggleWrong = async (wrongId, reviewed) => {        setError(undefined)
        try {
          await api.updateWrong(box.id, wrongId, reviewed)
          setWrong((current) => current.map((entry) => (entry.id === wrongId ? { ...entry, reviewed } : entry)))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const removeWrongEntry = async (wrongId) => {
        setError(undefined)
        try {
          const result = await api.removeWrong(box.id, wrongId)
          setWrong((current) => current.filter((entry) => entry.id !== wrongId))
          if (result.summary !== undefined) onSummary(result.summary)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const runExport = async (scope, noteId) => {
        setExportOpen(false)
        setError(undefined)
        try {
          const result = await api.exportMarkdown(box.id, scope, noteId)
          downloadMarkdown(result.filename, result.markdown)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      /** Persist one per-box preference and keep the panel in sync. */
      const updateSettings = async (patch) => {
        setSettings((current) => ({ ...current, ...patch }))
        if (typeof patch.defaultNoteSection === 'string') setDefaultSection(patch.defaultNoteSection)
        try {
          const result = await api.updateSettings(box.id, patch)
          if (result.settings !== undefined) setSettings(result.settings)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      // The settings dialog closes on Escape, like the rest of the shell.
      React.useEffect(() => {
        if (!settingsOpen) return undefined
        const onKey = (event) => {
          if (event.key === 'Escape' && !document.querySelector('.nb-popover')) setSettingsOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
      }, [settingsOpen])

      return h('div', { className: 'nb-box' },
        toast === '' ? null : h('div', { className: 'nb-toast', role: 'status' }, toast),
        notice ? h('div', { key: notice.id, className: 'nb-toast', role: 'status', 'aria-live': 'polite' }, notice.text) : null,
        confirmMaterial ? h(ConfirmModal, {
          t,
          title: '删除资料',
          busy,
          onCancel: () => setConfirmMaterial(undefined),
          onConfirm: async () => {
            const target = confirmMaterial
            const removed = Array.isArray(target.ids) ? await removeManyItems('material', target.ids) : await removeMaterial(target.id)
            if (removed === true) setConfirmMaterial(undefined)
          },
          body: Array.isArray(confirmMaterial.ids) && confirmMaterial.ids.length > 1
            ? '确定要删除所选 ' + confirmMaterial.ids.length + ' 份资料吗？删除后无法恢复。'
            : h(React.Fragment, null, '确定要删除 ', h('span', { className: 'nb-name-chip' }, confirmMaterial.name || (materials.find((entry) => entry.id === (confirmMaterial.ids ?? [])[0]) ?? {}).name || ''), ' 吗？删除后无法恢复。'),
        }) : null,
        h('header', { className: 'nb-box-head' },
          h('div', { className: 'nb-box-title-row' },
            h('h2', { className: 'nb-box-title' }, box.name),
            h('div', { className: 'nb-box-head-actions' },
              h('span', { className: 'nb-pop-wrap' },
                h('button', {
                  type: 'button',
                  className: 'nb-icon-btn',
                  title: t('settings.label'),
                  'aria-label': t('settings.label'),
                  onClick: () => setSettingsOpen((open) => !open),
                }, h(Icon, { path: ICONS.gear, size: 15 })),
                settingsOpen
                  ? h(ModalBackdrop, {
                    className: 'nb-modal-backdrop',
                    onMouseDown: (event) => {
                      if (event.target === event.currentTarget) setSettingsOpen(false)
                    },
                  },
                    h('div', { className: 'nb-modal nb-settings-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('settings.label') },
                      h(ModalHead, { t, title: t('settings.label'), onClose: () => setSettingsOpen(false) }),
                      h('div', { className: 'nb-settings' },
                      h('div', { className: 'nb-settings-tabs' },
                        ...[
                          [['notes', 'settings.groupNote'], ['chat', 'settings.groupChat'], ['practice', 'settings.groupPractice'], ['font', 'settings.groupFont']],
                        ].map(([id, labelKey]) => h('button', {
                          key: id,
                          type: 'button',
                          className: 'nb-settings-tab' + (settingsSection === id ? ' is-active' : ''),
                          onClick: () => setSettingsSection(id),
                        }, h(Icon, { path: ICONS[NAV_ICONS[id]], size: 15 }), h('span', null, t(labelKey)))),
                      ),
                      h('div', { key: settingsSection, className: 'nb-settings-content', ref: settingsContentRef },
                      settingsSection === 'notes' ? h(React.Fragment, null,
                      h('p', { className: 'nb-settings-group', id: 'nb-sec-notes' }, '笔记参考资料'),
                      ...[{ value: 'today', label: '今日知识点笔记' }, { value: 'daily', label: '今日总结' }, { value: 'notes', label: '其他笔记' }].map((entry) => h('label', { key: entry.value, className: 'nb-check' },
                        h('input', { type: 'checkbox', checked: (settings.referenceNotes ?? ['today','daily','notes']).includes(entry.value),
                          onChange: (event) => { const current = settings.referenceNotes ?? ['today','daily','notes']; void updateSettings({ referenceNotes: event.target.checked ? [...current, entry.value] : current.filter((value) => value !== entry.value) }) } }), entry.label)),
                      h('p', { className: 'nb-settings-group' }, t('settings.groupNote')),
                      h(Select, { t, label: t('settings.appendTarget'),
                        desc: t('settings.appendTargetHint'), testId: 'settings-append-target', below: true,
                        value: notes.some((note) => note.id === settings.defaultAppendNoteId) ? settings.defaultAppendNoteId : 'latest',
                        options: [{ value: 'latest', label: t('notes.latest') }, ...notes.map((note) => ({ value: note.id, label: note.title }))],
                        onChange: (next) => void updateSettings({ defaultAppendNoteId: next }),
                      }),
                      h('label', { className: 'nb-settings-row' },
                        h('span', null, t('settings.section')),
                        h('input', {
                          className: 'nb-input',
                          value: typeof settings.defaultNoteSection === 'string' ? settings.defaultNoteSection : '',
                          placeholder: t('notes.section'),
                          onChange: (event) => void updateSettings({ defaultNoteSection: event.target.value }),
                        }),
                      ),
                      h('label', { className: 'nb-check' },
                        h('input', {
                          type: 'checkbox',
                          checked: settings.multiSelectNotes === true,
                          onChange: (event) => void updateSettings({ multiSelectNotes: event.target.checked }),
                        }),
                        h('span', null, t('settings.multiSelect')),
                      ),
                      ) : null,
                      settingsSection === 'font' ? h(React.Fragment, null,
                                            h('p', { className: 'nb-settings-group', id: 'nb-sec-font' }, t('settings.groupFont')),
                      h('p', { className: 'nb-settings-caption' }, t('settings.fontBody')),
                      h(Select, {
                        t,
                        label: t('settings.fontFamily'),
                        desc: t('settings.fontBodyHint'),
                        testId: 'settings-font-body',
                        below: true,
                        value: typeof settings.fontBody === 'string' ? settings.fontBody : 'system',
                        options: fontOptions(t),
                        onChange: (next) => void updateSettings({ fontBody: next }),
                      }),
                      h(Select, {
                        t,
                        label: t('settings.fontSize'),
                        testId: 'settings-font-body-size',
                        below: true,
                        value: String(settings.fontBodySize ?? '13.5'),
                        options: SIZES,
                        onChange: (next) => void updateSettings({ fontBodySize: next }),
                      }),
                      h('div', {
                        className: 'nb-font-preview',
                        style: { fontFamily: fontStackOf(typeof settings.fontBody === 'string' ? settings.fontBody : 'system'), fontSize: String(settings.fontBodySize ?? '13.5') + 'px' },
                      }, '这是中文示例'),
                      h('div', { className: 'nb-font-import' },
                        h('button', { type: 'button', className: 'nb-btn', onClick: () => document.getElementById('nb-font-body-file')?.click() }, t('settings.importFont')),
                        h('input', {
                          id: 'nb-font-body-file',
                          type: 'file',
                          accept: '.ttf,.otf,.woff,.woff2',
                          style: { display: 'none' },
                          onChange: (event) => {
                            const chosen = event.target.files?.[0]
                            if (chosen !== undefined) void importFont(chosen, 'fontBody')
                            event.target.value = ''
                          },
                        }),
                      ),
                      h('p', { className: 'nb-settings-caption' }, t('settings.fontCode')),
                      h(Select, {
                        t,
                        label: t('settings.fontFamily'),
                        desc: t('settings.fontCodeHint'),
                        testId: 'settings-font-code',
                        below: true,
                        value: typeof settings.fontCode === 'string' ? settings.fontCode : 'consolas',
                        options: fontOptions(t),
                        onChange: (next) => void updateSettings({ fontCode: next }),
                      }),
                      h(Select, {
                        t,
                        label: t('settings.fontSize'),
                        desc: t('settings.fontCodeSizeHint'),
                        testId: 'settings-font-code-size',
                        below: true,
                        value: String(settings.fontCodeSize ?? '12.5'),
                        options: CODE_SIZES,
                        onChange: (next) => void updateSettings({ fontCodeSize: next }),
                      }),
                      h('div', {
                        className: 'nb-font-preview is-code',
                        style: { fontFamily: fontStackOf(typeof settings.fontCode === 'string' ? settings.fontCode : 'consolas'), fontSize: String(settings.fontCodeSize ?? '12.5') + 'px' },
                      }, 'Code Test  //  这是代码示例'),
                      h('div', { className: 'nb-font-import' },
                        h('button', { type: 'button', className: 'nb-btn', onClick: () => document.getElementById('nb-font-code-file')?.click() }, t('settings.importFont')),
                        h('input', {
                          id: 'nb-font-code-file',
                          type: 'file',
                          accept: '.ttf,.otf,.woff,.woff2',
                          style: { display: 'none' },
                          onChange: (event) => {
                            const chosen = event.target.files?.[0]
                            if (chosen !== undefined) void importFont(chosen, 'fontCode')
                            event.target.value = ''
                          },
                        }),
                      ),
                      fonts.length === 0
                        ? null
                        : h('div', { className: 'nb-font-list' },
                          fonts.map((entry) => h('div', { key: entry.id, className: 'nb-font-item' },
                            h('span', { className: 'nb-font-item-name', style: { fontFamily: '\'' + entry.id + '\', sans-serif' } }, entry.label),
                            h('button', { type: 'button', className: 'nb-font-item-btn', onClick: () => { const next = window.prompt(t('settings.fontRename'), entry.label); if (next !== null && next.trim() !== '') renameFont(entry.id, next.trim()) } }, t('settings.fontRename')),
                            h('button', { type: 'button', className: 'nb-font-item-btn', onClick: () => removeFont(entry.id) }, t('settings.fontRemove')),
                          )),
                        ),
                      ) : null,
                      settingsSection === 'chat' ? h(React.Fragment, null,
                      h('p', { className: 'nb-settings-group', id: 'nb-sec-chat' }, t('settings.groupChat')),
                      h(Select, {
                        t,
                        label: t('settings.qaScope'),
                        desc: t('settings.qaScopeHint'),
                        testId: 'settings-qa-scope',
                        below: true,
                        value: String(typeof settings.qaScope === 'number' ? settings.qaScope : 5),
                        options: [
                          { value: '3', label: '3' },
                          { value: '5', label: '5' },
                          { value: '8', label: '8' },
                        ],
                        onChange: (next) => void updateSettings({ qaScope: Number(next) }),
                      }),
                      h('label', { className: 'nb-check' },
                        h('input', {
                          type: 'checkbox',
                          checked: settings.stopClearsQueue !== false,
                          onChange: (event) => void updateSettings({ stopClearsQueue: event.target.checked }),
                        }),
                        h('span', null, t('settings.stopClearsQueue')),
                      ),
                      ) : null,
                      settingsSection === 'practice' ? h(React.Fragment, null,
                      h('p', { className: 'nb-settings-group', id: 'nb-sec-practice' }, t('settings.groupPractice')),
                      h(Select, {
                        t,
                        label: t('settings.kind'),
                        desc: t('settings.kindHint'),
                        testId: 'settings-kind',
                        below: true,
                        value: typeof settings.defaultQuestionKind === 'string' ? settings.defaultQuestionKind : 'mixed',
                        options: [
                          { value: 'mixed', label: t('practice.kindMixed') },
                          { value: 'choice', label: t('practice.kindChoice') },
                          { value: 'open', label: t('practice.kindOpen') },
                        ],
                        onChange: (next) => void updateSettings({ defaultQuestionKind: next }),
                      }),
                      h(Select, {
                        t,
                        label: t('settings.difficulty'),
                        desc: t('settings.difficultyHint'),
                        testId: 'settings-difficulty',
                        below: true,
                        value: typeof settings.defaultDifficulty === 'string' ? settings.defaultDifficulty : 'medium',
                        options: [
                          { value: 'basic', label: t('practice.levelBasic') },
                          { value: 'medium', label: t('practice.levelMedium') },
                          { value: 'advanced', label: t('practice.levelAdvanced') },
                          { value: 'any', label: t('practice.levelAny') },
                        ],
                        onChange: (next) => void updateSettings({ defaultDifficulty: next }),
                      }),
                      h('label', { className: 'nb-check' },
                        h('input', {
                          type: 'checkbox',
                          checked: settings.defaultUseWeb === true,
                          onChange: (event) => void updateSettings({ defaultUseWeb: event.target.checked }),
                        }),
                        h('span', null, t('settings.web')),
                      ),
                      ) : null,
                    ),
                    ),
                      ),
                  )
                  : null,
              ),
            ),
          ),
        ),
        error !== undefined
          ? h('div', { className: 'nb-banner', role: 'alert' },
            h('span', { className: 'nb-banner-text' }, error),
            h('button', {
              type: 'button',
              className: 'nb-banner-close',
              'aria-label': t('action.close'),
              title: t('action.close'),
              onClick: () => setError(undefined),
            }, h(Icon, { path: ICONS.close, size: 12 })),
          )
          : null,
        h('div', { className: `nb-box-body${viewer === undefined ? '' : ' has-reader'}` },
          h('div', { className: 'nb-box-main' },
        h('div', { className: `nb-tab-panel${tab === 'ask' ? ' is-chat' : ''}`, key: tab },
        tab === 'materials'
          ? h(MaterialsPane, {
            t,
            materials,
            reading: viewer,
            busy,
            models,
            model,
            efforts,
            effort,
            onModelChange: setModel,
            onEffortChange: setEffort,
            onRead: (id) => void openViewer(id),
            onReveal: async (materialId) => {
              try {
                await api.revealMaterial(box.id, materialId)
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : String(cause))
              }
            },
            onImport: (files) => void importFiles(files),
            onPickImport: box.nativeFilePicker ? (mode) => void pickLocalMaterials(mode) : undefined,
            onPaste: (name, text) => void addPasted(name, text),
            onReindex: () => void reindexBox(),
            onRemove: (id) => setConfirmMaterial(materials.find((entry) => entry.id === id)),
          onRemoveMany: (ids) => setConfirmMaterial({ ids, name: '' }),
            onSelectionAsk: (material, text) => {
              setPendingSelection({ materialId: material.id, materialName: material.name, text })
              onTab('ask')
            },
          })
          : tab === 'ask'
            ? h('div', { className: `nb-ask-layout${viewer === undefined ? '' : ' has-side'}` },
              h(ConversationControls, { t, conversations, value: conversationId, disabled: busy || asking || queued > 0,
                onChange: (id) => { setConversationId(id); setViewer(undefined); setPendingSelection(undefined); setAttached([]) },
                onCreate: () => void newConversation(), onRename: renameConversation, onRemove: removeConversation,
                onRemoveMany: (ids) => removeManyItems('conversation', ids) }),
              h('div', { className: 'nb-ask-main' },
                h(AskPane, {
                  key: conversationId,
                  t,
                  notes, settings, onAppend: appendSelection,
                  onNotify: notify,
                  messages: messages.filter((message) => (message.conversationId ?? 'default') === conversationId),
                  asking,
                  streaming: streaming === undefined ? undefined : { question: streaming.question, text: typer.text },
                  models,
                  model,
                  onModelChange: setModel,
                  efforts,
                  effort,
                  onEffortChange: setEffort,
                  onAsk: (question, options) => ask(question, options),
                  onStop: stop,
                  onHint: (question, chosen) => void hint(question, chosen),
                  onExtend: (id) => void extend(id),
                  onSaveNote: (message) => void saveNoteFromMessage(message),
                  onMarkWrong: (message) => void markWrong(message),
                  savedNotes,
                  extending,
                  pendingSelection,
                  onClearSelection: () => setPendingSelection(undefined),
                  onSelectText: (text) => setPendingSelection({ materialId: undefined, materialName: t('selection.chat'), text }),
                  queued,
                  onQuote: (text) => setQuestion((current) => {
                    const quoted = text.split('\n').map((line) => '> ' + line).join('\n')
                    return current.trim().length === 0 ? quoted + '\n\n' : current + '\n\n' + quoted
                  }),
                  materials,
                  onOpenMaterial: (materialId) => void openViewer(materialId),
                  attached,
                  onDetach: (id) => setAttached((current) => current.filter((entry) => entry.id !== id)),
                  onImportMaterial: (mode, payload) => {
                    if (box.nativeFilePicker && ['file', 'folder', 'pdf'].includes(mode)) { void pickLocalMaterials(mode, true); return }
                    if (mode === 'file') askFileRef.current?.click()
                    else if (mode === 'folder') askFolderRef.current?.click()
                            else if (mode === 'paste' && payload !== undefined) void addPasted(payload.name, payload.text, { attach: true })
                  },
                }),
              ),
              h('input', {
                ref: askFileRef,
                type: 'file',
                multiple: true,
                accept: '.txt,.md,.markdown,.csv,.json,.log,.text,text/plain,text/markdown',
                style: { display: 'none' },
                onChange: (event) => pickFiles(event.target, (files) => void importFiles(files, { attach: true })),
              }),
              h('input', {
                ref: askFolderRef,
                type: 'file',
                multiple: true,
                webkitdirectory: '',
                directory: '',
                style: { display: 'none' },
                onChange: (event) => pickFiles(event.target, (files) => void importFiles(files, { attach: true })),
              }),
            )
            : tab === 'notes'
              ? h(NotesPane, {
                t,
                notes,
                busy,
                onCreate: () => void createNote(),
                onSave: (noteId, patch) => void saveNote(noteId, patch),
                onRemove: (noteId) => removeNote(noteId),
                onRemoveMany: (ids) => removeManyItems('note', ids),
                onSummarize: summarizeNote,
                onDailySummary: dailySummary,
                focusNoteId: focusNote,
                onExport: (scope, noteId) => void runExport(scope, noteId),
                models,
                model,
                efforts,
                effort,
                onModelChange: setModel,
                onEffortChange: setEffort,
              })
              : tab === 'practice'
                ? h(PracticePane, {
                  t,
                  practice,
                  wrong,
                  materials,
                  models,
                  model,
                  efforts,
                  effort,
                  onModelChange: setModel,
                  onEffortChange: setEffort,
                  onAskSelection: (text) => {
                    setPendingSelection({ materialId: undefined, materialName: t('selection.practice'), text })
                    onTab('ask')
                  },
                  busy,
                  generating,
                  onGenerate: (options) => void generateQuiz(options),
                  onResume: () => void resumeQuiz(),
                  onAnswer: (questionId, choice, text) => answerQuestion(questionId, choice, text),
                  onHint: (question) => void hint(question, model),
                  onToggleWrong: (wrongId, reviewed) => void toggleWrong(wrongId, reviewed),
                  onRemoveWrong: (wrongId) => void removeWrongEntry(wrongId),
                  onRegrade: regradeWrong,
                  onImportNotes: (ids) => void importQuestions(ids),
                  defaults: settings,
                })
                : h('div', { className: 'nb-pane' }, h('p', { className: 'nb-muted' }, t('box.pending'))),
        ),
          ),
          viewer === undefined
            ? null
            : h('aside', { className: 'nb-reader-side', style: { width: `${readerWidth}px` } },
              h('div', {
                className: 'nb-reader-resize',
                role: 'separator',
                'aria-orientation': 'vertical',
                title: t('reader.resize'),
                onMouseDown: startReaderResize,
              }),
              h('div', { className: 'nb-reader-side-head' },
                h('span', { className: 'nb-reader-side-title' }, viewer.name),
                h('button', {
                  type: 'button',
                  className: 'nb-icon-btn',
                  title: t('action.collapse'),
                  'aria-label': t('action.collapse'),
                  onClick: () => setViewer(undefined),
                }, h(Icon, { path: ICONS.chevron, size: 14, className: 'is-flipped' })),
              ),
              h(MaterialReader, {
                t,
                compact: true,
                reading: viewer,
                notes, settings, onAppend: appendSelection,
                onSelectionAsk: (material, text) => {
                  setPendingSelection({ materialId: material.id, materialName: material.name, text })
                },
              }),
            ),
        ),
      )
    }

    // -----------------------------------------------------------------------
    // Page
    // -----------------------------------------------------------------------

    /** The registered page: rail of study spaces plus the selected one. */
    function NotebookPage(props) {
      const { t } = props
      const api = API
      const [state, setState] = React.useState({ phase: 'connecting' })
      // Show the changelog once per version: the moment it is dismissed, the
      // version is remembered, so it never appears again until the next update.
      const [openVersions, setOpenVersions] = React.useState([])
      const [showChangelog, setShowChangelog] = React.useState(() => {
        try {
          return window.localStorage.getItem('notebook.changelogSeenV15') !== APP_VERSION
        } catch {
          return false
        }
      })
      const dismissChangelog = () => {
        setShowChangelog(false)
        try {
          window.localStorage.setItem('notebook.changelogSeenV15', APP_VERSION)
        } catch {
          /* private mode */
        }
      }
      const [boxes, setBoxes] = React.useState([])
      const [selectedId, setSelectedId] = React.useState(undefined)
      const [creating, setCreating] = React.useState(false)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(undefined)
      const [detail, setDetail] = React.useState(undefined)
      const [focusMessage, setFocusMessage] = React.useState(undefined)
      const [settingsSignal, setSettingsSignal] = React.useState(0)
      const [confirmDelete, setConfirmDelete] = React.useState(undefined)
      const [dontAsk, setDontAsk] = React.useState(false)
      const [tab, setTab] = React.useState('materials')
      const tabs = [
        { id: 'materials', label: t('tab.materials') },
        { id: 'ask', label: t('tab.ask') },
        { id: 'notes', label: t('tab.notes') },
        { id: 'practice', label: t('tab.practice') },
      ]
      const [rail, setRail] = React.useState(() => {
        try {
          return window.localStorage.getItem('notebook.rail') === 'closed'
        } catch {
          return false
        }
      })
      const load = React.useCallback(async () => {
        setState({ phase: 'connecting' })
        setError(undefined)
        try {
          const result = await api.list()
          setBoxes(Array.isArray(result?.boxes) ? result.boxes : [])
          setState({ phase: 'ready' })
        } catch (cause) {
          setState({ phase: 'error' })
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }, [api])

      React.useEffect(() => {
        void load()
      }, [load])

      // Nothing selected yet: open the first box so the panel is never blank.
      React.useEffect(() => {
        if (selectedId === undefined && boxes.length > 0) setSelectedId(boxes[0].id)
      }, [boxes, selectedId])

      React.useEffect(() => {
        if (selectedId === undefined) {
          setDetail(undefined)
          return undefined
        }
        let cancelled = false
        api.get(selectedId).then(
          (box) => {
            if (!cancelled) setDetail(box)
          },
          (cause) => {
            if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
          },
        )
        return () => {
          cancelled = true
        }
      }, [api, selectedId])

      const create = async (name) => {
        setBusy(true)
        setError(undefined)
        try {
          const box = await api.create(name)
          setCreating(false)
          setBoxes((current) => [...current, box])
          setSelectedId(box.id)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

const remove = (id) => {
        let quiet = false
        try {
          quiet = window.localStorage.getItem('notebook.skipDeleteConfirm') === '1'
        } catch {
          quiet = false
        }
        if (quiet) {
          void deleteBoxBody(id)
          return
        }
        const box = boxes.find((entry) => entry.id === id)
        setDontAsk(false)
        setConfirmDelete({ id, name: box === undefined ? '' : box.name })
      }

      const confirmRemove = async () => {
        if (confirmDelete === undefined) return
        if (dontAsk) {
          try {
            window.localStorage.setItem('notebook.skipDeleteConfirm', '1')
          } catch {
            /* private mode */
          }
        }
        const target = confirmDelete.id
        setConfirmDelete(undefined)
        await deleteBoxBody(target)
      }

      const deleteBoxBody = async (id) => {
        setBusy(true)
        setError(undefined)
        try {
          await api.remove(id)
          setBoxes((current) => current.filter((box) => box.id !== id))
          if (selectedId === id) setSelectedId(undefined)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      const applySummary = React.useCallback((summary) => {
        if (summary === undefined) return
        setBoxes((current) => current.map((box) => (box.id === summary.id ? { ...box, ...summary } : box)))
      }, [])

      const statusText = state.phase === 'ready' ? t('state.ready') : state.phase === 'error' ? t('state.error') : t('state.connecting')

      return h(Boundary, { t },
        showChangelog
          ? h(ModalBackdrop, {
            className: 'nb-modal-backdrop',
            onMouseDown: (event) => { if (event.target === event.currentTarget) dismissChangelog() },
          },
            h('div', { className: 'nb-modal nb-changelog', role: 'dialog', 'aria-modal': 'true' },
              h(ModalHead, { t, title: '更新日志', onClose: dismissChangelog }),
              h('div', { className: 'nb-changelog-scroll' }, CHANGELOG.map((version, versionIndex) => h('div', { key: version.version, className: 'nb-changelog-version' },
                versionIndex === 0
                  ? h('p', { className: 'nb-changelog-version-head is-current' }, version.version)
                  : h('button', {
                    type: 'button',
                    className: 'nb-changelog-version-head',
                    'aria-expanded': openVersions.includes(version.version),
                    onClick: () => setOpenVersions((current) => (current.includes(version.version) ? current.filter((id) => id !== version.version) : [...current, version.version])),
                  }, version.version),
                versionIndex === 0 || openVersions.includes(version.version)
                  ? h('div', { className: 'nb-changelog-body' }, version.groups.map((group) => h('div', { key: group.title, className: 'nb-changelog-group' },
                    h('p', { className: 'nb-changelog-title' }, group.title),
                    h('ul', { className: 'nb-changelog-list' }, group.items.map((item) => h('li', { key: item }, item))),
                  )))
                  : null,
              ))),
              h('div', { className: 'nb-modal-actions' },
                h('button', { type: 'button', className: 'nb-btn is-primary', onClick: dismissChangelog }, '知道了'),
              ),
            ),
          )
          : null,        h('div', { className: 'nb-root' },
          h('header', { className: 'nb-header' },
            h('button', {
              type: 'button',
              className: 'nb-icon-btn',
              title: rail ? t('rail.expand') : t('rail.collapse'),
              'aria-label': rail ? t('rail.expand') : t('rail.collapse'),
              'aria-pressed': rail,
              onClick: () => setRail(!rail),
            }, h(Icon, { path: ICONS.chevron, size: 15, className: rail ? 'is-flipped' : undefined })),
            h('span', { className: 'nb-header-icon' }, h(Icon, { path: ICONS.book, size: 18 })),
            h('span', { className: 'nb-header-title' }, t('title')),
            detail === undefined
              ? null
              : h('div', { className: 'nb-tabs', role: 'tablist' },
                tabs.map((entry) => h('button', {
                  key: entry.id,
                  type: 'button',
                  role: 'tab',
                  'aria-selected': entry.id === tab,
                  className: `nb-tab${entry.id === tab ? ' is-active' : ''}`,
                  onClick: () => setTab(entry.id),
                }, entry.label)),
              ),
            h('span', { className: 'nb-header-status' },
              h(StatusDot, { state: state.phase }),
              h('span', null, statusText),
            ),
            h('button', {
              type: 'button',
              className: 'nb-icon-btn',
              title: t('settings.label'),
              'aria-label': t('settings.label'),
              'data-nb-settings': 'trigger',
              disabled: detail === undefined,
              onClick: () => setSettingsSignal((value) => value + 1),
            }, h(Icon, { path: ICONS.gear, size: 15 })),
            h('button', {
              type: 'button',
              className: 'nb-icon-btn',
              title: t('action.retry'),
              'aria-label': t('action.retry'),
              disabled: busy,
              onClick: () => void load(),
            }, h(Icon, { path: ICONS.refresh, size: 15 })),
          ),
          error !== undefined
          ? h('div', { className: 'nb-banner', role: 'alert' },
            h('span', { className: 'nb-banner-text' }, error),
            h('button', {
              type: 'button',
              className: 'nb-banner-close',
              'aria-label': t('action.close'),
              title: t('action.close'),
              onClick: () => setError(undefined),
            }, h(Icon, { path: ICONS.close, size: 12 })),
          )
          : null,
          creating
            ? h(ModalBackdrop, {
              className: 'nb-modal-backdrop',
              onMouseDown: (event) => {
                if (event.target === event.currentTarget) setCreating(false)
              },
            },
              h('div', { className: 'nb-modal', role: 'dialog', 'aria-modal': 'true' },
                h(ModalHead, { t, title: t('rail.new'), onClose: () => setCreating(false) }),
                h(CreateForm, { t, busy, onCreate: (name) => void create(name), onCancel: () => setCreating(false) }),
              ),
            )
            : null,
          confirmDelete === undefined
            ? null
            : h(ModalBackdrop, {
              className: 'nb-modal-backdrop',
              onMouseDown: (event) => {
                if (event.target === event.currentTarget) setConfirmDelete(undefined)
              },
            },
              h('div', { className: 'nb-modal', role: 'dialog', 'aria-modal': 'true' },
                h(ModalHead, { t, title: t('delete.title'), onClose: () => setConfirmDelete(undefined) }),
                h('p', { className: 'nb-modal-text' }, t('delete.body').replace('{name}', confirmDelete.name)),
                h('label', { className: 'nb-check' },
                  h('input', {
                    type: 'checkbox',
                    checked: dontAsk,
                    onChange: (event) => setDontAsk(event.target.checked),
                  }),
                  h('span', null, t('delete.dontAsk')),
                ),
                h('div', { className: 'nb-modal-actions' },
                  h('button', { type: 'button', className: 'nb-btn', onClick: () => setConfirmDelete(undefined) }, t('action.cancel')),
                  h('button', { type: 'button', className: 'nb-btn is-danger', onClick: () => void confirmRemove() }, t('action.delete')),
                ),
              ),
            ),
          h('div', { className: 'nb-body' },
            h('aside', { className: `nb-rail${rail ? ' is-hidden' : ''}` },
              h('div', { className: 'nb-rail-head' },
                h('span', null, t('rail.heading')),
                h('button', {
                  type: 'button',
                  className: 'nb-icon-btn',
                  title: t('rail.new'),
                  'aria-label': t('rail.new'),
                  disabled: busy || creating,
                  onClick: () => setCreating(true),
                }, h(Icon, { path: ICONS.plus, size: 15 })),
              ),
              h('div', { className: 'nb-rail-list' },
                boxes.length === 0
                  ? h('p', { className: 'nb-muted nb-rail-empty' }, t('rail.empty'))
                  : boxes.map((box) => h(BoxRow, {
                    key: box.id,
                    box,
                    selected: box.id === selectedId,
                    t,
                    onSelect: (id) => setSelectedId(id === selectedId ? undefined : id),
                    onRemove: (id) => void remove(id),
                  })),
              ),
            ),
            h('main', { className: 'nb-main' },
              detail !== undefined
                ? h(BoxView, { key: detail.id, box: detail, t, api, onSummary: applySummary, focusMessage, tab, onTab: setTab, openSettings: settingsSignal })
                : h('div', { className: 'nb-placeholder' },
                  h('h2', null, t('empty.title')),
                  h('p', { className: 'nb-muted' }, t('empty.body')),
                ),
            ),
          ),
        ),
      )
    }

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------

    /** Theme-token styling; injected once per activation and removed on unload. */
    const CSS = `
.nb-root{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}
.nb-header{flex:none;display:flex;align-items:center;gap:10px;padding:0 14px;height:44px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.nb-header-icon{display:inline-flex;color:var(--dsw-alias-brand-primary)}
.nb-header-title{font-size:13px;font-weight:600;white-space:nowrap}
.nb-header-status{margin-left:auto;display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:12px;white-space:nowrap}
.nb-dot{width:7px;height:7px;border-radius:50%;display:inline-block}
.nb-icon-btn,.nb-btn,.nb-chip,.nb-row,.nb-mat,.nb-tab,.nb-followup,.nb-row-action,.nb-mat-action{transition:background-color .14s ease,color .14s ease,border-color .14s ease,filter .14s ease,opacity .14s ease}
.nb-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:var(--dsw-radius-sm);border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.nb-icon-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.nb-icon-btn:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}
.nb-icon-btn:disabled{opacity:.45;cursor:default}
.nb-banner{flex:none;display:flex;align-items:flex-start;gap:8px;margin:8px 14px 0;padding:8px 10px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);font-size:12px}
.nb-body{flex:1;min-height:0;display:flex;position:relative}
.nb-rail{flex:none;width:236px;min-width:0;display:flex;flex-direction:column;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-sidebar-fill)}
.nb-rail.is-hidden{display:none}
.nb-icon-btn .is-flipped{transform:rotate(180deg)}
.nb-rail-head{flex:none;display:flex;align-items:center;justify-content:space-between;padding:10px 10px 6px 14px;color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;letter-spacing:.01em;line-height:1.4}
.nb-rail-list{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:0 6px 10px}
.nb-rail-empty{margin:6px 8px}
.nb-row{display:flex;align-items:center;gap:2px;border-radius:var(--dsw-radius-md);padding:2px}
.nb-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-row.is-selected{background:var(--dsw-alias-bg-layer-2);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1)}
.nb-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;align-items:flex-start;border:0;background:transparent;color:inherit;padding:6px 8px;border-radius:var(--dsw-radius-sm);cursor:pointer;text-align:left;font:inherit}
.nb-row-name{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.nb-row-meta{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:11px}
.nb-row-action{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;opacity:0}
.nb-row:hover .nb-row-action,.nb-row-action.is-danger{opacity:1}
.nb-row-action:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base)}
.nb-row-action.is-danger{color:var(--dsw-alias-state-error-primary)}
.nb-create{display:flex;flex-direction:column;gap:6px;margin:8px 4px 0;padding:8px;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1)}
.nb-create-actions{display:flex;gap:6px}
.nb-input{width:100%;box-sizing:border-box;height:30px;transform:none;padding:0 10px;border-radius:var(--dsw-radius-sm);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;outline:none}
.nb-input:focus{border-color:var(--dsw-alias-brand-primary)}
.nb-textarea{width:100%;box-sizing:border-box;padding:9px 11px;border-radius:var(--dsw-radius-md);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;line-height:1.6;resize:vertical;outline:none}
.nb-textarea:focus{border-color:var(--dsw-alias-brand-primary)}
.nb-btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 11px;border-radius:var(--dsw-radius-sm);border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.nb-btn:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-hover)}
.nb-btn:active:not(:disabled){background:var(--dsw-alias-button-ghost-active-fill)}
.nb-btn.is-primary{background:var(--dsw-alias-bg-base);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font-weight:500}
.nb-btn.is-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);filter:none}
.nb-btn:disabled{background:var(--dsw-alias-button-ghost-active-fill);border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);opacity:.85;cursor:default}
.nb-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:16px 20px}
.nb-placeholder{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center}
.nb-placeholder h2{margin:0;font-size:15px;font-weight:600}
.nb-muted{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0}
.nb-box{flex:1;min-height:0;width:100%;padding:0;display:flex;flex-direction:column;gap:12px}
.nb-box-head{display:flex;flex-direction:column;gap:2px}
.nb-box-title-row{display:flex;align-items:center;gap:14px;justify-content:flex-start}
.nb-box-head-actions{display:flex;align-items:center;gap:4px}.nb-box-head-actions > .nb-btn,.nb-box-head-actions > .nb-pop-wrap > .nb-btn,.nb-box-head-actions > .nb-pop-wrap > .nb-icon-btn{display:none}
.nb-root{font-family:var(--nb-font-body,inherit);font-size:var(--nb-font-size,13.5px)}.nb-root code,.nb-root pre,.nb-root .nb-code-area,.nb-root .nb-code-mirror,.nb-root .nb-notes-body,.nb-root .nb-md-math,.nb-root .nb-math-raw{font-family:var(--nb-font-code,Consolas,monospace)!important;font-size:var(--nb-font-code-size,12.5px)}.nb-font-import{display:flex;align-items:center;gap:10px}.nb-font-note{font-size:12.5px;color:var(--dsw-alias-label-caption)}.nb-font-preview{padding:10px 12px;border:1px dashed var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-base);line-height:1.6;color:var(--dsw-alias-label-primary);white-space:pre-wrap}.nb-settings-caption{margin:10px 0 -6px;font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}.nb-font-list{display:flex;flex-direction:column;gap:6px}.nb-font-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md)}.nb-font-item-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px}.nb-font-item-btn{border:0;background:transparent;padding:2px 6px;border-radius:6px;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);cursor:pointer}.nb-font-item-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}.nb-settings{display:flex;flex-direction:row;align-items:stretch;gap:20px;padding:4px 2px 2px;min-width:0;font-size:13.5px;color:var(--dsw-alias-label-primary)}
.nb-settings .nb-select{justify-content:space-between;width:100%}
.nb-settings .nb-select-trigger{flex:none;justify-content:space-between;border:1px solid transparent;background:var(--dsw-alias-button-ghost-active-fill, #f2f4f6);padding:0 12px;height:34px;min-width:120px;font-size:13.5px;border-radius:8px}
.nb-settings .nb-select-chevron{margin-left:auto}
.nb-modal-backdrop{position:fixed;inset:0;margin:0;width:100vw;height:100dvh;max-width:none;max-height:none;box-sizing:border-box;border:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 28%, transparent);animation:nb-fade .12s ease}
@keyframes nb-fade{from{opacity:0}to{opacity:1}}
.nb-modal{animation:nb-fade .12s ease-out;width:min(420px,100%);max-height:min(560px,90vh);overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:12px;padding:16px 18px 18px;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base);box-shadow:0 12px 40px rgba(15,17,21,.18);border:1px solid var(--dsw-alias-border-l1)}
.nb-modal-head{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:12px;min-width:0;flex:none}.nb-modal-head>.nb-modal-title{flex:1;min-width:0;overflow-wrap:anywhere}.nb-modal-head>button{flex:none;width:auto;min-width:52px;height:28px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}.nb-name-chip{display:inline-block;padding:1px 7px;border-radius:6px;background:#eceff3;border:1px solid #dfe3e8;color:var(--dsw-alias-label-primary);font-weight:500}.nb-modal-text{margin:0;font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-secondary)}.nb-modal-actions{display:flex;justify-content:flex-end;gap:8px}.nb-btn.is-danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}.nb-btn.is-danger:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:#fff}
.nb-modal-title{margin:0;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}
.nb-settings-group{margin:6px 0 -6px;font-size:14.5px;font-weight:600;letter-spacing:.01em;color:var(--dsw-alias-label-primary);text-transform:none;padding-bottom:8px}.nb-settings-group + .nb-check,.nb-settings-group + .nb-settings-row{margin-top:2px}.nb-settings-title{margin:0 0 2px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.nb-settings-row{display:flex;flex-direction:column;gap:7px;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.nb-settings-row .nb-input{height:34px;font-size:13px}
.nb-notes-layout{flex:1;min-height:0;display:flex;gap:12px}
.nb-notes-list{flex:none;width:264px;gap:2px;min-height:0;display:flex;flex-direction:column;gap:2px;overflow-y:auto;overflow-x:hidden;border-right:1px solid var(--dsw-alias-border-l1);padding-right:8px}
.nb-notes-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 0 8px;color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:600}
.nb-note-row{display:flex;flex-direction:row;gap:8px;align-items:center;width:100%;min-height:38px;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.nb-note-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-note-row.is-active{background:var(--dsw-alias-button-ghost-active-fill,#eceff3)}
.nb-note-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.nb-note-title{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:500}
.nb-note-meta{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:11px}
.nb-notes-editor{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:8px}
.nb-notes-meta-row{display:flex;gap:8px;flex-wrap:wrap}
.nb-notes-meta-row .nb-input{flex:1;min-width:130px}
.nb-mat-split{flex:1;min-height:0;display:grid;grid-template-rows:minmax(0,1fr)}
.nb-mat-scroll{min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}
.nb-mat-scroll.is-reader{border-top:0}
.nb-mat-scroll.is-reader .nb-reader{flex:1;min-height:0}
.nb-note-split{flex:1;min-height:0;display:grid;grid-template-rows:minmax(0,1fr)}
.nb-split-handle{height:7px;display:flex;align-items:center;justify-content:center;cursor:row-resize;touch-action:none}
.nb-split-handle::before{content:"";width:36px;height:3px;border-radius:2px;background:var(--dsw-alias-border-l2);transition:background-color .12s ease}
.nb-split-handle:hover::before{background:var(--dsw-alias-label-tertiary)}
.nb-notes-body{flex:1;min-height:180px;resize:vertical;font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);font-size:12.5px;line-height:1.7}
.nb-notes-preview{flex:1;min-height:180px;overflow-y:auto;overflow-x:hidden;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.nb-notes-actions{display:flex;align-items:center;gap:8px;justify-content:flex-end}.nb-notes-topbar{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-bottom:-2px}
.nb-notes-head-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;overflow:visible}.nb-notes-head-actions .nb-pop-wrap{display:inline-flex;gap:6px}.nb-notes-list .nb-notes-head{flex-wrap:wrap}
.nb-digest{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-layer-1)}
.nb-digest-head{display:flex;align-items:center;justify-content:space-between;color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:600}
.nb-digest-body{max-height:220px;overflow-y:auto;overflow-x:hidden;font-size:12.5px}
.nb-digest-actions{display:flex;gap:8px;justify-content:flex-end}
.nb-wrong-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.nb-wrong{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base)}
.nb-wrong.is-reviewed{opacity:.65}
.nb-wrong-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nb-wrong-tag{font-size:11px;color:var(--dsw-alias-state-warn-primary)}
.nb-wrong.is-reviewed .nb-wrong-tag{color:var(--dsw-alias-state-success-primary)}
.nb-wrong-actions{display:flex;gap:6px;flex-wrap:wrap}
.nb-wrong-q{margin:0;font-weight:500}
.nb-wrong-chosen{margin:0;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.nb-pane.is-practice{gap:12px}
.nb-practice-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nb-practice-topic{flex:1;min-width:140px;height:28px}
.nb-check{display:flex;align-items:center;gap:10px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.7;padding:13px 0;border-bottom:1px solid var(--dsw-alias-border-l1);cursor:pointer}
.nb-check input{width:16px;height:16px;flex:none;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.nb-quiz{display:flex;flex-direction:column;gap:14px}
.nb-question{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base)}
.nb-peek{display:flex;flex-direction:column;gap:6px}
.nb-peek-body{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.nb-peek-block{display:flex;flex-direction:column;gap:4px}
.nb-peek-label{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.nb-peek-rubric{margin:0;padding-left:18px;font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-primary)}
.nb-question-head{display:flex;align-items:flex-start;gap:8px}
.nb-question-index{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:600}
.nb-question-stem{flex:1;min-width:0}
.nb-options{display:flex;flex-direction:column;gap:6px}
.nb-option{display:flex;align-items:flex-start;gap:8px;width:100%;padding:7px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-base);color:inherit;font:inherit;font-size:13px;text-align:left;cursor:pointer}
.nb-option:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.nb-option:disabled{cursor:default;opacity:1}
.nb-option-key{flex:none;color:var(--dsw-alias-label-secondary);font-weight:600;font-size:11.5px;line-height:20px}
.nb-option-text{flex:1;min-width:0;line-height:1.6}
.nb-option.is-answer{border-color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent)}
.nb-option.is-wrong{border-color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent)}
.nb-answer-input{display:flex;flex-direction:column;gap:8px}.nb-mode-switch{display:inline-flex;padding:2px;border-radius:999px;background:#eceff3;border:1px solid #dfe3e8;align-self:flex-start}.nb-mode-btn{border:0;background:transparent;padding:3px 12px;border-radius:999px;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);cursor:pointer}.nb-mode-btn.is-active{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:0 1px 2px #0000001a}.nb-textarea.is-markdown{font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);line-height:1.7}.nb-answer{display:flex;flex-direction:column;gap:6px;padding-top:4px;border-top:1px dashed var(--dsw-alias-border-l1)}
.nb-answer-verdict{margin:0;font-size:12px;font-weight:600}
.nb-answer-verdict.is-ok{color:var(--dsw-alias-state-success-primary)}
.nb-answer-verdict.is-bad{color:var(--dsw-alias-state-error-primary)}
.nb-open{display:flex;flex-direction:column;gap:8px}
.nb-code-edit{position:relative;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-markdown-code-block);overflow:hidden;transition:border-color .14s ease}
.nb-code-edit:focus-within{border-color:var(--dsw-alias-brand-primary)}
.nb-code-mirror{position:absolute;inset:0;margin:0;padding:12px 14px;overflow:auto;pointer-events:none;font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);font-size:12.5px;line-height:1.7;letter-spacing:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;tab-size:4;color:var(--dsw-alias-label-primary)}
.nb-code-mirror code{font:inherit;white-space:inherit;overflow-wrap:inherit;tab-size:inherit}
.nb-code-ph{color:var(--dsw-alias-label-secondary)}
.nb-code-area{position:relative;display:block;width:100%;box-sizing:border-box;min-height:132px;padding:12px 14px;border:0;outline:none;background:transparent;color:transparent;caret-color:var(--dsw-alias-label-primary);resize:vertical;font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);font-size:12.5px;line-height:1.7;letter-spacing:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;tab-size:4}
.nb-code-area::selection{background:var(--dsw-alias-bg-document-selection);color:transparent}
.nb-open-given{padding:8px 10px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.nb-issues{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--dsw-alias-label-primary)}
.nb-issues li{line-height:1.6}
.nb-issues strong{color:var(--dsw-alias-state-error-primary);font-weight:600}
.nb-wrong-given{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px}
.nb-redo{display:flex;flex-direction:column;gap:8px;padding:10px;border:1px dashed var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md)}
.nb-redo-result{display:flex;flex-direction:column;gap:6px;padding-top:6px;border-top:1px dashed var(--dsw-alias-border-l1)}
.nb-md.is-small{font-size:12.5px;line-height:1.7}
.nb-box-title{display:none;margin:0;font-size:16px;font-weight:600}
.nb-box-sub{margin:0;color:var(--dsw-alias-label-secondary);font-size:11px}
.nb-tabs{flex:none;align-self:center;display:inline-flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base)}
.nb-tab{padding:4px 12px;background:transparent;border:1px solid transparent;border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.nb-tab:hover:not(.is-active){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.nb-tab.is-active{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1);font-weight:500}
.nb-pane{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;overflow-y:auto;overflow-x:hidden;padding:4px 0}
.nb-pane.is-ask{position:relative;padding-left:0;padding-right:0;overflow:visible;flex:none;min-height:0}
.nb-nav-slot{position:sticky;top:0;height:0;z-index:6;pointer-events:none}.nb-nav{position:absolute;right:10px;top:var(--nb-band-center, 240px);transform:translateY(-50%);width:32px;max-height:min(max(0px, calc(var(--nb-band, 400px) - 64px)), 420px);display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:5px;overflow:visible;pointer-events:auto;z-index:9}
.nb-nav-item{position:relative;display:flex;justify-content:flex-end;height:12px;align-items:center}
.nb-nav-tick{display:flex;justify-content:flex-end;align-items:center;width:32px;height:12px;border:0;padding:0;background:transparent;cursor:pointer}.nb-nav-tick::before{content:"";display:block;height:2px;width:20px;border-radius:2px;background:var(--dsw-alias-border-l3, #c9ced6);transform-origin:100% 50%;transform:scaleX(var(--nb-scale, .6));transition:transform .16s ease,background-color .16s ease}
.nb-nav-tick:hover::before{background:var(--dsw-alias-label-secondary);transform:scaleX(.9)}
.nb-nav-tick.is-current::before{background:var(--dsw-alias-label-primary);transform:scaleX(1)}
.nb-nav-preview{position:absolute;right:calc(100% + 14px);top:50%;z-index:10;animation:nb-fade .13s ease-out;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;width:250px;max-height:180px;overflow:hidden;padding:10px 12px;border-radius:var(--dsw-radius-md);border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);box-shadow:0 8px 24px rgba(15,17,21,.14);font-size:12px;line-height:1.55;text-align:left;pointer-events:none}
.nb-nav-preview-q{color:var(--dsw-alias-label-primary);font-weight:500;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nb-nav-preview-a{color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.nb-pane-empty{margin:8px 0}
.nb-toolbar{flex:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nb-hint{color:var(--dsw-alias-label-secondary);font-size:11px}
.nb-paste{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:var(--dsw-radius-lg);border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.nb-mat-list{list-style:none;margin:0;padding:6px;display:flex;flex-direction:column;gap:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base)}
.nb-mat{display:flex;align-items:center;gap:2px;border-radius:var(--dsw-radius-md);padding:2px}
.nb-mat:hover,.nb-mat.is-active{background:var(--dsw-alias-interactive-bg-hover)}
.nb-pick-box{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary);animation:nb-pick-in .16s ease-out}.nb-pick-box svg{stroke:currentColor;color:inherit}.nb-pick-box.is-on{background:#eceff3;border-color:#c9ced6;color:var(--dsw-alias-label-primary)}.nb-mat.is-picked,.nb-note-row.is-picked{background:var(--dsw-alias-button-ghost-active-fill,#eceff3)!important;color:var(--dsw-alias-label-primary)!important;box-shadow:none}.nb-chat-row.is-picked{background:#e4e7ec!important;color:var(--dsw-alias-label-primary)!important;box-shadow:inset 0 0 0 1px #c9ced6}@keyframes nb-pick-in{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}.nb-icon-btn.is-active{background:var(--dsw-alias-interactive-bg-hover)}.nb-notes-head{flex-direction:column;align-items:stretch;gap:8px}.nb-notes-title-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.nb-notes-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}.nb-notes-head-actions{flex-wrap:wrap;overflow:visible;gap:6px;padding-bottom:2px}.nb-notes-head-actions>.nb-btn{flex:none}.nb-icon-btn.is-multi{width:36px;height:36px;border-radius:10px}.nb-context-menu{position:fixed;z-index:70;min-width:160px;padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-base);box-shadow:0 8px 24px rgba(15,17,21,.14);display:flex;flex-direction:column;gap:1px}.nb-mat-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;align-items:flex-start;border:0;background:transparent;color:inherit;padding:6px 8px;border-radius:var(--dsw-radius-sm);cursor:pointer;text-align:left;font:inherit}
.nb-mat-name{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-mat-meta{color:var(--dsw-alias-label-secondary);font-size:11px}
.nb-mat-action{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;opacity:0}
.nb-mat:hover .nb-mat-action{opacity:1}
.nb-mat-action:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-base)}
.nb-reader{flex:1;min-height:220px;display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);overflow:hidden;background:transparent}
.nb-reader-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px 6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;color:var(--dsw-alias-label-secondary)}
.nb-reader-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-reader-body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 14px;white-space:pre-wrap;line-height:1.75;user-select:text;cursor:text}
.nb-reader.is-compact{flex:1}
.nb-reader-body.is-md{white-space:normal;overflow-x:auto;overflow-y:auto}
.nb-tab-panel.is-chat{flex:none;min-height:100%}.nb-ask-layout{flex:1;min-height:0;display:flex;align-items:flex-start;gap:12px}
.nb-chat-sidebar{position:sticky;top:0;align-self:flex-start;flex:none;width:220px;height:var(--nb-chat-height,calc(100dvh - 120px));box-sizing:border-box;min-height:180px;display:flex;flex-direction:column;gap:8px;border-right:1px solid var(--dsw-alias-border-l1);padding:2px 10px 8px 0}
.nb-chat-sidebar.is-collapsed{width:44px;min-width:44px}.nb-chat-sidebar.is-collapsed .nb-chat-tools,.nb-chat-sidebar.is-collapsed .nb-chat-list,.nb-chat-sidebar.is-collapsed .nb-chat-selection-actions{display:none}.nb-sidebar-toggle{flex:none}.nb-chat-sidebar-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;gap:8px}.nb-chat-tools{display:flex;align-items:center;gap:6px;margin-left:auto}.nb-new-chat{width:36px;height:36px;border-radius:10px}.nb-chat-list{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:3px;overscroll-behavior:contain}.nb-chat-row{flex:none;display:flex;align-items:center;gap:8px;width:100%;min-height:38px;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;text-align:left;cursor:pointer;transition:background-color .15s ease}.nb-chat-row:hover,.nb-chat-row.is-active{background:var(--dsw-alias-interactive-bg-hover,#eceff3)}.nb-chat-row.is-active{background:var(--dsw-alias-button-ghost-active-fill,#eceff3)}.nb-chat-row-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nb-chat-selection-actions{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
@media(max-width:900px){.nb-chat-sidebar{width:176px}}

.nb-ask-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}.nb-chat-context{position:fixed!important;z-index:9000!important;margin:0!important;overflow:visible!important}
.nb-box-body{position:relative;flex:1;min-height:0;display:flex}.nb-box-body.has-reader{padding-right:var(--nb-pad, 0px)}.nb-box-body.has-reader .nb-box-main{overflow-y:auto;overflow-x:hidden}.nb-box-body.has-reader .nb-transcript{overflow:visible}.nb-box-body.has-reader .nb-transcript,.nb-box-body.has-reader .nb-composer{max-width:min(860px, calc(100% - 24px))}
.nb-tab-panel{flex:1;min-height:0;display:flex;flex-direction:column;animation:nb-fade-up .16s ease-out}.nb-box-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden}
.nb-reader-side{position:absolute;top:0;right:0;bottom:0;background:var(--dsw-alias-bg-base);border-left:1px solid var(--dsw-alias-border-l1);min-width:320px;max-width:min(72%, max(320px, calc(100% - 470px)));display:flex;flex-direction:column;z-index:6;border-left:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.nb-reader-side .nb-reader-head{display:none}
.nb-reader-side .nb-reader{flex:1;min-height:0;border:0;border-radius:0;background:transparent}.nb-reader-side{min-height:0;overflow:hidden;overscroll-behavior:contain}.nb-reader-side .nb-reader-body{flex:1 1 0;overscroll-behavior:contain;scrollbar-gutter:stable}
.nb-dragging{cursor:ew-resize!important;user-select:none}.nb-dragging *{cursor:ew-resize!important}.nb-dragging .nb-box-body{transition:none!important}.nb-reader-resize{position:absolute;left:-5px;top:0;bottom:0;width:10px;cursor:ew-resize;background:transparent;z-index:7}.nb-reader-resize::before{content:"";position:absolute;left:4px;top:50%;transform:translateY(-50%);width:2px;height:28px;border-radius:2px;background:transparent;transition:background-color .15s ease}.nb-reader-resize:hover::before{background:#c9ced6}.nb-reader-side-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px 6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.nb-reader-side-title{font-size:12px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-import-menu{display:flex;flex-direction:column;gap:1px}
.nb-import-form{display:flex;flex-direction:column;gap:6px;padding:2px;width:280px}
.nb-math-note{padding:0 16px 10px;font-size:11px;color:var(--dsw-alias-state-warn-primary)}
.nb-selection-bar{flex:none;display:flex;align-items:center;gap:8px;padding:8px 10px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.nb-selection-label{color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap}
.nb-transcript{flex:none;min-height:0;overflow:visible;display:flex;flex-direction:column;gap:16px;padding:4px 26px 14px 2px;width:100%;max-width:860px;margin:0 auto}
.nb-msg{display:flex;flex-direction:column;gap:6px;max-width:100%;animation:nb-rise .18s ease-out}
.nb-msg.is-user{align-items:flex-end}
.nb-msg-user{max-width:76%;background:var(--dsw-specific-bubble);border-radius:var(--dsw-radius-lg);padding:9px 14px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}
.nb-msg-meta{display:flex;align-items:center;gap:6px;min-height:0;margin-bottom:2px}
.nb-tag{display:inline-flex;align-items:center;font-weight:500;font-size:11px;line-height:18px;padding:0 8px;border-radius:999px;border:1px solid #dfe3e8;background:#eceff3;color:#4b5563}
.nb-tag.is-warn{border-color:#ecc57f;background:#fbf1de;color:#8a5a00}
.nb-md{overflow-wrap:anywhere;line-height:1.8;font-size:13.5px}
.nb-md-p{margin:0 0 10px;white-space:pre-wrap}
.nb-md-p:last-child{margin-bottom:0}
.nb-md-h{margin:14px 0 8px;font-size:14px;font-weight:600;line-height:1.5}
.nb-md-h1{font-size:17px}
.nb-md-h2{font-size:15px}
.nb-md-h3,.nb-md-h4,.nb-md-h5,.nb-md-h6{font-size:13.5px}
.nb-md-list{margin:0 0 10px;padding-left:20px}
.nb-md-list li{margin:2px 0;white-space:pre-wrap}.nb-md-h.is-in-item{display:inline;font-weight:600;color:var(--dsw-alias-label-primary)}
.nb-md-quote{margin:0 0 10px;padding:2px 0 2px 10px;border-left:2px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}
.nb-md-color{font-weight:500}.nb-cite{display:inline;padding:0 2px;border-radius:4px;color:var(--dsw-static-blue-450, #3b7dd8);cursor:pointer}.nb-cite:hover{background:var(--dsw-alias-interactive-bg-hover);text-decoration:underline}.nb-md-tag{display:inline-block;padding:0 6px;border-radius:6px;background:var(--dsw-alias-button-ghost-active-fill, #eef1f5);color:var(--dsw-alias-label-secondary);font-size:.92em;line-height:1.55;white-space:nowrap}.nb-md-code{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);font-size:12px;padding:1px 5px;border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-markdown-inline-code);border:1px solid var(--dsw-alias-border-l1)}
.nb-box code,.nb-box pre,.nb-box kbd,.nb-box samp,.nb-box var,.nb-box tt,.nb-code-area,.nb-code-mirror,.nb-notes-body,.nb-md-math,.nb-math-raw,.nb-export-preview code,.nb-export-preview pre{font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace)!important}.nb-md-math{font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);font-style:italic;font-size:12.5px;padding:0 1px}
.nb-code{margin:0 0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);overflow:hidden;background:var(--dsw-alias-markdown-code-block)}
.nb-code-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 8px 5px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-markdown-code-block-banner)}
.nb-code-lang{font-size:11px;letter-spacing:.04em;text-transform:lowercase;color:var(--dsw-alias-label-secondary)}
.nb-code-copy{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;padding:2px 8px;border-radius:999px;cursor:pointer}
.nb-code-copy:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.nb-code .nb-md-pre{margin:0;border:0;border-radius:0;background:transparent}
.nb-md-pre{margin:0 0 10px;padding:11px 13px;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-markdown-code-block);border:1px solid var(--dsw-alias-border-l1);overflow-x:auto;overflow-y:hidden}
.nb-md-pre code{font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);font-size:12.5px;line-height:1.7;white-space:pre;tab-size:2}
.nb-tok-str{color:var(--dsw-static-green-400, #4ed17e)}
.nb-tok-com{color:var(--dsw-alias-label-secondary);font-style:italic}
.nb-tok-num{color:var(--dsw-static-amber-500, #f59e0b)}
.nb-tok-kw{color:var(--dsw-static-blue-450, #4d93f8);font-weight:600}
.nb-md-mathblock{margin:0 0 10px;padding:6px 2px;overflow-x:auto;overflow-y:hidden;text-align:center}
.nb-md-mathblock .katex-display{margin:0}
.nb-md-math.is-display{display:block;text-align:center;margin:6px 0;overflow-x:auto;overflow-y:hidden}.nb-md-math.is-rendered{display:inline;overflow:visible;box-sizing:border-box;vertical-align:bottom;font-family:inherit;font-style:normal;font-size:1.12em;white-space:nowrap;overflow-wrap:normal;word-break:normal;padding:0}
.nb-math-block .katex{white-space:nowrap;overflow-wrap:normal;word-break:normal}
.nb-math-block .katex-display{overflow-x:auto;overflow-y:hidden;margin:0;padding-bottom:2px}
.nb-math-block{margin:0 0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-markdown-code-block);overflow:hidden}
.nb-math-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 8px 5px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-markdown-code-block-banner)}
.nb-math-lang{font-size:11px;letter-spacing:.04em;color:var(--dsw-alias-label-secondary)}
.nb-math-body{padding:14px 16px;overflow-x:auto;overflow-y:hidden;text-align:center}
.nb-math-body .katex{font-size:1.3em}
.nb-math-body .katex-display{margin:0}
.nb-math-raw{margin:0;font-family:var(--ds-font-family-code, Consolas, "JetBrains Mono", "Cascadia Code", "Fira Code", "SFMono-Regular", Menlo, Monaco, "Courier New", monospace);font-size:12.5px;line-height:1.7;white-space:pre-wrap;text-align:left;color:var(--dsw-alias-label-secondary)}
.nb-md-hr{border:0;border-top:1px solid var(--dsw-alias-border-l1);margin:12px 0}
.nb-md-table-wrap{margin:0 0 10px;overflow-x:auto;overflow-y:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md)}
.nb-md-table{border-collapse:collapse;width:100%;font-size:12.5px}
.nb-md-table th,.nb-md-table td{padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);text-align:left}
.nb-md-table th{background:var(--dsw-alias-bg-layer-1);font-weight:600}
.nb-md-table tr:last-child td{border-bottom:0}
.nb-msg.is-streaming .nb-md > :last-child::after{content:"";display:inline-block;width:2px;height:13px;margin-left:3px;vertical-align:-2px;background:var(--dsw-alias-label-primary);animation:nb-blink 1s steps(2,end) infinite}
@keyframes nb-blink{50%{opacity:0}}@keyframes nb-rise{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes nb-fade-up{from{opacity:0}to{opacity:1}}@keyframes nb-pop{from{opacity:0}to{opacity:1}}
.nb-msg-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}
.nb-chip{display:inline-flex;align-items:center;gap:4px;height:25px;padding:0 9px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer}
.nb-chip:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.nb-chip:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}
.nb-chip.is-on{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}
.nb-chip:disabled{opacity:.45;cursor:default}
.nb-banner-text{flex:1;min-width:0}
.nb-banner-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:0;border-radius:var(--dsw-radius-xs);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.nb-banner-close:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-src-list{list-style:none;margin:0;padding:6px 10px;display:flex;flex-direction:column;gap:6px;border-left:2px solid var(--dsw-alias-border-l2);border-radius:0 var(--dsw-radius-lg) var(--dsw-radius-lg) 0;background:var(--dsw-alias-bg-layer-1)}
.nb-src-name{display:block;font-size:11px;color:var(--dsw-alias-brand-primary)}
.nb-src-list .nb-file-link{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;max-width:100%}
.nb-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-src-index{flex:none;color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums}
.nb-file-link{border:0;background:none;padding:0;font:inherit;font-size:11px;color:var(--dsw-static-blue-450, #4d93f8);cursor:pointer;text-align:left;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-file-link:hover{text-decoration:underline}
.nb-msg-attach{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:76%}
.nb-msg-attach .nb-file-link{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base)}
.nb-attach-row{display:flex;gap:6px;flex-wrap:wrap;padding:2px 0}
.nb-attach-chip{display:inline-flex;align-items:center;gap:2px;padding:2px 4px 2px 8px;border-radius:999px;border:1px dashed var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1)}
.nb-attach-remove{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.nb-attach-remove:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.nb-pop-wrap{position:relative;display:inline-flex;align-items:center}
.nb-popover{position:absolute;bottom:calc(100% + 8px);left:0;z-index:30;min-width:220px;max-width:340px;max-height:300px;overflow-y:auto;overflow-x:hidden;padding:6px;display:flex;flex-direction:column;gap:1px;border-radius:var(--dsw-radius-lg);border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base, #ffffff);border-color:#dfe3e8;box-shadow:0 10px 28px #0000001f}
.nb-popover.is-right{left:auto;right:0}
.nb-popover.is-below{top:calc(100% + 8px);bottom:auto}
.nb-pop-item{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;text-align:left;cursor:pointer}
.nb-pop-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-export-modal .nb-pop-item{font-family:inherit;font-size:13px;font-weight:400;line-height:1.6;padding:10px 12px;transition:background-color .12s ease}.nb-export-modal .nb-pop-item:is(:hover,:focus-visible,:active){background:var(--dsw-alias-interactive-bg-hover,#f0f1f3);outline:none}
.nb-selection-note-action{display:inline-flex;align-items:center;gap:4px;min-width:0}.nb-selection-note-action .nb-select-trigger{max-width:150px;font-size:11.5px}.nb-selection-bar{flex-wrap:wrap}.nb-ask-selection{transform:translateX(-50%);max-width:calc(100vw - 16px);flex-wrap:wrap;gap:0;padding:0;border-radius:10px;cursor:default;background:#ffffff;border:0;box-shadow:0 4px 16px rgba(15,17,21,.16);color:#1f2328}.nb-ask-selection .nb-btn{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border:0;border-radius:0;background:transparent;color:inherit;font-size:12px;box-shadow:none}.nb-ask-selection .nb-btn:first-child{border-radius:10px 0 0 10px}.nb-ask-selection .nb-btn:hover:not(:disabled){background:#f3f5f7}.nb-ask-selection .nb-selection-note-action{margin:0;padding:0;height:auto;gap:0;background:transparent;border:0;border-radius:0 10px 10px 0;box-shadow:none}.nb-ask-selection .nb-selection-note-action .nb-btn{height:30px;padding:0 12px;border:0;border-radius:0;background:transparent;box-shadow:none;font-size:12px}.nb-ask-selection .nb-selection-note-action .nb-btn:hover:not(:disabled){background:#f3f5f7;border-radius:0}.nb-ask-selection .nb-select-trigger{height:24px;max-width:120px;padding:0 4px;font-size:11.5px;white-space:nowrap;border:0;border-radius:0;background:transparent;color:#3c4148}.nb-ask-selection .nb-select-trigger:hover:not(:disabled){background:#f3f5f7;border-radius:0 10px 10px 0;color:#1f2328}.nb-ask-selection .nb-select-value{font-size:12px;color:inherit}.nb-ask-selection:is(:hover,:active){background:#ffffff;color:#1f2328;border-color:transparent}
@media (prefers-color-scheme: dark){
  .nb-ask-selection{background:#2b3036;border-color:#3c434b;color:#e8ebee}
  .nb-ask-selection .nb-btn:hover:not(:disabled){background:#343a41}
  .nb-ask-selection .nb-selection-note-action{background:#343a41;border-color:#3c434b}
  .nb-ask-selection .nb-select-trigger{color:#e8ebee}
  .nb-ask-selection:is(:hover,:active){background:#2b3036;color:#e8ebee;border-color:#4a525b}
}
.nb-pop-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-pop-index{flex:none;width:18px;color:var(--dsw-alias-label-secondary);font-size:11px;font-variant-numeric:tabular-nums}
.nb-pop-empty{padding:8px;margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6}
.nb-msg.is-flash{animation:nb-flash 1.5s ease}
@keyframes nb-flash{0%{background:var(--dsw-alias-interactive-bg-hover)}100%{background:transparent}}
.nb-src-snippet{display:block;max-height:260px;overflow-y:auto;overflow-x:hidden;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary);padding-right:2px}
.nb-src-snippet .nb-md-p{margin:0 0 6px}
.nb-src-snippet .nb-md-p:last-child{margin-bottom:0}
.nb-src-snippet .nb-md-list{margin:0 0 6px;padding-left:16px}
.nb-md-math.is-rendered.is-display{display:block;max-width:100%;overflow-x:auto;overflow-y:hidden}.nb-md .katex-display>.katex{display:block;width:max-content;min-width:100%}.nb-src-snippet .nb-math-body{padding:8px 4px}.nb-src-snippet .katex-display{overflow-x:auto;overflow-y:hidden;margin:6px 0;padding:2px 0}
.nb-followups{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px}
.nb-followups-label{font-size:11px;color:var(--dsw-alias-label-secondary)}
.nb-followup{border:1px dashed var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;padding:3px 10px;border-radius:999px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-followup:hover{color:var(--dsw-alias-label-primary);border-style:solid;border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-interactive-bg-hover)}
.nb-queued{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;background:var(--dsw-alias-bg-layer-1, #f0f2f5);color:var(--dsw-alias-label-secondary);font-size:11.5px}.nb-thinking>.nb-icon,.nb-thinking>svg{flex:none;color:var(--dsw-alias-label-tertiary)}.nb-thinking{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;min-height:20px}
.nb-spinner{flex:none;display:inline-block;width:14px;height:14px;animation:nb-spin .9s linear infinite}@keyframes nb-spin{to{transform:rotate(360deg)}}
@keyframes nb-spin{to{transform:rotate(360deg)}}
.nb-composer{position:sticky;bottom:0;z-index:2;flex:none;width:100%;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:6px;padding:10px 12px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base);transition:border-color .14s ease}
.nb-composer:focus-within{border-color:var(--dsw-alias-border-l2)}
.nb-ask-selection{position:fixed;z-index:65;display:inline-flex;align-items:center;gap:0;padding:0;border:0;border-radius:10px;background:#ffffff;color:#1f2328;font:inherit;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(15,17,21,.16)}.nb-ask-selection:hover{background:#ffffff;color:#1f2328;border-color:transparent}.nb-ask-selection:active{background:#ffffff;color:#1f2328;border-color:transparent}.nb-divider{flex:none;height:1px;background:var(--dsw-alias-border-l2);margin:0 0 10px}
.nb-textarea.is-question{resize:none;overflow-x:hidden;min-height:46px;max-height:240px;padding:6px 4px 7px;line-height:1.7;border-color:transparent;background:transparent;border-radius:var(--dsw-radius-md);overflow-y:hidden}
.nb-textarea.is-question:focus{border-color:transparent}
.nb-composer-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}.nb-box-body.has-reader .nb-composer-row{flex-wrap:nowrap;gap:6px}.nb-box-body.has-reader .nb-composer-row .nb-select{display:none}.nb-box-body.has-reader .nb-composer-row .nb-btn.is-primary{flex:none}
.nb-select-trigger.is-field{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);padding:0 8px;height:28px;gap:6px}
.nb-select-trigger.is-field:hover:not(:disabled){border-color:var(--dsw-alias-border-l2)}
.nb-select{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-caption);font-size:11px}
.nb-select-label{white-space:nowrap;color:var(--dsw-alias-label-caption)}
.nb-select-trigger{display:inline-flex;align-items:center;gap:4px;height:28px;max-width:200px;padding:0 4px 0 6px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;cursor:pointer;min-width:0}
.nb-select-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.nb-select-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));outline:none}
.nb-select-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.nb-select-value{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-select-chevron{flex:none;display:flex;color:var(--dsw-alias-label-caption)}
.nb-select-menu{min-width:190px;max-height:280px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:1px}
.nb-select-option{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;text-align:left;cursor:pointer}
.nb-select-option:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-select-option.is-active{background:var(--dsw-alias-button-ghost-active-fill);font-weight:500}
.nb-select-check{flex:none;width:14px;display:inline-flex;justify-content:center;color:var(--dsw-alias-label-caption)}
.nb-model-trigger.is-field{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);padding:0 8px;height:28px;gap:8px;font-size:13px}
.nb-model-trigger.is-field:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base)}
.nb-menu-card{display:flex;flex-direction:column;min-width:270px;padding:2px}
.nb-menu-row{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;font-size:12.5px;text-align:left;cursor:pointer}
.nb-menu-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-menu-row-label{flex:none;color:var(--dsw-alias-label-primary);font-weight:500}
.nb-menu-row-value{margin-left:auto;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-menu-chevron{flex:none;color:var(--dsw-alias-label-caption);transform:rotate(-90deg)}
.nb-menu-list{display:flex;flex-direction:column;gap:1px;min-width:230px;max-height:300px;overflow-y:auto;overflow-x:hidden}
.nb-menu-back{display:flex;align-items:center;gap:4px;padding:9px 10px;margin:0;border:0;background:transparent;color:var(--dsw-alias-label-caption);font:inherit;font-size:11.5px;cursor:pointer;border-radius:var(--dsw-radius-sm);justify-content:flex-start}
.nb-menu-back:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.nb-model{display:inline-flex;align-items:center}
.nb-model-trigger{display:inline-flex;align-items:center;gap:6px;height:28px;max-width:min(300px,40vw);padding:0 6px 0 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;cursor:pointer;min-width:0}
.nb-model-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.nb-model-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));outline:none}
.nb-model-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.nb-model-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.nb-model-effort{flex:none;color:var(--dsw-alias-label-caption);font-size:12.5px}
.nb-model-menu{display:flex;flex-direction:column;gap:1px;min-width:220px;max-width:340px;max-height:320px;overflow-y:auto;overflow-x:hidden}
.nb-menu-caption{margin:6px 8px 2px;font-size:11px;color:var(--dsw-alias-label-caption)}
.nb-menu-group{display:flex;flex-direction:column;gap:1px}
.nb-menu-group+.nb-menu-group{margin-top:4px;padding-top:4px;border-top:1px solid var(--dsw-alias-border-l1)}
.nb-menu-group-label{padding:4px 8px 2px;font-size:11px;font-weight:600;color:var(--dsw-alias-label-caption);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nb-menu-item{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12.5px;text-align:left;cursor:pointer}
.nb-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-menu-item.is-active{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}
.nb-composer-row .nb-btn.is-primary{margin-left:auto}
.nb-pending{display:flex;align-items:center;gap:8px;max-width:100%;padding:5px 6px 5px 10px;border-radius:10px;background:#1b1f24;border:1px solid #ffffff24;color:#fff;font-size:11.5px;line-height:1.5;box-shadow:0 1px 3px #00000026}
.nb-pending-tag{flex:none;display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:999px;background:#ffffff1f;color:#fff;font-size:11px}
.nb-pending-source{flex:none;max-width:32%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ffffffa8;font-size:11px}
.nb-pending-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ffffffe6}
.nb-pending-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:0;border-radius:50%;background:transparent;color:#ffffffb3;cursor:pointer}
.nb-pending-close:hover{background:#ffffff26;color:#fff}
.nb-import-modal{width:min(520px,100%)}
.nb-import-list{display:flex;flex-direction:column;gap:2px;max-height:46vh;overflow-y:auto;margin:2px 0 10px}
.nb-import-row{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:var(--dsw-radius-sm);cursor:pointer;font-size:12.5px;color:var(--dsw-alias-label-primary)}
.nb-import-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nb-import-row.is-picked{background:var(--dsw-alias-button-ghost-active-fill)}
.nb-import-row input{width:15px;height:15px;flex:none;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.nb-import-index{flex:none;width:16px;color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums;text-align:right}
.nb-import-stem{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-import-kind{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary)}
.nb-notes-meta-row .nb-select{flex:none}
.nb-fatal{margin:16px;padding:12px;border-radius:var(--dsw-radius-md);border:1px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);font-size:12px}
.nb-fatal pre{margin:6px 0 0;white-space:pre-wrap;font-size:11px}
.nb-ask-selection{border-radius:10px;cursor:default}.nb-ask-selection:is(:hover,:active){background:#ffffff;color:#1f2328;border-color:transparent}
/* Single-pill action: same 28px height as .nb-btn, no nested button chrome.
   An explicit opaque fill keeps the line underneath from showing through. */
.nb-ask-selection.is-action{height:30px;padding:0 12px;border-radius:10px;font-size:12px;cursor:pointer;z-index:200;background:#ffffff;border:0;color:#1f2328;box-shadow:0 4px 16px rgba(15,17,21,.16)}
.nb-ask-selection.is-action:is(:hover,:active){background:#f3f5f7;border-color:transparent;color:#1f2328}
@media (prefers-color-scheme: dark){
  .nb-ask-selection{background:#2b3036;box-shadow:0 4px 16px rgba(0,0,0,.45)}
  .nb-ask-selection:hover,.nb-ask-selection:active,.nb-ask-selection:is(:hover,:active){background:#2b3036;color:#e8ebee}
  .nb-ask-selection .nb-btn:hover:not(:disabled){background:#343a41}
  .nb-ask-selection .nb-selection-note-action{border-left-color:#3c434b}
  .nb-ask-selection .nb-selection-note-action .nb-btn:hover:not(:disabled){background:#343a41}
  .nb-ask-selection .nb-select-trigger{color:#e8ebee}
  .nb-ask-selection.is-action{background:#2b3036;color:#e8ebee}
  .nb-ask-selection.is-action:is(:hover,:active){background:#343a41;color:#e8ebee}
}
.nb-modal.nb-changelog{display:flex;flex-direction:column;padding:0;height:min(560px,86vh);max-height:min(560px,86vh);overflow:hidden}.nb-modal.nb-changelog .nb-modal-head{position:static;flex:none;margin:0;padding:16px 18px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base,#fff)}.nb-modal.nb-changelog .nb-changelog-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:8px 18px 4px}.nb-modal.nb-changelog .nb-modal-actions{position:static;flex:none;margin:0;padding:10px 18px 16px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base,#fff)}.nb-modal.nb-changelog{width:min(520px,100%);max-height:min(560px,86vh);overflow-y:auto;overflow-x:hidden}.nb-changelog-version{display:flex;flex-direction:column;gap:8px}.nb-changelog-version+.nb-changelog-version{border-top:1px solid var(--dsw-alias-border-l1);padding-top:12px;margin-top:12px}.nb-changelog-version-head{display:flex;align-items:center;gap:8px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;font-weight:600;padding:2px 0;cursor:pointer;text-align:left}.nb-changelog-version-head.is-current{color:var(--dsw-alias-label-primary)}.nb-changelog-body{display:flex;flex-direction:column;gap:10px}.nb-changelog-group{display:flex;flex-direction:column;gap:6px}.nb-changelog-title{margin:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}.nb-changelog-list{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:13px;line-height:1.7;color:var(--dsw-alias-label-primary)}.nb-modal{box-sizing:border-box;max-height:calc(100dvh - 48px);font-weight:400}.nb-modal-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;z-index:3;padding:8px 0 10px;background:var(--dsw-alias-bg-base);line-height:1.2}.nb-settings-modal .nb-modal-title{font-size:17px}.nb-settings-modal{width:min(760px,100%);height:min(78vh,660px);overflow:hidden}.nb-settings{flex:1;min-height:0}.nb-settings-tabs{flex:none;width:148px;align-self:stretch;display:flex;flex-direction:column;gap:2px;padding:0;margin:0;overflow:visible;position:static}.nb-settings-tab{gap:9px;display:flex;align-items:center;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13.5px;padding:8px 10px;border-radius:8px;text-align:left;cursor:pointer;transition:background-color .14s ease,color .14s ease}.nb-settings-tab:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.nb-settings-tab.is-active{background:#eceff3!important;color:var(--dsw-alias-label-primary)!important;font-weight:600}.nb-settings .nb-settings-group{scroll-margin-top:8px}.nb-settings-content{flex:1;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:6px;display:flex;flex-direction:column;gap:2px;animation:nb-fade .14s ease-out}.nb-settings-content > [hidden]{display:none!important}.nb-settings .nb-select{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,auto);gap:16px;align-items:center;padding:13px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}.nb-settings .nb-select-label{display:flex;flex-direction:column;gap:2px;white-space:normal;line-height:1.5;font-size:14px;color:var(--dsw-alias-label-primary)}.nb-select-desc{font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-secondary)}.nb-settings .nb-pop-wrap{min-width:0;width:100%}.nb-settings .nb-select-trigger{max-width:none;width:100%;box-sizing:border-box}.nb-settings .nb-select-value{font-size:14px;color:var(--dsw-alias-label-primary)}.nb-settings .nb-check{line-height:1.6;white-space:normal}.nb-popover[popover]{color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;font-weight:400}.nb-modal.nb-changelog .nb-changelog-version-head{margin:0;font-size:13.5px;font-weight:600;color:var(--dsw-alias-label-primary);cursor:default}.nb-modal.nb-changelog button.nb-changelog-version-head{cursor:pointer;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;gap:6px;line-height:1.4}.nb-modal.nb-changelog button.nb-changelog-version-head::after{content:"";flex:none;width:4px;height:4px;margin-top:-2px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);transform-origin:center;transition:transform .15s ease}.nb-modal.nb-changelog button.nb-changelog-version-head[aria-expanded="true"]::after{margin-top:1px;transform:rotate(-135deg)}
.nb-dragging .nb-nav-slot,.nb-dragging .nb-nav-preview,.nb-box:has(.nb-reader-side:hover) .nb-nav-slot,.nb-box:has(.nb-reader-side:hover) .nb-nav-preview{visibility:hidden;pointer-events:none}
.nb-nav-preview{max-height:248px;pointer-events:auto}.nb-nav-preview-a{display:block;max-height:180px;overflow:auto;font-size:12px;-webkit-line-clamp:unset}.nb-nav-preview-q{flex:none}.nb-msg-actions,.nb-followups,.nb-src-list{animation:nb-actions-in .24s cubic-bezier(.22,1,.36,1) both}.nb-followups{animation-delay:.05s}.nb-followup{animation:nb-actions-in .25s ease both}.is-streaming .nb-md> *{animation:nb-text-in .18s ease-out both}@keyframes nb-actions-in{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}@keyframes nb-text-in{from{opacity:.35;transform:translateY(2px)}to{opacity:1;transform:none}}
.nb-toast{position:fixed;top:60px;left:50%;z-index:100;transform:translateX(-50%);padding:9px 18px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 6px 24px #0002;font-size:13px;pointer-events:none;animation:nb-toast-in .25s cubic-bezier(.22,1,.36,1) both,nb-toast-out .35s ease 2.4s forwards}@keyframes nb-toast-in{from{opacity:0;transform:translate(-50%,-12px) scale(.95)}to{opacity:1;transform:translate(-50%,0) scale(1)}}@keyframes nb-toast-out{30%{transform:translate(-50%,3px)}to{opacity:0;transform:translate(-50%,-12px)}}
@media(prefers-reduced-motion:reduce){.nb-msg-actions,.nb-followups,.nb-followup,.nb-src-list,.is-streaming .nb-md> *,.nb-toast{animation:none}}
.nb-nav{position:fixed;justify-content:flex-start;align-items:stretch;gap:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:4px 0;scroll-behavior:auto}.nb-nav::-webkit-scrollbar{display:none}.nb-nav-item{flex:none;height:var(--nb-step,20px)}.nb-nav-tick{height:100%;width:32px}.nb-nav-tick::before{width:14px;transform:scaleX(1);transition:transform .18s cubic-bezier(.22,1,.36,1),background-color .18s ease}.nb-nav-tick:is(:hover,:focus-visible)::before{transform:scaleX(1.3)}.nb-nav-tick.is-current::before{background:transparent}.nb-nav-indicator{position:absolute;right:0;top:4px;width:20px;height:2px;border-radius:2px;background:var(--dsw-alias-label-primary);pointer-events:none;transform:translateY(calc(var(--nb-index,0) * var(--nb-step,20px) + var(--nb-step,20px) / 2 - 1px));transition:transform .24s cubic-bezier(.22,1,.36,1)}
@media(prefers-reduced-motion:reduce){.nb-nav-indicator,.nb-nav-tick::before{transition:none}}
/* One code font across every surface: answers, notes, reader, sources, previews. */
.nb-root code,.nb-root pre,.nb-root kbd,.nb-root samp,.nb-root tt,
.nb-root .nb-code-area,.nb-root .nb-code-mirror,.nb-root .nb-notes-body,
.nb-root .nb-md-math,.nb-root .nb-math-raw,.nb-root .nb-md-pre code,
.nb-root .nb-code-mirror *,.nb-root .nb-export-preview pre{
  font-family: var(--nb-font-code, Consolas, Menlo, Monaco, monospace) !important;
  font-size: var(--nb-font-code-size, 12.5px);
}
`

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          loadMath()
          return () => undefined
        }, 'notebook: math assets')
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'notebook: dictionaries')
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-notebook'
          tag.textContent = CSS
          document.head.appendChild(tag)
          return () => tag.remove()
        }, 'notebook: styles')

        const t = ctx.locale.bind(NS)

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, NotebookPage))

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 30,
          label: () => t('panel'),
          locale: NS,
        }, NotebookIcon))

        // Each finalized answer in a normal chat can be filed into a study box.
        ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
          name: 'conversation.chat.assistant-actions',
          id: 'notebook-save',
          order: 20,
          locale: NS,
        }, ChatSaveAction))
      },
      // Exposed only for the offline render smoke test; the module loader
      // consumes `inject` and `apply` and ignores everything else.
      __test: {
        NotebookPage,
        BoxView,
        MaterialsPane,
        AskPane,
        MessageItem,
        StreamingItem,
        NotesPane,
        PracticePane,
        ChatSaveAction,
        ModelMenu,
        stemPreview,
        answerPlain,
        cleanVerdictNoise,
        extractAssistantText,
        NotebookIcon,
        markdownNodes,
        dict: zh,
      },
    }
  },
})
