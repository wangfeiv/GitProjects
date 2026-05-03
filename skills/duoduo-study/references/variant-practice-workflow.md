# Variant Practice Workflow

Use this workflow when the user asks for:
- 同类型变式练习卷
- 根据错题生成练习题并导出 Word
- 不是复习原题，而是要做同类新题

## Goal

Keep the same:
- 知识点
- 题目类型
- 难度层级

Allow changes to:
- 数字
- 场景
- 人物名字
- 表达方式

Do not drift away from the original question family.

## Recommended workflow

### Step 1: Build seed JSON from wrong-question bank

```bash
python3 scripts/build_variant_practice_seed_json.py \
  --subject 数学 \
  --errors ~/.openclaw/workspace/duoduo/math/errors.md \
  --output /tmp/duoduo-math-variant-seed.json \
  --count 8
```

### Step 2: Let the model generate final practice JSON

Read the seed JSON, then produce a final JSON in the `generate_review_docx.py` schema:
- sections
- questions
- number
- type
- difficulty
- text
- answer
- explanation

### Step 3: Generate Word docx

```bash
python3 scripts/generate_review_docx.py \
  /tmp/duoduo-math-variant-final.json \
  ~/.openclaw/workspace/duoduo/math/variant-practice-YYYYMMDD.docx
```

## Important rules

1. Final Word must remain pure text
2. Every variant question must clearly match the source question type
3. Every variant question must include answer and explanation
4. Every variant question must include difficulty label
5. Prefer age-appropriate wording for 小学四年级下学期
