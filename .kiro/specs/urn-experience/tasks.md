# Implementation Plan — `urn-experience`

> 状态：v0.3，2026-11-22（北京时间）。依据 `requirements.md` v0.4 与 `design.md` v0.4。
> 截止：2026-12-04 14:00 PT（北京时间 12-05 06:00）。
> 标 ⚑ 的任务需要 Alex 拍板或亲自操作。
> 2026-11-21 Alex："这不算个大项目，你甚至后面能直接做完，不需要停。" 所以 1–16 一次做完，审阅放在之后。

## 进度

| 日期（北京时间） | 里程碑 | 状态 |
| --- | --- | --- |
| 11-22 | 五幕完整可玩，预览地址上线 | 完成：https://urn-experience.pages.dev（旧预览，保留） |
| 11-22 | Alex 第一轮体验意见：改为故事向 | 完成：https://fish-wish.pages.dev |
| 11-22 | Alex 第二轮意见：说明挪到结尾、第四幕动起来、配音 | 完成（同一地址） |
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
- [x] 14. 无障碍：只用键盘开始、刷土、暂停、静音已验证；reduced-motion 下特效层关闭已验证；文字对比度按配色估算约 8:1，未用工具测
- [x] 20. 开头去掉说明与内容提示，"inspired by" 改为结尾卡片（2026-11-22，D-008）
- [x] 21. 配音（2026-11-22，D-009）：MiMo-V2.5-TTS 生成 18 句（Chloe），机器转写逐句核对后选用；ffmpeg 混入随幕递减的"戏服"；`Narrator` 队列让字幕和配音同步、暂停续播、跳过淡出；Narrator 单元测试与属性测试
  - [ ] ⚑ 21.1 Alex 人耳试听（Kiro 听不了）：声音是否够诡异、最后是否够温柔、有没有读错
  - [ ] ⚑ 21.2 Q-10：核实 MiMo 生成音频能否公开使用
- [x] 22. 第四幕动画与母亲剪影（2026-11-22，D-010）：火光、火星、烟、草、星、日出、远山视差、晨雾、飞鸟、根须、门洞与坡道、镜头推近；母亲添火、走出门、跪在罐子旁
  - [ ] ⚑ 22.1 Alex 审第四幕的人物动作
- [x] 19. 故事向改写（2026-11-22，D-007）：脸对"你"说话（`strings.json` 的 `story`），台词逐字浮现并伴轻气声；史实移到结尾 "What is real" 页；事实检查只查 `real`；作品名暂定 "Fish Wish"；Pages 新项目 `fish-wish`；GitHub 仓库 `quaner1234-cmd/fish-wish`
- [~] 15. 性能与跨浏览器
  - JS 24 KB gzip，配音约 870 KB，全部资源约 0.9 MB（预算 150 KB / 3 MB）
  - 第四幕每帧绘制约 1 ms（`?perf`，2026-11-22）
  - 每帧 JS 耗时 < 4 ms（`?perf` 实测）。自动化浏览器里只有约 20 fps，但同一环境下一个空的绘图循环只有 8 fps，判断是自动化窗口限帧，不是作品本身；**真实 60 fps 未验证**
  - 只在 Chromium（ego lite）桌面和手机尺寸模拟下走过；Firefox、Safari、真机未测
- [x] 16. 发布：Cloudflare Pages 项目 `fish-wish`，`npm run build` 后 `npx wrangler pages deploy dist --project-name=fish-wish --branch=main`（旧项目 `urn-experience` 未删）
- [ ] 17. ⚑ 演示视频（D-08）：< 3 分钟，开头用第二幕和第五幕；先读本机共享的视频工作流说明（不在本仓库）
- [ ] 18. ⚑ 提交材料：公开仓库、Devpost 英文说明、how Kiro was used、既有作品披露（Q-09）；提交前按 Q-03 重核规则
