# Design Document — `urn-experience`

> 状态：v0.3，2026-11-22。故事向改写（D-007）：脸的台词在 `strings.json` 的 `story`，史实句在 `real`。依据 `requirements.md` v0.2（下文用 R#.# 引用）与 D-005（技术栈）。
> 史实依据：`context/research-urn-burial.md`（F#）。

## 1. 技术选型（D-005，Alex 2026-11-21 选定方案 C）

| 层 | 选择 | 理由 |
| --- | --- | --- |
| 构建 | Vite + TypeScript，不用 UI 框架 | 纯静态输出；体验是一块画布加少量文字，不需要组件框架 |
| 主渲染 | Canvas 2D | 灯光遮罩、刷土、剖面图都是 2D 合成操作；手机上稳定 |
| 特效层 | 单独一块 WebGL canvas，叠在主画布上 | 只做烟尘、光晕、胶片颗粒。**可降级**：没有 WebGL、或开启 `prefers-reduced-motion` 时直接不画，体验仍完整 |
| 文字层 | DOM（HTML/CSS） | 清晰、可读屏、对比度可控，满足 R9 |
| 声音 | Web Audio API 程序合成 | 无版权问题（R8.3），体积为零 |
| 测试 | Vitest；逻辑部分用 fast-check 做属性测试 | 覆盖率计算、状态机、文案事实检查都是纯函数，适合自动测试 |
| 托管 | Cloudflare Pages，`wrangler pages deploy` 手动发布 | Alex 已有账号和发布经验；静态、免登录（R11.1） |

## 2. 整体结构（v0.2：按实际实现更新）

```
index.html
src/
  main.ts                 # 画布、灯光合成、主循环（dt 上限 50ms）、场景切换与淡入淡出、DOM 控件
  core/
    machine.ts            # 场景顺序与纯函数 reducer：start → dig → inside → hole → ascent → again
    input.ts              # 指针 / 触摸 / 键盘 → 统一的灯目标位置与"按下"状态；P / S / M / Enter
    lamp.ts               # 灯：平滑跟随、闪烁、"打颤"
    coverage.ts           # 刷土覆盖率（纯函数）
    text.ts               # DOM 文字层：叙述与提示，aria-live
    audio.ts              # Web Audio 程序合成；静音存 localStorage
    motion.ts             # prefers-reduced-motion
    fx-webgl.ts           # 可降级的特效层
    rng.ts                # 固定种子随机数与噪声
  scenes/
    start.ts dig.ts inside.ts hole.ts ascent.ts again.ts
    urnview.ts            # 第二、三、五幕共用的瓮内视角与"看见过"记忆图
    types.ts              # Scene 接口、Env、Cues（按场景时间触发，暂停即停）
  art/
    face.ts               # 人面鱼纹：手写 Path2D，单一来源
    pottery.ts            # 盆内壁、瓮壁、发掘俯视图、泥土，全部程序生成
  content/
    strings.json          # 全部英文文字（含作品名 ui.title，唯一一处）；叙述条目带 facts
scripts/
  fact-check-lib.mjs      # 事实检查（纯函数）
  check-facts.mjs         # CLI：npm run check
tests/                    # Vitest + fast-check
```

文字改用 JSON（而不是 TS）是为了让 Node 脚本和 Kiro hook 不经编译就能读取。

### 场景接口

```ts
interface Scene {
  readonly exitFade: "black" | "pale" | "none";
  enter(env: Env): void;
  update(dt: number, env: Env): "stay" | "next";
  render(g: CanvasRenderingContext2D, env: Env): void; // 画出"全亮"的场景
  lighting(env: Env): Lighting;                         // 环境光、灯强度、暖度、上下附加层
  fx(env: Env): Fx;
  hint(env: Env): { x: number; y: number } | null;     // 空闲提示位置
  exit(env: Env): void;
}
```

`main.ts` 把场景画进离屏层，再用灯的径向渐变（`destination-in`）只留下光照到的部分。场景切换、暂停（R9.4）、跳过（R9.4）、空闲提示（R1.5）都在 `main.ts` 统一处理；场景之间只共享 `UrnView`。

## 3. 灯（R1）

- 每帧先把场景画进离屏画布，再盖一层近黑色；用 `destination-out` 画一个径向渐变，挖出灯照区域（R1.4 柔边）。
- 灯位置用指数平滑跟随目标位置，避免抖动；键盘方向键按速度移动目标（R1.3）。
- 灯有轻微的火光闪烁（半径 ±3%）；reduced-motion 时关闭闪烁。
- 空闲 10 秒：在下一个目标附近画一个缓慢呼吸的微光（R1.5），不弹文字。

## 4. 五幕的实现

### 4.1 dig（R2）

- 泥土是一张离屏画布（程序生成的土层纹理）。按下并拖动时，在灯照范围内用 `destination-out` 圆刷擦除，擦掉的部分不再恢复（R2.2）。
- 覆盖率：在目标区域（瓮口与盆）上取 64×64 的低分辨率采样，统计透明像素比例；≥ 70% 视为完成（R2.3）。采样每 200ms 做一次，不是每帧。
- 90 秒兜底：开始自动擦除剩余区域，约 3 秒完成（R2.5）。
- 画面只有陶器和土，没有骨骼（R2.4、R12.1）。

### 4.2 inside（R3）

- 视角：从瓮底往上看，画面中心是盆的内壁（一个圆），四周是瓮壁的弧形暗部。
- 那张脸由 `art/face.ts` 的 Path2D 绘制，纹样依 F2：圆脸、头顶尖状物与鳍形装饰、额头半黑、嘴边两条鱼、耳边各一条小鱼。纹样不参照任何博物馆照片的构图来"描"，按文字描述和公开的纹样结构自己画（R3.4）。
- 渐进揭示：维护一张"看见过"的低分辨率图。灯照过的地方留下很淡的残影，所以脸是在用户自己的照射下一块块拼出来的，而不是一下子出现（R3.2）。
- 不安感来源：极暗的底、慢速揭示、低频底噪在脸被照亮时轻微升高。没有巨响、闪白、跳出（R3.3）。
- 脸的 60% 被看见后，DOM 文字层出现一句事实（F2）（R3.5）。

### 4.3 hole（R4）

- 盆上靠近脸的位置出现一个透进来的小光点（R4.1）。
- 灯中心进入光点半径后停留 1 秒，显示文字：盆上常有这样的小孔（F8）；两种说法（F9），各自标 "One reading:"（R4.2、R4.3）。
- 用户点击或停留 6 秒后进入下一幕（R4.4）。

### 4.4 ascent（R5）

- 画面切成考古剖面图：瓮在底部，镜头沿竖直方向向上移动，穿过几层土（用不同颗粒和颜色表示），到达地面（R5.1）。
- 地面：瓮旁是一座圆形半地穴式茅草屋（F14）；远处村外有一片墓地（F5、F14）（R5.2）。
- 光线从冷暗逐渐变成清晨的暖光（R5.4）。文字说明小孩的瓮棺多埋在住处旁边，成人葬在村外（F5）（R5.3）。
- reduced-motion：镜头上移改为三张画面淡入淡出。

### 4.5 again（R6）

- 回到瓮内视角，调用同一个 `face.ts` 绘制函数和同一组参数，纹样零改动（R6.1）。只改变光：暖、亮、柔。
- 文字落在父母的爱上，并说明纹样含义无定论（F10）（R6.2）。
- 结尾两个按钮：Experience again / Sources（R6.3）。

## 5. 文字、声音、无障碍

- **文字**：全部在 `content/strings.json`，英文（R10.1）。`story` 是脸的台词，通过 `speak()` 逐字浮现并伴一声很轻的气声（`audio.breath()`），样式为暖色斜体；`real` 是史实句，显示在开始画面和 "What is real" 页。叙述条目结构：`{ id, text, facts: string[] }`；界面文字（按钮等）不带 facts。
- **声音**（R8）：开始按钮按下后才创建 `AudioContext`（R8.1）。底噪用滤波噪声 + 低频正弦；刷土声用短促的带通噪声；没有人声。静音按钮常驻右上角，状态存 localStorage（R8.2）。所有信息都有文字，静音不影响理解（R8.4）。
- **无障碍**（R9）：`prefers-reduced-motion` 时运动系数降为 0.2、关闭闪烁和特效层（R9.1）；全部操作可用键盘完成：方向键移动灯，空格按住刷土 / 确认，P 暂停，S 跳过当前幕，M 静音（R9.2、R9.4）；DOM 文字对比度 ≥ 4.5:1（R9.3）。
- **开始画面**（R1.1）：作品名（来自 `strings.json` 的 `ui.title`，目前是占位名 "The Painted Lid"）、内容提示一行、声音说明、操作说明、Begin 按钮。

## 6. 事实检查（R7）

`scripts/check-facts.mjs`（逻辑在 `fact-check-lib.mjs`）在 `npm run check` 和 `npm run build` 前运行：

1. 读取 `context/research-urn-burial.md` 表格，得到每个 F# 及其"上屏方式"。
2. 只检查 `real` 里的史实句：`facts` 不能为空，且只能引用存在的 F#（R7.1）。`story` 里的台词是虚构，不要求出处，但仍受第 4 条禁用词约束。
3. 引用了"不上屏"的 F#（F12、F13）则失败（R7.2）。
4. 禁用词表：`Fuwa`、`Beibei`、`every basin` 等，命中则失败（R7.2、R7.4）。
5. 引用了标为"两说并存 / 无定论"的 F#（F9、F10）时，文字里必须含 "One reading"、"Another reading" 或 "No one knows"（R4.3）。
6. 结论标为"推断"的 F#（F11）不能被引用。

Kiro hook `.kiro/hooks/fact-check-on-save.json`：保存 `src/content/strings.json` 或事实表时自动运行这个检查。

## 7. 素材

- **纹样**：代码绘制（矢量），不用位图，保证第二幕与第五幕完全一致。
- **陶面、泥土、剖面、茅屋**：先用程序生成。若程序效果不够精致，再用 AI 生图补背景或纹理：
  - 途径：本机 Codex 生图，或火山方舟 Seedream（调用前按本机共享的 API 服务说明读余额、记流水；该说明不在本仓库）。
  - 提示词里不引用任何博物馆照片或具体馆藏图片；生成结果、提示词、工具和日期记在 `public/assets/SOURCES.md`。
  - 资料来源页注明哪些是 AI 生成的纹理（R7.3）。
- 不使用福娃、博物馆照片、讲解视频的画面和声音（R7.4）。

## 8. 性能预算（R11）

- 首屏 JS（gzip）≤ 150 KB；全部资源 ≤ 3 MB。
- 画布分辨率按 `devicePixelRatio` 缩放，上限 2。
- 静态层（泥土纹理、陶面、剖面背景）预先画进离屏画布，每帧只做合成。
- 目标：中端笔记本 60fps；手机上不低于 30fps。

## 9. 测试与验证

| 层 | 方法 |
| --- | --- |
| 纯逻辑 | Vitest：覆盖率计算、场景状态机转换、灯的平滑与边界 |
| 属性测试 | fast-check：任意输入序列下状态机不会跳过或倒退场景；刷土覆盖率单调不减 |
| 文案 | `check-facts.mjs`（§6） |
| 画面 | 用 ego lite 打开本地或预览地址，截取每幕关键帧，人工审看（脚本与截图放 `_scratch/`） |
| 跨浏览器 | 发布到预览地址后在 Chrome / Edge / Firefox 桌面与一台手机上走完整流程 |
| 无障碍 | 只用键盘走完一遍；开启 reduced-motion 走完一遍；检查对比度 |

## 10. 发布

- `npm run build` 输出 `dist/`；`wrangler pages deploy dist --project-name=<name>`。
- Pages 的 `*.pages.dev` 子域名由项目名决定，作品名未定（D-004）。开发期先用临时项目名 `urn-experience` 发预览；定名后用最终名称新建项目并发布正式地址。
- 正式地址须保持到 2027-01-29 评审期结束（R11.6）。
- 发布前读本机共享 playbook 的 Cloudflare 一节（不在本仓库）。

## 11. 风险

| 风险 | 应对 |
| --- | --- |
| 那张脸画得不够好，整件作品就塌了 | 脸是第一个要交给 Alex 审的画面；先做脸，再做其他幕 |
| "从怕到爱"的情绪转折不成立 | 先做出第二幕到第五幕的粗糙版本，完整走一遍再打磨 |
| 剖面图上升一幕显得像科普图 | 用光线和声音推动情绪；文字极少 |
| 时间：截止 2026-12-04 14:00 PT | 按 `tasks.md` 的里程碑走；特效层可以整体砍掉而不影响完整性 |
