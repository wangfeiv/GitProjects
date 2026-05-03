# One Command Workflow

Use this when the user wants a Word review paper directly from the stored wrong-question bank.

## Command

```bash
python3 scripts/build_review_docx_from_errors.py \
  --subject 数学 \
  --errors ~/.openclaw/workspace/duoduo/math/errors.md \
  --output ~/.openclaw/workspace/duoduo/math/review-paper-YYYYMMDD.docx
```

## What it does

1. Reads `errors.md`
2. Selects eligible wrong questions (default: 未掌握 + 练习中)
3. Builds grouped review JSON
4. Calls the docx generator
5. Produces a printable Word paper

## Recommended use

- 快速生成数学/语文/英语复习卷
- 先做严格复习卷（基于原题）
- Later extend to variant practice mode if needed

## Optional useful flags

- `--max-questions 12`
- `--statuses "未掌握,练习中"`
- `--title "多多数学复习卷"`
- `--keep-json /tmp/review.json`
