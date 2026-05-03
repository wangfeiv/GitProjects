#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
duoduo-study 同类型变式练习种子 JSON 构建脚本

作用：
1. 从 errors.md 中抽取适合做同类型练习的错题
2. 输出一个“变式生成种子 JSON”
3. 供模型后续生成真正的同类型变式题
4. 生成后的最终 JSON 仍然交给 generate_review_docx.py 出 Word

用法示例：
python3 scripts/build_variant_practice_seed_json.py \
  --subject 数学 \
  --errors ~/.openclaw/workspace/duoduo/math/errors.md \
  --output /tmp/duoduo-math-variant-seed.json \
  --count 8
"""

import argparse
import json
import os
import re
from datetime import datetime

PRIORITY_SCORE = {
    "⭐": 1,
    "⭐⭐": 2,
    "⭐⭐⭐": 3,
    "⭐⭐⭐⭐": 4,
    "⭐⭐⭐⭐⭐": 5,
}

STATUS_ALIASES = {
    "未掌握": "未掌握",
    "练习中": "练习中",
    "已掌握": "已掌握",
    "❌ 未掌握": "未掌握",
    "🔄 练习中": "练习中",
    "✅ 已掌握": "已掌握",
}


def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_json(path, data):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def normalize_status(value):
    value = (value or "").strip()
    return STATUS_ALIASES.get(value, value.replace("❌", "").replace("🔄", "").replace("✅", "").strip())


def parse_entries(markdown_text):
    pattern = re.compile(r"^##\s+错题\s+#(\d+)[:：](.+?)$", re.M)
    matches = list(pattern.finditer(markdown_text))
    entries = []

    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown_text)
        block = markdown_text[start:end].strip()
        qid = int(match.group(1))
        title = match.group(2).strip()

        fields = {}
        for line in block.splitlines()[1:]:
            m = re.match(r"^-\s+\*\*(.+?)：\*\*\s*(.*)$", line.strip())
            if m:
                fields[m.group(1).strip()] = m.group(2).strip()

        entries.append({
            "id": qid,
            "entry_title": title,
            "date": fields.get("日期", ""),
            "source": fields.get("来源", ""),
            "question_type": fields.get("题目类型", ""),
            "question": fields.get("题目", ""),
            "correct_answer": fields.get("正确答案", ""),
            "mistake_reason": fields.get("错因分析", ""),
            "solution": fields.get("解题思路", ""),
            "tags": fields.get("知识点标签", ""),
            "difficulty": fields.get("难易程度", ""),
            "priority": fields.get("复习优先级", "⭐⭐⭐"),
            "status": normalize_status(fields.get("复习状态", "未掌握")),
        })

    return entries


def infer_question_type(text, raw_type=""):
    raw_type = (raw_type or "").strip()
    if raw_type:
        return raw_type
    text = text or ""
    if "选择" in text or "选项" in text or re.search(r"A\.|B\.|C\.|D\.", text):
        return "选择题"
    if "____" in text or "（  ）" in text:
        return "填空题"
    if any(op in text for op in ["×", "÷", "+", "-"]):
        return "计算题"
    if "应用题" in text:
        return "应用题"
    return "解答题"


def infer_difficulty(value, priority):
    value = (value or "").strip()
    if value in ["基础", "中等", "提高"]:
        return value
    p = PRIORITY_SCORE.get((priority or "").strip(), 3)
    if p >= 5:
        return "提高"
    if p >= 3:
        return "中等"
    return "基础"


def select_entries(entries, count, statuses):
    allowed = set(statuses)
    items = [e for e in entries if e["status"] in allowed and e["question"].strip()]
    items.sort(key=lambda e: (-PRIORITY_SCORE.get(e["priority"], 3), e["date"], e["id"]))
    return items[:count]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", required=True)
    parser.add_argument("--errors", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--student-name", default="多多")
    parser.add_argument("--grade", default="小学四年级下学期")
    parser.add_argument("--count", type=int, default=8)
    parser.add_argument("--statuses", default="未掌握,练习中")
    args = parser.parse_args()

    text = read_text(args.errors)
    entries = parse_entries(text)
    statuses = [s.strip() for s in args.statuses.split(",") if s.strip()]
    selected = select_entries(entries, args.count, statuses)

    data = {
        "title": f"{args.student_name}{args.subject}同类型变式练习卷-种子",
        "student_name": args.student_name,
        "subject": args.subject,
        "grade": args.grade,
        "mode": "variant-practice-seed",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "instructions": {
            "must_follow": [
                "保持原知识点不变",
                "保持原题型不变",
                "可以替换数字、情境、名称，但不能偏离题目家族",
                "必须输出题目、答案、解析、难度、题型",
                "最终生成结果必须是纯文本，不要带特殊公式字符"
            ]
        },
        "seed_questions": []
    }

    for i, e in enumerate(selected, start=1):
        data["seed_questions"].append({
            "seed_number": i,
            "source_error_id": e["id"],
            "question_type": infer_question_type(e["question"], e["question_type"]),
            "difficulty": infer_difficulty(e["difficulty"], e["priority"]),
            "knowledge_title": e["entry_title"],
            "tags": e["tags"],
            "source_question": e["question"],
            "source_answer": e["correct_answer"],
            "source_explanation": e["solution"] or e["mistake_reason"],
            "variant_requirement": "请基于这道题生成 1 道同类型变式题，保持知识点和题型一致，只替换数字、表达或情境。"
        })

    write_json(args.output, data)
    print(args.output)


if __name__ == "__main__":
    main()
