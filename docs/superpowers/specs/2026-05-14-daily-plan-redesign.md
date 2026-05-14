# DailyMilk 大改版设计文档

日期：2026-05-14

## 概述

将每日计划从「时间点」模式重构为「时间段」模式，支持自定义每日预设任务槽位，改造记录流程为弹窗手动填写模式。

---

## 1. 数据模型

### 1.1 daily_plans 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| date | date | 日期 |
| planned_start_time | text | 计划开始时间 "HH:MM" |
| planned_end_time | text | 计划结束时间 "HH:MM" |
| actual_start_time | timestamptz | 实际开始时间，null 表示未完成 |
| actual_end_time | timestamptz | 实际结束时间，null 表示未完成 |
| sort_order | int | 排序 |

- 删除字段：`planned_time`、`actual_time`
- 完成判断：`actual_start_time IS NULL` 表示未完成

### 1.2 presets 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID（唯一） |
| slots | jsonb | `[{ "start": "06:00", "end": "07:00" }, ...]` |
| updated_at | timestamptz | 更新时间 |

- 删除字段：`start_time`、`end_time`、`daily_count`
- slots 为时间槽数组，每个槽位包含 start 和 end（HH:MM 格式）

### 1.3 TypeScript 类型

```ts
interface Plan {
  id: string
  planned_start_time: string
  planned_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
  sort_order: number
}

interface Preset {
  id: string
  slots: Array<{ start: string; end: string }>
}
```

---

## 2. 记录流程

### 2.1 RecordButton → RecordDialog

- 新建 `RecordDialog` 组件取代原 `RecordButton`
- 点击「记录当前时间」→ 打开弹窗
- 弹窗内容：
  - 标题：「记录吸奶时间」
  - 开始时间 input：默认值 = now - 20min
  - 结束时间 input：默认值 = now
  - 两个 time input 均支持用户编辑
  - 「取消」/「确认记录」按钮

### 2.2 record 函数

- 移除「查找最近未完成计划」逻辑（`findNearestPlan`）
- 按 `sort_order` 升序取第一个 `actual_start_time IS NULL` 的计划
- 接收 `{ start_time: string; end_time: string }`，写入 `actual_start_time` 和 `actual_end_time`
- 弹窗中用户填写的是 ISO timestamp，存储为完整时间戳

---

## 3. PlanItem 卡片

### 3.1 未完成任务

- 显示：`11:00 - 12:00`（24h 格式，planned_start_time - planned_end_time）
- 当前活动任务（第一个未完成）：高亮样式

### 3.2 已完成任务

- 显示计划时间段 + 实际时间段
- 状态标签：
  - 准时（绿）：实际开始 ≥ 计划开始 - 30min 且 实际结束 ≤ 计划结束 + 30min
  - 偏差（红）：不满足上述条件
- 不显示时间差值

### 3.3 编辑模式

- 计划开始/结束时间：始终可编辑
- 实际开始/结束时间：仅在任务已完成时显示和可编辑
- 保存逻辑与现有编辑模式一致

---

## 4. StatsCards 统计卡片

- 从 3 卡冗余为 2 卡：`grid-template-columns: repeat(2, 1fr)`
- 卡片 1：今日进度（完成数/总数 + 进度环），不变
- 卡片 2：按时完成（准点次数/已完成次数），判断逻辑改为 ±30min
- 删除：平均偏差卡片及相关计算逻辑
- 删除的工具函数：`findNearestPlan`、`generatePlanTimes`

---

## 5. 设置页

### 5.1 预设配置

- 替换「起始时间 + 结束时间 + 次数」为时间槽列表
- 每条槽位：开始 time input + 结束 time input + 删除按钮
- 底部「+ 添加时间段」按钮
- 上方显示「共 N 个时间段」
- 「保存预设」按钮保持不变

### 5.2 重置今日任务

- 在预设区域新增「重置今日任务」按钮
- 点击弹出确认弹窗
- 确认后：删除当天所有 daily_plans → 基于当前预设 slots 重新生成今日计划
- 二次确认文案：确定要清空今日所有任务及记录吗？

---

## 6. UI 风格

- 严格延展当前设计风格（颜色变量、字体、阴影、圆角、间距）
- 使用 `ui-ux-pro-max-skill` 确保新组件风格一致
- 弹窗/确认框沿用现有 card 样式和配色体系

---

## 7. 影响范围

### 需修改的文件

| 文件 | 变更 |
|------|------|
| `src/lib/supabase.ts` | TypeScript 类型 + mock 数据适配 |
| `src/utils/plan.ts` | 删除 `generatePlanTimes`、`findNearestPlan`；修改 `formatTimeDiff`；新增按时判断函数 |
| `src/hooks/useTodaysPlans.ts` | record 函数重写；fetchPlans 适配新字段；新增 resetToday 函数 |
| `src/hooks/usePreset.ts` | 适配 slots 字段；updatePreset 支持 slots |
| `src/components/RecordButton.tsx` | 重构为 `RecordDialog.tsx` |
| `src/components/PlanItem.tsx` | 时间段显示；4 字段编辑 |
| `src/components/PlanList.tsx` | 适配新 Plan 接口 |
| `src/components/StatsCards.tsx` | 2 卡布局；移除平均偏差；按时逻辑改为 ±30min |
| `src/pages/Today.tsx` | 使用 RecordDialog 替代 RecordButton |
| `src/pages/Settings.tsx` | 时间槽列表 UI；重置按钮 + 确认弹窗 |
| `src/components/DayDetail.tsx` | 适配新 Plan 字段 |
| `src/pages/History.tsx` | 适配新字段（如有需要） |

### 不修改

- `Layout.tsx`、`CalendarGrid.tsx`、`Login.tsx`、`Register.tsx` 行为不变
- 路由和认证逻辑不变

---

## 8. 边界情况

- 今日无计划时，记录按钮不可用（或提示先去设置预设）
- 预设 slots 为空时，保存预设按钮给出提示
- 重置今日任务时，如果今天没有任何计划，提示无需重置
- 弹窗中开始时间不能晚于结束时间，前端校验
- Mock client 数据同步更新为新结构，无旧数据兼容问题
