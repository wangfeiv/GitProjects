# Word Generation Rules

Use `scripts/generate_review_docx.py` when users ask for:
- Word 复习卷
- Word 练习卷
- docx 可打印试卷

## Hard rules

1. Always generate pure readable text in the document
2. Never place LaTeX, markdown formulas, XML, code fences, or escaped syntax into the final Word file
3. Always include:
   - 标题
   - 信息栏
   - 按题型分区
   - 每题难度标注
   - 参考答案
   - 答案解析
4. Question text must stay close to the wrong-question bank's original type and concept
5. Same-type generated questions may vary numbers and context, but not topic family
6. Before generating JSON for the script, sanitize text to avoid strange symbols

## Suggested JSON production workflow

1. Read wrong questions from the subject's `errors.md`
2. Group by concept and question type
3. Build sections like:
   - 填空题
   - 选择题
   - 计算题
   - 解答题 / 应用题
4. For each question include:
   - number
   - type
   - difficulty
   - text
   - answer
   - explanation
5. Write JSON to a temp file
6. Run the script to produce `.docx`

## Minimal JSON example

```json
{
  "title": "多多数学复习卷",
  "student_name": "多多",
  "subject": "数学",
  "grade": "小学四年级下学期",
  "note": "本卷根据错题库生成",
  "sections": [
    {
      "name": "填空题",
      "questions": [
        {
          "number": 1,
          "type": "填空题",
          "difficulty": "基础",
          "text": "一个三位小数四舍五入后是 8.60，这个三位小数最大是多少？",
          "answer": "8.604",
          "explanation": "最大是四舍得到，所以最后一位最大是4。"
        }
      ]
    }
  ]
}
```
