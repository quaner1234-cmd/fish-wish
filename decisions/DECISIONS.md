# 决策记录（DECISIONS）

> 轻量的决策日志。状态：`已定` / `待定` / `已否决`。
> **待决定项不在此假装成决定**，统一列在 `context/open-questions.md` 的「B. 待决定」。
> 规则不确定处是「待核实」，不是决策，见同文件「A. 待核实」。

## 格式

```
### D-XXX <标题>
- 状态：已定 / 待定 / 已否决
- 日期：YYYY-MM-DD
- 决策：
- 理由：
- 影响 / 约束：
- 反例 / 明确不包含：
- 证据：
```

---

### D-001 创建独立的 Kiroween 2026 探索工作区

- **状态**：已定
- **日期**：2026-11-13
- **决策**：在 `D:\Projects\kiroween-2026\` 建立一个独立、干净的工作区，用于后续与 Kiro 共同研究和开发参赛作品；同时整理项目背景、开发环境、官方规则，并建立创意记录与决策记录。
- **理由**：主题与产品方向尚未确定，需要先有一个能承载上下文、且 Kiro 打开即能理解现状的地方，再开始讨论方向。
- **影响 / 约束**：
  - 工作区按 Kiro 原生约定组织：根目录 `AGENTS.md` + `.kiro/steering/`（product / tech / structure / contest-rules / collaboration），Kiro 会自动加载。
  - 规则内容单一来源：`context/rules-verified.md`；待办单一清单：`context/open-questions.md`。
  - 官方规则原文快照存 `context/evidence/`，附 SHA256 可复核。
  - 敏感信息（credits 一次性兑换链接、账号凭据、身份材料）不写入工作区 —— 本目录未来是公开 GitHub 仓库。
- **明确不包含（本次未做）**：
  - 未选主题、产品方向、目标用户、平台、技术栈
  - 未写任何应用代码、未安装依赖、未跑构建
  - 未 `git init`、未关联远端、未 commit / push / 发布（Alex 的验收前不发布约定）
  - 未实际启动 Kiro 窗口验证 steering 加载
  - 未核实 credits 是否已兑换（Q-02）
- **证据**：本文件、`README.md`、`context/dev-environment.md`（2026-11-13 实测环境）、`context/reference-emails.md`（Gmail 11 封只读索引）、`context/evidence/SHA256SUMS.txt`。

---

### D-002 不以 Stranger Typing（灯墙打字机）作为参赛项目

- **状态**：已定
- **日期**：2026-11-15
- **决策**：参赛作品不在 `Stranger Typing`（`D:\Projects\奇怪语物_灯墙打字机`）基础上延展，另起新项目。
- **理由**：Alex 2026-11-15 口述。该作品早于 Submission Period：首个 commit `a9684c7` 为 2026-10-30 12:00 +0800（= 2026-10-29 21:00 PT），底图素材来自 `灯墙电报_RUN_2026-10-28`；Submission Period 自 2026-10-30 09:00 PT 开始，规则要求 "Projects must be newly created by the Entrant after the start of the Hackathon Submission Period"。
- **影响 / 约束**：I-001 改为已否决。新项目代码须在本工作区新写。
- **明确不包含**：未删除、未修改 `Stranger Typing` 仓库或线上站点。
- **证据**：`git log`（灯墙仓库）、`context/rules-verified.md` New Projects Only 条目。

---

### D-003 方向：人面鱼纹盆与婴儿瓮棺，从恐怖走到爱

- **状态**：已定
- **日期**：2026-11-21
- **决策**：Alex 2026-11-21 同意 Kiro 的建议。参赛作品以 I-004 为方向：一个网页互动体验，以"从瓮里往上看"（第一人称）为骨架，借用"夜里发掘"的灯光和刷土作为交互；只做人面鱼纹彩陶盆这一件文物，5 分钟内体验完。
- **基调**：Alex 原话"我希望留下的是爱，恐怖是形式是工具，不是目的"。恐怖只用于开头的进入和转折，结尾落在爱与尊重上，不拿夭折的孩子做惊吓。
- **影响 / 约束**：
  - I-001 已否决；I-002（中式恐怖 + 黑暗）并入本方向；I-003（AI agent）暂不做。
  - 纹样自绘，不用博物馆照片；纹样含义只按"有一种说法"呈现。
  - 讲解视频中的说法（盆底小孔用途、埋在住处旁、每件都钻孔等）上屏前需找学术或博物馆来源核实。
  - 不使用福娃形象或名称（奥运相关商标与版权）。
- **明确不包含**：技术栈（D-04）、具体分镜与文案、交互细节、是否组队、bonus 申报仍未定。
- **证据**：本对话 Alex 口述；`ideas/IDEAS.md` L14 / I-004。

---

### D-004 需求草稿通过；界面只用英文；名称最后定

- **状态**：已定
- **日期**：2026-11-21
- **决策**：
  - `.kiro/specs/urn-experience/requirements.md` 内容不改，作为后续 design / tasks 的依据。
  - 体验界面先只用英文，不做中文切换。
  - 作品名称暂不定，Alex 原话"可能最后定吧，感觉会自己长出来"。之前用工作名 `urn-experience`。
- **影响 / 约束**：文字集中存放，以后要加语言或换名称时只改一处。提交材料的语言（D-10）随之倾向全英文，提交前再确认。
- **证据**：本对话 Alex 回复。

---

### D-005 技术栈与托管

- **状态**：已定
- **日期**：2026-11-21
- **决策**：Alex 选方案 C：Vite + TypeScript，不用 UI 框架；主体 Canvas 2D，局部特效用一层可降级的 WebGL；文字用 DOM；声音用 Web Audio 程序合成；托管 Cloudflare Pages。
- **理由**：兼顾精致与稳定；特效层可整体砍掉而不影响完整性；Alex 已有 Cloudflare Pages 发布经验。
- **影响 / 约束**：
  - 需要生图时可调用本机 Codex（Alex 2026-11-21 同意），只用于背景和纹理；那张脸用代码绘制。
  - Pages 子域名随项目名，作品名未定，开发期用临时项目名 `urn-experience`。
- **明确不包含**：未安装依赖、未建 Git 仓库、未建 Cloudflare 项目、未选许可证（D-07）。
- **证据**：本对话；`.kiro/specs/urn-experience/design.md` §1。

---

### D-006 MIT 许可证；一次做完；先发预览地址

- **状态**：已定
- **日期**：2026-11-21
- **决策**：
  - 开源许可证用 MIT（Alex 确认），版权署名暂写 GitHub 账号 `quaner1234-cmd`。
  - Alex："这不算个大项目，你甚至后面能直接做完，不需要停。" 任务 1–16 一次做完，审阅放到之后。
  - 预览发布到 Cloudflare Pages 临时项目 `urn-experience`（https://urn-experience.pages.dev）。定名后再用最终名称发布正式地址。
- **影响 / 约束**：
  - 本地已 `git init`（`main`），没有远端，按工作区规则不提交；公开 GitHub 仓库等 Alex 确认后再建（D-07）。
  - 界面上的作品名 "The Painted Lid" 是占位名，改 `src/content/strings.json` 的 `ui.title` 一处即可（页面标题由构建时读取同一字段）。
- **证据**：`tasks.md` v0.2；`_scratch/ego/qa-20261122/` 截图（本地，不入库）。

---

### D-007 改为故事向：那张脸对你说话；作品名暂定 Fish Wish；建 GitHub 仓库

- **状态**：已定
- **日期**：2026-11-22
- **决策**：
  - Alex 体验后反馈：灯、声音、画面满意；但"太科普而不是故事向""说得太保守"。改为虚构故事：盆上那张脸把用户当成瓮里的孩子，对"你"说话。台词由 Kiro 起草，Alex 选定"脸对我说话"并确认"台词不改"。
  - 开头写明 "A story inspired by a 6,000-year-old basin from Banpo, China. The people are imagined. The basin is real."；史实集中到结尾 "What is real" 页，继续由事实检查把关。
  - 作品名暂定 "Fish Wish"（Alex："先叫 fish wish 比较好"）。
  - Alex 同意先建 GitHub 仓库。
- **理由**：Costume Contest 要 "haunting … unforgettable"；旧版每到紧张处就用一句客观说明把它化解掉。
- **影响 / 约束**：需求 v0.3（第 3–7 条），设计 v0.3。Pages 用新项目 `fish-wish`；旧预览项目 `urn-experience` 保留未删。
- **证据**：本对话。

---

### 待决定（不在此写结论）

| ID | 待决定 | 去哪看 |
| --- | --- | --- |
| D-01 ~ D-10 | 主题、目标用户、平台、技术栈、组队、bonus 申报、公开仓库与许可证、演示视频、Kiro 使用说明、材料语言 | `context/open-questions.md` B 节 |

### 待核实（不是决策）

| ID | 待核实 | 去哪看 |
| --- | --- | --- |
| Q-01 ~ Q-08 | 资格与地区限制、credits 是否兑换、规则是否更新、FAQ/Resources 细则、Kiro 账号、bonus category 选项、评委访问执行、奖池口径 | `context/open-questions.md` A 节 |

---

## 记录模板

```markdown
### D-XXX <标题>
- 状态：已定 / 待定 / 已否决
- 日期：YYYY-MM-DD
- 决策：
- 理由：
- 影响 / 约束：
- 明确不包含：
- 证据：
```
