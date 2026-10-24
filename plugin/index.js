/**
 * Host half of the NoteBook bundle.
 *
 * Everything is local: study boxes, imported materials, extracted text, chat
 * history, notes, and the wrong-answer book live under
 * `<DSH_HOME>/notebook/` as plain JSON. No network, no server
 * component; the only outbound call is the model call the user asks for.
 *
 * The browser half reaches this half over one authenticated prefix route on
 * the Harness Web server. Every request is admitted through
 * `connection.admit()`, so it carries the same browser-session and
 * Host/Origin checks as the rest of the GUI.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { pdfToText } from './pdf.js'

/** Route prefix owned by this plugin. */
const ROUTE = '/notebook'

/** Directory holding the vendored browser assets (KaTeX). */
function vendorRoot() {
  return fileURLToPath(new URL('./vendor/', import.meta.url))
}

/** Content types for the small set of vendored asset kinds we serve. */
const ASSET_TYPES = new Map([
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
  ['.ttf', 'font/ttf'],
  ['.svg', 'image/svg+xml'],
  ['.map', 'application/json; charset=utf-8'],
])

/** Largest JSON body accepted from the page. */
const MAX_BODY_BYTES = 32 * 1024 * 1024

/** Services required before activation. */
export const inject = ['connection', 'webServer', 'llm', 'agentDefaultModel']

/** Store format version, bumped when the on-disk shape changes. */
const STORE_VERSION = 1

/** Characters per retrieval chunk. */
const CHUNK_CHARS = 700

/** Overlap between neighbouring chunks so a sentence is not cut in half. */
const CHUNK_OVERLAP = 120

/** Maximum excerpts sent to the model for one answer. */
const MAX_EXCERPTS = 8

/** Total excerpt characters kept in one prompt. */
const MAX_CONTEXT_CHARS = 9000

/** Characters of one material profile kept in a prompt. */
const PROFILE_CHARS = 500

/** Profiles packed into one answer prompt, bounding growth on wide boxes. */
const MAX_PROFILES = 3

/** Retrieval widths the user can pick for grounded answers. */
const QA_SCOPES = [3, 5, 8]

/** Answers kept from the box history when a question refers back. */
const HISTORY_TURNS = 4

// ---------------------------------------------------------------------------
// Paths and files
// ---------------------------------------------------------------------------

/** Resolve the DSH home directory the Host process was launched with. */
function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv
  return path.join(os.homedir(), '.dsh')
}

/** Root directory of every NoteBook-owned file. */
function dataRoot() {
  return path.join(dshHome(), 'notebook')
}

/** Per-box material originals. */
function materialsRoot() {
  return path.join(dataRoot(), 'materials', 'saves')
}

function safeFileName(value, fallback, limit = 100) {
  let name = String(value ?? '').replace(/[<>:"/\\|?*\x00-\x1f]/gu, '_').trim().slice(0, limit).replace(/[. ]+$/u, '')
  if (!name || name === '.' || name === '..') name = fallback
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(name) ? `_${name}` : name
}

/** Human-readable directories, with numeric suffixes for duplicate study-space names. */
async function materialDirectory(box) {
  if (box.materialFolder) return path.join(materialsRoot(), safeFileName(box.materialFolder, '学习区', 120))
  const name = safeFileName(box.name, '学习区')
  for (let suffix = 1; ; suffix++) {
    const folder = suffix === 1 ? name : `${name} (${suffix})`
    const directory = path.join(materialsRoot(), folder)
    await fs.mkdir(directory, { recursive: true })
    try {
      await fs.writeFile(path.join(directory, '.notebook-owner.json'), JSON.stringify({ boxId: box.id }), { flag: 'wx' })
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      if ((await readJson(path.join(directory, '.notebook-owner.json'), {})).boxId !== box.id) continue
    }
    box.materialFolder = folder
    return directory
  }
}

/** Generated materials are Markdown files; imported source files stay at their original paths. */
async function persistMaterial(box, material, original) {
  const directory = await materialDirectory(box)
  const stem = safeFileName(path.basename(material.name.replace(/\\/gu, '/')).replace(/\.(md|markdown|pdf|txt|json|csv|log|html|tex)$/iu, ''), '资料')
  for (let suffix = 1; ; suffix++) {
    const filename = `${stem}${suffix === 1 ? '' : ` (${suffix})`}.md`
    const target = path.join(directory, filename)
    try { await fs.writeFile(target, material.text, { encoding: 'utf8', flag: 'wx' }) }
    catch (error) { if (error.code === 'EEXIST') continue; throw error }
    material.path = target
    break
  }
  if (original && material.kind === 'pdf') {
    material.originalPath = material.path.replace(/\.md$/u, '.pdf')
    try { await fs.writeFile(material.originalPath, original, { flag: 'wx' }) }
    catch (error) { if (error.code !== 'EEXIST') throw error }
  }
}

/** Index file listing every box summary. */
function indexPath() {
  return path.join(dataRoot(), 'boxes.json')
}

/** Full record file for one box. */
function boxPath(id) {
  return path.join(dataRoot(), 'boxes', `${id}.json`)
}

/** Read JSON, returning `fallback` only when the file does not exist. */
async function readJson(file, fallback) {
  let text
  try {
    text = await fs.readFile(file, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`notebook: ${path.basename(file)} is not valid JSON (${String(error)})`)
  }
}

/** Write JSON atomically so an interrupted write cannot truncate user data. */
async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${randomUUID()}.tmp`
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await fs.rename(temporary, file)
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

/** Empty index. */
function emptyIndex() {
  return { version: STORE_VERSION, boxes: [] }
}

/** Summary projection shown in the rail, without the heavy fields. */
function summarize(box) {
  return {
    id: box.id,
    name: box.name,
    description: box.description,
    createdAt: box.createdAt,
    updatedAt: box.updatedAt,
    materialCount: Array.isArray(box.materials) ? box.materials.length : 0,
    noteCount: Array.isArray(box.notes) ? box.notes.length : 0,
    messageCount: Array.isArray(box.messages) ? box.messages.length : 0,
    wrongCount: Array.isArray(box.wrong) ? box.wrong.length : 0,
  }
}

/** A brand-new box record. */
function emptyBox(name, description) {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    settings: { defaultNoteSection: '今日知识点', multiSelectNotes: false, qaScope: 5 },
    materials: [],
    messages: [],
    notes: [],
    wrong: [],
  }
}

/** Trim and validate a user-provided box name. */
function boxName(raw, fallback) {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (text.length === 0) return fallback
  return text.slice(0, 120)
}

/** Reject a missing or malformed box id before it reaches the filesystem. */
function requireId(payload) {
  const id = payload?.id ?? payload?.boxId
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/u.test(id)) {
    throw new Error('notebook: a valid box id is required')
  }
  return id
}

/** First-run name for the nth box. */
function defaultBoxName(existing) {
  return `学习区 ${existing.length + 1}`
}

/** Local calendar day key, used for "today" scoping in exports. */
function dayKey(value) {
  const date = value === undefined ? new Date() : new Date(value)
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Whether a stored ISO timestamp falls on the current local day. */
function isToday(iso) {
  return typeof iso === 'string' && dayKey(iso) === dayKey()
}

/** Normalise a user-provided tag list. */
function normaliseTags(raw) {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw
    .map((tag) => (typeof tag === 'string' ? tag.trim().replace(/^#/u, '') : ''))
    .filter((tag) => tag.length > 0 && tag.length <= 30))].slice(0, 12)
}

/** A short excerpt from a material, used as the inline recap next to a link. */
function materialRecap(box, materialId) {
  const material = (box.materials ?? []).find((entry) => entry.id === materialId)
  if (material === undefined) return ''
  const text = (material.text ?? '').replace(/\s+/gu, ' ').trim()
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

/** Export ranges: the heading used inside the file and the filename suffix. */
const EXPORT_SCOPES = {
  notes: { title: '今日知识点', file: '知识点' },
  qa: { title: '今日问答', file: '问答' },
  extend: { title: '知识扩展', file: '扩展' },
  practice: { title: '练习题', file: '题目' },
  wrong: { title: '错题本', file: '错题' },
  all: { title: '全部', file: '全部' },
}

/** "- A. option" lines for one choice question. */
function exportOptions(question) {
  const options = Array.isArray(question.options) ? question.options : []
  return options.map((option, index) => `- ${optionLine(question, index)}`).join('\n')
}

/** One answered question in the wrong-answer book, ready to paste into a note. */
function renderWrongEntry(entry, index) {
  const lines = [`### ${index + 1}. ${String(entry.question ?? '').trim() || '（无题干）'}`, '']
  if (entry.kind === 'choice') {
    const options = exportOptions(entry)
    if (options !== '') lines.push(options, '')
  }
  if (entry.given !== undefined && entry.given !== null && entry.given !== '') lines.push(`**我的作答：** ${entry.given}`)
  if (entry.kind === 'choice' && Number.isInteger(entry.answerIndex)) {
    lines.push(`**正确答案：** ${optionLine(entry, entry.answerIndex)}`)
  } else if (typeof entry.referenceAnswer === 'string' && entry.referenceAnswer !== '') {
    lines.push(`**参考答案：** ${entry.referenceAnswer}`)
  }
  if (Array.isArray(entry.issues) && entry.issues.length > 0) {
    lines.push(`**问题：** ${entry.issues.map((issue) => `${issue.where === '' || issue.where === undefined ? '' : `${issue.where}：`}${issue.what}`).join('；')}`)
  }
  const explanation = typeof entry.explanation === 'string' && entry.explanation !== '' ? entry.explanation : String(entry.answer ?? '')
  if (explanation !== '') lines.push('', `**解析：** ${explanation}`)
  lines.push('')
  return lines
}

/** One practice question with its answer, explanation and any given response. */
function renderPracticeQuestion(question, response, index) {
  const lines = [`### ${index + 1}. ${String(question.stem ?? '').trim()}`, '']
  if (question.type === 'choice') {
    const options = exportOptions(question)
    if (options !== '') lines.push(options, '')
    lines.push(`**答案：** ${optionLine(question, question.answerIndex)}`)
  } else {
    if (typeof question.referenceAnswer === 'string' && question.referenceAnswer !== '') lines.push(`**参考答案：** ${question.referenceAnswer}`)
    if (Array.isArray(question.rubric) && question.rubric.length > 0) {
      lines.push('', '**评分要点：**')
      for (const item of question.rubric) lines.push(`- ${item}`)
    }
  }
  // A graded answer carries feedback written for that answer; prefer it.
  const note = typeof response?.explanation === 'string' && response.explanation !== ''
    ? response.explanation
    : (typeof question.explanation === 'string' ? question.explanation : '')
  if (note !== '') lines.push('', `**解析：** ${note}`)
  if (response !== undefined) {
    const given = question.type === 'choice' ? optionLine(question, Number.isInteger(response.choice) ? response.choice : -1) : String(response.text ?? '')
    if (given !== '') lines.push('', `**我的作答：** ${given}`)
    lines.push(`**结果：** ${response.correct === true ? '正确' : '错误'}`)
  }
  lines.push('')
  return lines
}

/**
 * Render one export document.
 * @param box - box record.
 * @param scope - one of EXPORT_SCOPES.
 */
function renderExport(box, scope) {
  const wantsNotes = scope === 'notes' || scope === 'all'
  const wantsQa = scope === 'qa' || scope === 'all'
  const wantsExtend = scope === 'extend' || scope === 'all'
  const wantsPractice = scope === 'practice' || scope === 'all'
  const wantsWrong = scope === 'wrong' || scope === 'all'
  const lines = []
  lines.push(`# ${box.name}`)
  lines.push('')
  lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}　范围：${EXPORT_SCOPES[scope]?.title ?? '全部'}`)
  lines.push('')

  if (wantsNotes) {
    const notes = (box.notes ?? []).slice().sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
    lines.push('## 知识点笔记')
    lines.push('')
    if (notes.length === 0) {
      lines.push('（还没有笔记）')
      lines.push('')
    }
    let lastSection = ''
    for (const note of notes) {
      const section = typeof note.section === 'string' && note.section.trim().length > 0 ? note.section.trim() : '未分类'
      if (section !== lastSection) {
        lines.push(`### ${section}`)
        lines.push('')
        lastSection = section
      }
      lines.push(`#### ${note.title}`)
      const tags = Array.isArray(note.tags) && note.tags.length > 0 ? note.tags.map((tag) => `#${tag}`).join(' ') : ''
      if (tags !== '') lines.push(`标签：${tags}`)
      const refs = Array.isArray(note.refs) ? note.refs : []
      if (refs.length > 0) {
        lines.push(`关联：${refs.map((ref) => `[[${ref.name}]]`).join(' · ')}`)
        for (const ref of refs) {
          const recap = materialRecap(box, ref.id)
          if (recap !== '') lines.push(`> 可参考《${ref.name}》：${recap}`)
        }
      }
      lines.push('')
      lines.push(String(note.body ?? '').trim())
      lines.push('')
    }
  }

  if (wantsQa) {
    lines.push('## 今日问答')
    lines.push('')
    const todays = (box.messages ?? []).filter((message) => isToday(message.createdAt) && (message.kind === 'qa' || message.kind === 'hint'))
    if (todays.length === 0) {
      lines.push('（今天还没有问答）')
      lines.push('')
    }
    for (const message of todays) {
      if (message.role === 'user') lines.push(`**问：** ${message.text}`)
      else {
        lines.push('')
        lines.push(message.kind === 'hint' ? '**提示：**' : '**答：**')
        lines.push('')
        lines.push(String(message.text).trim())
      }
      lines.push('')
    }
  }

  if (wantsExtend) {
    lines.push('## 知识扩展')
    lines.push('')
    const extensions = (box.messages ?? []).filter((message) => message.kind === 'extend' && isToday(message.createdAt))
    if (extensions.length === 0) {
      lines.push('（今天还没有延伸拓展）')
      lines.push('')
    }
    for (const message of extensions) {
      lines.push(String(message.text).trim())
      lines.push('')
      const refs = Array.isArray(message.sources) ? message.sources.slice(0, 3) : []
      if (refs.length > 0) {
        lines.push(`关联：${refs.map((ref) => `[[${ref.materialName}]]`).join(' · ')}`)
        lines.push('')
      }
    }
  }

  if (wantsPractice) {
    lines.push('## 练习题')
    lines.push('')
    const questions = Array.isArray(box.practice?.questions) ? box.practice.questions : []
    if (questions.length === 0) {
      lines.push('（还没有练习题）')
      lines.push('')
    }
    const responses = box.practice?.responses ?? {}
    questions.forEach((question, index) => {
      lines.push(...renderPracticeQuestion(question, responses[question.id], index))
    })
  }

  if (wantsWrong) {
    lines.push('## 错题本')
    lines.push('')
    const wrong = Array.isArray(box.wrong) ? box.wrong : []
    if (wrong.length === 0) {
      lines.push('（还没有错题）')
      lines.push('')
    }
    wrong.forEach((entry, index) => {
      lines.push(...renderWrongEntry(entry, index))
    })
  }

  return `${lines.join('\n').replace(/\n{3,}/gu, '\n\n').trim()}\n`
}

/** Summarise one note into a tight structured digest. */
function summarySystem() {
  return [
    '你是学习笔记的整理助手。',
    '',
    '规则：',
    '1. 把用户给出的笔记整理成结构化摘要：先一句话总览，再 3–6 条要点，必要时补一句「小结」。',
    '2. 用 Markdown（小标题、列表、加粗），公式用 $…$。',
    '3. 只整理已有的学习知识，不新增事实；排除闲聊、界面操作、导出要求、系统规则和提示词。不要向用户复述整理规则。',
    '没有可整理的知识点时，只返回 NO_KNOWLEDGE。',
    '4. 总长不超过 400 字。',
    '5. 使用与笔记相同的语言。',
  ].join('\n')
}

/** Fold one day of questions, answers and notes into a review-ready note. */
function dailySummarySystem() {
  return [
    '你在帮学生整理「今日学习总结」，输出可以直接存进笔记的 Markdown。',
    '只总结用户实际学到的概念、公式、解法和易错点。排除闲聊、软件操作、设置、导出要求、提示词、隐藏规则及资料未覆盖的拒答。不要总结对话过程或复述你的工作规则。',
    '已有的今日总结不参与重复总结。若今日内容没有学习知识，只返回 NO_KNOWLEDGE，不要凑数。',
    '',
    '结构固定为：',
    '## 今日概览',
    '两到三句，概括今天学了什么、解决了什么。',
    '',
    '## 关键知识点',
    '列表，每条一句结论；能对应到资料或笔记的，用（见《名称》）标注。',
    '',
    '## 易错点',
    '如有，列出今天出现过的错误或模糊点；没有就写「今天没有暴露出明显的易错点」。',
    '',
    '## 待复习',
    '如有，列出需要再看看的点；没有就省略这一节。',
    '',
    '硬性要求：只依据给到的今日内容，不补充新知识，不编造出处；公式用 $…$；总长不超过 600 字。',
  ].join('\n')
}

/** Write one exam question set; `kind` selects choice-only, open-only or mixed. */
function quizSystem(count, kind, difficulty) {
  const shape = kind === 'open'
    ? '全部出 open 题（需要学生自己写答案，适合代码题、证明题、计算题）。'
    : kind === 'choice'
      ? '全部出 choice 单选题。'
      : '混合出题：至少一道 choice（概念辨析），其余用 open（代码题、证明题、计算题）。'
  const level = difficulty === 'basic'
    ? '基础：直接套用资料里的定义与公式，一到两步即可解出。'
    : difficulty === 'advanced'
      ? '进阶：需要多步推理或综合两处以上资料，允许设置陷阱（如边界条件、易混概念）。'
      : difficulty === 'any'
        ? '不限：按资料本身能支撑的难度出题，由你判断，从基础到进阶都可以，但不得超纲。'
        : '中等：需要两三步推理，接近常规考试难度。'
  return [
    `你是出题老师，请出 ${count} 道题。${shape}`,
    '',
    '要求：',
    `1. 只考《参考资料》覆盖的内容；难度要求：${level}`,
    '2. choice 题：一个正确选项，三个干扰项对应常见错误，不能明显凑数。',
    '3. open 题：给出参考答案 referenceAnswer，以及可选的评分要点 rubric（2–4 条）。',
    '4. 题干简洁，公式用 $…$；代码题用 ``` 代码块。',
    '5. 解析 explanation 要说明「为什么这样做」，并指出一个易错点。',
    '6. 只输出一个 JSON 数组，每项形如：',
    '{"type":"choice","stem":"题干","options":["A","B","C","D"],"answerIndex":0,"explanation":"解析"}',
    '{"type":"open","stem":"题干","referenceAnswer":"参考答案","rubric":["要点1","要点2"],"explanation":"解析"}',
    '7. 不要输出任何解释文字或代码块标记。',
    '8. 只给必要的简短参考答案与解析，题干不超过 180 字、参考答案不超过 350 字、解析不超过 180 字；不输出思考过程。JSON 字符串中的 LaTeX 反斜杠必须正确转义。',
  ].join('\n')
}

/** Parse a generated question set defensively; keeps choice and open items. */
function parseQuiz(text, limit) {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return []
  let parsed
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const items = []
  for (const raw of parsed) {
    if (raw === null || typeof raw !== 'object') continue
    const stem = typeof raw.stem === 'string' ? raw.stem.trim() : ''
    if (stem.length === 0) continue
    const options = Array.isArray(raw.options)
      ? raw.options.filter((option) => typeof option === 'string').map((option) => option.trim()).slice(0, 4)
      : []
    const answerIndex = Number.isInteger(raw.answerIndex) ? raw.answerIndex : -1
    const referenceAnswer = typeof raw.referenceAnswer === 'string' ? raw.referenceAnswer.trim() : ''
    const isChoice = raw.type === 'choice' && options.length >= 2 && answerIndex >= 0 && answerIndex < options.length
    const isOpen = !isChoice && referenceAnswer.length > 0
    if (!isChoice && !isOpen) continue
    items.push({
      type: isChoice ? 'choice' : 'open',
      stem,
      options: isChoice ? options : [],
      answerIndex: isChoice ? answerIndex : -1,
      referenceAnswer: isChoice ? options[answerIndex] : referenceAnswer,
      rubric: Array.isArray(raw.rubric)
        ? raw.rubric.filter((entry) => typeof entry === 'string').map((entry) => entry.trim()).filter((entry) => entry.length > 0).slice(0, 4)
        : [],
      explanation: typeof raw.explanation === 'string' ? raw.explanation.trim() : '',
    })
    if (items.length >= limit) break
  }
  return items
}

/** Write one short material profile, generated once at import time. */
function profileSystem() {
  return [
    '你在为一份学习资料写「资料画像」，供后续问答时快速判断它覆盖了什么。',
    '',
    '要求：',
    '1. 只依据给定原文概括，不补充外部知识，不编造原文没有的内容。',
    '2. 用 3–5 句话说明：主题范围、关键概念/公式/结论、适合回答哪类问题。',
    '3. 不超过 200 字，直接输出正文；不要标题、不要分点、不要解释。',
  ].join('\n')
}

/**
 * Grade one answer, writing feedback that matches what the student actually
 * submitted rather than a general note about the topic.
 * @param kind - 'choice' for options, 'open' for free-form answers.
 */
function gradeSystem(kind = 'open') {
  const rules = [
    '只对照《正确答案》与《评分要点》判断对错；允许等价写法，不要因为表述不同就判错。',
    'explanation 必须针对学生这一次的答案来写，不要写放之四海皆准的套话。',
    kind === 'choice'
      ? '学生选错时，点明这个选项为什么不成立（它实际对应什么结论），再说明正确选项为什么成立。'
      : '作答有误时，逐条指出错误处：where 写具体位置（行号、步骤、哪一段、哪个式子），what 写错在哪、应该怎么改。',
    '学生答对时 issues 一律留空（步骤或说法有小瑕疵也写进 explanation），不要复述参考答案、不要重写完整解法；只用一两句说清那处小瑕疵该怎么改、或补一个他没提到的要点，确实没有可补充的就一句话确认。',
    '答错时结尾用一句话给出下次做题时可直接照做的小提示（先看什么、怎么排除、易错点），不要泛泛而谈。',
    kind === 'choice' ? '选择题的 issues 留空，把话都写进 explanation。' : null,
    '数学公式一律用 $…$（行内）或 $$…$$（独立）包裹，不要输出裸 LaTeX（如 M_{12}、a^{2}），也不要用文字描述符号。',
    '只输出一个 JSON 对象：{"correct":true,"issues":[{"where":"第 2 行","what":"越界，应改为 i < n"}],"explanation":"…"}',
    '不要输出任何解释文字或代码块标记。',
  ].filter((rule) => rule !== null)
  return ['你在批改一道学生的作答（可能包含代码）。', '', ...rules.map((rule, index) => `${index + 1}. ${rule}`)].join('\n')
}

/** "B. option text" for one choice answer, tolerant of missing options. */
function optionLine(question, index) {
  if (!Number.isInteger(index) || index < 0) return '（无）'
  const options = Array.isArray(question.options) ? question.options : []
  const text = typeof options[index] === 'string' ? options[index].trim() : ''
  const letter = String.fromCharCode(65 + index)
  return text === '' ? letter : `${letter}. ${text}`
}

/** Parse the grading verdict, tolerating extra prose around the JSON. */
function parseGrade(text) {  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return { correct: false, issues: [], explanation: text.trim().slice(0, 600) }
  let parsed
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return { correct: false, issues: [], explanation: text.trim().slice(0, 600) }
  }
  return {
    correct: parsed.correct === true,
    issues: Array.isArray(parsed.issues)
      ? parsed.issues
        .filter((issue) => issue !== null && typeof issue === 'object')
        .map((issue) => ({
          where: typeof issue.where === 'string' ? issue.where.trim() : '',
          what: typeof issue.what === 'string' ? issue.what.trim() : '',
        }))
        .filter((issue) => issue.where !== '' || issue.what !== '')
        .slice(0, 6)
      : [],
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation.trim() : '',
  }
}

/** Turn transport/model failures into one readable Chinese sentence. */
function humanError(error) {
  const raw = error instanceof Error ? error.message : String(error)
  if (/max-tokens|max tokens|maximum context|length limit/iu.test(raw)) {
    return '模型输出被截断（达到 token 上限）。可以减少题目数量、缩短提问，或把推理等级调低后重试。'
  }
  const status = /(?:http\s*|status\s*[:=]?\s*|statuscode[^0-9]{0,3})([45]\d\d)/iu.exec(raw) ?? /^\s*([45]\d\d)\s/u.exec(raw)
  if (status !== null) {
    const code = status[1]
    if (code === '400') return '请求被模型服务拒绝（400）。常见原因是代理/VPN 改写了请求，或该模型不支持所选参数；关闭代理后重试。'
    if (code === '401' || code === '403') return `鉴权失败（${code}）。请检查 API Key 是否有效、是否被撤销。`
    if (code === '404') return '模型或接口不存在（404）。请检查模型选择与 provider 配置。'
    if (code === '429') return '请求过于频繁（429），稍后再试。'
    if (code.startsWith('5')) return `模型服务异常（${code}），稍后重试。`
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|socket hang up|network error|EAI_AGAIN/iu.test(raw)) {
    return '无法连接模型服务。请检查网络或代理设置。'
  }
  if (/timeout|ETIMEDOUT|timed out/iu.test(raw)) return '请求超时。网络较慢或模型响应过久，稍后重试。'
  if (/abort|cancel/iu.test(raw)) return '请求已取消。'
  return raw
}

/** Distinct sources for one answer, in retrieval order. */
function sourcesOf(units) {
  const seen = new Set()
  const list = []
  for (const unit of units) {
    const key = `${unit.materialId}#${unit.index}`
    if (seen.has(key)) continue
    seen.add(key)
    list.push({
      materialId: unit.materialId,
      materialName: unit.materialName,
      index: unit.index,
      // The whole chunk: a footnote must never be the reason a formula is cut.
      snippet: typeof unit.text === 'string' ? unit.text.trim() : '',
    })
  }
  return list
}

/** RPC failure value. */
function fail(code, message) {
  return { ok: false, error: { code: `notebook/${code}`, message, details: {} } }
}

/** RPC success value. */
function done(value) {
  return { ok: true, value }
}

// ---------------------------------------------------------------------------
// Retrieval
// ---------------------------------------------------------------------------

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u

/**
 * Split one material into overlapping chunks, preferring paragraph breaks.
 * @param text - extracted material text.
 * @returns chunk strings in document order.
 */
function chunkText(text) {
  const normalized = text.replace(/\r\n?/gu, '\n').replace(/\n{3,}/gu, '\n\n').trim()
  if (normalized.length === 0) return []
  // Chunk boundaries must stay outside complete formulae and fenced code.
  const protectedRanges = [...normalized.matchAll(/```[^\n]*\n[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\\begin\{([a-zA-Z*]+)\}[\s\S]*?\\end\{\1\}|(?<!\\)\$[^$\n]+\$/gu)]
    .map((match) => ({ start: match.index, end: match.index + match[0].length }))
  const chunks = []
  let start = 0
  while (start < normalized.length) {
    const hardEnd = Math.min(normalized.length, start + CHUNK_CHARS)
    let end = hardEnd
    if (hardEnd < normalized.length) {
      const window = normalized.slice(start + CHUNK_CHARS * 0.6, hardEnd)
      const at = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('。'), window.lastIndexOf('. '), window.lastIndexOf('\n'))
      if (at > 0) end = Math.floor(start + CHUNK_CHARS * 0.6) + at + 1
    }
    const crossing = protectedRanges.find((range) => range.start < end && range.end > end)
    if (crossing) end = crossing.end
    const piece = normalized.slice(start, end).trim()
    if (piece.length > 0) chunks.push(piece)
    if (end >= normalized.length) break
    let next = Math.max(end - CHUNK_OVERLAP, start + 1)
    const overlap = protectedRanges.find((range) => range.start < next && range.end > next)
    if (overlap) next = overlap.start > start ? overlap.start : end
    start = next
  }
  return chunks
}

/**
 * Tokenize mixed Chinese/English text: latin words plus CJK character bigrams.
 * Keeps retrieval dependency-free and language-agnostic.
 * @param text - any user or material text.
 * @returns lower-cased search terms.
 */
function tokenize(text) {
  const lower = text.toLowerCase()
  const terms = []
  for (const match of lower.matchAll(/[a-z0-9_]{2,}/gu)) terms.push(match[0])
  let previous = ''
  for (const char of lower) {
    if (!CJK.test(char)) {
      previous = ''
      continue
    }
    if (previous !== '') terms.push(previous + char)
    previous = char
  }
  return terms
}

/** Build the retrieval units for a box: material chunks plus note chunks. */
function buildUnits(box) {
  const units = []
  for (const material of box.materials ?? []) {
    const chunks = chunkText(material.text ?? '')
    chunks.forEach((text, index) => {
      units.push({ materialId: material.id, materialName: material.name, index, text })
    })
  }
  // Notes are first-class sources: what the user wrote answers later questions too.
  for (const note of box.notes ?? []) {
    const categories = box.settings?.referenceNotes
    if (Array.isArray(categories)) {
      const category = note.tags?.includes('今日总结') ? 'daily' : note.section === '今日知识点' ? 'today' : 'notes'
      if (!categories.includes(category)) continue
    }
    const title = typeof note.title === 'string' && note.title.trim().length > 0 ? note.title.trim() : '未命名笔记'
    const chunks = chunkText(`${title}\n\n${note.body ?? ''}`)
    chunks.forEach((text, index) => {
      units.push({ materialId: `note:${note.id}`, materialName: `笔记·${title}`, index, text })
    })
  }
  return units
}

/**
 * Score the box against one query using TF-IDF over the chunk units.
 * @param box - box record.
 * @param query - the user's question or a selection to explain.
 * @param limit - how many chunks to keep, defaulting to the standard width.
 * @returns the best units, highest score first.
 */
function retrieve(box, query, limit = MAX_EXCERPTS) {
  const units = buildUnits(box)
  if (units.length === 0) return []
  const queryTerms = [...new Set(tokenize(query))]
  if (queryTerms.length === 0) return []

  const documentFrequency = new Map()
  const tokenized = units.map((unit) => {
    const counts = new Map()
    for (const term of tokenize(`${unit.materialName}\n${unit.text}`)) counts.set(term, (counts.get(term) ?? 0) + 1)
    for (const term of counts.keys()) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    return counts
  })

  const total = units.length
  const scored = units.map((unit, at) => {
    const counts = tokenized[at]
    let score = 0
    for (const term of queryTerms) {
      const frequency = counts.get(term)
      if (frequency === undefined) continue
      const df = documentFrequency.get(term) ?? 1
      const idf = Math.log(1 + total / df)
      score += (1 + Math.log(frequency)) * idf
    }
    // Mild preference for focused chunks over very long ones.
    return { unit, score: score / Math.sqrt(1 + unit.text.length / 400) }
  })

  return scored
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(1, limit))
    .map((entry) => entry.unit)
}

/**
 * Unified prompt context for the three chains, so retrieval strategy lives in
 * one place.
 *   scope 'qa'       → material profiles + retrieved chunks; when nothing hits,
 *                      fall back to the box's opening chunks and say so.
 *   scope 'generate' → the excerpts of the range the caller picked.
 *   scope 'judge'    → nothing: grading reads the reference answer, not sources.
 * @param box - box record.
 * @param options - scope plus the query, pre-resolved units, and retrieval width.
 * @returns context text, citation sources, the units used, and the fallback flag.
 */
function buildContext(box, options = {}) {
  const scope = options.scope ?? 'qa'
  if (scope === 'judge') {
    return { contextText: '', citations: [], units: [], usedFullText: false }
  }
  if (scope === 'generate') {
    const units = Array.isArray(options.units) ? options.units : []
    return { contextText: renderExcerpts(units), citations: sourcesOf(units), units, usedFullText: false }
  }
  const limit = QA_SCOPES.includes(options.limit) ? options.limit : MAX_EXCERPTS
  const query = typeof options.query === 'string' ? options.query : ''
  const hits = query.length > 0 ? retrieve(box, query, limit) : []
  // Nothing matched: degrade to the box's opening chunks instead of failing the
  // answer, and let the UI say the whole box was used this time.
  const fallback = hits.length === 0 && query.length > 0 ? buildUnits(box).slice(0, limit) : []
  const units = hits.length > 0 ? hits : fallback
  const usedFullText = hits.length === 0 && fallback.length > 0
  const hitIds = new Set(units.map((unit) => unit.materialId))
  const profiles = []
  let budget = PROFILE_CHARS * MAX_PROFILES
  for (const material of box.materials ?? []) {
    if (budget <= 0 || profiles.length >= MAX_PROFILES) break
    if (!hitIds.has(material.id)) continue
    const summary = typeof material.summary === 'string' ? material.summary.trim() : ''
    if (summary === '') continue
    const text = summary.length > budget ? `${summary.slice(0, budget)}…` : summary
    budget -= text.length
    profiles.push(`· ${material.name}：${text}`)
  }
  const parts = []
  if (profiles.length > 0) parts.push(`【资料画像】\n${profiles.join('\n')}`)
  parts.push(renderExcerpts(units))
  return { contextText: parts.join('\n\n'), citations: sourcesOf(units), units, usedFullText }
}

// ---------------------------------------------------------------------------
// Model calls
// ---------------------------------------------------------------------------

/**
 * Run one non-streaming completion through the Harness LLM service.
 * @param ctx - plugin context.
 * @param options - system prompt, prompt text, limits, cancellation.
 * @returns the completed text.
 */
async function complete(ctx, options, onDelta) {
  const selection = ctx.agentDefaultModel.currentSelection()
  const provider = typeof options.provider === 'string' && options.provider.length > 0
    ? options.provider
    : (typeof selection?.provider === 'string' ? selection.provider : undefined)
  const model = typeof options.model === 'string' && options.model.length > 0
    ? options.model
    : (typeof selection?.model === 'string' ? selection.model : undefined)
  if (provider === undefined || model === undefined) {
    throw new Error('notebook: no default model is configured; choose one in Settings → Models')
  }
  const request = {
    provider,
    model,
    messages: [{ role: 'user', content: [{ type: 'text', text: options.prompt }] }],
    system: options.system,
    signal: options.signal,
  }
  if (options.maxTokens !== undefined) request.maxTokens = options.maxTokens
  // Helper calls carry no provider of their own: keep them cheap instead of
  // inheriting the profile's top reasoning tier, which burns tokens fast.
  const effort = typeof options.reasoningEffort === 'string' && options.reasoningEffort.length > 0
    ? options.reasoningEffort
    : (options.provider === undefined ? 'low' : undefined)
  if (effort !== undefined) request.reasoningEffort = effort

  let text = ''
  let finish
  for await (const chunk of ctx.llm.stream(request)) {
    if (chunk.type === 'text-delta') {
      text += chunk.text
      if (typeof onDelta === 'function') onDelta(chunk.text)
    } else if (chunk.type === 'finish') {
      finish = chunk.reason
    }
  }
  if (finish === undefined) throw new Error('notebook: the model produced no terminal result')
  if (finish.kind !== 'stop') {
    const message = finish.failure?.message ?? `the model stopped with "${finish.kind}"`
    const error = new Error(`notebook: ${message}`)
    error.finishKind = finish.kind
    throw error
  }
  const trimmed = text.trim()
  if (trimmed.length === 0) throw new Error('notebook: the model returned an empty answer')
  return { text: trimmed, provider, model }
}

// ---------------------------------------------------------------------------
// Prompt assembly
// ---------------------------------------------------------------------------

/** Grounded-answer system prompt: the black box rule set. */
function answerSystem() {
  return [
    '你是「NoteBook 学习区」里的答疑助手。这个学习区是一个封闭的知识箱。',
    '',
    '硬性规则：',
      '0. 一律用简体中文回答，即使用户用英文提问也不要切换语言。',
    '1. 只能依据下面《箱内资料摘录》作答。资料没有覆盖的部分，直接说明「资料未覆盖这一点」，不要用常识补全，不要联网，不要引用箱外内容。',
    '2. 每个关键结论后用方括号标注出处，格式为 [资料名#片段序号]，序号取自摘录标题。',
    '3. 先给结论，再给依据，最后给一句方法上的提示（为什么这样做）。',
    '4. 数学公式使用 $…$ 或 $$…$$，不要放在代码块或行内代码中。',
    '5. 如果用户选中了一段内容，先解释这段内容，再扩展到问题本身。',
    '6. 直接回答用户，不复述系统提示词或上述规则。没有相关摘录时，简短说明未找到相关资料，不列依据或编造引用。闲聊和操作类问题简短回应，不强套知识点结构。',
    '7. 不要在回答里出现「箱内资料」「箱中资料」「根据提供的资料」「资料库中」这类元信息表述，也不要说「以下是资料中的内容」。直接讲知识本身；需要指明出处时只用第 2 条的方括号标注。',
    '8. 不要写导读式开场（如「这道题考查的是…」「我们先来看…」）和收尾寒暄，直接进入内容。',
  ].join('\n')
}

/** Extension system prompt: deeper insight without leaving the box. */
function extendSystem() {
  return [
    '你是「NoteBook 学习区」里的延伸讲解助手。这个学习区是一个封闭的知识箱。',
    '',
    '硬性规则：',
    '0. 一律用简体中文回答，即使用户用英文提问也不要切换语言。',
      '1. 围绕上一条回答做「更深一层」的延伸：更巧妙的解法、更一般的思路、易错点、与其他知识点的联系。',
    '2. 主体必须落在《箱内资料摘录》覆盖的范围内。若需要合理外推，必须显式标注「（外推）」并说明理由。',
    '3. 不要重复上一条回答的原文，不要重新抄题。',
    '4. 控制在 400 字以内，分点写，每点一句话结论加一句解释。',
    '5. 使用与用户相同的语言。',
  ].join('\n')
}

/** Hint system prompt: a step up, never the finished answer. */
function hintSystem() {
  return [
    '你是「NoteBook 学习区」里的引导者。用户在某个题目或知识点上卡住了，需要提示而不是答案。',
    '',
    '硬性规则：',
      '0. 一律用简体中文回答，即使用户用英文提问也不要切换语言。',
    '1. 只依据《箱内资料摘录》，不要给出完整解答，不要算出最终结果。',
    '2. 只给一到两个「台阶」：指出该看哪个定义/定理，或提示第一步该怎么变形。',
    '3. 用提问收尾，让用户自己往下走，例如「你先试试把…代入，会得到什么？」。',
    '4. 不超过 150 字，不要复述题目。',
    '5. 使用与用户相同的语言。',
  ].join('\n')
}

/** Follow-up suggestion system prompt: short, clickable next steps. */
function followupSystem() {
  return [
    '你在为一个学习问答生成「接下来可以问什么」。',
    '',
    '规则：',
    '1. 生成 3 条，每条不超过 20 字，是可以直接点开的问句或任务。',
    '2. 必须落在《箱内资料摘录》覆盖的范围内，不要引入新知识点。',
    '3. 三条要有区分度：一条查缺补漏、一条换角度、一条动手练。',
    '4. 只输出一个 JSON 数组，例如 ["…","…","…"]，不要任何解释或代码块标记。',
  ].join('\n')
}

/** Parse the follow-up reply into at most three short strings. */
function parseFollowups(text) {
  const match = /\[[\s\S]*\]/u.exec(text)
  if (match === null) return []
  try {
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= 40)
      .slice(0, 3)
  } catch {
    return []
  }
}

/**
 * Render retrieved units as numbered excerpt blocks.
 * @param units - retrieved units.
 * @returns prompt fragment.
 */
function renderExcerpts(units) {
  if (units.length === 0) return '【箱内资料摘录】\n（未检索到与本次问题相关的资料）'
  const blocks = []
  let budget = MAX_CONTEXT_CHARS
  for (const unit of units) {
    if (budget <= 0) break
    if (unit.text.length > budget) continue
    const text = unit.text
    budget -= text.length
    blocks.push(`[${unit.materialName}#${unit.index + 1}]\n${text}`)
  }
  return `【箱内资料摘录】\n${blocks.join('\n\n')}`
}

/**
 * Decide whether a question needs the box's own conversation history.
 * @param question - the current question.
 */
function wantsHistory(question) {
  const text = question.trim()
  if (text.length < 14) return true
  return /(这个|那个|它|上面|刚才|刚刚|继续|前面|上述|该|这道|上一|接着)/u.test(text)
}

/** Render recent Q&A turns for the prompt. */
function renderHistory(box) {
  const past = (box.messages ?? []).filter((message) => message.role === 'user' || message.role === 'assistant')
  if (past.length === 0) return ''
  const sliced = past.slice(-HISTORY_TURNS * 2)
  const lines = ['【箱内对话历史】']
  for (const message of sliced) {
    const who = message.role === 'user' ? '问' : '答'
    const text = message.text.length > 700 ? `${message.text.slice(0, 700)}…` : message.text
    lines.push(`${who}：${text}`)
  }
  return lines.join('\n')
}

/** Repair legacy 200-character snippets from the material, including formula boundaries. */
function repairSource(box, source) {
  const material = box?.materials?.find((entry) => entry.id === source.materialId)
  const note = source.materialId?.startsWith('note:') ? box?.notes?.find((entry) => `note:${entry.id}` === source.materialId) : undefined
  const text = String(material?.text ?? note?.body ?? '').replace(/\r\n?/gu, '\n').replace(/\n{3,}/gu, '\n\n').trim()
  const snippet = String(source.snippet ?? '').replace(/\r\n?/gu, '\n').replace(/…$/u, '').trim()
  if (!text || !snippet) return source
  let start = text.indexOf(snippet)
  if (start < 0) return source
  let end = Math.min(text.length, start + Math.max(snippet.length, material?.chunks?.[source.index]?.length ?? CHUNK_CHARS))
  for (const match of text.matchAll(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\\begin\{(?<env>[a-zA-Z*]+)\}[\s\S]*?\\end\{\k<env>\}|(?<!\\)\$[^$\n]+\$/gu)) {
    const left = match.index, right = left + match[0].length
    if (left < start && right > start) start = left
    if (left < end && right > end) end = right
  }
  return { ...source, snippet: text.slice(start, end).trim() }
}

/** Public projection of one stored message. */
function publicMessage(message, box) {
  return {
    id: message.id,
    conversationId: message.conversationId ?? 'default',
    role: message.role,
    kind: message.kind,
    text: message.text,
    sources: (message.sources ?? []).map((source) => box ? repairSource(box, source) : source),
    followups: Array.isArray(message.followups) ? message.followups : [],
    attachments: Array.isArray(message.attachments) ? message.attachments : [],
    parentId: message.parentId,
    createdAt: message.createdAt,
    usedHistory: message.usedHistory,
    usedFullText: message.usedFullText === true,
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * The box store. Keeps the on-disk contract in one place so later features
 * (practice questions, notes, export) only add methods.
 */
function createStore() {
  const store = {
    async list() {
      const index = await readJson(indexPath(), undefined)
        ?? await readJson(path.join(dshHome(), 'storages', 'notebook', 'boxes.json'), emptyIndex())
      return index.boxes
    },
    async create(payload) {
      const name = boxName(payload?.name, defaultBoxName(await store.list()))
      const description = typeof payload?.description === 'string' ? payload.description.trim().slice(0, 500) : ''
      const box = emptyBox(name, description)
      await writeJson(boxPath(box.id), box)
      const index = { version: STORE_VERSION, boxes: await store.list() }
      index.version = STORE_VERSION
      index.boxes.push(summarize(box))
      await writeJson(indexPath(), index)
      return summarize(box)
    },
    async get(payload) {
      const id = requireId(payload)
      const box = await readJson(boxPath(id), undefined)
        ?? await readJson(path.join(dshHome(), 'storages', 'notebook', 'boxes', `${id}.json`), undefined)
      if (box === undefined) throw new Error(`notebook: box "${id}" does not exist`)
      let migrated = false
      for (const conversation of box.conversations ?? []) {
        if (conversation.manualTitle === undefined && !/^(新聊天(?: \d+)?|原有聊天)$/u.test(conversation.title)) { conversation.manualTitle = true; migrated = true }
      }
      const previousFolder = box.materialFolder
      const obsolete = []
      for (const material of box.materials ?? []) {
        const directory = !material.external ? await materialDirectory(box) : undefined
        if (!material.external && (!material.path || path.dirname(material.path) !== directory || path.extname(material.path) !== '.md')) {
          let original
          const previous = material.path
          if (material.path) {
            try { original = await fs.readFile(material.path) } catch (error) { if (error.code !== 'ENOENT') throw error }
          }
          await persistMaterial(box, material, material.kind === 'pdf' && previous?.endsWith('.pdf') ? original : undefined)
          if (previous && path.resolve(previous).startsWith(path.resolve(materialsRoot()) + path.sep)) obsolete.push(previous)
          migrated = true
        }
      }
      if (migrated || previousFolder !== box.materialFolder || !await fs.access(boxPath(id)).then(() => true, () => false)) await writeJson(boxPath(id), box)
      for (const previous of obsolete) {
        await fs.unlink(previous).catch((error) => { if (error.code !== 'ENOENT') throw error })
        let directory = path.dirname(previous)
        while (directory !== materialsRoot() && directory.startsWith(materialsRoot() + path.sep)) {
          try { await fs.rmdir(directory) } catch { break }
          directory = path.dirname(directory)
        }
      }
      return box
    },
    async rename(payload) {
      const id = requireId(payload)
      const box = await store.get({ id })
      box.name = boxName(payload?.name, box.name)
      box.materialFolder = undefined
      await store.save(box)
      await store.get({ id })
      return summarize(box)
    },
    async remove(payload) {
      const id = requireId(payload)
      const box = await store.get({ id })
      const index = { version: STORE_VERSION, boxes: await store.list() }
      index.boxes = index.boxes.filter((entry) => entry.id !== id)
      await writeJson(indexPath(), index)
      await fs.rm(boxPath(id), { force: true })
      for (const material of box.materials ?? []) {
        if (!material.external && material.path && path.resolve(material.path).startsWith(path.resolve(materialsRoot()) + path.sep)) {
          await fs.unlink(material.path).catch((error) => { if (error.code !== 'ENOENT') throw error })
        }
      }
      return { id }
    },
    /** Replace one box summary in the index, appending it when absent. */
    async reindex(summary) {
      const index = { version: STORE_VERSION, boxes: await store.list() }
      index.version = STORE_VERSION
      const at = index.boxes.findIndex((entry) => entry.id === summary.id)
      if (at === -1) index.boxes.push(summary)
      else index.boxes[at] = summary
      await writeJson(indexPath(), index)
      return summary
    },
    /** Persist a whole box record and refresh its summary. */
    async save(box) {
      box.updatedAt = new Date().toISOString()
      await writeJson(boxPath(box.id), box)
      await store.reindex(summarize(box))
      return box
    },
  }
  return store
}

// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------

/**
 * Read one JSON request body with a hard size cap.
 * @param req - Node request stream.
 */
async function readBody(req) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) throw new Error(`notebook: request body exceeds ${MAX_BODY_BYTES} bytes`)
    chunks.push(chunk)
  }
  if (total === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/** Write one JSON response. */
function respond(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * Mount the browser-facing route for the client half.
 * @param ctx - plugin context providing Connection, the Web server, and the LLM.
 */
function apply(ctx) {
  const store = createStore()
  const titleJobs = new Map()

  /**
   * Grade one answer and write feedback that fits it. Choice correctness is
   * decided locally and sent to the model, which then explains why the chosen
   * option works or fails — so a wrong pick gets its own note instead of the
   * stored generic explanation. Only the question and the answer travel: the
   * reference already carries what grading needs, keeping every request small.
   * The web is consulted only when the caller opted in.
   */
  const gradeAnswer = async ({ box, question, choice, text, useWeb, signal, payload }) => {
    const isChoice = question.type !== 'open'
    const chosen = isChoice && Number.isInteger(choice) ? choice : -1
    const correct = isChoice && chosen === question.answerIndex
    const parts = [`【题目】\n${question.stem}`]
    if (isChoice) {
      const options = Array.isArray(question.options) ? question.options : []
      if (options.length > 0) parts.push(`【选项】\n${options.map((option, index) => optionLine(question, index)).join('\n')}`)
      parts.push(`【正确答案】\n${optionLine(question, question.answerIndex)}`)
      parts.push(`【学生选择】\n${chosen >= 0 ? optionLine(question, chosen) : '（未作答）'}`)
      parts.push(`【本次判定】\n${correct ? '正确' : '错误'}`)
    } else {
      parts.push(`【参考答案】\n${question.referenceAnswer === undefined || question.referenceAnswer === '' ? '（无）' : question.referenceAnswer}`)
      if (Array.isArray(question.rubric) && question.rubric.length > 0) {
        parts.push(`【评分要点】\n${question.rubric.map((item, index) => `${index + 1}. ${item}`).join('\n')}`)
      }
    }
    if (useWeb === true) {
      try {
        const web = ctx.get('web')
        if (web !== undefined) {
          const note = webLines(await web.search({ query: question.stem.slice(0, 120), maxResults: 4 }, signal), 2500)
          if (note !== '') parts.push(`【联网参考】\n${note.slice(0, 3000)}`)
        }
      } catch {
        // Grading still works from the local reference.
      }
    }
    if (!isChoice) parts.push(`【学生答案】\n${text}`)
    const request = {
      system: gradeSystem(isChoice ? 'choice' : 'open'),
      prompt: parts.join('\n\n'),
      signal,
      provider: payload?.provider,
      model: payload?.model,
      reasoningEffort: payload?.reasoningEffort,
      // Reasoning models spend most of the budget on their thinking, so a tight
      // cap truncates the JSON; the retry adds headroom instead of failing.
      maxTokens: isChoice ? 1400 : 2000,
    }
    /** One grading attempt; a length stop is retried once with more room. */
    const ask = async () => {
      const isTruncated = (error) => error?.finishKind === 'length'
        || /max.?tokens|length limit|token.?limit/iu.test(`${error?.finishKind ?? ''} ${error?.message ?? ''}`)
      try {
        return await complete(ctx, request)
      } catch (error) {
        if (!isTruncated(error)) throw error
        try {
          return await complete(ctx, { ...request, maxTokens: isChoice ? 2400 : 3600 })
        } catch (inner) {
          if (!isTruncated(inner)) throw inner
          throw new Error('notebook: 判题时模型输出被截断（推理占用了大部分预算）。把推理等级调低或换用非推理模型后，直接再次提交即可。')
        }
      }
    }
    if (isChoice) {
      // The verdict is already known; a failed call only costs the wording.
      try {
        const verdict = parseGrade((await ask()).text)
        return { correct, issues: verdict.issues, explanation: verdict.explanation === '' ? question.explanation : verdict.explanation }
      } catch {
        return { correct, issues: [], explanation: question.explanation }
      }
    }
    const verdict = parseGrade((await ask()).text)
    return { correct: verdict.correct, issues: verdict.issues, explanation: verdict.explanation }
  }

  /** Generate one material profile; a failure leaves it for lazy indexing. */
  const profileMaterial = async (material, payload) => {
    const text = (material.text ?? '').slice(0, 6000)
    if (text.trim().length === 0) return ''
    try {
      const answer = await complete(ctx, {
        system: profileSystem(),
        prompt: `【资料名称】\n${material.name}\n\n【资料原文】\n${text}`,
        provider: payload?.provider,
        model: payload?.model,
        reasoningEffort: 'low',
        maxTokens: 400,
      })
      return answer.text.trim().slice(0, PROFILE_CHARS)
    } catch {
      // Indexing is best effort: answers still work without a profile.
      return ''
    }
  }

  /** Profile every material that lacks one, saving as each finishes. */
  const indexMaterials = async (box, payload) => {
    const ids = []
    for (const material of box.materials ?? []) {
      if (typeof material.summary === 'string' && material.summary !== '') continue
      const summary = await profileMaterial(material, payload)
      if (summary === '') continue
      material.summary = summary
      material.indexedAt = new Date().toISOString()
      ids.push(material.id)
      await store.save(box)
    }
    return ids
  }

  /** Materials + retrieval-backed answering. */
  const materialEndpoints = {
    async addMaterial(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const sourcePath = typeof payload?.sourcePath === 'string' && path.isAbsolute(payload.sourcePath) ? path.resolve(payload.sourcePath) : undefined
      if (sourcePath) {
        const stat = await fs.stat(sourcePath)
        if (!stat.isFile() || stat.size > 12 * 1024 * 1024) throw new Error('文件不可读或超过 12 MB。')
        const bytes = await fs.readFile(sourcePath)
        payload = { ...payload, name: path.basename(sourcePath), kind: /\.pdf$/iu.test(sourcePath) ? 'pdf' : 'file', text: bytes.toString('utf8'), base64: bytes.toString('base64'), bytes: bytes.length }
      }
      const name = boxName(payload?.name, '未命名资料')
      let text = typeof payload?.text === 'string' ? payload.text : ''
      let kind = typeof payload?.kind === 'string' ? payload.kind : 'text'
      if (kind === 'pdf' && typeof payload?.base64 === 'string') {
        const extracted = pdfToText(Buffer.from(payload.base64, 'base64'))
        if (extracted.text.trim().length === 0 || extracted.quality < 0.55) {
          throw new Error('这个 PDF 提取不出可用的文字，可能是扫描件或用了特殊字体编码。请先转成文本、或直接粘贴内容。')
        }
        text = extracted.text
        kind = 'pdf'
      }
      if (text.trim().length === 0) throw new Error('notebook: the material has no readable text')
      const material = {
        id: randomUUID(),
        name,
        kind,
        bytes: typeof payload?.bytes === 'number' ? payload.bytes : Buffer.byteLength(text, 'utf8'),
        chars: text.length,
        addedAt: new Date().toISOString(),
        text,
        chunks: chunkText(text),
      }
      if (sourcePath) { material.path = sourcePath; material.external = true }
      else await persistMaterial(box, material, typeof payload?.base64 === 'string' ? Buffer.from(payload.base64, 'base64') : undefined)
      box.materials.push(material)
      await store.save(box)
      // The profile is written once, here; a failure falls back to lazy indexing.
      const profile = await profileMaterial(material)
      if (profile !== '') {
        material.summary = profile
        material.indexedAt = new Date().toISOString()
        await store.save(box)
      }
      return {
        material: { id: material.id, name: material.name, kind: material.kind, chars: material.chars, chunks: material.chunks.length, addedAt: material.addedAt, indexed: profile !== '' },
        summary: summarize(box),
      }
    },
    async pickMaterials(payload) {
      const boxId = requireId(payload)
      if (process.platform !== 'win32') throw new Error('当前宿主不支持 Windows 文件选择器。')
      const { execFile } = await import('node:child_process')
      const folder = payload?.mode === 'folder'
      const script = `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.Windows.Forms; ${folder
        ? '$d = New-Object System.Windows.Forms.FolderBrowserDialog; if ($d.ShowDialog() -eq "OK") { ConvertTo-Json -Compress -InputObject @($d.SelectedPath) }'
        : `$d = New-Object System.Windows.Forms.OpenFileDialog; $d.Multiselect = $true; ${payload?.mode === 'pdf' ? '$d.Filter = "PDF|*.pdf";' : ''} if ($d.ShowDialog() -eq "OK") { ConvertTo-Json -Compress -InputObject @($d.FileNames) }`}`
      const output = await new Promise((resolve, reject) => execFile('powershell.exe', ['-NoProfile', '-STA', '-Command', script], { windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (error, stdout) => error ? reject(error) : resolve(stdout.trim())))
      if (!output) return { materials: [], errors: [] }
      const selected = JSON.parse(output)
      const files = []
      const walk = async (dir) => {
        for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) await walk(full)
          else if (entry.isFile() && /\.(md|markdown|txt|pdf|csv|json|js|ts|py|html|tex)$/iu.test(entry.name)) files.push(full)
        }
      }
      if (folder) await walk(selected[0]); else files.push(...selected)
      const materials = [], errors = []
      for (const file of files) {
        try { materials.push((await materialEndpoints.addMaterial({ boxId, sourcePath: file })).material) }
        catch (error) { errors.push(`${path.basename(file)}：${error.message}`) }
      }
      return { materials, errors, summary: summarize(await store.get({ boxId })) }
    },
    /** Reveal a material's original file in the OS file manager, when known. */
    async revealMaterial(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const material = (box.materials ?? []).find((entry) => entry.id === payload?.materialId)
      if (material === undefined) throw new Error('notebook: 找不到这份资料')
      const filePath = typeof material.path === 'string' ? material.path : ''
      if (filePath.length === 0) {
        throw new Error('notebook: 资料的本地副本不存在，请重新导入。')
      }
      const { execFile } = await import('node:child_process')
      if (process.platform === 'win32') execFile('explorer.exe', ['/select,', filePath], () => {})
      else execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [filePath], () => {})
      return { path: filePath }
    },

    async removeMaterial(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const materialId = payload?.materialId
      const removed = box.materials.find((material) => material.id === materialId)
      box.materials = box.materials.filter((material) => material.id !== materialId)
      await store.save(box)
      if (removed && !removed.external) {
        for (const file of [removed.path, removed.originalPath]) {
          if (file && path.resolve(file).startsWith(path.resolve(materialsRoot()) + path.sep)) await fs.unlink(file).catch((error) => { if (error.code !== 'ENOENT') throw error })
        }
      }
      return { summary: summarize(box) }
    },
    /** Profile every material that lacks one; safe to call on every box open. */
    async ensureIndex(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const ids = await indexMaterials(box, payload)
      return { indexed: ids.length, ids, summary: summarize(box) }
    },
    /** Drop all profiles and rebuild them from the current text. */
    async reindex(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      for (const material of box.materials ?? []) {
        material.summary = undefined
        material.indexedAt = undefined
      }
      await store.save(box)
      const ids = await indexMaterials(box, payload)
      return { indexed: ids.length, ids, summary: summarize(box) }
    },
    /** Delete several items of one kind in a single write. */
    async removeMany(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const kind = payload?.kind
      const ids = new Set(Array.isArray(payload?.ids) ? payload.ids.filter((id) => typeof id === 'string') : [])
      if (ids.size === 0) return { summary: summarize(box), removed: 0 }
      let removed = 0
      if (kind === 'material') {
        const gone = box.materials.filter((material) => ids.has(material.id))
        removed = gone.length
        box.materials = box.materials.filter((material) => !ids.has(material.id))
        for (const material of gone) {
          if (material.external) continue
          for (const file of [material.path, material.originalPath]) {
            if (file && path.resolve(file).startsWith(path.resolve(materialsRoot()) + path.sep)) await fs.unlink(file).catch((error) => { if (error.code !== 'ENOENT') throw error })
          }
        }
      } else if (kind === 'note') {
        removed = (box.notes ?? []).filter((note) => ids.has(note.id)).length
        box.notes = (box.notes ?? []).filter((note) => !ids.has(note.id))
        if (ids.has(box.settings?.defaultAppendNoteId)) box.settings.defaultAppendNoteId = 'latest'
      } else if (kind === 'conversation') {
        box.conversations ??= [{ id: 'default', title: '原有聊天' }]
        removed = box.conversations.filter((entry) => ids.has(entry.id)).length
        box.conversations = box.conversations.filter((entry) => !ids.has(entry.id))
        box.messages = (box.messages ?? []).filter((message) => !ids.has(message.conversationId ?? 'default'))
        if (box.conversations.length === 0) box.conversations.push({ id: randomUUID(), title: '新聊天', manualTitle: false, createdAt: new Date().toISOString() })
      } else {
        throw new Error('notebook: unknown kind')
      }
      await store.save(box)
      return { summary: summarize(box), removed, conversations: box.conversations }
    },
    async materialText(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const material = box.materials.find((entry) => entry.id === payload?.materialId)
      if (material === undefined) throw new Error('notebook: material not found')
      return { id: material.id, name: material.name, text: material.text }
    },
  }

  /** Grounded question answering and the optional extension turn. */
  const dialogEndpoints = {
    async conversationTitle(payload, signal) {
      const boxId = requireId(payload)
      const key = `${boxId}:${payload?.conversationId}`
      if (titleJobs.has(key)) return titleJobs.get(key)
      const job = (async () => {
        const box = await store.get({ boxId })
        const conversation = box.conversations?.find((entry) => entry.id === payload?.conversationId)
        if (!conversation || conversation.manualTitle || conversation.titleSummarized) return { conversation }
        const messages = box.messages.filter((entry) => (entry.conversationId ?? 'default') === conversation.id).slice(0, 2)
        if (!messages.some((entry) => entry.role === 'assistant')) return { conversation }
        const answer = await complete(ctx, { system: '用 8–16 个汉字概括这段问答的学习主题作为聊天名称。只输出名称，不加引号、Markdown、解释或规则。', prompt: messages.map((entry) => `${entry.role}: ${entry.text.slice(0, 700)}`).join('\n'), signal, provider: payload?.provider, model: payload?.model, maxTokens: 1024, reasoningEffort: 'low' })
        // Re-read after the model call so a user's rename always wins.
        const latest = await store.get({ boxId })
        const target = latest.conversations?.find((entry) => entry.id === conversation.id)
        if (!target || target.manualTitle || target.titleSummarized) return { conversation: target }
        target.title = boxName(answer.text.replace(/^["“]|["”]$/gu, ''), target.title).slice(0, 30)
        target.manualTitle = false
        target.titleSummarized = true
        await store.save(latest)
        return { conversation: target }
      })()
      titleJobs.set(key, job)
      try { return await job } finally { titleJobs.delete(key) }
    },
    async renameConversation(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      box.conversations ??= [{ id: 'default', title: '原有聊天', manualTitle: false }]
      const conversation = box.conversations.find((entry) => entry.id === payload?.conversationId)
      if (!conversation) throw new Error('聊天不存在。')
      conversation.title = boxName(payload?.title, conversation.title)
      conversation.manualTitle = true
      await store.save(box)
      return { conversation }
    },
    async removeConversation(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      box.conversations ??= [{ id: 'default', title: '原有聊天' }]
      const at = box.conversations.findIndex((entry) => entry.id === payload?.conversationId)
      if (at < 0) throw new Error('聊天不存在。')
      box.conversations.splice(at, 1)
      box.messages = box.messages.filter((message) => (message.conversationId ?? 'default') !== payload.conversationId)
      if (!box.conversations.length) box.conversations.push({ id: randomUUID(), title: '新聊天', createdAt: new Date().toISOString() })
      await store.save(box)
      return { conversations: box.conversations, nextId: box.conversations[Math.min(at, box.conversations.length - 1)].id, summary: summarize(box) }
    },
    async createConversation(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      box.conversations ??= [{ id: 'default', title: '原有聊天' }]
      const conversation = { id: randomUUID(), title: `新聊天 ${box.conversations.length}`, manualTitle: false, createdAt: new Date().toISOString() }
      box.conversations.push(conversation)
      await store.save(box)
      return { conversation }
    },
    async ask(payload, signal, onDelta) {
      const box = await store.get({ boxId: requireId(payload) })
      const conversationId = payload?.conversationId ?? 'default'
      if (!(box.conversations ?? [{ id: 'default' }]).some((entry) => entry.id === conversationId)) throw new Error('聊天不存在。')
      const conversationMessages = box.messages.filter((message) => (message.conversationId ?? 'default') === conversationId)
      const question = typeof payload?.question === 'string' ? payload.question.trim() : ''
      if (question.length === 0) throw new Error('notebook: a question is required')

      const selection = payload?.selection
      const selectedText = typeof selection?.text === 'string' ? selection.text.trim() : ''
      const retrievalQuery = selectedText.length > 0 ? `${selectedText}\n${question}` : question
      // One place decides what context a grounded answer carries: profiles plus
      // retrieved chunks, widening to the whole box only when nothing matched.
      const scopeLimit = QA_SCOPES.includes(box.settings?.qaScope) ? box.settings.qaScope : undefined
      const context = buildContext(box, { scope: 'qa', query: retrievalQuery, limit: scopeLimit })
      const units = context.units

      const includeHistory = payload?.includeHistory === true || (payload?.includeHistory !== false && wantsHistory(question))
      const parts = [context.contextText]
      // Materials pinned with the composer's "+" enter the prompt as a whole.
      const pinned = Array.isArray(payload?.attachments) ? payload.attachments : []
      const pinnedNames = []
      let pinnedBudget = 12000
      for (const entry of pinned) {
        const materialId = typeof entry === 'string' ? entry : entry?.materialId
        const material = box.materials.find((candidate) => candidate.id === materialId)
        if (material === undefined || pinnedBudget <= 0) continue
        const text = material.text.length > pinnedBudget ? `${material.text.slice(0, pinnedBudget)}…` : material.text
        pinnedBudget -= text.length
        pinnedNames.push({ id: material.id, name: material.name })
        const pinnedUnit = { materialId: material.id, materialName: material.name, index: 0, text }
        if (!units.some((unit) => unit.materialId === material.id)) units.push(pinnedUnit)
        parts.push(`【附加资料：[${material.name}#1]】\n${text}`)
      }
      if (includeHistory) {
        const history = renderHistory({ ...box, messages: conversationMessages })
        if (history !== '') parts.push(history)
      }
      if (selectedText.length > 0) {
        const from = typeof selection?.materialName === 'string' ? selection.materialName : '选中内容'
        parts.push(`【用户选中的内容（${from}）】\n${selectedText.slice(0, 4000)}`)
      }
      parts.push(`【用户问题】\n${question}`)

      const hasContext = units.length > 0 || selectedText.length > 0
        || (includeHistory && conversationMessages.some((message) => message.role === 'assistant' && message.sources?.length > 0))
      const answer = hasContext ? await complete(ctx, {
        system: answerSystem(),
        prompt: parts.join('\n\n'),
        signal,
        provider: payload?.provider,
        model: payload?.model,
        reasoningEffort: payload?.reasoningEffort,
      }, onDelta) : {
        text: buildUnits(box).length === 0 ? '还没有可用的学习资料，请先导入资料或添加笔记。' : '没有找到与这个问题相关的资料，请补充资料或换个关键词。',
      }
      if (!hasContext && typeof onDelta === 'function') onDelta(answer.text)

      const now = new Date().toISOString()
      const userMessage = {
        conversationId,
        id: randomUUID(),
        role: 'user',
        kind: 'qa',
        text: question,
        sources: [],
        createdAt: now,
        attachments: pinnedNames,
        knowledgeEligible: hasContext,
      }
      const assistantMessage = {
        conversationId,
        id: randomUUID(),
        role: 'assistant',
        kind: 'qa',
        text: answer.text,
        sources: sourcesOf(units).filter((source) => answer.text.includes(`[${source.materialName}#${source.index + 1}]`)),
        parentId: userMessage.id,
        createdAt: now,
        model: { provider: answer.provider, model: answer.model },
        usedHistory: includeHistory,
        usedFullText: context.usedFullText === true,
        knowledgeEligible: hasContext,
      }
      box.messages.push(userMessage, assistantMessage)
      box.conversations ??= [{ id: 'default', title: '原有聊天' }]
      const conversation = box.conversations.find((entry) => entry.id === conversationId)
      await store.save(box)
      return { message: publicMessage(assistantMessage), question: publicMessage(userMessage), conversation, summary: summarize(box) }
    },

    async extend(payload, signal) {
      const box = await store.get({ boxId: requireId(payload) })
      const target = box.messages.find((message) => message.id === payload?.messageId && message.role === 'assistant')
      if (target === undefined) throw new Error('notebook: the answer to extend was not found')
      if (target.knowledgeEligible === false) throw new Error('请先补充相关学习资料，再进行延伸讲解。')
      const question = box.messages.find((message) => message.id === target.parentId)
      const units = retrieve(box, `${question?.text ?? ''}\n${target.text}`)
      if (units.length === 0) throw new Error('未找到相关学习资料，暂时无法延伸讲解。')

      const parts = [
        renderExcerpts(units),
        `【上一条问答】\n问：${question?.text ?? '（未记录）'}\n答：${target.text}`,
        '请给出延伸讲解。',
      ]
      const answer = await complete(ctx, {
        system: extendSystem(),
        prompt: parts.join('\n\n'),
        signal,
      })
      const message = {
        id: randomUUID(),
        role: 'assistant',
        kind: 'extend',
        conversationId: target.conversationId ?? 'default',
        text: answer.text,
        sources: sourcesOf(units),
        parentId: target.id,
        createdAt: new Date().toISOString(),
        model: { provider: answer.provider, model: answer.model },
      }
      box.messages.push(message)
      await store.save(box)
      return { message: publicMessage(message), summary: summarize(box) }
    },

    async messages(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      return { messages: (box.messages ?? []).map((message) => publicMessage(message, box)) }
    },
  }

  /**
   * Ask the model for exactly one question. Small per-call output budgets keep
   * every request well clear of token limits; a truncated or unparseable reply
   * retries the current question instead of shrinking the requested count.
   */
  const askOneQuestion = async ({ kind, difficulty, parts, generated, provider, model, effort, signal }) => {
    const ask = (tokens, retry = false) => complete(ctx, {
      system: quizSystem(1, kind, difficulty),
      prompt: [...parts, `【已出题，不能重复】\n${generated.map((entry) => entry.stem).join('\n')}`, retry ? '上次输出不完整或 JSON 无法解析。请只输出一道简短、完整、正确转义的 JSON 题目。' : '只生成当前这一道题。'].join('\n\n'),
      signal,
      provider,
      model,
      reasoningEffort: effort,
      maxTokens: tokens,
    })
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const answer = await ask(attempt ? 8192 : kind === 'open' ? 6144 : 4096, attempt > 0)
        const parsed = parseQuiz(answer.text, 1).filter((entry) => entry.type === kind && !generated.some((previous) => previous.stem === entry.stem))
        if (parsed.length) return parsed[0]
      } catch (error) {
        if (attempt || !/max.?tokens|length|token.?limit/iu.test(`${error.finishKind ?? ''} ${error.message}`)) throw error
      }
    }
    return undefined
  }

  /** Resolve the per-question kinds for a requested count, first one is a choice. */
  const planKinds = (questionKind, count) => {
    const kinds = []
    for (let index = 0; index < count; index++) {
      kinds.push(questionKind === 'open' ? 'open' : questionKind === 'choice' || index === 0 ? 'choice' : 'open')
    }
    return kinds
  }

  /** Flatten one web search result into capped prompt lines. */
  const webLines = (result, contentCap) => {
    const lines = []
    if (typeof result.content === 'string' && result.content.trim().length > 0) {
      lines.push(result.content.trim().slice(0, contentCap))
    }
    for (const source of result.sources ?? []) {
      lines.push(`- ${source.title ?? source.url}${source.snippet === undefined ? '' : `：${source.snippet.slice(0, 200)}`}`)
    }
    return lines.join('\n')
  }

  /**
   * Resolve the chunks a practice set draws from: one material when scoped to
   * it, otherwise the topic's best matches (or the whole box without a topic).
   */
  const quizUnits = (box, topic, materialId) => {
    if (materialId !== '') {
      return buildUnits(box).filter((unit) => unit.materialId === materialId).slice(0, 6)
    }
    return (topic ? retrieve(box, topic) : buildUnits(box)).slice(0, 4)
  }

  /** Prompt parts shared by every question of one practice set. */
  const quizParts = (box, topic, webNote, units) => {
    const chosen = Array.isArray(units) ? units : quizUnits(box, topic, '')
    const parts = [renderExcerpts(chosen)]
    if (topic.length > 0) parts.push(`【考察范围】\n${topic}`)
    if (webNote !== '') parts.push(`【联网参考（仅作题型参考，不作为答案依据）】\n${webNote.slice(0, 4000)}`)
    return parts
  }

  /** Notes, the wrong-answer book, and Markdown export. */
  const noteEndpoints = {
    async appendNote(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
      if (!text || text.length > 50000) throw new Error('请选择 1–50000 字的内容。')
      const targetId = payload?.noteId || box.settings?.defaultAppendNoteId || 'latest'
      box.notes ??= []
      let note = targetId === 'latest'
        ? box.notes.slice().reverse().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
        : box.notes.find((entry) => entry.id === targetId)
      if (!note && targetId !== 'latest') throw new Error('所选笔记已不存在，请重新选择。')
      const now = new Date().toISOString()
      if (!note) {
        note = { id: randomUUID(), title: '摘录笔记', section: box.settings?.defaultNoteSection ?? '今日知识点', tags: [], refs: [], body: '', createdAt: now }
        box.notes.push(note)
      }
      note.body = `${String(note.body ?? '').trimEnd()}${note.body?.trim() ? '\n\n' : ''}${text}`
      const material = box.materials.find((entry) => entry.id === payload?.materialId)
      note.refs ??= []
      if (material && !note.refs.some((ref) => ref.id === material.id)) note.refs.push({ id: material.id, name: material.name })
      note.updatedAt = now
      await store.save(box)
      return { note, summary: summarize(box) }
    },
    async notes(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      return { notes: box.notes ?? [], wrong: box.wrong ?? [] }
    },

    async addNote(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const body = typeof payload?.body === 'string' ? payload.body : ''
      const now = new Date().toISOString()
      const note = {
        id: randomUUID(),
        title: boxName(payload?.title, body.trim().split('\n')[0].slice(0, 40) || '未命名笔记'),
        section: boxName(payload?.section, box.settings?.defaultNoteSection ?? '今日知识点'),
        tags: normaliseTags(payload?.tags),
        body,
        refs: Array.isArray(payload?.refs)
          ? payload.refs
            .filter((ref) => ref !== null && typeof ref === 'object' && typeof ref.id === 'string' && typeof ref.name === 'string')
            .map((ref) => ({ id: ref.id, name: ref.name }))
            .slice(0, 8)
          : [],
        createdAt: now,
        updatedAt: now,
      }
      box.notes = Array.isArray(box.notes) ? box.notes : []
      box.notes.push(note)
      await store.save(box)
      return { note, summary: summarize(box) }
    },

    async updateNote(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const note = (box.notes ?? []).find((entry) => entry.id === payload?.noteId)
      if (note === undefined) throw new Error('notebook: 找不到这条笔记')
      if (typeof payload.title === 'string') note.title = boxName(payload.title, note.title)
      if (typeof payload.section === 'string') note.section = boxName(payload.section, note.section)
      if (Array.isArray(payload.tags)) note.tags = normaliseTags(payload.tags)
      if (typeof payload.body === 'string') note.body = payload.body
      note.updatedAt = new Date().toISOString()
      await store.save(box)
      return { note, summary: summarize(box) }
    },

    async removeNote(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      box.notes = (box.notes ?? []).filter((entry) => entry.id !== payload?.noteId)
      if (box.settings?.defaultAppendNoteId === payload?.noteId) box.settings.defaultAppendNoteId = 'latest'
      await store.save(box)
      return { summary: summarize(box) }
    },

    /** File one answer into the wrong-answer book for later review. */
    async addWrong(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const target = (box.messages ?? []).find((message) => message.id === payload?.messageId)
      if (target === undefined) throw new Error('notebook: 找不到这条消息')
      const question = (box.messages ?? []).find((message) => message.id === target.parentId)
      box.wrong = Array.isArray(box.wrong) ? box.wrong : []
      const existing = box.wrong.find((entry) => entry.messageId === target.id)
      if (existing !== undefined) return { entry: existing, summary: summarize(box) }
      const entry = {
        id: randomUUID(),
        messageId: target.id,
        question: question?.text ?? '',
        answer: target.text,
        reviewed: false,
        createdAt: new Date().toISOString(),
      }
      box.wrong.push(entry)
      await store.save(box)
      return { entry, summary: summarize(box) }
    },

    async updateWrong(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const entry = (box.wrong ?? []).find((item) => item.id === payload?.wrongId)
      if (entry === undefined) throw new Error('notebook: 找不到这条错题')
      if (typeof payload.reviewed === 'boolean') entry.reviewed = payload.reviewed
      await store.save(box)
      return { summary: summarize(box) }
    },

    async removeWrong(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      box.wrong = (box.wrong ?? []).filter((entry) => entry.id !== payload?.wrongId)
      await store.save(box)
      return { summary: summarize(box) }
    },

    /** Start a practice set: the plan is persisted first, then questions arrive one by one. */
    async beginQuiz(payload, signal) {
      const box = await store.get({ boxId: requireId(payload) })
      const count = Number.isInteger(payload?.count) ? Math.min(8, Math.max(1, payload.count)) : 3
      const topic = typeof payload?.topic === 'string' ? payload.topic.trim() : ''
      // An explicit material narrows the set to that source alone.
      const materialId = typeof payload?.materialId === 'string' && box.materials.some((entry) => entry.id === payload.materialId) ? payload.materialId : ''
      const units = quizUnits(box, topic, materialId)
      if (units.length === 0 && payload?.useWeb !== true) {
        if (materialId !== '') throw new Error('notebook: 所选资料没有可用内容，换一份或改回全部资料。')
        // Distinguish "no material at all" from "the topic matched nothing".
        if (buildUnits(box).length === 0) throw new Error('notebook: 这个学习区还没有资料，先导入再出题。')
        throw new Error(`notebook: 没有找到与「${topic.slice(0, 30)}」相关的资料，换个关键词或清空题目再试。`)
      }

      let webNote = ''
      if (payload?.useWeb === true) {
        try {
          const web = ctx.get('web')
          if (web === undefined) throw new Error('当前 profile 没有启用联网搜索')
          const result = await web.search({ query: topic.length > 0 ? `${topic} 考研 真题` : `${box.name} 考研 习题`, maxResults: 5 }, signal)
          webNote = webLines(result, 3000)
        } catch (error) {
          webNote = ''
          // A failed search must not block the local question set.
          if (payload?.requireWeb === true) throw error
        }
      }
      const parts = quizParts(box, topic, webNote, units)

      let quizEffort = 'low'
      if (typeof ctx.llm.resolveModelInfo === 'function') {
        const selected = ctx.agentDefaultModel.currentSelection()
        const info = await ctx.llm.resolveModelInfo(payload?.provider ?? selected.provider, payload?.model ?? selected.model).catch(() => undefined)
        const efforts = info?.reasoning?.efforts ?? []
        quizEffort = efforts.find((entry) => entry.id === 'low')?.id ?? efforts[0]?.id
      }
      const difficulty = ['basic', 'medium', 'advanced', 'any'].includes(payload?.difficulty) ? payload.difficulty : 'medium'
      const practice = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        topic,
        difficulty,
        usedWeb: webNote !== '',
        questions: [],
        responses: {},
        done: false,
        plan: {
          count,
          kinds: planKinds(payload?.questionKind, count),
          difficulty,
          topic,
          materialId,
          webNote: webNote.slice(0, 4000),
          effort: quizEffort,
        },
      }
      box.practice = practice
      await store.save(box)
      const question = await askOneQuestion({
        kind: practice.plan.kinds[0],
        difficulty,
        parts,
        generated: [],
        provider: payload?.provider,
        model: payload?.model,
        effort: quizEffort,
        signal,
      })
      if (question === undefined) throw new Error('第 1 道题未生成完整，请重试。')
      practice.questions.push({ ...question, id: randomUUID() })
      if (practice.questions.length >= count) practice.done = true
      await store.save(box)
      return { practice, done: practice.done, summary: summarize(box) }
    },

    /** Generate the next question of an in-progress set; resumes after a failure. */
    async quizNext(payload, signal) {
      const box = await store.get({ boxId: requireId(payload) })
      const practice = box.practice
      if (practice === undefined || practice.id !== payload?.practiceId) throw new Error('notebook: 这套题已经失效，请重新出题。')
      const plan = practice.plan
      if (practice.done === true || plan === undefined) return { practice, done: true, summary: summarize(box) }
      const index = practice.questions.length
      if (index >= plan.count) {
        practice.done = true
        await store.save(box)
        return { practice, done: true, summary: summarize(box) }
      }
      const parts = quizParts(box, plan.topic, practice.usedWeb === true ? plan.webNote : '', quizUnits(box, plan.topic, typeof plan.materialId === 'string' ? plan.materialId : ''))
      const question = await askOneQuestion({
        kind: plan.kinds[index] ?? 'choice',
        difficulty: plan.difficulty ?? 'medium',
        parts,
        generated: practice.questions,
        provider: payload?.provider,
        model: payload?.model,
        effort: plan.effort ?? 'low',
        signal,
      })
      if (question === undefined) throw new Error(`第 ${index + 1} 道题未生成完整，请重试。`)
      practice.questions.push({ ...question, id: randomUUID() })
      if (practice.questions.length >= plan.count) practice.done = true
      await store.save(box)
      return { practice, question: practice.questions[practice.questions.length - 1], done: practice.done, summary: summarize(box) }
    },

    /** Grade one answer; each question accepts a single submission. */
    async answerQuestion(payload, signal) {
      const box = await store.get({ boxId: requireId(payload) })
      const practice = box.practice
      if (practice === undefined || practice.id !== payload?.practiceId) throw new Error('notebook: 这套题已经失效，请重新出题。')
      const question = practice.questions.find((item) => item.id === payload?.questionId)
      if (question === undefined) throw new Error('notebook: 找不到这道题')
      // One question, one submission: a repeat call returns the stored verdict
      // instead of grading again, so an impatient double click cannot file the
      // same wrong answer twice or burn extra tokens.
      const settled = practice.responses?.[question.id]
      if (settled !== undefined) {
        return {
          correct: settled.correct === true,
          issues: Array.isArray(settled.issues) ? settled.issues : [],
          answerIndex: question.answerIndex,
          explanation: settled.explanation ?? question.explanation,
          summary: summarize(box),
          wrong: box.wrong ?? [],
        }
      }
      const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
      const choice = Number.isInteger(payload?.choice) ? payload.choice : -1
      if (question.type === 'open') {
        if (text.length === 0) throw new Error('notebook: 请先写下你的答案。')
      } else if (choice < 0 || choice >= question.options.length) {
        throw new Error('notebook: 请选择一个选项。')
      }

      const verdict = await gradeAnswer({
        box,
        question,
        choice,
        text,
        useWeb: payload?.useWeb === true || practice.usedWeb === true,
        signal,
        payload,
      })
      practice.responses = practice.responses ?? {}
      practice.responses[question.id] = {
        choice: question.type === 'open' ? undefined : choice,
        text: question.type === 'open' ? text : undefined,
        correct: verdict.correct,
        issues: verdict.issues,
        explanation: verdict.explanation === '' ? question.explanation : verdict.explanation,
        at: new Date().toISOString(),
      }

      box.wrong = Array.isArray(box.wrong) ? box.wrong : []
      const already = box.wrong.find((entry) => entry.questionId === question.id)
      if (!verdict.correct && already === undefined) {
        // Keep the note written for THIS answer, not the question's canned one.
        const note = verdict.explanation === '' ? question.explanation : verdict.explanation
        box.wrong.push({
          id: randomUUID(),
          questionId: question.id,
          kind: question.type,
          messageId: undefined,
          question: question.stem,
          options: question.options,
          answerIndex: question.answerIndex,
          referenceAnswer: question.referenceAnswer,
          rubric: question.rubric ?? [],
          answer: `${question.referenceAnswer ?? ''}\n\n${note}`.trim(),
          explanation: note,
          given: question.type === 'open' ? text : question.options[choice],
          chosen: question.type === 'open' ? undefined : question.options[choice],
          issues: verdict.issues,
          attempts: 1,
          reviewed: false,
          createdAt: new Date().toISOString(),
        })
      }
      await store.save(box)
      return {
        correct: verdict.correct,
        issues: verdict.issues,
        answerIndex: question.answerIndex,
        explanation: verdict.explanation === '' ? question.explanation : verdict.explanation,
        summary: summarize(box),
        wrong: box.wrong,
      }
    },

    /** Re-attempt one entry from the wrong-answer book. */
    async regradeWrong(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const entry = (box.wrong ?? []).find((item) => item.id === payload?.wrongId)
      if (entry === undefined) throw new Error('notebook: 找不到这条错题')
      if (entry.questionId === undefined) throw new Error('notebook: 这条错题没有可重做的题目。')
      const question = {
        type: entry.kind === 'open' ? 'open' : 'choice',
        stem: entry.question,
        options: Array.isArray(entry.options) ? entry.options : [],
        answerIndex: Number.isInteger(entry.answerIndex) ? entry.answerIndex : -1,
        referenceAnswer: entry.referenceAnswer ?? '',
        rubric: Array.isArray(entry.rubric) ? entry.rubric : [],
        explanation: entry.explanation ?? entry.answer ?? '',
      }
      const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
      const choice = Number.isInteger(payload?.choice) ? payload.choice : -1
      if (question.type === 'open') {
        if (text.length === 0) throw new Error('notebook: 请先写下你的答案。')
      } else if (choice < 0 || choice >= question.options.length) {
        throw new Error('notebook: 请选择一个选项。')
      }
      const verdict = await gradeAnswer({ box, question, choice, text, useWeb: payload?.useWeb === true, signal: undefined, payload })
      entry.attempts = (entry.attempts ?? 1) + 1
      entry.given = question.type === 'open' ? text : question.options[choice]
      if (question.type !== 'open') entry.chosen = question.options[choice]
      entry.issues = verdict.issues
      // A still-wrong retry replaces the note; a correct one keeps the original
      // mistake analysis (that is the part worth reviewing later).
      if (!verdict.correct && verdict.explanation !== '') {
        entry.explanation = verdict.explanation
        entry.answer = `${question.referenceAnswer ?? ''}\n\n${verdict.explanation}`.trim()
      }
      if (verdict.correct) entry.reviewed = true
      await store.save(box)
      return {
        correct: verdict.correct,
        issues: verdict.issues,
        explanation: verdict.explanation === '' ? question.explanation : verdict.explanation,
        reviewed: entry.reviewed === true,
        summary: summarize(box),
        wrong: box.wrong,
      }
    },

    /** Current practice set, if any. */
    async practice(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      return { practice: box.practice ?? null, wrong: box.wrong ?? [] }
    },

    /** Merge whitelisted per-box settings. */
    async updateSettings(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      const patch = payload?.patch
      if (patch === null || typeof patch !== 'object') throw new Error('notebook: 设置内容无效')
      const settings = box.settings ?? {}
      if (typeof patch.defaultNoteSection === 'string' && patch.defaultNoteSection.trim().length > 0) {
        settings.defaultNoteSection = patch.defaultNoteSection.trim().slice(0, 40)
      }
      if (['mixed', 'choice', 'open'].includes(patch.defaultQuestionKind)) {
        settings.defaultQuestionKind = patch.defaultQuestionKind
      }
      if (['basic', 'medium', 'advanced', 'any'].includes(patch.defaultDifficulty)) {
        settings.defaultDifficulty = patch.defaultDifficulty
      }
      if (typeof patch.defaultUseWeb === 'boolean') settings.defaultUseWeb = patch.defaultUseWeb
      if (typeof patch.multiSelectNotes === 'boolean') settings.multiSelectNotes = patch.multiSelectNotes
      if (QA_SCOPES.includes(patch.qaScope)) settings.qaScope = patch.qaScope
      if (typeof patch.stopClearsQueue === 'boolean') settings.stopClearsQueue = patch.stopClearsQueue
      if (typeof patch.fontBody === 'string') settings.fontBody = patch.fontBody
      if (typeof patch.fontBodySize === 'string') settings.fontBodySize = patch.fontBodySize
      if (typeof patch.fontCodeSize === 'string') settings.fontCodeSize = patch.fontCodeSize
      if (typeof patch.fontCode === 'string') settings.fontCode = patch.fontCode
      if (typeof patch.fontSize === 'string') settings.fontSize = patch.fontSize
      if (typeof patch.customFontName === 'string') settings.customFontName = patch.customFontName
      if (Array.isArray(patch.referenceNotes)) settings.referenceNotes = [...new Set(patch.referenceNotes.filter((entry) => ['today', 'daily', 'notes'].includes(entry)))]
      if (patch.defaultAppendNoteId === 'latest' || box.notes?.some((note) => note.id === patch.defaultAppendNoteId)) settings.defaultAppendNoteId = patch.defaultAppendNoteId
      box.settings = settings
      await store.save(box)
      return { settings, summary: summarize(box) }
    },

    /** Summarise the note the user is editing. */
    async summarize(payload, signal) {
      await store.get({ boxId: requireId(payload) })
      const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
      if (text.length === 0) throw new Error('notebook: 先写点内容再总结。')
      const answer = await complete(ctx, {
        system: summarySystem(),
        prompt: `【需要整理的笔记】\n${text.slice(0, 8000)}`,
        signal,
        provider: payload?.provider,
        model: payload?.model,
        reasoningEffort: payload?.reasoningEffort,
      })
      return { markdown: answer.text }
    },

    /** Fold today's questions, answers and notes into one new note. */
    async dailySummary(payload, signal) {
      const box = await store.get({ boxId: requireId(payload) })
      const todays = (box.messages ?? []).filter((message) => isToday(message.createdAt) && message.knowledgeEligible !== false)
      const notes = (box.notes ?? []).filter((note) => isToday(note.createdAt) && !note.tags?.includes('今日总结'))
      if (todays.length === 0 && notes.length === 0) {
        throw new Error('notebook: 今天还没有内容可以总结。')
      }
      const history = []
      for (const message of todays) {
        if (message.role === 'user') history.push(`问：${message.text}`)
        else if (message.kind === 'hint') history.push(`提示：${message.text}`)
        else if (message.kind === 'extend') history.push(`延伸：${message.text}`)
        else history.push(`答：${message.text}`)
      }
      for (const note of notes) {
        history.push(`笔记《${note.title}》：\n${note.body}`)
      }
      const answer = await complete(ctx, {
        system: dailySummarySystem(),
        prompt: `【今日内容】\n${history.join('\n\n').slice(0, 12000)}`,
        signal,
        provider: payload?.provider,
        model: payload?.model,
        reasoningEffort: payload?.reasoningEffort,
      })
      const today = new Date()
      if (answer.text.trim() === 'NO_KNOWLEDGE') throw new Error('notebook: 今天还没有可总结的学习知识点。')
      const label = `${today.getMonth() + 1}-${String(today.getDate()).padStart(2, '0')}`
      const note = {
        id: randomUUID(),
        title: `今日总结 · ${label}`,
        section: box.settings?.defaultNoteSection ?? '今日知识点',
        tags: ['今日总结'],
        body: answer.text,
        refs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      box.notes = Array.isArray(box.notes) ? box.notes : []
      box.notes.push(note)
      await store.save(box)
      return { note, summary: summarize(box) }
    },

    /** Render one Markdown document for the browser to download. */
    async exportMarkdown(payload) {
      const box = await store.get({ boxId: requireId(payload) })
      if (payload?.scope === 'note') {
        const note = (box.notes ?? []).find((entry) => entry.id === payload?.noteId)
        if (!note) throw new Error('notebook: 请先选择要导出的笔记。')
        const safeTitle = note.title.replace(/[\\/:*?"<>|]/gu, '_').slice(0, 80) || '笔记'
        return { filename: `${safeTitle}.md`, markdown: `# ${note.title}\n\n${String(note.body ?? '').trim()}\n` }
      }
      const scope = Object.hasOwn(EXPORT_SCOPES, payload?.scope) ? payload.scope : 'all'
      const markdown = renderExport(box, scope)
      const suffix = EXPORT_SCOPES[scope].file
      const safeName = box.name.replace(/[\\/:*?"<>|]/gu, '_').slice(0, 40)
      return { filename: `${safeName}-${dayKey()}-${suffix}.md`, markdown }
    },
  }

  /** Model catalogue and the two coaching helpers. */
  const extraEndpoints = {
    async models() {
      const current = ctx.agentDefaultModel.currentSelection()
      const providers = []
      for (const provider of ctx.llm.listProviders()) {
        let models = []
        try {
          models = await ctx.llm.listModels(provider.id)
        } catch {
          models = []
        }
        if (models.length === 0) continue
        providers.push({
          id: provider.id,
          name: provider.name,
          models: models.map((model) => ({ id: model.id, name: model.name })),
        })
      }
      // Keep the selector usable even when an adapter advertises no catalogue.
      if (providers.length === 0 && typeof current?.provider === 'string' && typeof current?.model === 'string') {
        providers.push({
          id: current.provider,
          name: current.provider,
          models: [{ id: current.model, name: current.model }],
        })
      }
      return {
        current: { provider: current.provider, model: current.model },
        providers,
      }
    },

    /** Reasoning efforts the exact model route advertises. */
    async efforts(payload) {
      const current = ctx.agentDefaultModel.currentSelection()
      const provider = typeof payload?.provider === 'string' && payload.provider.length > 0 ? payload.provider : current.provider
      const model = typeof payload?.model === 'string' && payload.model.length > 0 ? payload.model : current.model
      try {
        const info = await ctx.llm.resolveModelInfo(provider, model)
        const reasoning = info?.reasoning
        if (reasoning === undefined) return { provider, model, efforts: [], default: undefined }
        return {
          provider,
          model,
          efforts: reasoning.efforts.map((entry) => ({ id: String(entry.id), name: entry.name })),
          default: reasoning.defaultEffort === undefined ? undefined : String(reasoning.defaultEffort),
        }
      } catch {
        return { provider, model, efforts: [], default: undefined }
      }
    },

    /** A nudge instead of an answer. Falls back to the last question asked. */
    async hint(payload, signal) {
      const box = await store.get({ boxId: requireId(payload) })
      const typed = typeof payload?.question === 'string' ? payload.question.trim() : ''
      const lastAsked = [...(box.messages ?? [])].reverse().find((message) => message.role === 'user' && (message.conversationId ?? 'default') === (payload?.conversationId ?? 'default'))
      const question = typed.length > 0 ? typed : (lastAsked?.text ?? '')
      if (question.length === 0) throw new Error('先写下一个想攻克的题目或问题，再要提示。')
      const units = retrieve(box, question)
      if (units.length === 0) throw new Error('未找到相关学习资料，请先补充资料再获取提示。')
      const answer = await complete(ctx, {
        system: hintSystem(),
        prompt: [renderExcerpts(units), `【用户卡住的地方】\n${question}`, '请给一个提示，不要给完整答案。'].join('\n\n'),
        signal,
        provider: payload?.provider,
        model: payload?.model,
        reasoningEffort: payload?.reasoningEffort,
      })
      const message = {
        id: randomUUID(),
        role: 'assistant',
        kind: 'hint',
        conversationId: payload?.conversationId ?? 'default',
        text: answer.text,
        sources: sourcesOf(units),
        createdAt: new Date().toISOString(),
        model: { provider: answer.provider, model: answer.model },
      }
      box.messages.push(message)
      await store.save(box)
      return { message: publicMessage(message), summary: summarize(box) }
    },

    /** Three clickable next steps, cached on the answer that produced them. */
    async followups(payload, signal) {
      const box = await store.get({ boxId: requireId(payload) })
      const target = box.messages.find((message) => message.id === payload?.messageId && message.role === 'assistant')
      if (target === undefined) throw new Error('notebook: 找不到对应的回答')
      if (target.knowledgeEligible === false) return { questions: [] }
      if (Array.isArray(target.followups) && target.followups.length > 0) return { questions: target.followups }
      const question = box.messages.find((message) => message.id === target.parentId)
      const units = retrieve(box, `${question?.text ?? ''}\n${target.text}`)
      if (units.length === 0) return { questions: [] }
      const answer = await complete(ctx, {
        system: followupSystem(),
        prompt: [
          renderExcerpts(units),
          `【刚完成的问答】\n问：${question?.text ?? '（未记录）'}\n答：${target.text.slice(0, 1200)}`,
          '请给出 3 条接下来可以问的。',
        ].join('\n\n'),
        signal,
        maxTokens: 300,
      })
      const questions = parseFollowups(answer.text)
      if (questions.length > 0) {
        target.followups = questions
        await store.save(box)
      }
      return { questions }
    },
  }

  /**
   * Serve one file from the vendored asset directory.
   * Rejects traversal, unknown files, and anything outside `vendor/`.
   * @param relative - decoded path below `vendor/`.
   * @param req - incoming request (used for HEAD).
   * @param res - response to own.
   */
  const serveAsset = async (relative, req, res) => {
    let target
    try {
      const root = vendorRoot()
      const resolved = path.resolve(root, relative)
      if (!resolved.startsWith(root)) throw new Error('outside vendor root')
      target = resolved
    } catch {
      res.writeHead(400).end('bad asset path')
      return
    }
    let body
    try {
      body = await fs.readFile(target)
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('asset not found')
      return
    }
    const type = ASSET_TYPES.get(path.extname(target).toLowerCase()) ?? 'application/octet-stream'
    res.writeHead(200, {
      'content-type': type,
      'content-length': String(body.length),
      'cache-control': 'public, max-age=86400',
    })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    res.end(body)
  }

  /**
   * Stream one grounded answer as Server-Sent Events.
   * Owns the response: frames are `delta`, then `done` or `error`.
   */
  const runStream = async (payload, req, res) => {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    })
    const controller = new AbortController()
    const abort = () => controller.abort()
    res.on('close', abort)
    const send = (frame) => {
      if (res.writableEnded || res.destroyed) return
      try {
        res.write(`data: ${JSON.stringify(frame)}\n\n`)
      } catch {
        // The browser went away mid-frame; nothing left to deliver.
      }
    }
    try {
      const result = await dialogEndpoints.ask(payload, controller.signal, (text) => send({ type: 'delta', text }))
      send({ type: 'done', ...result })
    } catch (error) {
      send({ type: 'error', message: humanError(error) })
    } finally {
      res.off('close', abort)
      if (!res.writableEnded) res.end()
    }
  }

  const endpoints = {
    async ping() {
      const boxes = await store.list()
      return { version: 1, dir: dataRoot(), boxes: boxes.length }
    },
    async list() {
      return { boxes: await store.list(), dir: dataRoot() }
    },
    async get(payload) {
      const box = await store.get(payload)
      return {
        ...box,
        nativeFilePicker: process.platform === 'win32',
        conversations: box.conversations ?? [{ id: 'default', title: '原有聊天' }],
        materials: (box.materials ?? []).map((material) => ({
          id: material.id,
          name: material.name,
          kind: material.kind,
          chars: material.chars,
          chunks: Array.isArray(material.chunks) ? material.chunks.length : 0,
          addedAt: material.addedAt,
          indexed: typeof material.summary === 'string' && material.summary !== '',
        })),
        messages: (box.messages ?? []).map((message) => publicMessage(message, box)),
        notes: box.notes ?? [],
        wrong: box.wrong ?? [],
        settings: box.settings ?? {},
        practice: box.practice ?? null,
      }
    },
    create: (payload) => store.create(payload),
    rename: (payload) => store.rename(payload),
    remove: (payload) => store.remove(payload),
    ...materialEndpoints,
    ...dialogEndpoints,
    ...extraEndpoints,
    ...noteEndpoints,
  }

  // A model-facing tool so a normal chat can file notes into a study box.
  const tools = ctx.get('tools')
  if (tools !== undefined) {
    ctx.effect(() => tools.register({
      name: 'notebook_save_note',
      description: '把一段 Markdown 内容保存为 NoteBook 学习区的笔记。用户要求「记到学习区 / 存成笔记」时使用；未指定学习区则用第一个。',
      parameters: {
        type: 'object',
        properties: {
          box: { type: 'string', description: '学习区名称，可省略' },
          title: { type: 'string', description: '笔记标题，可省略' },
          section: { type: 'string', description: '分区，默认沿用学习区设置' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签，可省略' },
          content: { type: 'string', description: 'Markdown 正文' },
        },
        required: ['content'],
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            saved: { type: 'boolean' },
            box: { type: 'string' },
            noteId: { type: 'string' },
          },
          required: ['saved'],
        },
        render(args, value) {
          const saved = value !== null && typeof value === 'object' && value.saved === true
          return [{ type: 'text', text: saved ? `已保存到学习区「${String(value.box ?? '')}」` : '没有保存（找不到学习区或内容为空）' }]
        },
      },
      async execute(args) {
        const body = typeof args?.content === 'string' ? args.content : ''
        if (body.trim().length === 0) return { saved: false }
        const index = await store.list()
        if (index.length === 0) return { saved: false }
        const wanted = typeof args?.box === 'string' ? args.box.trim() : ''
        const target = wanted === ''
          ? index[0]
          : (index.find((entry) => entry.id === wanted) ?? index.find((entry) => entry.name.includes(wanted)) ?? index[0])
        const box = await store.get({ boxId: target.id })
        const now = new Date().toISOString()
        const note = {
          id: randomUUID(),
          title: boxName(args?.title, body.trim().split('\n')[0].slice(0, 40) || '未命名笔记'),
          section: boxName(args?.section, box.settings?.defaultNoteSection ?? '今日知识点'),
          tags: normaliseTags(args?.tags),
          body,
          refs: [],
          createdAt: now,
          updatedAt: now,
        }
        box.notes = Array.isArray(box.notes) ? box.notes : []
        box.notes.push(note)
        await store.save(box)
        return { saved: true, box: box.name, noteId: note.id }
      },
    }), 'notebook: save-note tool')
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE,
    async handler(req, res) {
      const pathname = (() => {
        try {
          return new URL(req.url ?? '/', 'http://localhost').pathname
        } catch {
          return ''
        }
      })()

      // Vendored library assets are static files with no user data, the same
      // posture as the app's own static assets, so they are served before the
      // browser-session check. Every data endpoint below still requires it.
      const assetPrefix = `${ROUTE}/asset/`
      if ((req.method === 'GET' || req.method === 'HEAD') && pathname.startsWith(assetPrefix)) {
        await serveAsset(decodeURIComponent(pathname.slice(assetPrefix.length)), req, res)
        return
      }

      const admission = ctx.connection.admit(req)
      if (admission.rejection !== undefined) {
        respond(res, admission.rejection, { ok: false, error: { code: 'notebook/unauthorized', message: 'not authorized', details: {} } })
        return
      }
      if (req.method !== 'POST') {
        respond(res, 405, { ok: false, error: { code: 'notebook/method', message: 'POST required', details: {} } })
        return
      }
      let request
      try {
        request = await readBody(req)
      } catch (error) {
        respond(res, 400, fail('body', error instanceof Error ? error.message : String(error)))
        return
      }
      const endpoint = request?.endpoint
      if (endpoint === 'askStream') {
        await runStream(request.payload, req, res)
        return
      }
      const run = typeof endpoint === 'string' ? endpoints[endpoint] : undefined
      if (run === undefined) {
        respond(res, 200, fail('unknown-endpoint', `unknown endpoint "${String(endpoint)}"`))
        return
      }
      // A browser disconnect cancels the model call instead of leaving it running.
      const controller = new AbortController()
      const abort = () => controller.abort()
      res.on('close', abort)
      try {
        respond(res, 200, done(await run(request.payload, controller.signal)))
      } catch (error) {
        respond(res, 200, fail('handler', humanError(error)))
      } finally {
        res.off('close', abort)
      }
    },
  }), 'notebook: http route')
}

export { apply }
// Pure helpers exported for the offline checks in `_scratch`; the Loader only
// consumes `apply` and `inject`, so extra exports are inert at runtime.
export { chunkText, tokenize, retrieve, renderExcerpts, wantsHistory, repairSource }
