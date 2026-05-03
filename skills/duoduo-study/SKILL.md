---
name: duoduo-study
description: Manage Duoduo's study error bank, review plans, and same-type practice generation for grade-4 elementary school subjects. Use when users mention 多多 and ask to record wrong questions, upload or analyze homework/test images, summarize weak points, generate review plans, update mastery status, or create similar exercises for math (PEP), Chinese (PEP), or English (Beijing Press).
---

# duoduo-study

## Overview

Use this skill to maintain a persistent, structured study system for 多多（北京市朝阳区，小学四年级下学期，男） across three subjects:
- 数学：人民教育出版社
- 语文：人民教育出版社
- 英语：北京出版社

This skill supports:
1. 错题录入（文本、单图、多图）
2. 错题库分类整理（按学科、知识点、时间）
3. 薄弱点查询与知识点掌握追踪
4. 个性化复习计划生成
5. 基于错题生成同类型练习题与答案

Everything must be stored on disk so users can come back later and continue managing the system.

## Data Layout

All persistent data lives under:

`~/.openclaw/workspace/duoduo/`

Structure:

```text
~/.openclaw/workspace/duoduo/
├── assets/
│   ├── math/
│   ├── chinese/
│   └── english/
├── math/
│   ├── errors.md
│   ├── knowledge.md
│   └── review.md
├── chinese/
│   ├── errors.md
│   ├── knowledge.md
│   └── review.md
└── english/
    ├── errors.md
    ├── knowledge.md
    └── review.md
```

Read `references/storage-schema.md` when you need the exact table structures, field meanings, or recommended output filenames.

## Subject Mapping

Map user inputs to subjects like this:
- 数学 / math / 算术 / 应用题 → `math`
- 语文 / chinese / 阅读 / 字词 / 作文 → `chinese`
- 英语 / english / 单词 / 语法 / 阅读 → `english`

If the subject is unclear, infer from the problem content first. Only ask the user if confidence is low.

## Core Workflow Decision Tree

### A. User wants to record a wrong question
Use the **Wrong Question Intake Workflow**.

Triggers include:
- “多多今天数学有一道错题”
- “帮我记录这道题”
- “把这几张图片整理进错题库”
- “这是多多英语错题”

### B. User wants a review plan
Use the **Review Plan Workflow**.

Triggers include:
- “生成本周复习计划”
- “帮多多安排一下数学复习”
- “多多最近该复习什么”

### C. User wants same-type exercises
Use the **Practice Generation Workflow**.

Triggers include:
- “根据错题出几道同类型题”
- “生成练习题”
- “按多多的薄弱点出一套题”

### D. User wants weak-point summary
Use the **Weak Point Query Workflow**.

Triggers include:
- “多多数学哪里薄弱”
- “汇总一下英语弱项”
- “哪些知识点还没掌握”

### E. User wants to mark progress
Use the **Mastery Update Workflow**.

Triggers include:
- “这个知识点已经掌握了”
- “错题 #5 已掌握”
- “把这项改成练习中”

## Wrong Question Intake Workflow

### Step 1: Determine input type
There are three valid intake modes:
1. 文本录入
2. 图片录入
3. 多张图片 + 文字补充录入

### Step 2: Validate required information
For text-only intake, the problem statement is required.

Required minimum fields:
- subject
- problem statement

Strongly preferred fields:
- source（作业 / 单元测试 / 日常考试 / 课堂练习 / 家长补充）
- Duoduo's wrong answer
- correct answer
- mistake reason

If some preferred fields are missing, still record the entry and mark unknown fields clearly.

### Step 3: Save uploaded images
If images are provided:
- Save them under `assets/{subject}/`
- Naming format: `YYYYMMDD-N.jpg`
- `N` is the sequence number for that subject on that date
- If multiple images belong to one question, save them all and list them together in the record

When multiple images describe a single question:
- merge them into one wrong-question entry
- preserve all image paths in the “原始图片” field
- do not create duplicate entries unless the images are clearly separate questions

### Step 4: Extract and normalize the question
When the input contains images:
- read the image content
- extract question text
- normalize it into clean text
- if the image includes multiple sub-questions, decide whether they belong to one concept cluster or separate entries
- prefer one entry per concept unless the questions are clearly independent and should be tracked separately

### Step 5: Write to errors.md
Append a new entry using this exact template:

```markdown
## 错题 #N：[知识点简述]

- **日期：** YYYY-MM-DD
- **来源：** 作业 / 单元测试 / 日常考试 / 课堂练习 / 薄弱点录入 / 家长补充
- **原始图片：** assets/{subject}/YYYYMMDD-1.jpg；assets/{subject}/YYYYMMDD-2.jpg（无图片填“无”）
- **题目：** ...
- **多多的答案：** ...（未知可写“未提供”）
- **正确答案：** ...（未知可写“待补充”）
- **错因分析：** ...
- **解题思路：** ...
- **知识点标签：** #标签1 #标签2
- **复习优先级：** ⭐ / ⭐⭐ / ⭐⭐⭐ / ⭐⭐⭐⭐ / ⭐⭐⭐⭐⭐
- **复习状态：** ❌ 未掌握 / 🔄 练习中 / ✅ 已掌握
- **下次复习日期：** YYYY-MM-DD
```

### Step 6: Update top summary table
At the top of `errors.md`, maintain a summary table with at least these columns:

```markdown
| # | 日期 | 来源 | 知识点 | 优先级 | 状态 |
```

Every new wrong-question entry must also be reflected in this table.

### Step 7: Update knowledge.md
For every intake:
- identify the main knowledge point(s)
- add or update them in `knowledge.md`
- mark mastery status consistently with the wrong-question entry

Recommended structure for `knowledge.md`:

```markdown
# 知识点掌握情况

| 知识点 | 科目 | 当前状态 | 相关错题 | 最近更新 |
|--------|------|----------|----------|----------|
| 乘法分配律 | 数学 | ❌ 未掌握 | #8, #10, #15 | 2026-04-16 |
```

## Weak-Point Intake Workflow

If the user reports a weakness without a specific question, create a lightweight wrong-question record.

Use:
- 来源：薄弱点录入
- 题目：薄弱点
- 多多的答案：未作答
- 正确答案：不适用

Still update:
- `errors.md`
- summary table
- `knowledge.md`

## Review Plan Workflow

When generating a review plan:

### Step 1: Read all three subjects
Read:
- `math/errors.md`
- `chinese/errors.md`
- `english/errors.md`

### Step 2: Select review candidates
Prioritize in this order:
1. ❌ 未掌握
2. 🔄 练习中 and review date is due
3. high-priority topics with repeated mistakes

### Step 3: Balance subjects
Do not overload one subject unless the user explicitly asks for a single-subject plan.

### Step 4: Write to review.md
Append a dated review block instead of overwriting old content.

Suggested format:

```markdown
## 本周复习计划（YYYY-MM-DD）

### 数学
- 复习：乘法分配律（对应错题 #8 #10 #15）
- 练习：同类题 4 道

### 语文
- 复习：...

### 英语
- 复习：...

## 历史记录
- 保留旧计划
```

### Step 5: Return a user-friendly summary
In chat, provide a concise merged summary of the plan.

## Practice Generation Workflow

Generate same-type exercises from either:
- one specific wrong question
- one knowledge point
- a group of weak points

### Rules for generated exercises
1. Keep the same concept, but change the surface numbers, wording, or context
2. Match 多多's grade level: 小学四年级下学期
3. Match the textbook style when possible
4. Avoid copying the original wrong question verbatim unless the user asks for a re-do version
5. Do not drift away from the original question type
6. Include answers
7. Include short explanations when useful
8. Always label question type
9. Always label difficulty level

### Required structure for generated practice
Generated practice must explicitly include:
- 题目类型：选择题 / 填空题 / 计算题 / 解答题 / 阅读题 / 应用题 / 其他
- 难易程度：基础 / 中等 / 提高
- 题目正文
- 参考答案
- 简短解析（适合小学生理解）

### Output formats
Use one of these depending on the request:
- 单题练习
- 同类题 3~5 道
- 小卷（5~15 道）
- 综合复习卷（含答案）
- 同类型变式练习卷（可导出 Word）

### Variant practice workflow
When the user explicitly wants same-type variants in a Word paper:
1. Prefer reading `references/variant-practice-workflow.md`
2. Prefer running `scripts/build_variant_practice_seed_json.py`
3. Use the seed JSON to generate final variant questions in the same JSON schema required by `generate_review_docx.py`
4. Then use `scripts/generate_review_docx.py` to produce the final docx

### Storage rule
If the user asks to save the generated exercises or review material:
- save under the appropriate subject folder
- prefer markdown or docx depending on the request
- make filenames clear and date-based

## Word Review Paper Generation Workflow

Use this workflow when the user asks for:
- Word 复习卷
- Word 练习卷
- 可打印试卷
- 错题复习卷 docx

### Mandatory rules for Word output
1. Use pure readable text in the final document
2. Do not include LaTeX, markdown math, XML fragments, escaped symbols, or other special formula syntax
3. Avoid any content that could render as乱码 or broken symbols in Word
4. Questions must come strictly from the wrong-question bank's concepts and question patterns
5. Same-type generated questions may vary numbers, wording, or context, but must not drift away from the original type
6. The paper must clearly separate sections such as 选择题、填空题、计算题、解答题
7. Every generated question must carry a difficulty label: 基础 / 中等 / 提高
8. The document must include a separate answer section with clear explanations
9. Prefer plain Chinese punctuation and simple formatting
10. Before finalizing, sanity-check that the content has no strange symbols and that all questions are valid grade-4 level questions
11. Prefer using `scripts/build_review_json.py` + `scripts/generate_review_docx.py` for docx generation
12. Read `references/word-generation.md` when you need the JSON structure and script workflow
13. Read `references/closed-loop-workflow.md` when generating a full review paper from the stored wrong-question bank
14. Prefer `scripts/build_review_docx_from_errors.py` when the user wants a direct one-command Word paper from `errors.md`
15. Read `references/one-command-workflow.md` when you need the direct end-to-end command pattern

### Required paper structure
When generating a review paper, include:
1. 标题
2. 学生信息栏（姓名、日期、用时、得分）
3. 试卷说明
4. 按题型分区的题目正文
5. 每题难易程度标注
6. 参考答案
7. 答案解析

### Question sourcing rules
- Source questions from `errors.md`
- Group by concept and question type
- If generating variants, preserve the same concept and same question family
- Do not invent unrelated topics
- Prefer repeated weak points and high-priority entries first
- Exclude any entry that is not self-contained on paper, such as entries whose question/answer/explanation still says “图片中包含…”, “待补充”, “原题图形未完整”, or other signs that the prompt still depends on the source image

### Recommended section order
A sensible default order is:
1. 填空题
2. 选择题
3. 计算题
4. 解答题 / 应用题

Adjust by subject when needed.

## Mastery Update Workflow

When the user says a topic or entry is mastered:
1. Find the corresponding wrong-question entry or knowledge point
2. Update status to `✅ 已掌握`
3. Clear or replace next review date with `已掌握，无需复习`
4. Sync the matching row in `knowledge.md`
5. Update the summary table if needed

If the user says “still weak” or “needs more practice”:
- set to `🔄 练习中` or `❌ 未掌握` based on severity
- assign a new next review date

## Weak Point Query Workflow

When asked where 多多 is weak:
1. Read the relevant `knowledge.md`
2. Filter all `❌ 未掌握`
3. Optionally include `🔄 练习中`
4. Group by subject and concept
5. Mention repeated patterns if visible

## Review-Date Guidance

Use these defaults unless the user specifies otherwise:
- New wrong question: review in 3 days
- Still not mastered after review: next review in 3 to 5 days
- Practice-in-progress: next review in 7 days if improving
- Mastered: no next review needed

## Priority Guidance

Set priority using this heuristic:
- ⭐⭐⭐⭐⭐: repeated mistakes, core foundations, or highly blocking concepts
- ⭐⭐⭐⭐: major weak point, likely to reappear soon
- ⭐⭐⭐: ordinary weak point
- ⭐⭐: light review needed
- ⭐: low urgency

## Important Persistence Rules

1. Always persist useful study data to disk
2. Always keep subject folders separate
3. Always keep image paths relative to `duoduo/`
4. Always update the summary table after adding or changing entries
5. Always sync `knowledge.md` after changing mastery status
6. Never overwrite historical review plans; append instead
7. If users ask to regenerate practice sheets or review plans, keep prior files unless explicitly asked to replace them

## Output Style

When chatting with the family:
- be clear and parent-friendly
- avoid overly technical wording
- for 多多, explanations should be age-appropriate
- when giving practice questions, keep formatting simple and printable

## Minimal Examples

### Example 1: Record one math wrong question
User: “多多今天数学作业这道题错了，题目是……他的答案是……正确答案是……”
Action:
- classify as math
- append to `duoduo/math/errors.md`
- update summary table
- update `duoduo/math/knowledge.md`

### Example 2: Merge multiple images into one wrong-question record
User: “这 3 张图是同一道英语错题，帮我整理进去”
Action:
- save all 3 images to `assets/english/`
- merge text into one entry
- record all image paths in one field
- update errors and knowledge tracking

### Example 3: Generate same-type exercises
User: “按多多数学里乘法分配律的错题出 5 道同类题，带答案”
Action:
- read related math entries
- generate 5 new problems with varied numbers/context
- include answers and short explanations
- save if the user asks
