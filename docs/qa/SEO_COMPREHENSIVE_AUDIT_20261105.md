# Quilt Studio — 全站 SEO / GEO 综合审计（2026-11-05）

> **结论：预览版的技术 SEO 基础通过范围内核查；不等于具备可公开索引的正式上线许可，也不等于 202 个关键词已经取得排名。**
>
> 审计目标：`https://quilt-calculator-566.pages.dev/`，部署 Git SHA `05d5d22a333614370566d452d876cb5815654dd0`。审计后如有纯报告提交，不代表计算逻辑变化。
>
> 证据级别：LIVE = 本次公网抓取；SOURCE = 当前仓库实际代码/数据；CI = 已完成的持续集成；EXTERNAL = Google 官方资料/抽样公开竞品；NOT_RUN = 没有足够证据。不要用“已映射”替代“已收录”“已排名”。

## 1. 本次检查范围和结果

| 维度 | 结论 | 核实依据与边界 |
|---|---|---|
| 公网正式工具/首页 | **PASS：10/10** | LIVE：主页 + 9 工具页可抓取，当前提交标记一致；CI 完成线上 10 路由和 HTTP 页面校验 |
| Title、Description、HTML lang=en | **PASS：10/10** | LIVE：每页有独立标题和描述，英文语言明确 |
| 页面 H1 / 结构化正文 | **PASS：10/10（代码/CI）** | SOURCE：`ToolPage.astro`；CI：每页仅一个 H1；LIVE：对 HUB、BACK、INCH 使用 H1 精确选择器再次验证。第三方默认正文抽取器遗漏 H1 不能认定 HTML 缺 H1 |
| 预览索引安全 | **PASS（现阶段）** | LIVE：10/10 均 `noindex,follow`，没有正式 canonical；`robots.txt` 为 `Allow: /`；`sitemap.xml` 为 404，这是有意的预览模式 |
| 内部导航与独立路由 | **PASS（当前页面集合）** | CI：静态内部链接检查；LIVE：10 页导航均可链接到全站正式工具；9 个唯一主要意图 |
| 实体 Schema / 富媒体 | **PARTIAL** | SOURCE：WebApplication JSON-LD，正式模式有 BreadcrumbList；未运行 Google Rich Results Test 独立正式域名验证，不能保证富媒体展示 |
| 图片 SEO | **PARTIAL** | LIVE：每页至少一个独立 WebP；SOURCE：带尺寸及 alt；缺少 `og:image` 和 Twitter 分享图片元信息，未独立测图片搜索曝光 |
| 关键词研究分配 | **PASS（路由分配）/ PARTIAL（真实搜索意图）** | 218 US Semrush 历史候选，202 分配至 9 页，16 HOLD；发现 1 个明确的其他品牌词、若干歧义词；未完成当前 US 全量 SERP 意图/排名测试 |
| FAQ / 方法 / GEO | **PARTIAL** | LIVE：独立公式、可复算示例、边界条件和 FAQs；缺可核实的站点维护者/联系渠道、部分直接答案与多场景表；不添加虚构资质或 AI 专用页面 |
| 速度 / CWV / 移动实机 | **PARTIAL / NOT_RUN** | CI：320px 代理 reflow / 375px 移动和 axe A/AA 自动规则通过；**本轮无 Lighthouse 数值、CrUX LCP/INP/CLS 或真实用户性能数据** |
| 正式生产 SEO / GSC | **NOT_RUN / WAIT_DOMAIN** | 无购买的正式域名，尚未启用正式 canonical、sitemap、GSC/索引；不宣称排名和点击 |

公开验证路径：[Quality CI 41981193163](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41981193163)；[Live deployment CI 41978590943](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41978590943)。

## 2. 十页页面级元信息（本轮 LIVE）

`Title` 和 `Description` 长度仅供编辑时参考，**不是 Google 的硬性字符阈值**；Google 按设备和页面信号决定展示长度。

| URL | Title 字符 | Description 字符 | Robots | 内容备注 |
|---|---:|---:|---|---|
| `/` | 63 | 173 | noindex | 首页与 HUB 都有项目规划器，但首页本身的品牌叙述不同 |
| `/calculators/` | 49 | 151 | noindex | 主 `quilt calculator` 意图；项目型 |
| `/quilt-backing-calculator/` | 63 | 144 | noindex | 面幅、裁片方向、拼缝和购买量 |
| `/quilt-binding-calculator/` | 54 | 129 | noindex | 明确直纹，不承诺 bias |
| `/quilt-border-calculator/` | 61 | 135 | noindex | butted side-first 边框 |
| `/fabric-yardage-calculator/` | 61 | 145 | noindex | 实际矩形排料，与 FABRIC 的多 SKU 分离 |
| `/quilt-fabric-calculator/` | 53 | 139 | noindex | 多 SKU 独立切割和购物估计 |
| `/fabric-yards-to-inches/` | 68 | 149 | noindex | 107 个变体共享一个转换页 |
| `/quilt-batting-calculator/` | 57 | 128 | noindex | 单片棉衬可行性 |
| `/quilt-sashing-calculator/` | 72 | 140 | noindex | 最长 Title，可考虑编辑精简；非硬性违规 |

LIVE：每页 `lang=en`，`og:title`/`og:description` 存在，`og:image` 不存在。每页固定插图是独立 URL（`hub.webp`、`backing.webp`、`binding.webp` 等）。源代码标记的 Git SHA 与公网一致。

## 3. 关键词的真实口径和具体问题

源文件：`docs/data/V2_Keyword_Appendix_218.csv`（用户提供的历史 US Semrush 研究输入，**不是 2026-11-05 最新查询**）。202/218 为映射数，不是 202 个逐词高相关展示、排名或页面数。

| 路径 | 已映射词数 | 代表性历史 US Volume / KD |
|---|---:|---|
| `/quilt-backing-calculator/` | 28 | `quilt backing calculator` 2400 / 0 |
| `/quilt-binding-calculator/` | 17 | `quilt binding calculator` 1900 / 15 |
| `/calculators/` | 7 | `quilt calculator` 1600 / 18 |
| `/fabric-yardage-calculator/` | 14 | `fabric yardage calculator` 1300 / 26 |
| `/quilt-fabric-calculator/` | 14 | `quilt fabric calculator` 880 / 19 |
| `/quilt-border-calculator/` | 10 | `quilt border calculator` 720 / 7 |
| `/fabric-yards-to-inches/` | 107 | `how big is a yard of fabric` 3600 / 18 |
| `/quilt-batting-calculator/` | 2 | `quilt batting calculator` 110 / 12 |
| `/quilt-sashing-calculator/` | 3 | `quilt sashing calculator` 90 / 0 |
| **合计** | **202** | **16 个候选词 HOLD**：7 bias；5 宽幅/转换；4 square |

### 已确认的意图问题

1. **P1，品牌意图误映射。** `robert kaufman calculator`（260 / KD20）当前被标记 `TARGET` → `/calculators/`。这是其他品牌导航/品牌意图；应**保留原始数据行**，但在新的运营/投放目标清单里标为 `EXCLUDE_BRANDED_INTENT`，不能算有效非品牌机会。页面本身没有在 Title/H1 直接使用该词。
2. **P1，高搜索量问题未作为标题的第一眼答案。** `how big is a yard of fabric`（3600 / KD18）当前归换算页，正文确实回答了 36 英寸/宽度不固定；但 Title/H1 以 `Fabric yards to inches` 为主，首页屏幕内缺凸显该问题的快速答案区。可在同一 URL 增加静态重点解答和表格，不开新的克隆页面。
3. **P1，待复核的搜索意图。** `how much is 1 yard`（1900 / KD17）可能要长度，也可能问价格；现有正文说明报价不属于转换器范围，后续需抽样当前 US SERP。 `quilting calculator app`（210 / KD25）可能希望原生 App，不能单凭词含 calculator 就算完整覆盖。
4. **P2，首页与 HUB 共用规划器组件。** 独立引导正文不同，当前**没有证明**互相蚕食流量；生产上线后用 GSC query×page 检查同一核心查询是否长期分散在两页。不要凭同组件自动删除首页。
5. **保持现状：** 107 个 yards/inches 分数长尾共用一页，不创建 107 个薄页；16 个未证明物理几何的候选保持 HOLD。

源数据仍有来源追溯缺口：`docs/SEO_KEYWORD_ROUTING.md` 明言仓库 Appendix 不包含原始 Top 300 的全部竞争 URL/排名类型；需要日后以原始完整导出补档，不得自行补造。

## 4. 语义内容和竞争意图

- **已具备独立价值：** backing 解释 60×80 + 两种 seam 方向和 108-inch WOF；binding 包含 8 strip/292-inch 范例；yardage 包含 43/50-inch WOF 真实排料对照；fabric 为多 SKU；border/sashing/batting 有独立几何说明；换算页有 14 行分数换算表。
- **P1 建议：** 给 BACK/BIND/YARD 分别增加由**本项目同一计算引擎独立验证**的多场景参考表（Baby/Throw/Twin/Queen、条宽差异、可用布宽差异）。每一行必须写清 overage、可用 WOF、seam、旋转和购买进位假设。仅在内容确实帮助用户时增加，无需新建低价值 URL。
- **P1 SEO/GEO：** 静态 HTML 内加清晰的 `Question → precise answer → assumptions → real example → limitation` 单元；不为了 AI 生成重复页面、夸张排名承诺或虚构测试人员。
- **竞争抽样（非完整 Google 前十/非排名保证）：** 公开竞品例如 `quiltingcalculator.com`、`thecraftmat.com/quilting/quilt-backing-calculator/`、`sewingpath.com/tools/quilt-backing-calculator` 提供预设尺寸与参考表。站点现有 SVG/CSV 物理坐标核查是独立差异化点；需要更直接解释给搜索用户。

## 5. 技术 SEO / 上线风险

### 当前确认已通过

- 预览 `noindex,follow`；Google 要求爬虫**可以访问 HTML**才能读取 noindex，所以 robots.txt 使用 `Allow: /` 与之并不冲突。当前 robots.txt 正常。参考 Google 官方：https://developers.google.com/search/docs/crawling-indexing/block-indexing
- 生产 sitemap **仅在明确配置** `PUBLIC_SITE_URL` + `PUBLIC_INDEXABLE=1` 后才生成；预览 `/sitemap.xml` 返回 404 属于设计行为。
- 非法路由返回 HTTP 404；noindex 的 `/lab/square-in-square/` 与 `/qa/print-calibration/` 不进入正式 sitemap。
- 生产 canonical 和 BreadcrumbList 逻辑已写入构建代码；**没有在正式域名实际部署**，因此不能写 `PRODUCTION PASS`。
- 9 个工具的独立 FAQ 可读，未伪造 Review/AggregateRating/Offer，也未滥用 FAQ schema。
- 英文 US 站点只有单一语言，现阶段 `hreflang` N/A；多语种不应无关键词数据直接扩张。

### 上线之前必须处理

1. **P1/上线阻断：双域名索引隔离。** `src/layouts/Base.astro` 由构建时 `PUBLIC_INDEXABLE` 决定是否 `index`，而 Cloudflare Pages 的 `*.pages.dev` 别名可能和正式域名提供**同一 HTML 构建**。一旦把生产构建改成 `index,follow`，不能仅凭当前逻辑断言 pages.dev 继续 noindex。应在 Cloudflare 验证可行的**按 Host 区分的边缘 noindex/重定向/隔离部署**，并分别抓取正式域名和 pages.dev 验证真实 HTTP 响应、canonical、sitemap、跳转；当前尚未触发此风险。
2. **P1/上线前：性能证据缺失。** 运行移动/桌面 Lighthouse 和生产真实监测：LCP、INP、CLS（FID 已过时），记录样本环境和数值。浏览器 smoke 和抓取延迟**不能**代替 Core Web Vitals。
3. **P1/上线前：完整 URL 状态/301/canonical 一致性。** 正式域名后验证 /slug、/slug/、http→https、www→non-www（按所选主域）、query 参数、404/410 和 sitemap URL 的一致性。当前只核对预览正式带斜杠路径，不能声称所有重定向组合通过。
4. **P1/生产验证：Search Console。** 验证域名所有权、提交 10 条合规 URL sitemap、检查 URL Inspection/Googlebot 页面、GSC 的索引状态与 query×page；28/90 天报告只有真实数据到期后可产生。
5. **P2：页面级 social/image metadata。** 增加真实相关 `og:image`（可与每页 WebP 一致），必要时提供宽图/卡片；不需要假 `lastmod`、`llms.txt` 或未验证的 Google 富媒体承诺。参考 Google Image SEO：https://developers.google.com/search/docs/appearance/google-images
6. **P2：信任与维护信息。** 当前 footer 只有隐私与 QA，缺可核验的 About / Contact 或维护说明。网站若以后通过广告或推广变现，可以补充**真实**维护方式/反馈渠道和计算方法的版本说明；不能凭空制造机构、专家、联系方式或“每周更新”日期。
7. **P2：图片可用性与社交预览**、GEO 公式来源与日期。单纯数学公式无需装饰性外链；有可变事实/行业标准时记录可信来源。手工评估 WebP 的语义和清晰度。
8. **N/A：** 不强制 FAQPage、虚构作者、`sameAs`、AI 专用结构化标记或 100 个分数换算子页。

## 6. 同统一建站质量标准的对照

对照 `chenmu2024/Website-Starter-Standard` 的 `SEO-GEO-QUALITY-GATE.md` / `TECHNICAL-SEO-IMPLEMENTATION.md` / `TRUST-AND-STRUCTURED-DATA-GATE.md`：

- 已满足：真实元数据、独立主意图、SSR/SSG 文字、robots 预览门禁、静态导览、数学范例、隐私的本地计算声明、移动代理回流、没有伪造用户评价。
- 待完善：本轮发现的品牌排除与歧义词运营表、真实实体/联系渠道（如果用户能提供）、网页性能真实数值、独立结构化数据校验、社交/图片元数据、生产 host 的 canonical/index 一致性、GSC 和排名证据。
- 不适用：没有多语言 URL 故 hreflang 不要求；未有付费 SaaS/医税法律资格，Article author/每天更新/Organization sameAs 并非必须字段。

## 7. 优先修复清单

| ID | 优先级 | 建议动作 | 完成判据 |
|---|---|---|---|
| SEO-01 | P1 | 创建**派生运营映射表**，排除 `robert kaufman calculator`，保留原始 218 行不可变 | 非品牌可投目标不再包含此词；源不改写 |
| SEO-02 | P1 | 核查 `how much is 1 yard`、`quilting calculator app` 的 US SERP 意图 | 记录当前 SERP 的 URL/日期/主要页面类型及是否保留 |
| SEO-03 | P1 | 增强 BACK/BIND/YARD 的用户尺寸/宽幅参考表 | 数据由自家引擎独立复算；明确所有假设；首页/工具实际可阅读 |
| SEO-04 | P1 | 强化 INCH 页面可抓取的主问句直接答案 | `how big is a yard of fabric` 在醒目静态 HTML 直接回答，保留一个转换页 |
| SEO-05 | P1（正式上线） | 生产和 pages.dev 按 hostname 分离索引控制 | 公网双 hostname 元信息、响应与 canonical 均实测合格 |
| SEO-06 | P1（正式上线） | 运行 Lighthouse/PSI，复核跳转/正式 canonical/sitemap | 实际实验室数值；HTTP、索引、URL 最终状态记录 |
| SEO-07 | P2 | 增加真正相关的逐页 `og:image` 与可验证维护者/反馈信息 | 分享预览与真实页面一致，无虚构身份 |
| SEO-08 | L3（正式上线后） | GSC 索引/查询/排名、图片等真实报告 | 分日期 28/90 天首次归因，零曝光如实报告 |

**不需立即做的事**：再生成 107 个转换页、把 HOLD 16 个强行解锁、购买 SEO API、发布 `index` 预览、宣传已排名或广告收益。

## 8. 参考材料和可复核状态

- 主要仓库代码：`src/data/routes.ts`、`src/data/intent-guides.ts`、`src/components/{ToolPage,IntentGuide}.astro`、`src/layouts/Base.astro`、`scripts/{check-build,sitemap}.mjs`、`public/{robots.txt,_headers}`。
- 关键词来源：`docs/data/V2_Keyword_Appendix_218.csv`，V2 方案 `Quilt_Calculator_完整开发方案_V2_20261104.md`；无实时 Semrush 重新导出。
- LIVE：2026-11-05 对 10 个带斜杠正式路径以及 robots、sitemap、privacy、calibration、experimental lab、随机 404 的公网内容抓取。为 H1 抽取误差另用精确选择器复核 HUB、BACK、INCH；其余 H1 由仓库构建和 CI 验证。
- 自动化工程： [quality 41981193163](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41981193163)；[Cloudflare live 41978590943](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41978590943)。实物打印和缝制的未验收项目仍见 `docs/qa/PREVIEW_ENGINEERING_ACCEPTANCE_20261105.md`。
- 官方规范：https://developers.google.com/search/docs/fundamentals/seo-starter-guide 、https://developers.google.com/search/docs/appearance/google-images 、https://developers.google.com/search/docs/appearance/core-web-vitals 、https://developers.google.com/search/docs/crawling-indexing/block-indexing 。

**最终判定：SEO 基础建设适合当前 noindex 预览，但存在可执行的内容/品牌意图修正以及正式域名启用时的主机级索引安全门槛；未实测的性能、GSC、真人/实物数据不得以 PASS 表述。**


## Implementation closure notes — 2026-11-05

Implemented from the above audit: (1) 218-row derived operational keyword sheet retaining 199 mapped nonbrand target terms, 2 intentional search-intent reviews, 1 other-brand exclusion and 16 unchanged HOLD terms; (2) engine-derived factual example tables on backing/binding/yardage; (3) prominent `1 yd = 36 in` answer without cloning fractional URLs; (4) per-page OG/Twitter preview images and more specific related links; (5) static/regression/browser checks covering provenance, content integrity and WCAG contrast. See [source-keyword matrix](../SEO_CONTENT_MATRIX.md).

Performance: a separate [mobile Lighthouse CI workflow](../../.github/workflows/lighthouse.yml) now measures simulated lab LCP/CLS/TBT and preserves JSON evidence. Its results must be read from the particular run, not inferred from this paragraph. **Field INP, Google CrUX, GSC and search ranking remain NOT_RUN**. A future approved domain must still pass true host-level pages.dev vs production index/canonical/sitemap isolation checks. No production indexing has been enabled.
