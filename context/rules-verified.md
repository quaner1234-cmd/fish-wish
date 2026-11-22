# Kiroween 2026 官方规则 — 已核实 / 待核实

> 抓取时间：2026-11-13（本机 `curl https://kiroween.devpost.com/rules`，HTTP 200）。
> 原文快照：`context/evidence/kiroween-rules-2026-11-13.txt`；SHA256 见同目录 `SHA256SUMS.txt`。
> 本文是工作区内**规则内容的单一事实来源**。其他文件引用本文，不另写一份。
> **标注「待核实」的项目不做推测**，统一见 `context/open-questions.md`。

## A. 已核实（官方规则原文）

### A1. 时间与截止 [1]

| 事项 | 时间 |
| --- | --- |
| Registration Period | 2026-10-13 08:30 PT → 2026-12-04 14:00 PT |
| Submission Period | 2026-10-30 09:00 PT → 2026-12-04 14:00 PT |
| 提交截止 | 2026-12-04 14:00 PT |
| Judging Period | 2026-12-16 13:00 PT → 2027-01-29 13:00 PT |
| 获奖公布 | 约 2027-02-03 09:00 PT |

原文："No extensions will be granted. Late Submissions will not be accepted."

### A2. 主办方 [1]

- Sponsor: Amazon Web Services, 2121 7th Ave, Seattle, Washington 98121, United States
- Administrator: Devpost, Inc., 250 Broadway, Floor 24, New York, NY 10007

### A3. 资格 [1] —— 部分待核实

- 开放给：达到所在地法定成年年龄的个人；由合资格个人组成的团队（**每队最多 3 人**）；参赛时已合法存在的组织。
- 不开放给：居民/注册地属于规则所列排除地区的个人或组织；Promotional Entities 及其雇员/代理/近亲属；评委及其雇主；上述主体的母/子/关联公司；主办方认定存在利益冲突者。
- 规则原文列出的排除地区包括（但不限于）：Quebec（省）、Argentina、Australia、Brazil、Italy、Philippines、Russia、Cuba、Iran、North Korea、Syria、Belarus、Crimea 地区、DNR、LNR、United Arab Emirates，以及被美国 OFAC 全面制裁的任何国家。
- **待核实**：Alex 的居住地/身份是否属于合资格范围，见 Q-01。此处不代为判断。

### A4. 参赛类别与 Costume Contest 原文 [1][2]

四个类别：Resurrection、Frankenstein、Skeleton Crew、**Costume Contest**。

Costume Contest 原文：

> "Build any app but show us a haunting user interface that's polished and unforgettable. Bring in spooky design elements that enhance your app's function."

其余三类原文（供对照，不是本项目类别）：
- Resurrection: "Bring your favorite dead technology back to life. Reimagine obsolete tech with today's innovations or solving tomorrow's problems."
- Frankenstein: "Stitch together a chimera of technologies into one app. Bring together seemingly incompatible elements to build something unexpectedly powerful."
- Skeleton Crew: "Build a skeleton code template lean enough to be clear but flexible enough to support various use cases. Show us its versatility with two distinct applications from your foundation."

### A5. 作品要求（What to Create / Project Requirements）[1]

- "Entrants must build a **working software application using Kiro (IDE, CLI, Web, and/or Kiro Crew)** and submit it into one of the following categories. **Insufficient use of Kiro will result in disqualification at the Judges' sole discretion.**"
- **Functionality**: "The Project must be capable of being successfully installed and running consistently on the platform for which it is intended and must function as depicted in the video and/or expressed in the text description."
- **Platforms**: 须在提交要求中指定的目标平台上运行。
- **New Projects Only**: 项目须由参赛者在 Submission Period 开始之后新建。允许使用标准开发资源（框架、库、starter 模板），但须披露任何其他既有代码或作品。
- **Third Party Integrations**: 集成第三方 SDK / API / 数据须获得授权并遵守其条款与许可。

### A6. Kiro Credits [1] —— 兑换状态待核实

- "Entrants ... may be provided with a one-time allotment of **4,000 Kiro credits** for the duration of their participation throughout the Hackathon submission period. No additional usage benefits will be provided."
- 须通过 Credit Request Form 申请，准确填写 Kiro user ID 或 AWS account ID 及项目详情；ID 错误可能不获批。
- 申请截止：**2026-12-01（周二）12:00 PT**；审核约需 48 个营业小时，可疑/欺诈申请可被拒。
- "Credits must be redeemed by Friday, **December 4, 2026**, after which all unredeemed credit codes expire. Expired credit codes will not be replaced. **Redeemed credits expire on Thursday, December 31, 2026 at 11:59 pm Pacific Time.**"
- 争议须通过 Hackathon Website 上列出的 Hackathon Manager 升级处理。
- **待核实**：Alex 的 4,000 credits 是否已兑换进 Kiro 账户，见 Q-02。

### A7. 提交要求（Submission Requirements）[1][2]

| # | 要求 |
| --- | --- |
| 1 | 提交用 Kiro 构建、满足 Project Requirements 的项目 |
| 2 | **可运行 App 的 URL**；若评委测试需登录，须在 Devpost 提交表单内提供凭据与说明 |
| 3 | 描述功能与特性的**文字说明** |
| 4 | **演示视频**：应 < 3 分钟（评委无义务看超过 3 分钟）；须展示项目在目标设备上真实运行；须公开上传至 **YouTube** 并在提交表单给出链接；不得含无授权的第三方商标或版权音乐等素材 |
| 5 | **公开 GitHub 仓库 URL**（原文："NOT GitLab or BitBucket"），须含使项目可运行的全部源码、素材与说明；仓库须公开、开源并包含开源许可证文件，且该许可证须能在仓库页 About 区被识别 |
| 6 | "Your repo must contain the **/.kiro directory at the root of the project** to show usage of Kiro such as specs, hooks, and steering. **Do NOT add the /.kiro directory or sub-folders to your .gitignore, as this could disqualify your submission.**" |
| 7 | 指明所提交的 **category 与 bonus category** |
| 8 | Skeleton Crew 专属：仓库须含 2 个独立应用文件夹（本项目不适用） |
| 9 | Startup / Student / Kiro Crew / Social Blitz / Blog 等 bonus 有各自附加要求（见 A9） |
| 10 | 一份 **"how Kiro was used"** 说明，评审需据此判断 Kiro 使用是否有效；官方列出的可写点：IDE / CLI / Web / Crew 的差异、custom agents、agent hooks、spec-driven development、steering docs、MCP、property-based testing (PBT)、Kiro powers |
| 11 | **Testing**: 须免费、无限制地向 Sponsor / Administrator / Judges 提供可运行项目访问，直至 Judging Period 结束；评委无义务实测，可仅依据文字/图片/视频评分；不按要求提供访问可能被取消资格 |
| 12 | **Language Requirements**: 所有提交材料须为英文；非英文须提供演示视频、文字说明、测试说明及其他材料的英文翻译 |
| 13 | 多份提交须彼此"unique and substantially different" |
| 14 | 提交须为参赛者原创、独自拥有、不侵犯他人 IP |

> 关于 `/.kiro`：Kiro 的 spec 三阶段文件为 `requirements.md` → `design.md` → `tasks.md` [4]；steering 基础文件为 `product.md` / `tech.md` / `structure.md`，默认每次交互加载，`AGENTS.md` 始终加载 [3]。这些是 Kiro 工具自身的约定，不是赛事规则。

### A8. 评审 [1]

- **Stage One**：pass / fail，判断项目 "reasonably fits the theme and reasonably applies the required tools featured in the Hackathon"。
- **Stage Two**：五项**等权各 20%**（各项 10 分）：
  - Potential Impact — 是否为真实受众解决真实问题；是否有用、直观、易用；是否真会有人用
  - Technological Implementation — 是否深入且有策略地使用 Kiro；是否用到多种 Kiro 工具；是否体现对 Kiro 特性的深度理解
  - Design — 是否完整、连贯的产品体验（不只是技术验证）；设计是否直观、精致、有意图
  - Innovation / Idea — 概念是否新颖、是否有别于既有概念；是否以独特方式组合不常见技术或公开资源
  - Presentation — 视频是否端到端演示可用；pitch 是否讲清解决什么问题、给谁、为何重要；是否易理解、有创意、令人记住
- 并列时按 20 分制重新评分，仍并列则每轮 +10 分上限继续。

### A9. 奖项 [1][2]

| 奖项 | 金额 / 内容 | 数量 |
| --- | --- | --- |
| Overall 1st / 2nd / 3rd | $30,000 / $20,000 / $10,000 USD | 各 1 |
| Best Resurrection / Frankenstein / Skeleton Crew / **Costume Contest** | 各 $5,000 USD | 各 1 |
| Best Startup Project | $10,000 USD | 1 |
| Best Ghost of Kiroween Past | $2,000 USD | 1 |
| Best Kiro Crew App | $1,000 USD | 1 |
| Best Student Project（每类别 1 个） | $1,500 USD + 1 年 Kiro Pro Max | 4 |
| Bonus: Best Demo | $1,000 USD | 1 |
| Bonus Blog Prize | 2,000 bonus Kiro credits | 100 |
| Social Blitz Prize | 3 个月 Kiro Pro+ | 5 |

规则注明：一个项目可获 1 个 Overall Prize **或** 1 个 Category Prize，**加上**任意数量 Bonus Prizes。奖池总额对外宣传为 $100,000（此数字来自第三方报道与赛事宣传，非本页规则表格，标注为**待核实 Q-08**）。

### A10. 地区限制（Regional Restrictions）[1]

原文要点：Kiro 内部分功能、AI 模型与功能可能因地区而异；参赛者**自行负责**查阅并遵守所有适用的 Regional Restrictions（公布于 https://kiro.dev 或主办方指定 URL）；依赖所在地区不可用功能/模型的项目由参赛者自行承担责任。
→ **本机所在区域的 Kiro 功能/模型可用性待核实，见 Q-01。**

### A11. 歧义处理机制 [1]

原文："If at any time prior to the deadline, an Entrant or prospective Entrant believes that any term in the Official Rules is or may be ambiguous, they must submit a written request for clarification."

### A12. 草稿与修改 [1]

- 截止前可在 Devpost 保存 draft；截止后不得再改动已提交材料（但可继续更新 portfolio 里的项目）。
- 截止后主办方可允许为移除侵权/PII/不当内容做局部修改，但须保持实质相同。

## B. 待核实（不做推测）

以下项目**不自行推断**，主清单与核实方式见 `context/open-questions.md`：

- Q-01 参赛资格与地区限制（含 Kiro Regional Restrictions）
- Q-02 4,000 Credits 是否已兑换进 Kiro 账户
- Q-03 官方规则是否有更新（本页为 2026-11-13 快照）
- Q-04 FAQ / Resources 页是否存在 rules 页之外的细则
- Q-08 $100,000 总奖池的官方口径

## C. 来自邮件、非官方规则的补充（明确区分）

以下内容**不是官方规则**，仅作背景，出处见 `context/reference-emails.md`：

- 注册确认邮件（uid 7853）提醒：仓库须含 `/.kiro`；团队最多 3 人；Discord `#kiroween-hackathon`；Build Session 录播。
- Credit 申请被拒邮件（uid 7886）说明：申请表须**写明四个类别之一**，否则不获批；并称 credits "first-come, first-served ... while supplies last"，"submitting a request does not guarantee approval"。该表述来自邮件，官方规则原文用的是 "may be provided" 与「审核后可因可疑/欺诈被拒」。
- 身份验证邮件（uid 7940）与更新邮件（uid 7955）说明：credits 需通过 Didit 做一次性身份验证（自拍 + 政府证件）；该验证只针对 credits，注册与提交作品不需要。
- 发放邮件（uid 7952）：已批准 4,000 credits，含**一次性兑换链接**（本工作区刻意不收录）。
- 更新邮件（uid 7857）称 "Indonesia is now eligible ... The Official Rules have been updated"，并提供了 Bahasa Indonesia 规则翻译链接 —— 这是 Q-03 的直接依据。

## Sources

[1] https://kiroween.devpost.com/rules — Kiroween 2026 Official Rules (Devpost)
[2] https://kiroween.devpost.com — Kiroween 2026 Overview (Devpost)
[3] https://kiro.dev/docs/steering — Kiro Docs: Steering
[4] https://kiro.dev/docs/specs — Kiro Docs: Specs

## 本地证据

- `context/evidence/kiroween-rules-2026-11-13.txt`：2026-11-13 抓取的 rules 页 HTML 转文本全文（352 行），SHA256 `0d879f78f9b994bea35894dd7f91d113b27bc3cf0da8b5052f93e8da39359bc3`。
- `context/evidence/SHA256SUMS.txt`：可用 `sha256sum -c` 复核。
- 引用官方数字/日期/金额前，先对照该快照；规则可能更新，提交前须重新核对 rules 页。
