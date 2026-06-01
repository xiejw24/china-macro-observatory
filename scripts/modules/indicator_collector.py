#!/usr/bin/env python3
"""指标采集模块"""
import json
import os
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_DIR, "data")

MACRO_INDICATORS = [
    {"id": "gdp", "name": "GDP:不变价:当季同比", "unit": "%", "query": "GDP不变价当季同比（最近8个季度）", "frequency": "quarterly"},
    {"id": "cpi", "name": "CPI:当月同比", "unit": "%", "query": "CPI当月同比（最近12个月）", "frequency": "monthly"},
    {"id": "pmi", "name": "制造业PMI", "unit": "%", "query": "制造业采购经理指数PMI（最近12个月）", "frequency": "monthly"},
    {"id": "social_financing", "name": "社会融资规模增量:当月值", "unit": "亿元", "query": "社会融资规模增量当月值（最近12个月）", "frequency": "monthly"},
    {"id": "m2", "name": "M2(货币和准货币):同比", "unit": "%", "query": "M2余额同比增速（最近12个月）", "frequency": "monthly"},
    {"id": "lpr", "name": "1年期LPR", "unit": "%", "query": "1年期贷款市场报价利率LPR最新值", "frequency": "monthly"},
    {"id": "industrial_value_added", "name": "规模以上工业增加值:当月同比", "unit": "%", "query": "规模以上工业增加值当月同比（最近12个月）", "frequency": "monthly"},
    {"id": "retail_sales", "name": "社会消费品零售总额:当月同比", "unit": "%", "query": "社会消费品零售总额当月同比（最近12个月）", "frequency": "monthly"},
    {"id": "fixed_investment", "name": "固定资产投资:累计同比", "unit": "%", "query": "固定资产投资累计同比（最近12个月）", "frequency": "monthly"},
    {"id": "trade_balance", "name": "进出口总额:当月值", "unit": "亿美元", "query": "进出口总额当月值（最近12个月）", "frequency": "monthly"},
    {"id": "unemployment", "name": "城镇调查失业率", "unit": "%", "query": "城镇调查失业率（最近12个月）", "frequency": "monthly"},
    {"id": "ppi", "name": "PPI:全部工业品:当月同比", "unit": "%", "query": "PPI当月同比（最近12个月）", "frequency": "monthly"},
]


def parse_edb_response(raw_data):
    if not raw_data or "data" not in raw_data: return []
    data = raw_data["data"]
    if "datas" not in data: return []
    results = []
    for item in data["datas"]:
        if item.get("success") and "data" in item:
            d = item["data"]
            cols = d.get("columns", [])
            rows = d.get("data", [])
            for row in rows:
                entry = {}
                for i, val in enumerate(row):
                    if i < len(cols): entry[cols[i]] = val
                results.append(entry)
    return results


def collect_indicators():
    print(f"\n[IndicatorCollector] 共 {len(MACRO_INDICATORS)} 项指标待采集")
    collected = {}
    errors = []
    for i, indicator in enumerate(MACRO_INDICATORS, 1):
        print(f"  [{i}/{len(MACRO_INDICATORS)}] {indicator['name']} ({indicator['frequency']})")
        print(f"       Query: {indicator['query']}")
        try:
            print(f"       → 等待 MCP 响应...")
        except Exception as e:
            error_msg = f"采集 {indicator['name']} 失败: {e}"
            print(f"       ❌ {error_msg}")
            errors.append(error_msg)
    if errors:
        print(f"\n⚠ {len(errors)} 项指标采集失败")
    return collected


def merge_indicators(existing, new_data):
    if not existing:
        existing = {
            "last_updated": datetime.now().isoformat(),
            "metadata": {"version": "2.0", "source": "同花顺 iFinD", "update_frequency": "daily"},
            "indicators": {}
        }
    for key, data in new_data.items():
        if key not in existing["indicators"]:
            existing["indicators"][key] = {"name": key, "latest": {"date": "", "value": None, "change": "", "desc": ""}, "history": []}
        existing_hist = existing["indicators"][key].get("history", [])
        existing_dates = {h["date"] for h in existing_hist}
        for entry in data:
            date = entry.get("日期") or entry.get("date") or ""
            value = entry.get("值") or entry.get("value")
            if date and value is not None and date not in existing_dates:
                existing_hist.append({"date": date, "value": value})
                existing_dates.add(date)
        existing_hist.sort(key=lambda x: x["date"])
        existing["indicators"][key]["history"] = existing_hist
        if existing_hist:
            latest = existing_hist[-1]
            prev = existing_hist[-2] if len(existing_hist) >= 2 else None
            change = ""
            if prev:
                diff = latest["value"] - prev["value"]
                change = f"↑{diff:.1f}" if diff > 0 else f"↓{abs(diff):.1f}" if diff < 0 else "持平"
            existing["indicators"][key]["latest"] = {"date": latest["date"], "value": latest["value"], "change": change, "desc": ""}
    existing["last_updated"] = datetime.now().isoformat()
    return existing


def save_indicators(indicators_data):
    path = os.path.join(DATA_DIR, "indicators.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(indicators_data, f, ensure_ascii=False, indent=2)
    print(f"  [OK] 已保存至 {path}")


def run_indicator_collection(existing=None):
    if existing is None:
        path = os.path.join(DATA_DIR, "indicators.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                existing = json.load(f)
    new_data = collect_indicators()
    if new_data:
        merged = merge_indicators(existing, new_data)
        save_indicators(merged)
        return merged
    return existing
