# China Macro Observatory - 全面重构方案设计文档

**日期：** 2026-06-01  
**版本：** 1.0  
**状态：** 设计完成，待实施

---

## 1. 概述

### 1.1 项目背景

China Macro Observatory 是一个自动更新的中国宏观经济时间线网站，当前功能包括核心指标仪表盘、趋势图表和政策要闻时间线。为进一步提升数据展示和分析能力，决定进行全面重构。

### 1.2 设计目标

1. **数据可视化增强** - 交互式图表、行业细分、市场预测
2. **数据分析功能** - 时间序列对比、指标关联分析、数据导出
3. **更多宏观经济数据** - 10+ 经济指标、行业细分、市场预测
4. **新闻模块** - 基于 iFinD MCP 的宏观新闻采集与展示

### 1.3 技术约束

- **保持纯静态网站架构** - 轻量、易部署、低维护
- **技术栈** - HTML + CSS + ECharts 5.x（无前端框架）
- **数据源** - 同花顺 iFinD MCP API
- **部署** - GitHub Pages

---

## 2. 系统架构

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    前端展示层 (Static Site)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   仪表盘    │  │   图表库    │  │   时间线    │         │
│  │  Dashboard  │  │  Charts    │  │  Timeline   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         ↑                ↑                ↑                │
├─────────┴────────────────┴────────────────┴────────────────┤
│                    数据处理层 (Data Layer)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  指标管理   │  │  分析引擎   │  │  数据导出   │         │
│  │ Indicators  │  │  Analytics  │  │   Export    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         ↑                ↑                ↑                │
├─────────┴────────────────┴────────────────┴────────────────┤
│                    数据存储层 (Storage)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              JSON 数据文件 (data/)                   │   │
│  │  indicators.json  timeline.json  config.json        │   │
│  │  industry.json    forecast.json  history/            │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↑                                 │
├──────────────────────────┴─────────────────────────────────┤
│                    数据采集层 (Collection)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  指标采集   │  │  新闻采集   │  │  预测数据   │         │
│  │  Collector  │  │   News      │  │  Forecast   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         ↑                ↑                ↑                │
├─────────┴────────────────┴────────────────┴────────────────┤
│                    外部数据源 (External)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │           同花顺 iFinD MCP API                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块

#### 2.2.1 指标管理模块 (Indicators)

**职责：** 管理所有宏观经济指标的展示和配置

**功能：**
- 统一指标接口：所有指标遵循相同的数据结构
- 动态配置：通过 config.json 控制指标显示和排序
- 扩展支持：新增指标只需添加配置和数据
- 历史管理：自动维护历史数据，支持时间序列分析

**接口：**
```javascript
// 指标数据结构
{
  "name": "GDP同比增速",
  "category": "宏观经济",
  "unit": "%",
  "frequency": "quarterly",
  "latest": {
    "date": "2026-03-31",
    "value": 5.0,
    "change": "持平",
    "change_pct": 0,
    "desc": "2026年Q1 GDP同比增长5.0%"
  },
  "history": [
    {"date": "2026-03-31", "value": 5.0},
    {"date": "2025-12-31", "value": 4.5}
  ],
  "metadata": {
    "source": "国家统计局",
    "release_date": "2026-04-16",
    "next_release": "2026-07-16"
  }
}
```

#### 2.2.2 图表库模块 (Charts)

**职责：** 统一创建和管理 ECharts 图表实例

**功能：**
- 图表工厂：统一创建和配置 ECharts 实例
- 交互增强：支持联动、下钻、缩放
- 主题系统：统一的暗黑主题配置
- 响应式：自适应不同屏幕尺寸

**交互功能：**
1. **图表联动** - 鼠标悬停一个图表时，其他相关图表同步高亮对应时间点
2. **数据下钻** - 点击数据点展开详细信息
3. **缩放和平移** - 鼠标滚轮缩放、拖拽平移
4. **工具栏** - 数据视图切换、保存图片、全屏模式

#### 2.2.3 新闻模块 (News)

**职责：** 采集、处理和展示宏观新闻

**功能：**
- 新闻采集器：从 iFinD MCP 采集宏观新闻
- 智能去重：基于标题相似度去除重复新闻
- 自动分类：根据关键词自动标记新闻类别
- 重要性标记：根据来源和内容判断重要性

**iFinD MCP 查询配置：**
```python
NEWS_QUERIES = {
    "货币政策": {
        "queries": [
            "央行货币政策 公开市场操作 逆回购 MLF",
            "央行降准 存款准备金率",
            "LPR利率调整"
        ],
        "size": 10,
        "priority": "high"
    },
    "财政政策": {
        "queries": [
            "国务院常务会议 财政政策",
            "超长期特别国债 专项债"
        ],
        "size": 10,
        "priority": "high"
    },
    "宏观经济": {
        "queries": [
            "国家统计局 经济数据 GDP CPI PMI",
            "就业形势 失业率"
        ],
        "size": 10,
        "priority": "medium"
    },
    "产业政策": {
        "queries": [
            "发改委 工信部 产业政策 行业规划",
            "数字经济 人工智能 新质生产力"
        ],
        "size": 8,
        "priority": "medium"
    },
    "房地产": {
        "queries": [
            "楼市调控 房地产政策 房贷利率",
            "住建部 保障房"
        ],
        "size": 5,
        "priority": "medium"
    },
    "国际贸易": {
        "queries": [
            "关税 进出口 国际贸易",
            "外汇政策 人民币汇率"
        ],
        "size": 5,
        "priority": "medium"
    }
}
```

**新闻数据结构：**
```json
{
  "id": "news_20260531_001",
  "time": "09:30",
  "category": "宏观经济",
  "importance": "high",
  "title": "5月制造业PMI回落至50%临界点",
  "summary": "国家统计局5月31日发布数据...",
  "analysis": "5月PMI如期回落至50%临界点...",
  "content": "完整新闻内容...",
  "source": "国家统计局",
  "url": "https://...",
  "related_indicators": ["pmi", "industrial_value_added"],
  "tags": ["PMI", "制造业", "景气指数"],
  "published_at": "2026-05-31T09:30:00.000000"
}
```

#### 2.2.4 分析引擎模块 (Analytics)

**职责：** 提供数据分析功能

**功能：**
- 时间序列对比：选择时间段对比指标走势
- 相关性分析：计算指标间的相关系数
- 趋势分析：识别指标的趋势和拐点
- 统计摘要：自动生成数据摘要和洞察

**相关性分析结果示例：**
```
指标相关性矩阵：
         GDP    CPI    PMI    社融    M2
GDP      1.00   0.72   0.81   0.58   0.45
CPI      0.72   1.00   0.63   0.38   0.42
PMI      0.81   0.63   1.00   0.71   0.48
社融     0.58   0.38   0.71   1.00   0.78
M2       0.45   0.42   0.48   0.78   1.00
```

#### 2.2.5 数据导出模块 (Export)

**职责：** 支持数据导出功能

**功能：**
- 多格式支持：CSV、Excel、JSON
- 自定义选择：选择指标、时间范围、数据字段
- 批量导出：一次导出多个指标
- 格式优化：自动格式化数值和日期

---

## 3. 数据结构设计

### 3.1 indicators.json

```json
{
  "last_updated": "2026-05-31T21:34:00.000000",
  "metadata": {
    "version": "2.0",
    "source": "同花顺 iFinD",
    "update_frequency": "daily"
  },
  "indicators": {
    "gdp": {
      "name": "GDP同比增速",
      "category": "宏观经济",
      "unit": "%",
      "frequency": "quarterly",
      "latest": {
        "date": "2026-03-31",
        "value": 5.0,
        "change": "持平",
        "change_pct": 0,
        "desc": "2026年Q1 GDP同比增长5.0%"
      },
      "history": [
        {"date": "2026-03-31", "value": 5.0},
        {"date": "2025-12-31", "value": 4.5}
      ],
      "metadata": {
        "source": "国家统计局",
        "release_date": "2026-04-16",
        "next_release": "2026-07-16"
      }
    },
    "cpi": { /* ... */ },
    "pmi": { /* ... */ },
    "social_financing": { /* ... */ },
    "m2": { /* ... */ },
    "lpr": { /* ... */ },
    "industrial_value_added": { /* ... */ },
    "retail_sales": { /* ... */ },
    "fixed_investment": { /* ... */ },
    "trade_balance": { /* ... */ },
    "unemployment": { /* ... */ },
    "ppi": { /* ... */ }
  },
  "industry": {
    "manufacturing": {
      "name": "制造业细分",
      "subcategories": ["高技术制造业", "装备制造业", "消费品行业", "高耗能行业"],
      "data": {
        "high_tech": {
          "name": "高技术制造业",
          "pmi": { "latest": 52.9, "history": [/* ... */] }
        },
        "equipment": { /* ... */ },
        "consumer": { /* ... */ },
        "energy_intensive": { /* ... */ }
      }
    },
    "services": { /* ... */ },
    "real_estate": { /* ... */ }
  },
  "forecasts": {
    "gdp": {
      "2026_q2": {"value": 4.8, "source": "市场一致预期", "confidence": 0.85},
      "2026_q3": {"value": 4.9, "source": "市场一致预期", "confidence": 0.80}
    },
    "cpi": { /* ... */ },
    "pmi": { /* ... */ }
  }
}
```

### 3.2 timeline.json

```json
{
  "last_updated": "2026-05-31T21:34:00.000000",
  "metadata": {
    "version": "2.0",
    "total_entries": 156,
    "categories": ["货币政策", "财政政策", "宏观经济", "产业政策", "房地产", "国际贸易"]
  },
  "events": [
    {
      "date": "2026-05-31",
      "day_of_week": "周日",
      "entries": [
        {
          "id": "news_20260531_001",
          "time": "09:30",
          "category": "宏观经济",
          "importance": "high",
          "title": "5月制造业PMI回落至50%临界点",
          "summary": "国家统计局5月31日发布数据...",
          "analysis": "5月PMI如期回落至50%临界点...",
          "content": "完整新闻内容...",
          "source": "国家统计局",
          "url": "https://...",
          "related_indicators": ["pmi", "industrial_value_added"],
          "tags": ["PMI", "制造业", "景气指数"],
          "published_at": "2026-05-31T09:30:00.000000"
        }
      ]
    }
  ]
}
```

### 3.3 config.json

```json
{
  "dashboard": {
    "indicators": [
      {"key": "gdp", "name": "GDP同比增速", "unit": "%", "show": true, "order": 1},
      {"key": "cpi", "name": "CPI当月同比", "unit": "%", "show": true, "order": 2},
      {"key": "pmi", "name": "制造业PMI", "unit": "%", "show": true, "order": 3},
      {"key": "social_financing", "name": "社会融资规模", "unit": "亿元", "show": true, "order": 4},
      {"key": "m2", "name": "M2同比增速", "unit": "%", "show": true, "order": 5},
      {"key": "lpr", "name": "1年期LPR", "unit": "%", "show": true, "order": 6},
      {"key": "industrial_value_added", "name": "工业增加值同比", "unit": "%", "show": true, "order": 7},
      {"key": "retail_sales", "name": "社零同比", "unit": "%", "show": true, "order": 8},
      {"key": "fixed_investment", "name": "固投累计同比", "unit": "%", "show": true, "order": 9},
      {"key": "trade_balance", "name": "进出口总额", "unit": "亿美元", "show": true, "order": 10},
      {"key": "unemployment", "name": "城镇调查失业率", "unit": "%", "show": true, "order": 11},
      {"key": "ppi", "name": "PPI当月同比", "unit": "%", "show": true, "order": 12}
    ]
  },
  "charts": {
    "pmi_cpi": {"title": "PMI & CPI 走势"},
    "social_m2": {"title": "社会融资 & M2 增速"},
    "gdp": {"title": "GDP 季度同比增速"},
    "industry": {"title": "制造业 PMI 细分对比"}
  },
  "news": {
    "update_frequency": "daily",
    "max_entries_per_day": 20,
    "categories": ["货币政策", "财政政策", "宏观经济", "产业政策", "房地产", "国际贸易"]
  }
}
```

---

## 4. 目录结构

```
china-macro-observatory/
├── index.html                 # 主页面
├── styles.css                 # 全局样式
├── js/
│   ├── main.js               # 入口文件
│   ├── core/
│   │   ├── config.js         # 配置管理
│   │   ├── data-loader.js    # 数据加载器
│   │   └── event-bus.js      # 事件总线
│   ├── modules/
│   │   ├── indicators/       # 指标管理模块
│   │   │   ├── index.js
│   │   │   ├── renderer.js
│   │   │   └── cards.js
│   │   ├── charts/           # 图表库模块
│   │   │   ├── index.js
│   │   │   ├── factory.js    # 图表工厂
│   │   │   ├── themes.js     # 主题配置
│   │   │   ├── gdp.js
│   │   │   ├── pmicpi.js
│   │   │   ├── socialm2.js
│   │   │   └── industry.js   # 行业细分图表
│   │   ├── analytics/        # 分析引擎模块
│   │   │   ├── index.js
│   │   │   ├── comparison.js # 时间对比
│   │   │   ├── correlation.js# 相关性分析
│   │   │   └── trends.js     # 趋势分析
│   │   ├── export/           # 数据导出模块
│   │   │   ├── index.js
│   │   │   ├── csv.js
│   │   │   └── excel.js
│   │   └── timeline/         # 时间线模块
│   │       ├── index.js
│   │       ├── renderer.js
│   │       └── filters.js
│   └── utils/
│       ├── format.js         # 格式化工具
│       ├── date.js           # 日期工具
│       └── math.js           # 数学计算
├── data/
│   ├── indicators.json       # 指标数据
│   ├── timeline.json         # 时间线数据
│   ├── industry.json         # 行业细分数据
│   ├── forecast.json         # 市场预测数据
│   ├── config.json           # 配置文件
│   └── history/              # 历史快照
├── scripts/
│   ├── collector.py          # 数据采集主脚本
│   ├── build.py              # 构建验证
│   └── modules/
│       ├── indicator_collector.py
│       ├── news_collector.py
│       └── forecast_collector.py
└── .github/
    └── workflows/
        └── update.yml
```

---

## 5. 实施计划

### 5.1 阶段划分

**阶段 1：基础架构重构（2 周）**
- 重构目录结构
- 创建核心模块（config.js, data-loader.js, event-bus.js）
- 重构数据结构（indicators.json, timeline.json, config.json）
- 更新数据采集脚本

**阶段 2：指标管理模块（1 周）**
- 实现统一指标接口
- 实现动态配置
- 实现历史数据管理
- 添加新指标（失业率、PPI 等）

**阶段 3：图表库模块（2 周）**
- 实现图表工厂
- 实现交互功能（联动、下钻、缩放）
- 实现主题系统
- 实现行业细分图表

**阶段 4：新闻模块（1 周）**
- 实现新闻采集器
- 实现智能去重
- 实现自动分类
- 实现前端展示

**阶段 5：分析引擎模块（1 周）**
- 实现时间序列对比
- 实现相关性分析
- 实现趋势分析
- 实现统计摘要

**阶段 6：数据导出模块（0.5 周）**
- 实现 CSV 导出
- 实现 Excel 导出
- 实现 JSON 导出

**阶段 7：测试与优化（0.5 周）**
- 功能测试
- 性能优化
- 文档更新

### 5.2 里程碑

| 阶段 | 交付物 | 预计时间 |
|------|--------|----------|
| 阶段 1 | 重构后的项目结构和核心模块 | 第 2 周 |
| 阶段 2 | 指标管理模块和新指标 | 第 3 周 |
| 阶段 3 | 交互式图表库 | 第 5 周 |
| 阶段 4 | 新闻模块 | 第 6 周 |
| 阶段 5 | 分析引擎模块 | 第 7 周 |
| 阶段 6 | 数据导出模块 | 第 7.5 周 |
| 阶段 7 | 完整功能上线 | 第 8 周 |

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| iFinD MCP 接口变更 | 数据采集失败 | 设计适配层，隔离接口变化 |
| 数据量增长导致性能下降 | 用户体验差 | 实现惰性加载、数据分页 |
| 图表交互复杂度高 | 开发周期延长 | 优先实现核心功能，迭代优化 |
| 浏览器兼容性问题 | 部分用户无法使用 | 渐进增强，提供降级方案 |

---

## 7. 成功标准

1. **功能完整性** - 所有设计功能正常工作
2. **性能指标** - 页面加载时间 < 3 秒，图表渲染 < 1 秒
3. **数据准确性** - 指标数据与官方来源一致
4. **用户体验** - 交互流畅，信息清晰易懂
5. **可维护性** - 代码结构清晰，易于扩展和维护

---

## 8. 附录

### 8.1 参考资料

- [ECharts 5.x 文档](https://echarts.apache.org/zh/index.html)
- [同花顺 iFinD MCP API](https://www.51ifind.com/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)

### 8.2 相关文档

- 项目 README.md
- 现有代码结构分析
- 用户需求文档
