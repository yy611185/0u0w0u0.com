# Fitness V1 动作库与素材

动作库位于 `src/fitness/catalog.json`，收录 36 个动作，覆盖 A–D 计划的全部 22 个不同动作与 14 个常见替代。推荐组数、次数来自 V1 计划；替代动作的默认目标由本站整理，替换时仍需用户确认。单侧动作在说明中明确按每侧计数。引体向上、俯卧撑与 Pallof Press 使用 `repsMin: 0, repsMax: 0` 表示记录实际次数；计时动作使用 `durationSeconds`。

## 来源与许可

图片来自 [Free Exercise DB](https://github.com/yuhonas/free-exercise-db)，固定为提交 `a859101d633a01c4a1a920d6a8ce41dabba0705f`。核验日期：2026-09-15。

- 上游 [README](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/README.md) 将其描述为 public-domain exercise dataset，并明确允许检出 JSON 和图片在本地使用。
- 上游 [LICENSE.md](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/LICENSE.md) 为 Unlicense；仓库没有为选入图片另列更严格的许可。
- 本地保留上游 `free-exercise-db-LICENSE.md` 与 `free-exercise-db-README.md`。上游 README 记载数据整理者 yuhonas 以及原始数据集作者 Ollie Jennings。
- 每个动作记录 `source`、固定提交的 `sourceUrl`、`license`；每张图片记录源地址、SHA-256 与字节数，见 `public/static/fitness/media/manifest.json`。
- 中文步骤与常见错误为本站整理；两项完全自有文本条目以 CC0-1.0 提供。肌群示意图是本站绘制的区域指示图，不属于 Free Exercise DB 图片。

所有 68 张 JPEG 均由本站 `/static/fitness/media/` 提供，不向第三方热链。34 / 36 个动作具有起始、结束双帧，覆盖率约 94.4%。双帧是动作位置示意，不能当作连续视频；UI 应支持静态显示或显式切换，并尊重减少动态效果设置。V1 没有导入授权不明确的 GIF，也没有将双帧伪称为 MP4 / WebM。

## 精确匹配与缺口

`bulgarian-split-squat` 对应上游 `Split_Squat_with_Dumbbells`：其步骤明确后脚抬高，因此可作为保加利亚分腿蹲素材。`reverse-fly` 对应胸托反向飞鸟，中文名称、器械与步骤均与图片一致。`dead-bug` 对应上游双臂保持向上、交替伸腿的版本。

以下两个动作保留文字与肌群图，`mediaUrl` 为空字符串、`mediaFrames` 为空数组：

| 动作           | 原因                                                       |
| -------------- | ---------------------------------------------------------- |
| 哑铃高脚杯深蹲 | 上游 `Goblet_Squat` 展示壶铃，未将其标成哑铃素材。         |
| 坡度快走       | 上游跑步机步行没有明确展示坡度，未将平地步行标成坡度教学。 |

V1 要求中 wger 为优先来源、Free Exercise DB 为可用备用来源。本次采用可固定提交、可完整留存许可与图片、无需运行期外部 API 的 Free Exercise DB 精选集合。未来补充视频时逐条核验实际媒体许可，不把 API 或代码仓库的许可证自动套用到第三方媒体。

## 可重复导入与校验

在项目根目录使用已有 Node.js，无新增依赖：

```powershell
node scripts/fitness-import-media.mjs
node scripts/fitness-import-media.mjs --verify
```

导入脚本从固定提交下载选定素材与许可，验证 JPEG 文件头并重建 SHA-256 清单。离线 `--verify` 检查全部清单文件的哈希以及动作库引用。动作库的来源 URL 应保持固定提交格式；修改素材前重新核对动作匹配与授权，并将更新后的清单、许可与图片一并提交。
