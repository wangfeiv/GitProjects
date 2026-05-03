# Closed Loop Workflow

Use this workflow to turn wrong-question data into a printable Word review paper.

## Closed loop

1. Record wrong questions into `errors.md`
2. Sync `knowledge.md`
3. Build review JSON from `errors.md`
4. Generate `.docx` from review JSON
5. Send the document or save it for later
6. After review, update mastery status back into `errors.md` and `knowledge.md`

## Script chain

### Step 1: Build JSON

```bash
python3 scripts/build_review_json.py \
  --subject 数学 \
  --errors ~/.openclaw/workspace/duoduo/math/errors.md \
  --output /tmp/duoduo-math-review.json \
  --student-name 多多 \
  --grade 小学四年级下学期 \
  --max-questions 12
```

### Step 2: Build Word docx

```bash
python3 scripts/generate_review_docx.py \
  /tmp/duoduo-math-review.json \
  ~/.openclaw/workspace/duoduo/math/review-paper-YYYYMMDD.docx
```

## Important constraints

- `build_review_json.py` only builds questions directly from existing wrong-question records
- It preserves question type and concept as much as possible
- For generated variants, the model should first create the variants, then save them into JSON using the same schema before calling the Word generator

## Recommended operational modes

### Mode A: strict review paper
Use original wrong-question content, cleaned and regrouped by question type.

### Mode B: same-type practice paper
1. Read relevant wrong questions
2. Generate same-type variants in chat or intermediate JSON
3. Keep question family, type, and difficulty aligned
4. Pass the final JSON to `generate_review_docx.py`
