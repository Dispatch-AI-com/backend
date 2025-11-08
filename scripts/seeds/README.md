# Database Seed Scripts

这个目录包含了用于初始化测试数据的seed脚本。

## 可用的Seed脚本

### 1. Calllog Seed (`seed:calllog`)
- **文件**: `seed-inbox-data.ts`
- **用途**: 创建calllog相关的测试数据
- **运行命令**: `npm run seed:calllog`

### 2. Telephony Seed (`seed:telephony`)
- **文件**: `seed-telephony-test-data.ts`
- **用途**: 创建电话系统测试数据，包括用户、公司和服务
- **运行命令**: `npm run seed:telephony`

### 3. Plan Seed (`seed:plan`)
- **文件**: `seed-plan-data.ts`
- **用途**: 创建计划数据（FREE, BASIC, PRO计划）
- **运行命令**: `npm run seed:plan`
- **说明**: 
  - 脚本会检查计划是否已存在，如果存在则更新，如果不存在则创建
  - 需要在 `seed-plan-data.ts` 中更新 UAT 数据（价格、Stripe价格ID、功能等）

### 4. 全部Seed (`seed:all`)
- **用途**: 运行所有seed脚本
- **运行命令**: `npm run seed:all` 或 `npm run seed`

## 使用方法

### 运行单个Seed
```bash
# 只运行calllog数据
npm run seed:calllog

# 只运行telephony数据
npm run seed:telephony

# 只运行plan数据
npm run seed:plan
```

### 运行所有Seed
```bash
# 运行所有seed脚本
npm run seed:all
# 或者
npm run seed
```

## 测试数据说明

### Calllog测试数据
- 包含calllog相关的测试数据
- 用于测试calllog相关的API端点

### Telephony测试数据
- 创建测试用户: `john.doe@example.com` / `Admin123!`
- 创建测试公司: ABC Cleaning Services
- 创建5个测试服务:
  1. House Cleaning - $120
  2. Garden Maintenance - $80
  3. Plumbing Service - $150
  4. Carpet Cleaning - $100
  5. Window Cleaning - $90

### Plan测试数据
- 创建三个计划: FREE, BASIC, PRO
- 每个计划包含:
  - 名称和层级
  - 定价选项（月度、季度、年度等）
  - 功能（通话分钟数、支持级别）
  - Stripe价格ID
- **注意**: 使用前需要在 `seed-plan-data.ts` 中更新UAT数据

## 注意事项

1. 运行seed脚本可能会清除现有的测试数据（calllog和telephony seed）
2. Plan seed会更新现有计划，如果计划不存在则创建新计划（不会删除现有计划）
3. 确保MongoDB连接正常
4. 确保环境变量配置正确
5. 每个seed脚本都可以独立运行
6. **Plan Seed使用前**: 请先在 `seed-plan-data.ts` 中更新UAT数据，包括价格、Stripe价格ID和功能描述

## 文件结构

```
scripts/seeds/
├── index.ts                    # 主入口文件，导入所有seed
├── seed-calllog.ts            # Calllog seed入口
├── seed-telephony.ts          # Telephony seed入口
├── seed-plan.ts               # Plan seed入口
├── run-calllog-seed.ts        # Calllog seed运行脚本
├── run-telephony-seed.ts      # Telephony seed运行脚本
├── seed-inbox-data.ts         # Calllog测试数据
├── seed-telephony-test-data.ts # Telephony测试数据
├── seed-plan-data.ts          # Plan测试数据
└── README.md                  # 本文档
``` 