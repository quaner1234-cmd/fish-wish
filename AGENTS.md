# AGENTS.md — Kiroween 2026 工作区入口

> 本文件与 `.kiro/steering/*.md` 会被 Kiro 自动加载（AGENTS.md 始终加载；steering 基础文件默认每次交互都加载）。打开工作区先读这一页。

## 这是什么

- 一个**独立、干净的探索工作区**，用于后续与 Kiro 共同研究、开发 Kiroween 2026 参赛作品。
- 当前状态：**故事版已上线**（2026-11-22，D-003 ~ D-015；光从小孔进入瓮里、第四幕动画与瓮中光的孩子、结尾光鱼与结尾卡片；无配音，不用 3D；内容已定稿，剩提交工作）：《Fish Wish》（暂定名），盆上那张脸对"你"说话的网页互动故事，界面只用英文；Vite + TypeScript + Canvas 2D。地址 https://fish-wish.pages.dev ，仓库 https://github.com/quaner1234-cmd/fish-wish 。进度看 `.kiro/specs/urn-experience/tasks.md`。
- 常用命令：`npm run dev` / `npm test` / `npm run check`（事实检查）/ `npm run build`；发布见 `tasks.md` 第 16 项。
- 参赛类别：**Costume Contest**（已确认，见 `context/rules-verified.md`）。
- 目标：做出**真正可运行的 App**，并具备**精致、令人印象深刻的诡异风格界面**。

## 三条硬约束（官方规则，已核实）

1. 必须是 **working software application**，且使用 Kiro 构建。原文："Entrants must build a working software application using Kiro (IDE, CLI, Web, and/or Kiro Crew)"；并明确 "Insufficient use of Kiro will result in disqualification at the Judges' sole discretion."[1]
2. 提交的公开 GitHub 仓库**根目录必须包含 `/.kiro` 目录**（specs / hooks / steering）。原文："Your repo must contain the /.kiro directory at the root of the project to show usage of Kiro such as specs, hooks, and steering. Do NOT add the /.kiro directory or sub-folders to your .gitignore, as this could disqualify your submission."[1][2]
   **绝对不要把 `/.kiro` 及其子目录写进 `.gitignore`。**
3. 项目必须是 **Submission Period 开始（2026-10-30 09:00 PT）之后新建**的。框架、库、starter 模板可用，但须披露其他既有代码。[1]

## 协作约定（重要）

- **官方规则不确定的地方一律标记「待核实」，不要自行推测、补全或推断成确定结论。** 主清单见 `context/open-questions.md`。
- 任何规则性断言都要能指到 `context/rules-verified.md` 的条目或 `context/evidence/` 里的原文快照；指不到就写「待核实」。
- 严格区分四种信息：**已核实事实** / **Alex 的陈述** / **待核实** / **待决定**。不要把 Alex 的陈述写成官方规则，也不要把讨论起点写成决定。
- 主题、技术栈、平台未定前，不要默认替 Alex 选好；先记进 `ideas/IDEAS.md` 或 `decisions/DECISIONS.md`。
- **敏感信息不得写入本工作区任何文件**：Kiro credits 一次性兑换链接、Devpost / Kiro 账号凭据、身份证明材料。本目录未来会成为**公开 GitHub 仓库**。
- 官方规则可能被主办方更新；提交前需重新核对 rules 页（见 `context/open-questions.md` Q-03）。
- **本项目的所有文件都写在 `D:\Projects\kiroween-2026` 内**，不要写到 C 盘或其他目录（Alex 2026-11-21 要求；写到工作区外会反复弹出授权）。浏览器脚本（ego lite `.mjs`）、截图、下载、转写等临时文件放 `_scratch/`，该目录已在 `.gitignore` 中，因含第三方版权素材，不进公开仓库。

## 导航

| 想了解 | 读 |
| --- | --- |
| 项目背景、时间线、已确认事实 | `context/competition-brief.md` |
| 官方规则逐条（已核实 / 待核实分开） | `context/rules-verified.md` |
| 全部待核实与待决定项 | `context/open-questions.md` |
| 本机开发环境（实测） | `context/dev-environment.md`（仅本地，不进公开仓库） |
| Gmail 参考邮件索引 | `context/reference-emails.md`（仅本地，不进公开仓库） |
| 规则原文快照 + 哈希 | `context/evidence/` |
| 史实核对（人面鱼纹盆 / 瓮棺） | `context/research-urn-burial.md` |
| 需求 / 设计 / 任务 spec | `.kiro/specs/urn-experience/`（`requirements.md` → `design.md` → `tasks.md`） |
| 创意记录 | `ideas/IDEAS.md` |
| 决策记录 | `decisions/DECISIONS.md` |
| Kiro 原生上下文 | `.kiro/steering/` |

## 关键日期（Pacific Time，已核实 [1]）

| 事项 | 时间 |
| --- | --- |
| Submission Period 开始 | 2026-10-30 09:00 PT |
| **提交截止** | **2026-12-04 14:00 PT**（无延期，逾期不收） |
| Credits 申请截止 | 2026-12-01 12:00 PT |
| Credits 兑换截止 | 2026-12-04 |
| 已兑换 Credits 失效 | 2026-12-31 23:59 PT |
| 评审期 | 2026-12-16 13:00 PT → 2027-01-29 13:00 PT |
| 获奖公布 | 约 2027-02-03 09:00 PT |

## 来源

[1] https://kiroween.devpost.com/rules
[2] https://kiroween.devpost.com
