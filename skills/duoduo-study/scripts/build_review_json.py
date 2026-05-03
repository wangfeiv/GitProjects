#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
duoduo-study 复习卷 JSON 构建脚本

作用：
1. 从某学科的 errors.md 中解析错题详情
2. 按状态、优先级、题目类型筛选题目
3. 自动组装成 generate_review_docx.py 可直接使用的 JSON
4. 为后续 docx 生成形成稳定闭环

用法示例：
python3 scripts/build_review_json.py \
  --subject 数学 \
  --errors /home/wangfei/.openclaw/workspace/duoduo/math/errors.md \
  --output /tmp/math-review.json

可选参数：
  --student-name 多多
  --grade 小学四年级下学期
  --title 多多数学复习卷
  --mode review
  --max-questions 12
  --statuses "未掌握,练习中"

说明：
- 本脚本默认生成“复习卷 JSON”，题目直接来自错题库中的原题内容
- 同类型变式练习题仍建议由主模型先生成，再把结果整理成 JSON 给 docx 脚本
"""

import argparse
import json
import os
import re
from datetime import datetime


TYPE_ORDER = [
    "填空题", "选择题", "计算题", "解答题", "应用题",
    "阅读题", "默写题", "拼写题", "听力题", "作文题", "其他"
]

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


def infer_question_type(text, raw_type=""):
    raw_type = (raw_type or "").strip()
    if raw_type:
        return raw_type

    text = text or ""
    if "选择" in text or "选项" in text or re.search(r"A\.|B\.|C\.|D\.", text):
        return "选择题"
    if "填空" in text or "____" in text or "（  ）" in text:
        return "填空题"
    if "计算" in text or any(op in text for op in ["×", "÷", "+", "-"]):
        if len(text) <= 40:
            return "计算题"
    if "应用题" in text:
        return "应用题"
    if "阅读" in text:
        return "阅读题"
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
                key = m.group(1).strip()
                val = m.group(2).strip()
                fields[key] = val

        entries.append({
            "id": qid,
            "entry_title": title,
            "date": fields.get("日期", ""),
            "source": fields.get("来源", ""),
            "question_type": fields.get("题目类型", ""),
            "image": fields.get("原始图片", ""),
            "question": fields.get("题目", ""),
            "duoduo_answer": fields.get("多多的答案", ""),
            "correct_answer": fields.get("正确答案", ""),
            "mistake_reason": fields.get("错因分析", ""),
            "solution": fields.get("解题思路", ""),
            "tags": fields.get("知识点标签", ""),
            "difficulty": fields.get("难易程度", ""),
            "priority": fields.get("复习优先级", "⭐⭐⭐"),
            "status": normalize_status(fields.get("复习状态", "未掌握")),
            "next_review": fields.get("下次复习日期", ""),
        })

    return entries


def is_docx_ready(entry):
    question = (entry.get("question") or "").strip()
    answer = (entry.get("correct_answer") or "").strip()
    solution = (entry.get("solution") or "").strip()

    blocked_markers = [
        "图片中包含",
        "待补充",
        "原题图形未完整",
        "需要结合原图",
        "应回看原卷",
        "当前图片缺少",
    ]

    if not question:
        return False
    combined = question + "\n" + answer + "\n" + solution
    for marker in blocked_markers:
        if marker in combined:
            return False
    return True


def filter_entries(entries, statuses, max_questions):
    allowed = set(statuses)
    filtered = [
        e for e in entries
        if e["status"] in allowed and e["question"].strip() and is_docx_ready(e)
    ]
    filtered.sort(
        key=lambda e: (
            -PRIORITY_SCORE.get(e["priority"], 3),
            e["date"],
            e["id"],
        )
    )
    return filtered[:max_questions]


def group_sections(entries):
    grouped = {name: [] for name in TYPE_ORDER}
    grouped["其他"] = grouped.get("其他", [])

    for idx, e in enumerate(entries, start=1):
        qtype = infer_question_type(e["question"], e["question_type"])
        if qtype not in grouped:
            grouped[qtype] = []
        grouped[qtype].append({
            "number": idx,
            "type": qtype,
            "difficulty": infer_difficulty(e["difficulty"], e["priority"]),
            "text": e["question"],
            "answer": e["correct_answer"] or "待补充",
            "explanation": e["solution"] or e["mistake_reason"] or "待补充",
            "source_error_id": e["id"],
            "source_priority": e["priority"],
            "source_status": e["status"],
        })

    sections = []
    for name in TYPE_ORDER:
        qs = grouped.get(name, [])
        if qs:
            sections.append({"name": name, "questions": qs})

    for name, qs in grouped.items():
        if name not in TYPE_ORDER and qs:
            sections.append({"name": name, "questions": qs})

    return sections


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", required=True)
    parser.add_argument("--errors", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--student-name", default="多多")
    parser.add_argument("--grade", default="小学四年级下学期")
    parser.add_argument("--title", default="")
    parser.add_argument("--note", default="本卷根据错题库自动生成")
    parser.add_argument("--mode", default="review")
    parser.add_argument("--max-questions", type=int, default=12)
    parser.add_argument("--statuses", default="未掌握,练习中")
    args = parser.parse_args()

    text = read_text(args.errors)
    entries = parse_entries(text)
    statuses = [s.strip() for s in args.statuses.split(",") if s.strip()]
    picked = filter_entries(entries, statuses, args.max_questions)
    sections = group_sections(picked)

    title = args.title.strip() or f"{args.student_name}{args.subject}复习卷"

    data = {
        "title": title,
        "student_name": args.student_name,
        "subject": args.subject,
        "grade": args.grade,
        "note": args.note,
        "mode": args.mode,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source_errors_file": args.errors,
        "selected_error_count": len(picked),
        "sections": sections,
    }

    write_json(args.output, data)
    print(args.output)


if __name__ == "__main__":
    main()
