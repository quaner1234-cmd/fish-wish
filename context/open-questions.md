# 待核实 / 待决定 主清单

> 这是**唯一**的待办清单。规则不确定处一律标「待核实」，不做推测；产品未定项标「待决定」，不替 Alex 决定。
> 建立：2026-11-13。核实一条就更新状态并写明日期与证据位置。

## 图例

- **类型**：`待核实` = 官方规则/外部事实不确定；`待决定` = 产品/项目层面的选择
- **状态**：`OPEN` / `IN PROGRESS` / `CLOSED`

## A. 待核实（官方规则不确定处，禁止自行推测）

| ID | 问题 | 依据 | 如何核实 | 状态 |
| --- | --- | --- | --- | --- |
| **Q-01** | Alex 的居住地/身份是否属于合资格参赛者；以及 Kiro 在本区域可用的功能与 AI 模型（Regional Restrictions） | 规则 §3 列出排除地区；§4 明确「Entrants are solely responsible for reviewing and complying with all applicable regional restrictions」并指向 https://kiro.dev [1] | ① 对照 `context/evidence/kiroween-rules-2026-11-13.txt` §3 的完整排除清单与自身情况；② 查 https://kiro.dev 的 Regional Restrictions 说明；③ 有歧义则按规则 §「submit a written request for clarification」在截止前向主办方书面询问，或在 Discord `#kiroween-hackathon` 提问 | OPEN |
| **Q-02** | 4,000 Kiro Credits **是否已实际兑换进 Kiro 账户** | 邮件 uid 7952 只证明「已批准 + 发放一次性兑换码」，不证明已兑换 [1] | 登录 Kiro → `kiro.dev/account/usage`，查看是否有带 `kiroween` 前缀的 credits；邮件称 1–2 分钟内可见 | OPEN |
| **Q-03** | 官方规则自 2026-11-13 快照之后是否有更新 | 邮件 uid 7857 明确说 "Indonesia is now eligible ... The Official Rules have been updated"，并提供 Bahasa Indonesia 翻译链接；说明规则会被改 [1] | 已在 2026-11-23 重新抓取 https://kiroween.devpost.com/rules 并与 11-13 快照逐词 diff：**唯一实质变化是 2026-11-16 把 Australia 移出排除地区（澳居民现可参赛）**，其余条款无变化。详见 `rules-verified.md` A13；新快照 `context/evidence/kiroween-rules-2026-11-23.txt`（SHA256 已记入 `SHA256SUMS.txt`） | CLOSED |
| **Q-04** | FAQ / Resources / Updates / Discussions 页是否存在 rules 页之外的 Costume Contest 细则 | 官网有 FAQ / Resources / Updates 等标签页；本工作区只核实了 rules 页与 overview 页 [2] | 已逐页抓取（2026-11-23）：FAQ [5]、Updates [6]、Resources [7]、Credits [8]、Discussions [9]。**未发现 rules 之外的额外硬性提交要求**；FAQ 的数条澄清（只收新项目、开源许可证、一类别+bonus、评委测试凭据字段、视频<3min、截止后不可改）已并入 `rules-verified.md` A7/A14 | CLOSED |
| **Q-05** | Kiro 账号登录状态、Kiro user ID，以及 credits 余额的核对入口 | 邮件 uid 7952 要求「Log in to your Kiro account before you open this link」；uid 7853 说申请需 Kiro user ID 或 AWS account ID [1] | 打开 Kiro 确认登录；在 `kiro.dev/account/usage` 核对 credits；记录 Kiro user ID（**不写入仓库**） | OPEN |
| **Q-06** | 提交表单中 "bonus category" 的具体可选项与填写方式 | 规则只写 "Identify which category and bonus category you are submitting into"，未列出可选组合 [1][2]；FAQ 称可申请 "any bonus prizes you qualify for" [5] | 规则/Resources 已列出 bonus 奖项目（Startup / Student / Ghost of Kiroween Past / Kiro Crew / Best Demo / Blog / Social Blitz）[1][7]；**提交表单里这些字段的确切选项仍需登录 Devpost 表单草稿页查看（需 Alex 账号）**。是否有资格申报由 Alex 决定（D-06） | OPEN（需在 Devpost 表单内确认字段） |
| **Q-07** | 「向评委免费、无限制提供可运行项目访问直至 Judging Period 结束」的具体执行方式 | 规则 §Testing 有此要求；FAQ 补充：提供可运行 URL，若需登录把测试凭据/说明填进提交表单、该字段仅评委可见 [1][5] | 已明确：本作品是**公开、无需登录**的 Cloudflare Pages 站点，无需填测试凭据；只要保证该部署在 Judging Period（至 2027-01-29）内持续在线即可 | CLOSED（本项目做法已定） |
| **Q-08** | 宣传中的「$100,000 总奖池」官方口径 | 规则 §8 表格逐项金额与宣传数字并非同一呈现；第三方报道与赛事宣传称 $100,000 [1] | 以 https://kiroween.devpost.com/rules §8 表格为准逐项核对；不要把宣传数字当作规则条款 | OPEN |
| **Q-09** | Alex 在 Submission Period 开始后、但用其他 Agent（Codex / WorkBuddy）做的作品，或已投过其他比赛的作品（如 `innie-vote`、`proof-of-human`），能否沿用、沿用多少 | 规则 New Projects Only 要求披露 "pre-existing code or work"；硬约束要求 "build ... using Kiro" [1]；FAQ 明确 "Only new projects created during the Submission Period are eligible. This includes projects from Kiroween 2025."、"Your submission must be your own original work"、可用开源库但须遵守许可证并披露 [5] | 已核实（2026-11-23）：**旧作（innie-vote / proof-of-human 等）不能作为本项目沿用**，项目须在 Submission Period 内新建；若纳入任何既有代码须在提交中披露。本作品《Fish Wish》是在本工作区用 Kiro 从零新建，未沿用旧作代码 → 无需就"沿用"披露；如将来加入任何既有代码再在 `submission/` 披露。FAQ 未专门写"已投其他比赛"，但本作品未投过其他比赛 | CLOSED |

| **Q-10** | 小米 MiMo-V2.5-TTS 生成的配音，能否放进 MIT 公开仓库、公开网站和比赛演示视频（权属、商用、署名要求） | 需求 R8.3 要求声音"自制、程序合成或明确可商用"；规则要求第三方服务"获得授权并遵守其条款"（`rules-verified.md` Third Party Integrations）。2026-11-22 查了 MiMo 公开文档（TTS 使用指南、首次调用、FAQ），没有找到生成内容的权属或商用条款（D-009） | 2026-11-22 Alex 决定去掉配音（D-012），`public/voice/` 已删除，当前网站与仓库最新版不含生成音频。剩下的只有 git 历史 `aa4e71e` 里的旧 MP3；只有在需要从历史中清除时才要再查条款（清除需改写历史并强制推送，须 Alex 批准） | 不再阻塞 |

> 补充：Q-03 是持续项，提交前必须复核一次。**2026-11-23 已复核（仅 Australia 资格更新）**；提交日（12-03 前）再复核一次。任何核实结果都要写回 `context/rules-verified.md` 并更新快照哈希。

## B. 待决定（产品/项目层面，不替 Alex 选）

| ID | 待决定 | 为什么现在要记 | 关联约束 | 状态 |
| --- | --- | --- | --- | --- |
| **D-01** | 项目主题与产品方向 | 2026-11-21 已定：人面鱼纹盆与婴儿瓮棺，从恐怖到爱（`decisions/DECISIONS.md` D-003） | 类别 Costume Contest 允许任何类型 App [1] | CLOSED |
| **D-02** | 目标用户与要解决的真实问题 | 评审 Potential Impact 20% | [1] | OPEN |
| **D-03** | 目标平台（Web / 桌面 / 移动）与运行方式 | 2026-11-21 已定：网页互动体验，Cloudflare Pages 静态托管（D-003 / D-005）。规则要求「在目标平台稳定运行」并「按视频所示工作」[1] | [1] | CLOSED |
| **D-04** | 技术栈 | 2026-11-21 已定：Vite + TypeScript + Canvas 2D + 可降级 WebGL 特效层（D-005） | 必须用 Kiro 构建 [1] | CLOSED |
| **D-05** | 个人参赛还是组队（≤3 人） | 规则允许两者；影响 Representative、奖金分配、学生奖资格 | [1]；邮件 uid 7853 | OPEN |
| **D-06** | 是否申报 bonus 奖项（Startup / Student / Ghost of Kiroween Past / Kiro Crew / Best Demo / Blog / Social Blitz） | 各 bonus 有额外材料要求，需提前准备；表单须填 bonus category | [1][2] | OPEN |
| **D-07** | 何时建公开 GitHub 仓库、选哪个开源许可证 | 2026-11-21：许可证已定 MIT（D-006），`LICENSE` 已写；本地已 `git init`。**公开仓库何时建仍待 Alex 确认**。根目录须含 `/.kiro` 且不得进 `.gitignore`（已用 `git check-ignore` 确认未被忽略） | [1][2] | IN PROGRESS |
| **D-08** | 演示视频的录制与 YouTube 上传 | 须 < 3 分钟、公开可见、展示真实运行、无无授权版权素材 | [1] | OPEN |
| **D-09** | "how Kiro was used" 说明怎么写 | 评审 Technological Implementation 20%，官方列了可写点（specs / steering / hooks / custom agents / MCP / PBT / powers） | [1] | OPEN |
| **D-10** | 提交材料直接用英文，还是中文正文 + 英文翻译 | 规则要求所有材料英文或附全套英文翻译 | [1] | OPEN |

## C. 已关闭 / 已确认（不重复列入待办）

- 参赛类别 = Costume Contest（已核实 [1] + Alex 陈述 + 邮件 uid 7886 显示首次申请因未写类别被拒、后重新申请获批）
- 已注册（邮件 uid 7853）
- 4,000 credits 已批准发放（邮件 uid 7952）—— 但「已兑换」仍是 Q-02
- 提交截止 2026-12-04 14:00 PT（[1]，无延期）
- 仓库根目录须含 `/.kiro` 且不得进 `.gitignore`（[1][2]）

## 来源

[1] https://kiroween.devpost.com/rules
[2] https://kiroween.devpost.com
[5] https://kiroween.devpost.com/details/faqs
[6] https://kiroween.devpost.com/updates
[7] https://kiroween.devpost.com/resources
[8] https://kiroween.devpost.com/details/credit-info
[9] https://kiroween.devpost.com/forum_topics
