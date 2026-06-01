#!/usr/bin/env python3
"""新闻采集模块 — 通过 iFinD MCP 采集宏观新闻"""

import json
import os
from datetime import datetime
from collections import OrderedDict, defaultdict

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_DIR, "data")

NEWS_QUERIES = OrderedDict([
    ("货币政策", {
        "queries": ["央行货币政策 公开市场操作 逆回购 MLF", "央行降准 存款准备金率", "LPR利率调整"],
        "size": 10, "priority": "high"
    }),
    ("财政政策", {
        "queries": ["国务院常务会议 财政政策", "超长期特别国债 专项债"],
        "size": 10, "priority": "high"
    }),
    ("宏观经济", {
        "queries": ["国家统计局 经济数据 GDP CPI PMI", "就业形势 失业率"],
        "size": 10, "priority": "medium"
    }),
    ("产业政策", {
        "queries": ["发改委 工信部 产业政策 行业规划", "数字经济 人工智能 新质生产力"],
        "size": 8, "priority": "medium"
    }),
    ("房地产", {
        "queries": ["楼市调控 房地产政策 房贷利率", "住建部 保障房"],
        "size": 5, "priority": "medium"
    }),
    ("国际贸易", {
        "queries": ["关税 进出口 国际贸易", "外汇政策 人民币汇率"],
        "size": 5, "priority": "medium"
    })
])

SOURCE_MAP = {
    "yicai.com": "一财网", "gelonghui.com": "格隆汇", "jjckb.cn": "经济参考报",
    "21jingji.com": "21世纪经济报道", "cls.cn": "财联社", "10jqka.com": "同花顺",
    "people.com.cn": "人民网", "xinhuanet.com": "新华网", "news.qq.com": "腾讯新闻",
    "mp.weixin.qq.com": "微信公众号"
}

CATEGORY_KEYWORDS = {
    "货币政策": ["逆回购", "MLF", "LPR", "降准", "准备金", "央行", "公开市场", "利率", "流动性"],
    "财政政策": ["财政", "国债", "专项债", "赤字", "减税", "转移支付", "国务院常务会议"],
    "宏观经济": ["GDP", "CPI", "PMI", "就业", "失业", "统计局", "经济数据"],
    "产业政策": ["产业", "发改委", "工信部", "人工智能", "数字经济", "新质生产力", "制造业"],
    "房地产": ["楼市", "房地产", "住房", "房贷", "保障房", "住建部"],
    "国际贸易": ["关税", "进出口", "贸易", "外汇", "人民币汇率", "跨境"]
}


def extract_source(url):
    for domain, name in SOURCE_MAP.items():
        if domain in url:
            return name
    return "同花顺财经"


def classify_news(article):
    title = article.get("title", "") + article.get("content", "")
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in title)
        if score >= 2:
            return category
    return "宏观经济"


def levenshtein_distance(s1, s2):
    if not s1 or not s2:
        return max(len(s1 or ''), len(s2 or ''))
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    return dp[m][n]


def title_similarity(s1, s2):
    if not s1 or not s2: return 0.0
    dist = levenshtein_distance(s1, s2)
    max_len = max(len(s1), len(s2))
    return 1.0 - (dist / max_len) if max_len > 0 else 0.0


def deduplicate_news(articles, threshold=0.3):
    if not articles: return []
    deduped = []
    for article in articles:
        title = article.get("title", "")
        is_dup = False
        for existing in deduped:
            if title_similarity(title, existing.get("title", "")) > threshold:
                if len(article.get("content", "")) > len(existing.get("content", "")):
                    existing.update(article)
                is_dup = True
                break
        if not is_dup:
            deduped.append(article)
    return deduped


def parse_news_response(raw_data):
    if not raw_data or "data" not in raw_data: return []
    news_data = raw_data["data"]
    if not isinstance(news_data, dict): return []
    articles = news_data.get("data", [])
    if not isinstance(articles, list):
        try: articles = json.loads(articles)
        except (TypeError, json.JSONDecodeError): return []
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


def merge_into_timeline(existing_timeline, new_articles):
    if not existing_timeline:
        existing_timeline = {
            "last_updated": datetime.now().isoformat(),
            "metadata": {"version": "2.0", "total_entries": 0, "categories": list(NEWS_QUERIES.keys())},
            "events": []
        }
    existing_events = existing_timeline.get("events", [])
    existing_dates = {day["date"] for day in existing_events}
    today = datetime.now().strftime("%Y-%m-%d")
    new_by_date = defaultdict(list)
    for article in new_articles:
        date_str = article.get("date", today)[:10]
        new_by_date[date_str].append(article)
    for date_str, entries in new_by_date.items():
        entries_with_meta = []
        for i, entry in enumerate(entries):
            entries_with_meta.append({
                "id": f"news_{date_str.replace('-', '')}_{i+1:03d}",
                "time": entry.get("date", "")[11:16] or "全天",
                "category": entry.get("category", "宏观经济"),
                "importance": "medium",
                "title": entry.get("title", ""),
                "summary": entry.get("content", "")[:200],
                "content": entry.get("content", ""),
                "source": entry.get("source", "同花顺财经"),
                "url": entry.get("url", ""),
                "related_indicators": [],
                "tags": [],
                "published_at": entry.get("date", datetime.now().isoformat())
            })
        if date_str in existing_dates:
            for day in existing_events:
                if day["date"] == date_str:
                    existing_ids = {e["id"] for e in day["entries"]}
                    for e in entries_with_meta:
                        if e["id"] not in existing_ids:
                            day["entries"].append(e)
                    day["entries"].sort(key=lambda x: x.get("time", ""), reverse=True)
                    break
        else:
            existing_events.append({"date": date_str, "day_of_week": "", "entries": entries_with_meta})
    existing_events.sort(key=lambda x: x["date"], reverse=True)
    existing_timeline["events"] = existing_events
    existing_timeline["last_updated"] = datetime.now().isoformat()
    existing_timeline["metadata"]["total_entries"] = sum(len(day["entries"]) for day in existing_events)
    return existing_timeline


def save_timeline(timeline_data):
    path = os.path.join(DATA_DIR, "timeline.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(timeline_data, f, ensure_ascii=False, indent=2)
    print(f"  [OK] 已保存至 {path}")


def run_news_collection(existing_timeline=None):
    if existing_timeline is None:
        timeline_path = os.path.join(DATA_DIR, "timeline.json")
        if os.path.exists(timeline_path):
            with open(timeline_path, "r", encoding="utf-8") as f:
                existing_timeline = json.load(f)
    print("\n[NewsCollector] 开始采集新闻...")
    all_articles = []
    for category, config in NEWS_QUERIES.items():
        print(f"  [{category}] {len(config['queries'])} 个查询维度...")
        for query in config["queries"]:
            print(f"    Query: {query}")
            # MCP 调用由 WorkBuddy 代理执行
    all_articles = deduplicate_news(all_articles)
    print(f"  [OK] 去重后共 {len(all_articles)} 条新闻")
    if all_articles:
        timeline = merge_into_timeline(existing_timeline, all_articles)
        save_timeline(timeline)
        return timeline
    return existing_timeline
