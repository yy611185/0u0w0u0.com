# Personal Fitness System V1 交付说明

## 实现与入口

Fitness 是当前 Hono JSX / Cloudflare Workers 网站中的子路由，入口 `/fitness` 重定向 `/fitness/dashboard`。沿用 SiteShell、导航、Manrope 字体、原生 CSS 和 ES Modules，没有增加运行时依赖或独立账户系统。浅色 Fitness 样式全部限定于 `.fit-app`。

| 页面         | 已实现                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| dashboard    | 下次训练、恢复进行中训练、周次数、连续达标周数、月完成率、断练天数、最近历史                                               |
| workout      | A–D 循环、场地/器械、计划快照、逐组重量/次数/RPE/可选动作时长、上一场表现、专注卡片、修改组、替代、结束动作、完成/提前结束 |
| plan         | 四日完整计划、明确确认后的目标调整、可解释的加重建议                                                                       |
| exercises    | 36 动作、名称/肌群/器械/难度/场地/类型筛选、步骤、错误、双帧图、肌群示意、来源、单动作历史与趋势                           |
| history      | 完成/提前结束/进行中训练、实际组数、原计划目标、时长、备注、每组数据                                                       |
| progress     | 每日体重保存/同日更正、7 日实际测量平均、30 日趋势和每日记录                                                               |
| achievements | 等级、周任务、连续达标、5 个持久化徽章与阶段挑战                                                                           |

未实现文档排除的饮食、步数、独立跑步、心率、社交、通知、组间休息计时器或 AI 功能。

## 运行与数据

```powershell
npm run fitness:setup
npm run dev
```

然后访问 `/fitness`。开发数据由本地 Workers 的 D1 SQLite 实例持久化在 `.wrangler/state/`；不是 LocalStorage 或 mock。部署到同一个远端 D1 后，Windows 和 iPhone 使用相同的服务器记录。当前尚未创建远端数据库或部署生产。

- `migrations/fitness/0001_fitness.sql`：Profile、Exercise、WorkoutPlan、WorkoutDay、WorkoutExercise、WorkoutSession、训练动作快照、ExerciseSet、BodyWeight、Achievement、TrainingSuggestion，共 11 张表。
- `0002_integrity.sql`：数据库写入与训练完成约束。
- `0003_partial_exercise.sql`：明确结束剩余组时保留实际记录。
- `0004_skipped_set_guard.sql`：跨设备结束动作后拒绝过期组修改。
- `seeds/fitness.sql`：1 个 Profile、36 动作、4 训练日、24 计划条目、5 徽章定义。没有虚构体重或训练记录。
- `npm run fitness:seed:generate` 从动作库重新生成 seed；重复 seed 更新动作资料，但保留个人记录、调整后的目标和徽章状态。

`wrangler.jsonc` 声明 `FITNESS_DB`，没有伪造远端 database_id。准备上线时创建 D1 后将真实 ID 写入配置，然后执行远端 migration / seed；部署继续走项目既有 PR → CI → merge 流程。

```powershell
npx wrangler d1 create ouowouo-fitness
# 将创建结果的 database_id 加到 wrangler.jsonc 的 FITNESS_DB 条目
npm run cf-typegen
npx wrangler d1 migrations apply FITNESS_DB --remote
npx wrangler d1 execute FITNESS_DB --remote --file seeds/fitness.sql
```

当前代码库是公开网站，需求文档则假设仅本人访问。上线前需要确定 `/fitness`、`/fitness/*` 的网站级访问保护（建议 Cloudflare Access，同时覆盖 workers.dev/预览入口或关闭相应入口）。目前未新建登录系统，也没有把 Origin 校验误作身份认证。生产访问方式仍待用户选择。

## 一致性与操作语义

训练开始时复制计划，后续修改不改变已有训练；单个服务器数据库最多允许一场进行中的训练。只有明确完成训练才推进循环，提前结束保留数据但不推进。结束剩余组是明确操作，实际组数仍可少于计划目标；至少要有一组真实记录才能完成训练。

逐组保存有唯一键和版本冲突检查，重复同值提交不会产生重复组，旧版本不会覆盖新数据；结束训练可重复提交。D1 batch/SQL 约束在事务内保护并发状态。写入只接受同源请求，参数经服务端验证，查询绑定参数，Fitness 页面/API 不缓存且禁止索引。

断网失败不显示保存成功，页面保留当前输入并可重试；未保存输入离开页面前提示。V1 没有离线队列，关闭浏览器仍会丢失未成功提交的输入。开始/结束间的时间为训练时长，不含额外的暂停计时功能。

本周以 Profile 时区的周一开始，默认 Asia/Taipei；本周尚未达标时保留上周连续记录，错过完整一周只改变当前连续周数，不扣等级或已获得徽章。体重平均只计算对应 7 个日历日中已有测量，缺失数据不补零。

## 素材与扩展

素材明细见 [fitness-media.md](fitness-media.md)。34 个动作有本地双帧图，哑铃高脚杯深蹲和坡度快走提供文字回退。没有连续 GIF/MP4/WebM；没有将双帧图片宣称为视频。肌群 SVG 为原创简化区域图（CC0-1.0），由页面组件渲染；`muscleImageUrl` 保留供以后接入独立素材。

`TrainingAnalysisService` 是版本化建议接口，当前只有透明的双进阶规则；建议需要单独确认，确认记录与目标更新在事务中完成。没有调用 AI API。未来 provider 可复用相同数据/建议结构，不能绕过确认直接改计划。

## 验证

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run test:e2e
node scripts/fitness-import-media.mjs --verify
```

17 个单元测试包括跨周循环、时区边界、连续达标、不完整体重窗口、进阶条件。10 个浏览器测试包括既有网站回归，以及真实 D1 的跨浏览器同步、并发开始、重复提交、旧版本冲突、同源保护、提前完成拒绝、部分组保留、完成幂等、A→B、提前结束不推进、体重更正及非法日期。

浏览器测试使用独立 `.wrangler/fitness-e2e/`，初始化脚本只清理该测试数据库。测试包含 1440px 桌面和 390px iPhone 尺寸、实际手机表单提交、输入字号/点击尺寸/横向溢出。当前是 Chromium 移动模拟，尚未在真实 iPhone Safari 或 WebKit 上验收。

## 后续

优先确定访问保护并部署远端 D1，然后在真实 iPhone Safari 试练一次；按实际体验补充两个缺图动作及许可清晰的连续视频。V1 数据查询面向个人规模；多年记录增长后可按需加入历史分页，不改变现有训练数据模型。
