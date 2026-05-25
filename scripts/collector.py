#!/usr/bin/env python3
"""
China Macro Observatory - 数据采集主脚本
通过同花顺 MCP (hexin-ifind-ds) 采集宏观经济数据与政策新闻

使用方式：
  WorkBuddy Automation 定时调用此脚本，WorkBuddy 会自动执行采集流程。
  手动运行时，需要 WorkBuddy 环境中的 MCP 工具支持。
"""

import json
import os
import sys
from datetime import datetime, timedelta
from collections import OrderedDict

# 项目根目录
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "data")
HISTORY_DIR = os.path.join(DATA_DIR, "history")

# ============================================================
# 宏观指标采集配置
# ============================================================
MACRO_INDICATORS = [
    {
        "id": "gdp",
        "name": "GDP:不变价:当季同比",
        "unit": "%",
        "query": "GDP不变价当季同比（最近8个季度）",
        "frequency": "quarterly"
    },
    {
        "id": "cpi",
        "name": "CPI:当月同比",
        "unit": "%",
        "query": "CPI当月同比（最近12个月）",
        "frequency": "monthly"
    },
    {
        "id": "pmi",
        "name": "制造业PMI",
        "unit": "%",
        "query": "制造业采购经理指数PMI（最近12个月）",
        "frequency": "monthly"
    },
    {
        "id": "social_financing",
        "name": "社会融资规模增量:当月值",
        "unit": "亿元",
        "query": "社会融资规模增量当月值（最近12个月）",
        "frequency": "monthly"
    },
    {
        "id": "m2",
        "name": "M2(货币和准货币):同比",
        "unit": "%",
        "query": "M2余额同比增速（最近12个月）",
        "frequency": "monthly"
    },
    {
        "id": "lpr",
        "name": "1年期LPR",
        "unit": "%",
        "query": "1年期贷款市场报价利率LPR最新值",
        "frequency": "monthly"
    },
    {
        "id": "industrial_value_added",
        "name": "规模以上工业增加值:当月同比",
        "unit": "%",
        "query": "规模以上工业增加值当月同比（最近12个月）",
        "frequency": "monthly"
    },
    {
        "id": "retail_sales",
        "name": "社会消费品零售总额:当月同比",
        "unit": "%",
        "query": "社会消费品零售总额当月同比（最近12个月）",
        "frequency": "monthly"
    },
    {
        "id": "fixed_investment",
        "name": "固定资产投资:累计同比",
        "unit": "%",
        "query": "固定资产投资累计同比（最近12个月）",
        "frequency": "monthly"
    },
    {
        "id": "trade_balance",
        "name": "进出口总额:当月值",
        "unit": "亿美元",
        "query": "进出口总额当月值（最近12个月）",
        "frequency": "monthly"
    }
]

# ============================================================
# 新闻采集配置
# ============================================================
NEWS_QUERIES = [
    {
        "category": "货币政策",
        "color": "red",
        "queries": [
            "央行货币政策 公开市场操作 逆回购 MLF",
            "央行降准 存款准备金率",
            "LPR利率调整"
        ],
        "size": 5
    },
    {
        "category": "财政政策",
        "color": "yellow",
        "queries": [
            "国务院常务会议 财政政策",
            "超长期特别国债 专项债"
        ],
        "size": 5
    },
    {
        "category": "宏观经济",
        "color": "green",
        "queries": [
            "国家统计局 经济数据 GDP CPI PMI",
            "就业形势 失业率"
        ],
        "size": 5
    },
    {
        "category": "产业政策",
        "color": "blue",
        "queries": [
            "发改委 工信部 产业政策 行业规划",
            "数字经济 人工智能 新质生产力"
        ],
        "size": 5
    },
    {
        "category": "房地产",
        "color": "purple",
        "queries": [
            "楼市调控 房地产政策 房贷利率",
            "住建部 保障房"
        ],
        "size": 3
    },
    {
        "category": "国际贸易",
        "color": "gray",
        "queries": [
            "关税 进出口 国际贸易",
            "外汇政策 人民币汇率"
        ],
        "size": 3
    }
]

# ============================================================
# MCP 数据解析函数
# ============================================================

def parse_edb_response(raw_data):
    """解析 EDB 宏觀指标返回数据"""
    if not raw_data or "data" not in raw_data:
        return []
    
    data = raw_data["data"]
    if "datas" not in data:
        return []
    
    results = []
    for item in data["datas"]:
        if item.get("success") and "data" in item:
            d = item["data"]
            # 提取列名和数据
            cols = d.get("columns", [])
            rows = d.get("data", [])
            units = {}
            for col_name, attr in d.get("attrs", {}).items():
                units[col_name] = attr.get("unit", "")
            
            for row in rows:
                entry = {}
                for i, val in enumerate(row):
                    if i < len(cols):
                        entry[cols[i]] = val
                # 添加单位信息
                if len(cols) > 1:
                    entry["_unit"] = units.get(cols[1], "")
                results.append(entry)
    
    return results


def parse_news_response(raw_data):
    """解析新闻资讯返回数据"""
    if not raw_data or "data" not in raw_data:
        return []
    
    news_data = raw_data["data"]
    if not isinstance(news_data, dict):
        return []
    
    articles = news_data.get("data", [])
    if not isinstance(articles, list):
        try:
            articles = json.loads(articles)
        except:
            return []
    
    parsed = []
    for article in articles:
        if isinstance(article, dict) and "资讯标题" in article:
            parsed.append({
                "title": article.get("资讯标题", ""),
                "content": article.get("资讯内容", ""),
                "date": article.get("日期", ""),
                "url": article.get("URL", ""),
                "source": extract_source(article.get("URL", ""))
            })
    
    return parsed


def extract_source(url):
    """从 URL 提取来源"""
    source_map = {
        "yicai.com": "一财网",
        "gelonghui.com": "格隆汇",
        "jjckb.cn": "经济参考报",
        "21jingji.com": "21世纪经济报道",
        "cls.cn": "财联社",
        "10jqka.com": "同花顺",
        "people.com.cn": "人民网",
        "xinhuanet.com": "新华网",
        "news.qq.com": "腾讯新闻",
        "mp.weixin.qq.com": "微信公众号"
    }
    for domain, name in source_map.items():
        if domain in url:
            return name
    return "同花顺财经"


# ============================================================
# 新闻去重
# ============================================================

def deduplicate_news(articles, threshold=0.6):
    """基于标题相似度的新闻去重"""
    if not articles:
        return []
    
    deduped = []
    for article in articles:
        title = article.get("title", "")
        is_dup = False
        for existing in deduped:
            existing_title = existing.get("title", "")
            if similarity(title, existing_title) > threshold:
                # 保留更长的内容
                if len(article.get("content", "")) > len(existing.get("content", "")):
                    existing.update(article)
                is_dup = True
                break
        if not is_dup:
            deduped.append(article)
    
    return deduped


def similarity(s1, s2):
    """简单的标题相似度计算（基于字符重叠）"""
    if not s1 or not s2:
        return 0.0
    s1_set = set(s1)
    s2_set = set(s2)
    intersection = s1_set & s2_set
    union = s1_set | s2_set
    if not union:
        return 0.0
    return len(intersection) / len(union)


# ============================================================
# 分类标记
# ============================================================

def classify_news(articles):
    """根据关键词自动分类"""
    category_keywords = {
        "货币政策": ["逆回购", "MLF", "LPR", "降准", "准备金", "央行", "公开市场", "利率", "流动性"],
        "财政政策": ["财政", "国债", "专项债", "赤字", "减税", "转移支付", "国务院常务会议"],
        "宏观经济": ["GDP", "CPI", "PMI", "就业", "失业", "统计局", "经济数据"],
        "产业政策": ["产业", "发改委", "工信部", "人工智能", "数字经济", "新质生产力", "制造业"],
        "房地产": ["楼市", "房地产", "住房", "房贷", "保障房", "住建部"],
        "国际贸易": ["关税", "进出口", "贸易", "外汇", "人民币汇率", "跨境"]
    }
    
    for article in articles:
        title = article.get("title", "") + article.get("content", "")
        for category, keywords in category_keywords.items():
            score = sum(1 for kw in keywords if kw in title)
            if score >= 2:
                article["category"] = category
                break
        else:
            article["category"] = "宏观经济"
    
    return articles


# ============================================================
# 数据归档
# ============================================================

def archive_snapshot(today_str):
    """将当日数据归档到 history/"""
    timeline_path = os.path.join(DATA_DIR, "timeline.json")
    indicators_path = os.path.join(DATA_DIR, "indicators.json")
    
    archive = {"date": today_str, "timeline": None, "indicators": None}
    
    if os.path.exists(timeline_path):
        with open(timeline_path, "r", encoding="utf-8") as f:
            archive["timeline"] = json.load(f)
    
    if os.path.exists(indicators_path):
        with open(indicators_path, "r", encoding="utf-8") as f:
            archive["indicators"] = json.load(f)
    
    archive_path = os.path.join(HISTORY_DIR, f"{today_str}.json")
    with open(archive_path, "w", encoding="utf-8") as f:
        json.dump(archive, f, ensure_ascii=False, indent=2)
    
    print(f"[Archive] 已归档至 {archive_path}")


# ============================================================
# 主流程（供 WorkBuddy Automation 调用）
# ============================================================

def main():
    """主入口 - 由 WorkBuddy Automation 触发"""
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    
    print(f"=" * 60)
    print(f"China Macro Observatory - 数据采集")
    print(f"执行时间: {today.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"=" * 60)
    
    # Step 1: 采集宏观指标
    print("\n[Step 1] 采集宏观指标...")
    print(f"  共 {len(MACRO_INDICATORS)} 项指标待采集")
    for i, indicator in enumerate(MACRO_INDICATORS, 1):
        print(f"  [{i}/{len(MACRO_INDICATORS)}] {indicator['name']}")
        print(f"       Query: {indicator['query']}")
        # MCP 调用由 WorkBuddy 代理执行，此处为框架代码
        print(f"       → 等待 MCP 响应...")
    
    # Step 2: 采集政策新闻
    print(f"\n[Step 2] 采集政策新闻...")
    for section in NEWS_QUERIES:
        print(f"  [{section['category']}] {len(section['queries'])} 个查询维度")
    
    # Step 3: 读取并合并已有数据
    print(f"\n[Step 3] 数据处理...")
    indicators_path = os.path.join(DATA_DIR, "indicators.json")
    timeline_path = os.path.join(DATA_DIR, "timeline.json")
    
    if os.path.exists(indicators_path):
        with open(indicators_path, "r", encoding="utf-8") as f:
            existing_indicators = json.load(f)
        print(f"  已加载指标数据: {len(existing_indicators.get('indicators', {}))} 项")
    
    if os.path.exists(timeline_path):
        with open(timeline_path, "r", encoding="utf-8") as f:
            existing_timeline = json.load(f)
        print(f"  已加载时间线: {len(existing_timeline.get('events', []))} 天数据")
    
    # Step 4: 归档
    print(f"\n[Step 4] 归档当日快照...")
    archive_snapshot(today_str)
    
    print(f"\n完成! 下次采集时间: 根据 Automation 配置")
    print(f"=" * 60)


if __name__ == "__main__":
    main()
