# Contest Rules — 影响日常开发的规则要点

> 完整逐条规则见 `context/rules-verified.md`（单一事实来源）。本文只摘取会直接影响每天怎么写代码、怎么组织仓库的条目。**不确定处一律标「待核实」，见 `context/open-questions.md`。**

## 必须做到

| # | 要求 | 出处 |
| --- | --- | --- |
| R1 | **Working software application**，且用 Kiro（IDE / CLI / Web / Kiro Crew）构建；Kiro 使用不足会被取消资格 | [1] |
| R2 | 能成功安装、在目标平台稳定运行，且功能与视频/文字描述一致 | [1] |
| R3 | 项目须在 **2026-10-30 09:00 PT** 之后新建；框架/库/starter 可用，但**其他既有代码必须披露** | [1] |
| R4 | 公开仓库**根目录含 `/.kiro`**（specs / hooks / steering）；**`/.kiro` 不得进 `.gitignore`** | [1][2] |
| R5 | GitHub 公开仓库（**非 GitLab / BitBucket**），含全部源码、素材、运行说明；公开开源且许可证可被 GitHub 在 About 区识别 | [1][2] |
| R6 | 提供可运行 App 的 URL；私有站点须在提交表单给评委登录凭据与说明 | [1] |
| R7 | 演示视频 **< 3 分钟**，公开上传 **YouTube**，须展示项目在目标设备上真实运行；不得含无授权的第三方商标/版权音乐 | [1] |
| R8 | 文字说明描述功能与特性 | [1] |
| R9 | 提交材料**须为英文**，否则须附视频、文字说明、测试说明等全套英文翻译 | [1] |
| R10 | 一份 "how Kiro was used" 说明：IDE/CLI/Web/Crew 差异、custom agents、agent hooks、spec-driven development、steering docs、MCP、PBT、Kiro powers | [1] |
| R11 | 提交表单中指明 category 与 bonus category | [1] |
| R12 | 第三方 SDK / API / 数据须有使用授权并遵守其条款 | [1] |

## 时间（Pacific Time）

- Submission Period：2026-10-30 09:00 PT → **2026-12-04 14:00 PT**；无延期，逾期不收。[1]
- 申请 Credits 截止 2026-12-01 12:00 PT；兑换截止 2026-12-04；已兑换 Credits 于 2026-12-31 23:59 PT 失效。[1]

## 类别原文（Costume Contest，已核实）

> "Build any app but show us a haunting user interface that's polished and unforgettable. Bring in spooky design elements that enhance your app's function."[1][2]

即：**任何类型 App 都可以**；界面是评分核心之一，但诡异元素要**增强功能**。

## 评审（已核实）

- Stage One：pass / fail，看是否 reasonably fits theme 且 reasonably applies required tools。[1]
- Stage Two：五项各 20%（各 10 分）—— Potential Impact / Technological Implementation / Design / Innovation-Idea / Presentation。[1]

## 不要自行推断的部分

- 参赛资格与地区限制（含 Kiro Regional Restrictions）→ 待核实 Q-01
- 4,000 Credits 是否已兑换到账户 → 待核实 Q-02
- 官方规则是否已有更新 → 待核实 Q-03
- FAQ / Resources 页是否有 rules 页之外的细则 → 待核实 Q-04

若 Alex 或 Kiro 认为某条规则有歧义，官方规则给出的机制是：**在截止前向主办方提交书面澄清请求**（"If at any time prior to the deadline, an Entrant or prospective Entrant believes that any term in the Official Rules is or may be ambiguous, they must submit a written request for clarification."）[1]

## 来源

[1] https://kiroween.devpost.com/rules
[2] https://kiroween.devpost.com
