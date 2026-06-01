#!/usr/bin/env python3
"""
China Macro Observatory — 站点构建脚本
读取数据文件，验证数据完整性，生成构建报告
"""

import json
import os
import sys
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "data")

def validate_data():
    """验证数据文件完整性和格式"""
    errors = []
    warnings = []

    # Schema 校验规则
    REQUIRED_INDICATORS = ['gdp', 'cpi', 'pmi', 'social_financing', 'm2', 'lpr']
    REQUIRED_NEWS_FIELDS = ['title', 'category', 'date']

    # 检查 indicators.json
    indicators_path = os.path.join(DATA_DIR, "indicators.json")
    if not os.path.exists(indicators_path):
        errors.append("indicators.json 不存在")
    else:
        try:
            with open(indicators_path, "r", encoding="utf-8") as f:
                indicators = json.load(f)
            inds = indicators.get("indicators", {})
            # 校验必须包含的核心指标
            for key in REQUIRED_INDICATORS:
                if key not in inds:
                    errors.append(f"indicators.json 缺少核心指标: {key}")
                else:
                    latest = inds[key].get("latest", {})
                    if not latest.get("value"):
                        errors.append(f"指标 {key} 缺少最新值")
            print(f"  [OK] indicators.json: {len(inds)} 项指标")
        except Exception as e:
            errors.append(f"indicators.json 解析失败: {e}")

    # 检查 timeline.json
    timeline_path = os.path.join(DATA_DIR, "timeline.json")
    if not os.path.exists(timeline_path):
        errors.append("timeline.json 不存在")
    else:
        try:
            with open(timeline_path, "r", encoding="utf-8") as f:
                timeline = json.load(f)
            events = timeline.get("events", [])
            total_entries = sum(len(day.get("entries", [])) for day in events)
            # 校验新闻字段完整性
            for day in events:
                for entry in day.get("entries", []):
                    for field in REQUIRED_NEWS_FIELDS:
                        if not entry.get(field):
                            warnings.append(f"新闻缺少字段 {field}: {entry.get('title', '未知')[:30]}")
            print(f"  [OK] timeline.json: {len(events)} 天, {total_entries} 条新闻")
        except Exception as e:
            errors.append(f"timeline.json 解析失败: {e}")

    return errors, warnings

def update_timestamps():
    """更新数据文件的最后修改时间"""
    for fname in ["indicators.json", "timeline.json"]:
        fpath = os.path.join(DATA_DIR, fname)
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
            data["last_updated"] = datetime.now().isoformat()
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    print("  [OK] 时间戳已更新")

def main():
    print("=" * 60)
    print("China Macro Observatory — 站点构建")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    print("\n[1/3] 数据验证...")
    errors, warnings = validate_data()

    for w in warnings:
        print(f"  [WARN] {w}")
    for e in errors:
        print(f"  [ERROR] {e}")

    if errors:
        print("\n[FAIL] 构建失败: 存在数据错误")
        sys.exit(1)

    print("\n[2/3] 更新时间戳...")
    update_timestamps()

    print("\n[3/3] 生成构建报告...")
    report = {
        "build_time": datetime.now().isoformat(),
        "status": "success",
        "warnings": warnings
    }
    report_path = os.path.join(PROJECT_DIR, "build_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"  [OK] 报告已保存至 build_report.json")

    print(f"\n[PASS] 构建成功!")
    print("=" * 60)


if __name__ == "__main__":
    main()
