#!/usr/bin/env python3
"""市场预测数据采集模块"""
import json
import os
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_DIR, "data")

FORECAST_QUERIES = [
    {"id": "gdp", "name": "GDP增速预测", "query": "GDP增速市场一致预期"},
    {"id": "cpi", "name": "CPI预测", "query": "CPI市场一致预期"},
    {"id": "pmi", "name": "PMI预测", "query": "PMI市场一致预期"},
]


def collect_forecasts():
    print(f"\n[ForecastCollector] 共 {len(FORECAST_QUERIES)} 项预测待采集")
    collected = {}
    for f in FORECAST_QUERIES:
        print(f"  Query: {f['query']}")
    return collected
