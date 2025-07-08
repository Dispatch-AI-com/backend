# AI服务重构架构设计文档

## 📋 概述

本文档描述了Dispatch AI后端AI服务的重构架构设计，旨在提升代码的可维护性、可扩展性和可测试性。

## 🎯 重构目标

### 当前问题
1. **代码混杂**：业务逻辑、数据访问、工具函数混合在同一文件中
2. **职责不清**：`chatr2v3.py`承担了过多责任
3. **测试困难**：缺乏清晰的依赖注入和分层结构
4. **扩展性差**：添加新功能需要修改多个文件
5. **配置分散**：环境配置和业务配置散落各处

### 目标效果
- ✅ **清晰的分层架构**：API、服务、领域、基础设施层分离
- ✅ **单一职责原则**：每个模块专注于特定功能
- ✅ **依赖注入**：便于单元测试和功能替换
- ✅ **配置集中化**：统一的配置管理
- ✅ **可扩展性**：支持新的对话流程和AI功能

## 🏗️ 分层架构设计

### 架构理念

采用**Clean Architecture + DDD**设计理念：
- **依赖倒置**：高层模块不依赖低层模块
- **关注点分离**：每层专注于特定职责
- **领域驱动**：以业务领域为核心设计模型

### 分层结构

```
ai/
├── app/
│   ├── api/                    # 🌐 API层 - 处理HTTP请求/响应
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── conversation.py  # 智能对话路由
│   │   │   ├── chat.py         # 简单聊天路由
│   │   │   ├── summary.py      # 通话摘要路由
│   │   │   └── health.py       # 健康检查路由
│   │   └── dependencies.py     # 依赖注入配置
│   │
│   ├── core/                   # ⚙️ 核心配置层
│   │   ├── __init__.py
│   │   ├── config.py          # 统一配置管理
│   │   └── security.py        # 安全相关配置
│   │
│   ├── services/              # 🔧 业务服务层 - 应用业务逻辑
│   │   ├── __init__.py
│   │   ├── conversation_service.py  # 对话管理服务
│   │   ├── llm_service.py          # LLM交互服务
│   │   └── summary_service.py      # 摘要生成服务
│   │
│   ├── domain/                # 💼 领域层 - 核心业务逻辑
│   │   ├── models/            # 领域模型
│   │   │   ├── __init__.py
│   │   │   ├── call_session.py    # 通话会话模型
│   │   │   ├── user_info.py       # 用户信息模型
│   │   │   └── conversation.py    # 对话模型
│   │   └── workflows/         # 业务工作流
│   │       ├── __init__.py
│   │       └── customer_info_workflow.py  # 客户信息收集工作流
│   │
│   ├── infrastructure/        # 🏭 基础设施层 - 外部依赖
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── redis_client.py    # Redis连接管理
│   │   ├── external/
│   │   │   ├── __init__.py
│   │   │   └── openai_client.py   # OpenAI API客户端
│   │   └── repositories/
│   │       ├── __init__.py
│   │       └── session_repository.py  # 会话数据仓储
│   │
│   ├── utils/                 # 🛠️ 工具层 - 通用工具
│   │   ├── __init__.py
│   │   ├── validators/        # 数据验证器
│   │   │   ├── __init__.py
│   │   │   ├── contact_validators.py  # 联系方式验证
│   │   │   └── service_validators.py  # 服务相关验证
│   │   ├── prompts/          # 提示词管理
│   │   │   ├── __init__.py
│   │   │   ├── conversation_prompts.py  # 对话提示词
│   │   │   └── extraction_prompts.py    # 信息提取提示词
│   │   └── exceptions.py      # 自定义异常定义
│   │
│   └── main.py               # 🚀 应用入口
│
├── tests/                    # 🧪 测试目录
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   └── e2e/                  # 端到端测试
│
├── scripts/                  # 📜 脚本目录
├── docs/                     # 📚 文档目录
├── Dockerfile
├── Dockerfile.uat
├── pyproject.toml
└── Makefile
```

## 🎯 各层职责详解

### 1. API层 (`api/`)
**职责**：处理HTTP请求和响应，数据验证和序列化
- 路由定义和参数验证
- 请求/响应数据转换
- HTTP状态码和错误处理
- API文档生成

**原则**：
- 不包含业务逻辑
- 只负责数据传输格式转换
- 依赖注入业务服务

### 2. 服务层 (`services/`)
**职责**：应用业务逻辑协调，事务管理
- 协调多个领域对象完成业务用例
- 处理跨领域的业务流程
- 管理事务边界
- 调用外部服务

**设计模式**：
- 应用服务模式
- 门面模式
- 策略模式

### 3. 领域层 (`domain/`)
**职责**：核心业务规则和领域逻辑
- 业务实体和值对象
- 领域服务和业务规则
- 工作流状态管理
- 业务不变性维护

**DDD概念**：
- 实体 (Entities)
- 值对象 (Value Objects)
- 领域服务 (Domain Services)
- 工作流 (Workflows)

### 4. 基础设施层 (`infrastructure/`)
**职责**：外部系统集成和技术实现
- 数据库访问实现
- 外部API调用
- 文件系统操作
- 消息队列等技术细节

**模式**：
- 仓储模式 (Repository Pattern)
- 适配器模式 (Adapter Pattern)
- 工厂模式 (Factory Pattern)

### 5. 工具层 (`utils/`)
**职责**：提供通用工具和辅助功能
- 数据验证工具
- 常用工具函数
- 自定义异常
- 配置辅助类

## 📋 重构实施计划

### Phase 1: 基础架构搭建 (高优先级)

#### 1.1 目录结构创建
```bash
# 创建新的目录结构
mkdir -p app/{api/routers,core,services,domain/{models,workflows},infrastructure/{database,external,repositories},utils/{validators,prompts}}
mkdir -p tests/{unit,integration,e2e}
mkdir -p {scripts,docs}
```

#### 1.2 核心配置重构
**目标文件**: `app/core/config.py`
```python
# 统一配置管理
class Settings(BaseSettings):
    # Redis配置
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    
    # OpenAI配置
    openai_api_key: str
    openai_model: str = "gpt-4o"
    
    # 应用配置
    debug: bool = False
    log_level: str = "INFO"
```

#### 1.3 数据模型重构
**迁移**: `models.py` → `domain/models/`
- 拆分为独立的模型文件
- 添加领域验证逻辑
- 实现数据转换方法

### Phase 2: 服务层重构 (高优先级)

#### 2.1 对话服务重构
**目标**: 将`chatr2v3.py`拆分为：
- `services/conversation_service.py` - 对话协调逻辑
- `domain/workflows/customer_info_workflow.py` - 工作流状态管理
- `infrastructure/repositories/session_repository.py` - 数据访问

#### 2.2 LLM服务重构
**目标**: 优化`services/llm.py`
- 统一LLM接口封装
- 添加错误处理和重试机制
- 支持多种LLM提供商

### Phase 3: 基础设施重构 (中优先级)

#### 3.1 数据访问层重构
**目标**: 重构`redis_client.py`
- 实现仓储模式
- 添加连接池管理
- 统一错误处理

#### 3.2 外部服务集成
- OpenAI客户端封装
- 统一的HTTP客户端
- 配置驱动的服务发现

### Phase 4: 测试和文档 (低优先级)

#### 4.1 测试体系建设
- 单元测试覆盖率 > 80%
- 集成测试关键流程
- E2E测试完整用例

#### 4.2 文档完善
- API文档自动生成
- 架构设计文档
- 部署和运维文档

## 🔧 迁移策略

### 渐进式迁移
1. **新功能新架构**：新开发的功能使用新架构
2. **逐步重构**：按模块逐步迁移现有代码
3. **兼容性保证**：迁移期间保持API兼容性
4. **测试先行**：每次迁移前编写测试用例

### 风险控制
- **回滚机制**：保留原有代码分支
- **灰度发布**：分阶段部署验证
- **监控告警**：实时监控系统稳定性
- **文档更新**：及时更新相关文档

## 📊 成功指标

### 技术指标
- **代码复用率** > 70%
- **测试覆盖率** > 80%
- **构建时间** < 2分钟
- **平均响应时间** < 500ms

### 开发效率指标
- **新功能开发时间**减少 30%
- **Bug修复时间**减少 50%
- **代码审查时间**减少 40%

### 质量指标
- **代码重复率** < 5%
- **圈复杂度** < 10
- **技术债务**减少 60%

## 🚀 下一步行动

### 立即行动项
1. **创建分支**：`refactor/ai-architecture-phase1`
2. **搭建目录结构**：按照设计创建文件夹
3. **迁移核心配置**：实现统一配置管理
4. **重构数据模型**：拆分`models.py`

### 本周目标
- [ ] 完成Phase 1.1-1.3
- [ ] 编写迁移脚本
- [ ] 更新CI/CD配置
- [ ] 团队技术分享

### 本月目标
- [ ] 完成Phase 2 服务层重构
- [ ] 建立测试框架
- [ ] 性能基准测试
- [ ] 文档完善

---

## 📞 联系方式

如有疑问或建议，请联系：
- **架构负责人**：开发团队
- **项目经理**：项目组
- **技术支持**：DevOps团队

---
*最后更新：2025-07-08*
*文档版本：v1.0*