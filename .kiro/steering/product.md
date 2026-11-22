# Product Overview — Kiroween 2026 参赛作品

## 当前状态：故事版已上线（2026-11-22，D-007）

- **作品名**：暂定 "Fish Wish"（D-007）。叙述者是盆上那张脸，它把用户当成瓮里的孩子；人物和台词是虚构，史实在结尾 "What is real" 页。
- **方向**（D-003）：一个网页互动叙事体验。用户在黑暗中发掘出半坡人面鱼纹彩陶盆盖着的婴儿瓮棺，进入瓮内看到盆内壁的脸，再经由小孔和瓮旁的房子，明白这是父母的爱。不是有输赢的游戏。
- **基调**：留下的是爱；恐怖是工具，不是目的。不出现遗体、骨骼、血腥或跳出式惊吓。
- **spec**：`.kiro/specs/urn-experience/`（需求 v0.5，设计 v0.5，进度在 `tasks.md`）；史实依据：`context/research-urn-burial.md`。"What is real" 页和结尾卡片里的史实句必须能对应到其中一条 F#；脸的台词是虚构，不需要出处。
- **开头与结尾**（D-008）：开始画面不放项目说明和内容提示；"inspired by… The people are imagined. The basin is real." 是结尾卡片。
- **没有配音**（D-012，撤销 D-009）：脸只用字幕说话，下面配一声合成气声；全部声音都在浏览器里合成。
- **小孔是进出的门**（D-013）：第一幕的灯熄进盆上的小孔，第二幕从同一个孔拉开；瓮里的光是"你"，比油灯小、稳。第三幕晨光从这个孔透进来，第四幕从这个孔出去。
- **第四幕**（D-010）：程序绘制加动画，母亲添火后走出门跪到罐子旁。不用 3D（D-011）。
- **界面语言**：只用英文（D-004）。
- **技术栈与托管**：已定（D-005），见 `tech.md`。
- **许可证**：MIT（D-006）。地址：https://fish-wish.pages.dev ；仓库：https://github.com/quaner1234-cmd/fish-wish
- **仍未定**：最终作品名（"Fish Wish" 是暂定）、组队、bonus。不要替 Alex 选。

## 参赛目标（已核实）

- 赛事：Kiroween 2026，Sponsor 为 Amazon Web Services，Administrator 为 Devpost。[1]
- 报名类别：**Costume Contest**。[1]
- 官方对该类别的原文要求："Build any app but show us a haunting user interface that's polished and unforgettable. Bring in spooky design elements that enhance your app's function."[1][2]
- 由此得到的产品级理解（基于原文，非推测）：**允许任何类型的 App**；关键在界面，要求是 "haunting / polished / unforgettable"；并且诡异设计元素必须**增强应用功能**，不是纯装饰。
- 全局要求："Entrants must build a working software application using Kiro"。[1] 即必须真的能安装、运行、按描述工作。

## 评审标准（已核实，Stage Two 五项等权各 20% [1]）

| 维度 | 权重 | 对产品的含义 |
| --- | --- | --- |
| Potential Impact | 20% | 是否为真实受众解决真实问题，是否有人真的会用 |
| Technological Implementation | 20% | 是否深入、有策略地使用 Kiro |
| Design | 20% | 是否完整、连贯、精致、有意图的产品体验，而非技术 demo |
| Innovation / Idea | 20% | 概念是否新颖、是否与既有产品不同 |
| Presentation | 20% | 视频是否端到端演示可用，pitch 是否讲清问题/受众/价值 |

> Costume Contest 虽以界面为主题，但 Design 只占 20%；界面之外仍需真实功能与清晰叙事。

## 硬性约束（已核实）

1. 使用 Kiro 构建；使用不足会被取消资格（Judges 自行裁定）。[1]
2. 公开 GitHub 仓库根目录必须含 `/.kiro`，且不得把 `/.kiro` 加入 `.gitignore`。[1][2]
3. 项目须在 Submission Period 开始（2026-10-30 09:00 PT）之后新建；既有代码须披露。[1]
4. 提交截止 2026-12-04 14:00 PT，无延期。[1]

## 待决定（不要替 Alex 猜）

- 项目主题与产品方向 → `context/open-questions.md` D-01
- 目标用户与要解决的问题 → D-02
- 目标平台 → D-03
- 技术栈 → D-04
- 个人参赛还是组队 → D-05
- 是否申报 bonus 奖项 → D-06

## 来源

[1] https://kiroween.devpost.com/rules
[2] https://kiroween.devpost.com
