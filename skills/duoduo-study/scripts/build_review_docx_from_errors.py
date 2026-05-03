#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
duoduo-study 总控脚本：从 errors.md 直接生成 Word 复习卷

闭环流程：
1. 读取某学科 errors.md
2. 生成中间 review JSON
3. 生成最终 .docx

用法示例：
python3 scripts/build_review_docx_from_errors.py \
  --subject 数学 \
  --errors ~/.openclaw/workspace/duoduo/math/errors.md \
  --output ~/.openclaw/workspace/duoduo/math/review-paper-20260416.docx

可选参数：
  --student-name 多多
  --grade 小学四年级下学期
  --title 多多数学复习卷
  --note 本卷根据错题库自动生成
  --max-questions 12
  --statuses "未掌握,练习中"
  --keep-json /tmp/review.json
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
BUILD_JSON = SCRIPT_DIR / "build_review_json.py"
BUILD_DOCX = SCRIPT_DIR / "generate_review_docx.py"


def run(cmd):
    result = subprocess.run(cmd, text=True, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"Command failed: {' '.join(cmd)}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        )
    return result.stdout.strip()


def ensure_file(path_str):
    path = Path(path_str).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return path


def ensure_parent(path_str):
    path = Path(path_str).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def count_questions(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    total = 0
    for sec in data.get("sections", []):
        total += len(sec.get("questions", []))
    return total, data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", required=True)
    parser.add_argument("--errors", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--student-name", default="多多")
    parser.add_argument("--grade", default="小学四年级下学期")
    parser.add_argument("--title", default="")
    parser.add_argument("--note", default="本卷根据错题库自动生成")
    parser.add_argument("--max-questions", type=int, default=12)
    parser.add_argument("--statuses", default="未掌握,练习中")
    parser.add_argument("--keep-json", default="")
    args = parser.parse_args()

    errors_path = ensure_file(args.errors)
    output_path = ensure_parent(args.output)

    if not BUILD_JSON.exists():
        raise FileNotFoundError(f"Missing script: {BUILD_JSON}")
    if not BUILD_DOCX.exists():
        raise FileNotFoundError(f"Missing script: {BUILD_DOCX}")

    if args.keep_json:
        json_path = ensure_parent(args.keep_json)
        temp_json = False
    else:
        fd, tmp = tempfile.mkstemp(prefix="duoduo-review-", suffix=".json")
        os.close(fd)
        json_path = Path(tmp)
        temp_json = True

    title = args.title.strip() or f"{args.student_name}{args.subject}复习卷"

    cmd_json = [
        sys.executable,
        str(BUILD_JSON),
        "--subject", args.subject,
        "--errors", str(errors_path),
        "--output", str(json_path),
        "--student-name", args.student_name,
        "--grade", args.grade,
        "--title", title,
        "--note", args.note,
        "--max-questions", str(args.max_questions),
        "--statuses", args.statuses,
    ]
    run(cmd_json)

    total_questions, data = count_questions(str(json_path))
    if total_questions == 0:
        if temp_json and json_path.exists():
            json_path.unlink(missing_ok=True)
        raise RuntimeError(
            f"No eligible questions found in {errors_path}. "
            f"Try checking statuses or recording some wrong questions first."
        )

    cmd_docx = [
        sys.executable,
        str(BUILD_DOCX),
        str(json_path),
        str(output_path),
    ]
    run(cmd_docx)

    print(str(output_path))
    print(f"selected_questions={total_questions}")
    print(f"sections={len(data.get('sections', []))}")
    if not temp_json:
        print(f"json={json_path}")

    if temp_json and json_path.exists():
        json_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
