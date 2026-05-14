# DayMilk 设计规格

> 吸奶记录移动端 Web App — 帮助哺乳期妈妈规划并记录每日吸奶情况

## 产品概览

DayMilk 是一款面向哺乳期妈妈的移动端 Web 应用（PWA），支持浏览器直接打开。用户设定每日吸奶次数和时间范围，系统自动生成均匀分布的吸奶计划表。一键记录实际吸奶时间，直观对比计划与实际的偏差。支持历史日历回溯和云端多设备同步。

---

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite | SPA，PWA 支持 |
| 样式 | Tailwind CSS | 移动优先，响应式 |
| 后端/数据库 | Supabase | 认证 + PostgreSQL + 自动 API |
| 部署 | Vercel (前端) + Supabase (后端) | 免费额度起用 |

---

## 用户流程

```
用户注册/登录 → 设置预设（起始时间、结束时间、每日次数）
  → 系统自动生成今日均匀间隔计划
  → 用户查看今日计划列表 + 统计卡片
  → 到时间 → 点击"记录吸奶时间"按钮 → 自动匹配最近未完成计划并标记完成
  → 显示计划 vs 实际偏差
  → 可回看历史日历任意日期的完成情况
  → 修改预设（仅影响明天及以后）
  → 可手动编辑任意一天的计划时间
```

---

## 页面结构（3 个 Tab）

### 1. 今天（首页）
- 日期 Header + 用户头像
- 3 张统计卡片：今日进度（N/总数）、平均偏差（±分钟）、按时完成数
- 醒目渐变记录按钮（全宽、手机拇指易触达）
- 今日计划列表，每条显示：
  - 状态图标：✅ 已完成 / ⟳ 进行中 / ○ 待完成
  - 计划时间
  - 实际时间 + 偏差（已完成项）
  - 右侧 ⋮ 菜单（编辑/删除）

### 2. 历史
- 月份导航（← 2025年5月 →）
- 月历网格，每天带完成状态小圆点（绿=全部完成，灰=部分，无=当天无数据）
- 点击日期显示当天详情（计划 vs 实际对比列表）

### 3. 设置
- 预设配置：起始时间选择器、结束时间选择器、每日次数（1-12）
- 修改仅对明天生效的说明提示
- 账号信息（邮箱、注册时间）
- 退出登录

---

## 数据模型

### presets（预设配置表）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid → auth.users | 关联用户 |
| start_time | time | 每日起始时间 |
| end_time | time | 每日最晚时间 |
| daily_count | int | 每日次数 |
| updated_at | timestamptz | 最后修改时间 |

每个用户仅一条记录。

### daily_plans（每日计划表）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid → auth.users | 关联用户 |
| date | date | 计划日期 |
| planned_time | time | 计划吸奶时间 |
| actual_time | timestamptz | 实际完成时间（nullable） |
| sort_order | int | 排序序号 |
| created_at | timestamptz | 创建时间 |

### 核心逻辑

1. **自动生成**：每天首次访问时，从 presets 读取设置，按 `start_time` 到 `end_time` 均匀分布生成 `daily_count` 条记录
2. **一键记录**：查询当天所有 `actual_time IS NULL` 的计划，按 `|planned_time - now()|` 绝对时间距离找到最近的一条，写入 `actual_time = now()`。若无未完成计划则提示"今日计划已全部完成"
3. **均匀间隔算法**：`interval = (end - start) / (count - 1)`，当 count=1 时仅使用 start_time
4. **偏差计算**：`actual_time` - `planned_time` 换算为分钟偏差，正值表示晚于计划，负值表示早于计划
4. **预设修改**：仅影响明天及以后的生成，今天计划不变
5. **手动编辑**：支持直接修改 `planned_time` 或删除某条计划

### Supabase 行级安全（RLS）

```sql
-- 所有表启用 RLS
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的数据
CREATE POLICY "Users access own presets" ON presets
  USING (auth.uid() = user_id);
CREATE POLICY "Users access own plans" ON daily_plans
  USING (auth.uid() = user_id);
```

---

## 设计系统

### 色彩（Beauty/Spa/Wellness）

| 角色 | 色值 | 用途 |
|---|---|---|
| Primary | `#EC4899` | 按钮、高亮、激活态 |
| Secondary | `#F9A8D4` | 装饰、渐变过渡 |
| Accent | `#8B5CF6` | 统计数字、点缀 |
| Background | `#FDF2F8` | 页面背景 |
| Foreground | `#831843` | 主文字 |
| Card | `#FFFFFF` | 卡片背景 |
| Border | `#FBCFE8` | 边框、分割线 |
| Success | `#10B981` | 完成状态 |
| Muted | `#F1EEF5` / `#9CA3AF` | 未激活/灰色态 |

### 字体
- 标题：**Varela Round**（圆润、亲和）
- 正文：**Nunito Sans**（清晰、可读）

### 风格
- Soft UI Evolution — 柔和多层阴影、圆角 12-16px
- 移动优先，触控目标 ≥ 44px
- 渐变按钮，圆角 20px
- 动画 200-300ms

### 布局规范（320-420px 手机视口）
- 左右内边距：16px
- 卡片圆角：16px
- 按钮圆角：20px，最小高度 52px
- 底部导航带 border-top 分割

---

## 认证设计

- Supabase Auth，邮箱 + 密码注册/登录
- 注册后可设置预设
- 无密码重置流程
- 会话持久化（localStorage token）

---

## 边界场景

| 场景 | 处理 |
|---|---|
| 当天已全完成时点击记录 | 提示"今日计划已全部完成" |
| 当天无计划（预设未设置） | 引导去设置页面 |
| 跨日（23:59 → 00:01）| 自动加载新一天计划 |
| 网络断开 | 乐观更新 + Supabase 离线队列 |
| 修改预设后当天 | 不影响已生成的计划 |
| 多次点击记录按钮 | 防抖处理（300ms） |

---

## 验收标准

1. 用户可注册/登录/退出
2. 设置预设后，每日自动生成均匀间隔计划
3. 一键记录功能正确匹配最近未完成计划
4. 计划 vs 实际偏差准确显示
5. 历史日历可浏览任意日期
6. 手动编辑计划时间生效
7. 修改预设仅影响明天
8. PWA 可添加到手机主屏幕
9. 所有触控目标满足 44px 最小尺寸
10. 温柔暖色系视觉风格一致
