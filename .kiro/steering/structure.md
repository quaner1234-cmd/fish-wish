# Project Structure — 探索工作区布局

## 当前结构（探索阶段；尚无应用源码）

```
D:\Projects\kiroween-2026\
├── AGENTS.md                       # Kiro 必读入口（始终加载）
├── README.md                       # 人类导航入口
├── .gitignore                      # 明确不含 .kiro
├── index.html / vite.config.ts / tsconfig.json / package.json / LICENSE (MIT)
├── src\                            # 应用源码，布局见 design.md §2
├── scripts\                        # check-facts.mjs + fact-check-lib.mjs（事实检查）
├── tests\                          # Vitest + fast-check
├── _scratch\                       # 本地临时文件（浏览器脚本、截图、第三方素材），已 gitignore
├── .kiro\
│   ├── hooks\
│   │   └── fact-check-on-save.json # 保存文案或事实表时运行事实检查
│   ├── specs\
│   │   └── urn-experience\
│   │       ├── requirements.md     # 需求（已通过）
│   │       ├── design.md           # 设计 v0.2
│   │       └── tasks.md            # 任务与进度
│   └── steering\
│       ├── product.md              # 产品概览 / 目标 / 待定项
│       ├── tech.md                 # 技术栈（未定）+ 本机环境
│       ├── structure.md            # 本文件
│       ├── contest-rules.md        # 影响日常开发的规则要点
│       └── collaboration.md        # 与 Kiro 的协作约定
├── context\
│   ├── competition-brief.md        # 项目背景 / 时间线 / 已确认事实
│   ├── rules-verified.md           # 官方规则：已核实 / 待核实
│   ├── dev-environment.md          # 实测开发环境（仅本地，gitignore）
│   ├── reference-emails.md         # Gmail 参考邮件索引（仅本地，gitignore）
│   ├── open-questions.md           # 待核实 + 待决定主清单
│   ├── research-urn-burial.md      # 史实核对（F1–F13），上屏文字的依据
│   └── evidence\
│       ├── kiroween-rules-2026-11-13.txt   # 官方规则原文快照
│       └── SHA256SUMS.txt                  # 快照哈希
├── ideas\
│   └── IDEAS.md                    # 创意记录
└── decisions\
    └── DECISIONS.md                # 决策记录
```

## 结构性硬约束（已核实）

- 未来参赛仓库的**根目录必须有 `/.kiro` 目录**，用于展示 Kiro 的 specs、hooks、steering 使用情况；`/.kiro` 及其子目录**不得加入 `.gitignore`**，否则可能被取消资格。[1][2]
- 本工作区的 `.kiro/steering/` 是随仓库一起提交的上下文，不是临时文件。
- 若使用 Kiro spec-driven development，spec 位于 `.kiro/specs/<feature>/`，三阶段文件为 `requirements.md` → `design.md` → `tasks.md`。[3]
- Kiro 的 steering 基础文件为 `product.md` / `tech.md` / `structure.md`，默认每次交互都加载；`AGENTS.md` 始终加载且不支持 inclusion mode；工作区 steering 优先于全局 steering。[4]

## 约定

- 文档正文用中文；代码、命令、文件名、技术术语保持英文。
- 官方规则原文引用保留英文，避免翻译引入歧义。
- 规则性内容只写在 `context/rules-verified.md`（单一事实来源），其他文件引用它而不是各自复述。
- 待核实项只维护在 `context/open-questions.md`（单一清单），避免多处不一致。
- 应用源码布局见 `.kiro/specs/urn-experience/design.md` §2。界面文字只放 `src/content/strings.json`；每条叙述的 `facts` 必须指向 `context/research-urn-burial.md` 的 F#。

## 来源

[1] https://kiroween.devpost.com/rules
[2] https://kiroween.devpost.com
[3] https://kiro.dev/docs/specs
[4] https://kiro.dev/docs/steering
