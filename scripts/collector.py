#!/usr/bin/env python3
"""
China Macro Observatory - 数据采集主脚本 (v2.0)
通过同花顺 MCP (hexin-ifind-ds) 采集宏观经济数据与政策新闻
"""

import json
import os
import sys
import shutil
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "data")
sys.path.insert(0, os.path.join(PROJECT_DIR, "scripts"))

from modules.indicator_collector import run_indicator_collection, MACRO_INDICATORS
from modules.news_collector import run_news_collection, NEWS_QUERIES
from modules.forecast_collector import collect_forecasts


def archive_snapshot(today_str):
    history_dir = os.path.join(DATA_DIR, "history")
    os.makedirs(history_dir, exist_ok=True)
    for fname in ["indicators.json", "timeline.json"]:
        src = os.path.join(DATA_DIR, fname)
        if os.path.exists(src):
            dst = os.path.join(history_dir, f"{today_str}_{fname}")
            shutil.copy2(src, dst)
    print(f"[Archive] 已归档至 {history_dir}/")


def main():
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    print("=" * 60)
    print(f"China Macro Observatory - 数据采集 (v2.0)")
    print(f"执行时间: {today.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: 采集宏观指标
    print("\n[Step 1] 采集宏观指标...")
    indicators = run_indicator_collection()

    # Step 2: 采集政策新闻
    print(f"\n[Step 2] 采集政策新闻...")
    for category, config in NEWS_QUERIES.items():
        print(f"  [{category}] {len(config['queries'])} 个查询维度 (优先级: {config['priority']})")
    run_news_collection()

    # Step 3: 采集市场预测
    print(f"\n[Step 3] 采集市场预测...")
    collect_forecasts()

    # Step 4: 归档
    print(f"\n[Step 4] 归档当日快照...")
    archive_snapshot(today_str)

    print(f"\n[OK] 采集完成! 下次采集: 根据 Automation 配置")
    print("=" * 60)


if __name__ == "__main__":
    main()
