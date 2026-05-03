# duoduo-study Storage Schema

## errors.md summary table

Recommended columns:

| # | 日期 | 来源 | 题目类型 | 知识点 | 难度 | 优先级 | 状态 | 下次复习日期 | 关联图片 |
|---|------|------|----------|--------|------|--------|------|--------------|----------|

### Column meanings
- #：错题编号，和详情区一致
- 日期：录入日期
- 来源：作业 / 单元测试 / 日常考试 / 课堂练习 / 薄弱点录入 / 家长补充
- 题目类型：选择题 / 填空题 / 计算题 / 解答题 / 阅读题 / 应用题 / 其他
- 知识点：主知识点名称
- 难度：基础 / 中等 / 提高
- 优先级：⭐ 到 ⭐⭐⭐⭐⭐
- 状态：❌ 未掌握 / 🔄 练习中 / ✅ 已掌握
- 下次复习日期：用于自动排计划
- 关联图片：相对路径，可多张

## knowledge.md table

| 知识点 | 细分说明 | 当前状态 | 难度 | 相关错题 | 错题次数 | 最近更新 | 备注 |
|--------|----------|----------|------|----------|----------|----------|------|

## review.md sections

Use this structure:

1. 当前待复习清单
2. 历史复习记录
3. 追加写入新的复习计划，不覆盖旧计划

## File naming suggestions for generated materials

### Practice sheets
- `practice-YYYYMMDD-topic.md`
- `practice-YYYYMMDD-topic.docx`

### Review papers
- `review-paper-YYYYMMDD-subject.docx`
- `review-paper-YYYYMMDD-topic.docx`
