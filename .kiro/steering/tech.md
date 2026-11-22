# Technology Stack — 状态：已定（2026-11-21，D-005）

## 技术栈

- Vite + TypeScript，不用 UI 框架；包管理用 npm。
- 主渲染 Canvas 2D；特效用一层可降级的 WebGL canvas（无 WebGL 或 reduced-motion 时不画）。
- 文字用 DOM；声音用 Web Audio API 程序合成，不用外部音频。
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

## 本机已检测环境（2026-11-13 实测，详见 `context/dev-environment.md`）

| 项 | 实测值 |
| --- | --- |
| OS | Windows 11（MSYS_NT-10.0-26300，WINDOWS-OMEN-HP） |
| Kiro | 1.4.13，`D:/Kiro/bin/kiro`；`~/.kiro/` 已存在 |
| Node / npm | v24.14.1 / 11.11.0 |
| pnpm / bun | 12.4.2 / 1.4.2（yarn 未安装） |
| Python | 默认 `python` / `python3` = 3.14.9；系统 Python 3.12 位于 `C:/Users/quane/AppData/Local/Programs/Python/Python312/`（pip 25.0.1、keyring、playwright 在此环境） |
| uv | 0.12.18 |
| Docker | 29.8.1 (Docker Desktop) |
| VS Code | 1.141.0，`D:/Microsoft VS Code` |
| git | 2.53.0.windows.3 |
| 全局前端 CLI | vite / next / expo / create-vite 均未全局安装；`wrangler` 已全局安装 |

## 选型时注意

- 默认 `python` 是 **3.14.9**，较新；部分工具链可能尚未兼容。系统 **Python 3.12** 才装有 pip / keyring / playwright。需要装包时优先用 3.12 或 `uv` 管理独立环境，并在决策记录里写明。
- 本机 Clash TUN 生效：公网域名 DNS 解析到 `198.18.x.x`；`curl` 可用，Hermes `web_extract` 会因「私有地址」守卫被拒；个别 HTTPS 抓取会报 `CRYPT_E_REVOCATION_OFFLINE`，`curl --ssl-no-revoke` 可绕过。这会影响依赖下载/在线校验，属于环境事实而非项目约束。
- 以上为 `--version` / `command -v` 探测结果，**未做实际构建或运行验证**。选定技术栈后须跑一次真实构建再下结论。

## 来源

[1] https://kiroween.devpost.com/rules
[2] https://kiroween.devpost.com
