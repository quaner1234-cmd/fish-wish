# Technology Stack — 状态：已定（2026-11-21，D-005）

## 技术栈

- Vite + TypeScript，不用 UI 框架；包管理用 npm。
- 主渲染 Canvas 2D；特效用一层可降级的 WebGL canvas（无 WebGL 或 reduced-motion 时不画）。
- 文字用 DOM；全部声音用 Web Audio API 程序合成，没有音频文件（D-012，撤销 D-009 的配音）。
- 测试：Vitest + fast-check。
- 托管：Cloudflare Pages，`wrangler pages deploy dist` 手动发布。
- 细节见 `.kiro/specs/urn-experience/design.md`。改动技术栈前先记进 `decisions/DECISIONS.md` 并经 Alex 确认。

## 已核实的外部约束

- 作品必须 "using Kiro (IDE, CLI, Web, and/or Kiro Crew)" 构建；"Insufficient use of Kiro will result in disqualification at the Judges' sole discretion."[1]
- 提交需要公开 GitHub 仓库（**不是 GitLab / BitBucket**），公开、开源，且含可被 GitHub 识别的开源许可证文件。[1][2]
- 仓库根目录必须含 `/.kiro`（specs / hooks / steering），且 `/.kiro` 不得进 `.gitignore`。[1][2]
- 需提供可运行的 App URL；若需登录，须在 Devpost 提交表单里给评委提供凭据与说明。[1]
- 需一段 < 3 分钟、公开可见于 YouTube 的演示视频。[1]
- 需一份 "how Kiro was used" 说明，评审会看是否用到了 specs / steering / hooks / custom agents / MCP / PBT / Kiro powers 等。[1]
- 官方规则明确：Kiro 的功能、AI 模型可用性可能因地区而异，参赛者须自行查阅并遵守 Regional Restrictions（https://kiro.dev）。**本机所在区域的可用性待核实**，见 `context/open-questions.md` Q-01。[1]

## 本机环境

- 实测细节（路径、代理、各工具版本）只记在 `context/dev-environment.md`，该文件只留本地，不进公开仓库。
- 已实际跑通（2026-11-22）：Node 24 + npm 11 下 `npm test`、`npm run build`；`wrangler pages deploy` 发布到 Cloudflare Pages。
- 网络环境可能让个别 HTTPS 抓取失败；遇到时看 `context/dev-environment.md`，不要改系统代理设置。

## 来源

[1] https://kiroween.devpost.com/rules
[2] https://kiroween.devpost.com
