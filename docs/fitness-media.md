# Fitness V1 动作库与素材

动作库位于 `src/fitness/catalog.json`，收录 36 个动作，覆盖 A–D 计划的全部 22 个不同动作与 14 个常见替代。推荐组数、次数来自 V1 计划；替代动作的默认目标由本站整理，替换时仍需用户确认。单侧动作在说明中明确按每侧计数。引体向上、俯卧撑与 Pallof Press 使用 `repsMin: 0, repsMax: 0` 表示记录实际次数；计时动作使用 `durationSeconds`。

## 来源与许可

图片来自 [Free Exercise DB](https://github.com/yuhonas/free-exercise-db)，固定为提交 `a859101d633a01c4a1a920d6a8ce41dabba0705f`。核验日期：2026-09-15。

- 上游 [README](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/README.md) 将其描述为 public-domain exercise dataset，并明确允许检出 JSON 和图片在本地使用。
- 上游 [LICENSE.md](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/LICENSE.md) 为 Unlicense；仓库没有为选入图片另列更严格的许可。
- 本地保留上游 `free-exercise-db-LICENSE.md` 与 `free-exercise-db-README.md`。上游 README 记载数据整理者 yuhonas 以及原始数据集作者 Ollie Jennings。
- 每个动作记录 `source`、固定提交的 `sourceUrl`、`license`；每张图片记录源地址、SHA-256 与字节数，见 `public/static/fitness/media/manifest.json`。
- 中文步骤与常见错误为本站整理；两项完全自有文本条目以 CC0-1.0 提供。肌群示意图是本站绘制的区域指示图，不属于 Free Exercise DB 图片。

Free Exercise DB 的 68 张 JPEG 均由本站 `/static/fitness/media/` 提供，不向第三方热链。另有 4 张 PNG 是本项目为两个缺图动作生成的成对教学图，来源与校验记录见 `generated-manifest.json`。现在 36 / 36 个动作具有起始、结束双帧；双帧仍然只是动作位置示意，不能当作连续视频。UI 同时支持静态对照与显式播放，并尊重减少动态效果设置。

## 精确匹配与缺口

`bulgarian-split-squat` 对应上游 `Split_Squat_with_Dumbbells`：其步骤明确后脚抬高，因此可作为保加利亚分腿蹲素材。`reverse-fly` 对应胸托反向飞鸟，中文名称、器械与步骤均与图片一致。`dead-bug` 对应上游双臂保持向上、交替伸腿的版本。

以下两个动作已经补齐本项目生成的成对图片：

| 动作           | 素材说明                                                     |
| -------------- | ------------------------------------------------------------ |
| 哑铃高脚杯深蹲 | PNG 成对图明确展示哑铃；不套用 Free Exercise DB 的壶铃图片。 |
| 坡度快走       | PNG 成对图明确展示抬高的跑台，且示范者没有握扶手。           |

本项目生成图的素材标记为 `AI-generated project asset`，不把 Free Exercise DB 的 Unlicense 自动套用到它们；页面保留 OpenAI 使用条款链接。高脚杯深蹲另接入 Wikimedia Commons 的真实 23 秒 WebM 连续视频，作者 Taco fleur，许可 CC BY-SA 4.0，已本地保存为 `/static/fitness/media/kettlebell-goblet-squat.webm`。该视频展示壶铃版本，页面明确提示只参考深蹲路径与躯干姿势，不能误认为哑铃版本；视频文件的来源、许可、SHA-256 与字节数记录在 `generated-manifest.json`。

## 可重复导入与校验

在项目根目录使用已有 Node.js，无新增依赖：

```powershell
node scripts/fitness-import-media.mjs
node scripts/fitness-import-media.mjs --verify
```

导入脚本从固定提交下载选定素材与许可，验证 JPEG 文件头并重建 SHA-256 清单；`--verify` 同时校验 Free Exercise DB 与 `generated-manifest.json` 的全部文件哈希、字节数及动作库引用。动作库的来源 URL 应保持固定提交格式；修改素材前重新核对动作匹配与授权，并将更新后的清单、许可与图片一并提交。
