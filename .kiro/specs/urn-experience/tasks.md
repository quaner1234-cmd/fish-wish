# Implementation Plan — `urn-experience`

> 状态：v0.4，2026-11-22（北京时间）。依据 `requirements.md` v0.5 与 `design.md` v0.5。
> 截止：2026-12-04 14:00 PT（北京时间 12-05 06:00）。
> 标 ⚑ 的任务需要 Alex 拍板或亲自操作。
> 2026-11-21 Alex："这不算个大项目，你甚至后面能直接做完，不需要停。" 所以 1–16 一次做完，审阅放在之后。

## 进度

| 日期（北京时间） | 里程碑 | 状态 |
| --- | --- | --- |
| 11-22 | 五幕完整可玩，预览地址上线 | 完成：https://urn-experience.pages.dev（旧预览，保留） |
| 11-22 | Alex 第一轮体验意见：改为故事向 | 完成：https://fish-wish.pages.dev |
| 11-22 | Alex 第二轮意见：说明挪到结尾、第四幕动起来、配音 | 完成（同一地址） |
| 11-22 | Alex 第三轮意见：不用 3D；盖子图案跳变、瓮里为什么有光；去掉配音 | 完成（同一地址；D-011 ~ D-013） |
| 11-22 | Alex 第四轮意见：结尾小鱼游起来、瓮里有个蜷着的孩子；Alex 看预览后确认"很棒就这样" | 完成（同一地址；D-014、D-015） |
| 待定 | 交给其他 agent：提交前核对、演示视频、Devpost 材料（交接 prompt 见本轮对话） | 未开始 |
| 待定 | ⚑ Alex 体验故事版 | 未开始 |
| 待定 | ⚑ 最终定名（"Fish Wish" 为暂定） | 未开始 |
| 12-01 前 | ⚑ 演示视频 + 提交材料 | 未开始 |
| 12-03 前 | ⚑ 提交 Devpost（留一天余量） | 未开始 |

## Tasks

- [x] 1. 项目骨架：Vite + TypeScript（npm）、Vitest、fast-check；`dev` / `check` / `typecheck` / `test` / `build`；MIT 许可证（Alex 2026-11-21 确认）
  - [x] 公开 GitHub 仓库 https://github.com/quaner1234-cmd/fish-wish （Alex 2026-11-22 同意）；`context/reference-emails.md`、`context/dev-environment.md` 含邮箱与本机路径，只留本地
- [x] 2. 核心循环与输入：`input.ts`、`lamp.ts`、`machine.ts`（属性测试）、`text.ts`、`motion.ts`
- [x] 3. 那张脸：`art/face.ts`、`art/pottery.ts`
  - [ ] ⚑ 3.3 Alex 审脸；截图在 `_scratch/ego/qa-20261122/`（06、16）
- [x] 4. 文字与事实检查：`strings.json`、`scripts/check-facts.mjs` + 测试、hook `.kiro/hooks/fact-check-on-save.json`
- [x] 5. 开始画面
- [x] 6. 第一幕 dig（覆盖率属性测试）
- [x] 7. 第二幕 inside
- [x] 8. 第三幕 hole
- [x] 9. 第四幕 ascent（竖屏时镜头会转向墓地）
- [x] 10. 第五幕 again 与资料来源页
- [ ] 11. ⚑ Alex 完整体验一遍并给意见
- [x] 12. 声音（Web Audio 程序合成）
  - [ ] ⚑ 人耳试听：未做，只验证了静音开关与状态
- [x] 13. WebGL 特效层（reduced-motion 时关闭，已验证）
- [x] 14. 无障碍
  - 只用键盘走完整流程（2026-11-23，Chromium/ego lite，脚本 `_scratch/qa/keyboard.mjs`，日志 `_scratch/qa/keyboard/log.txt`）：Tab→Enter 开始；方向键移动灯、Space 刷土；P 暂停（遮罩出现/恢复）、M 静音（`aria-pressed` false→true）；第一幕密集刷 48 秒未达 70% 阈值，最后由 R2.5 的 90 秒兜底自动清土进第二幕；第二幕方向键扫过脸触发 `thereYouAre` 等四句并自动进第三幕；第三幕把灯停在孔上触发台词后 Enter 继续；第四幕按自身时间线推进；第五幕到结尾卡，Enter 使卡片 `ready`；Tab 到 `btn-sources` 打开、Esc 关闭 "What is real"。全程 js-errors 为空
  - reduced-motion（Chromium emulated，脚本 `_scratch/qa/reduced.mjs`，日志 `_scratch/qa/reduced/log.txt`）：`matchMedia('(prefers-reduced-motion: reduce)')`=true；拉远更快（1.2s），经 Skip 走完五幕到结尾卡，结尾 reduced 600ms 即 `ready`；光鱼/结尾帧在 `_scratch/qa/reduced/`
  - 文字对比度仍按配色估算约 8:1，未用工具测
  - 未证实：仅靠键盘刷土能否自己刷到 70%（本次由 90 秒兜底过关）
  - 真机测试：Alex 2026-11-24 确认 OK（不再列为 Agent 侧未测）；Safari 由 Alex 真机覆盖
- [x] 20. 开头去掉说明与内容提示，"inspired by" 改为结尾卡片（2026-11-22，D-008）
- [x] 21. 配音（2026-11-22，D-009）：MiMo-V2.5-TTS 生成 18 句（Chloe）；`Narrator` 队列让台词一句接一句
  - [x] 21.1 Alex 试听后决定去掉："听着不够好"（D-012）
  - [x] 21.2 Q-10 不再需要：配音已删除（D-012）
- [x] 23. 去掉配音（2026-11-22，D-012）：删除 `public/voice/`、`src/content/voice.json`、MiMo 与配音脚本和 `voice:*` 命令；`Narrator` 改为按字数估算时长，每句配一声合成气声；"What is real" 页的声音说明改为 "Every sound is synthesized in your browser… There are no recordings."；Narrator 测试改写
- [x] 24. 光从小孔进入瓮里（2026-11-22，D-013）：盆的俯视图画出小孔（与瓮内左右镜像，`tests/hole.test.ts`）；第一幕说完后孔上有微光，灯停上去或 8 秒后灯熄进孔里、镜头推近；第二幕从孔开始拉远，光停在孔边等用户移动；第二、三幕的光改小、改稳、暖色变淡（`SOUL`）
  - [x] 桌面 1396×894（停在孔上）与 390×844（等 8 秒）两条路径用 ego lite 逐帧截图检查；第三幕的晨光落在画出的孔上
  - [ ] ⚑ 24.1 Alex 体验新的第一幕结尾和第二幕开头
- [x] 25. 结尾的光鱼（2026-11-22，D-014）：最后一句时，脸嘴边衔着的四条鱼亮起，各游出一条光鱼绕盆，游到结尾卡片后面；画上的鱼不动。先发预览分支 `ending-fish`
  - [x] 桌面 1396×894 与 390×844 逐帧截图检查（`_scratch/ego/qa-fish/`）
  - [x] 25.1 Alex 看过预览后确认（"很棒就这样"），已合并上线
- [x] 26. 第四幕瓮里的孩子（2026-11-22，D-015）：剖面里的瓮中有一个蜷着的孩子，姿势像在母亲肚子里，只画成暖光剪影；母亲跪下时更亮。同在预览分支 `ending-fish`
  - [x] 单独的形状测试页与第四幕逐帧截图，桌面与 390×844（`_scratch/baby/`）
  - [x] 26.1 Alex 看过预览后确认（"很棒就这样"），保持光的剪影，已合并上线
- [x] 22. 第四幕动画与母亲剪影（2026-11-22，D-010）：火光、火星、烟、草、星、日出、远山视差、晨雾、飞鸟、根须、门洞与坡道、镜头推近；母亲添火、走出门、跪在罐子旁
  - [ ] ⚑ 22.1 Alex 审第四幕的人物动作
- [x] 19. 故事向改写（2026-11-22，D-007）：脸对"你"说话（`strings.json` 的 `story`），台词逐字浮现并伴轻气声；史实移到结尾 "What is real" 页；事实检查只查 `real`；作品名暂定 "Fish Wish"；Pages 新项目 `fish-wish`；GitHub 仓库 `quaner1234-cmd/fish-wish`
- [~] 15. 性能与跨浏览器
  - JS 24 KB gzip；没有音频文件；`dist/` 共约 73 KB（预算 150 KB / 3 MB）
  - 第四幕每帧绘制约 1 ms（`?perf`，2026-11-22）
  - 每帧 JS 耗时 < 4 ms（`?perf` 实测）。自动化浏览器里只有约 20 fps，但同一环境下一个空的绘图循环只有 8 fps，判断是自动化窗口限帧，不是作品本身；**真实 60 fps 未验证**
  - Chromium（ego lite）桌面+手机尺寸模拟、Firefox（Playwright）已走过；真机 Alex 2026-11-24 确认 OK
  - Firefox 冒烟（2026-11-23，Playwright Firefox 155，脚本 `_scratch/qa/firefox_qa.py`）：HTTP 200、标题 Fish Wish、canvas 存在、bundle `assets/index-BFGAqUZy.js` 正常加载；键盘 Enter 开始进入 dig，Skip 走到 again，结尾可见；pageerror / console.error 均为空；rAF 采样约 35 fps（headless，仅供参考，非真实 60 fps 证据）
  - Safari 由 Alex 真机覆盖（Alex 2026-11-24 确认真机 OK）；真实 60 fps 仍未由 Agent 验证
- [x] 16. 发布：Cloudflare Pages 项目 `fish-wish`，`npm run build` 后 `npx wrangler pages deploy dist --project-name=fish-wish --branch=main`（旧项目 `urn-experience` 未删）
- [~] 17. ⚑ 演示视频（D-08）：< 3 分钟，开头用第二幕和第五幕；先读本机共享的视频工作流说明（不在本仓库）
  - 英文分镜/字幕稿：`submission/demo-video-script.md`（7 拍，目标 ~2:20，无配音，仅字幕）
  - 真实录屏（Playwright Chromium，实跑 https://fish-wish.pages.dev/?perf）：`_scratch/video/fish-wish-demo.mp4`
    - 时长 152.57 s（2:32），1280×720，H.264，30 fps，约 11 MB；**无音轨**（Playwright 视频不采集音频，按规则"静音+烧录字幕"合规；作品自带声音可由 Alex 录屏时另采）
    - 流程：开头用作品自身标题页（Fish Wish / Begin）→ 第一幕 → 第二幕（脸+字幕）→ 第三幕孔 → 第四幕上升（瓮中光的孩子）→ 第五幕（光鱼+末句）→ 结尾卡（The people are imagined. The basin is real.）→ 4.5 s 结尾字幕卡
    - 已完成：录制、剪辑、烧录英文解释字幕、结尾卡；脚本 `_scratch/video/record_final.py`、字幕文件 `_scratch/video/caps/*.txt`
    - 2026-11-24 Alex 确认"视频OK"，并授权公开上传到 YouTube（D-018）
    - 未完成：实际上传并回填公开链接
- [~] 18. ⚑ 提交材料：公开仓库、Devpost 英文说明、how Kiro was used、既有作品披露（Q-09）；提交前按 Q-03 重核规则
  - 英文材料已放 `submission/`：`devpost.md`（tagline + 8 段 + 既有作品披露 + 史实措辞）、`README.md`（索引）、`demo-video-script.md`
  - 类别 = Costume Contest；bonus 留空待 Alex（D-06/Q-06）；最终名称 = Fish Wish（Alex 2026-11-24 定，D-016）；材料全英文（D-10 CLOSED）
  - Alex 2026-11-24 授权提交表单（D-018）；提交前仍需 Alex 指定 D-05（个人/组队）、D-06（bonus）、Q-01（资格）、Q-05（Kiro 账号信息）——不得代填；Q-03 规则已复核（2026-11-23）
