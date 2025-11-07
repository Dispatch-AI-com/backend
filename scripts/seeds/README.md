# Database Seed Scripts

这个目录包含了用于初始化测试数据的seed脚本。

## 可用的Seed脚本

### 1. Calllog Seed (`seed:calllog`)
- **文件**: `seed-inbox-data.ts`
- **用途**: 创建calllog相关的测试数据
- **运行命令**: `pnpm seed:calllog`

### 2. Telephony Seed (`seed:telephony`)
- **文件**: `seed-telephony-test-data.ts`
- **用途**: 创建电话系统测试数据，包括用户、公司和服务
- **运行命令**: `pnpm seed:telephony`

### 3. 全部Seed (`seed:all`)
- **用途**: 运行所有seed脚本
- **运行命令**: `pnpm seed:all` 或 `pnpm seed`

## 使用方法

### 运行单个Seed
```bash
# 只运行calllog数据
pnpm seed:calllog

# 只运行telephony数据
pnpm seed:telephony
```

### 运行所有Seed
```bash
# 运行所有seed脚本
pnpm seed:all
# 或者
pnpm seed
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

## 注意事项

1. 运行seed脚本会清除现有的测试数据
2. 确保MongoDB连接正常
3. 确保环境变量配置正确
4. 每个seed脚本都可以独立运行

## 文件结构

```
scripts/seeds/
├── index.ts                    # 主入口文件，导入所有seed
├── seed-calllog.ts            # Calllog seed入口
├── seed-telephony.ts          # Telephony seed入口
├── run-calllog-seed.ts        # Calllog seed运行脚本
├── run-telephony-seed.ts      # Telephony seed运行脚本
├── seed-inbox-data.ts         # Calllog测试数据
├── seed-telephony-test-data.ts # Telephony测试数据
└── README.md                  # 本文档
``` 