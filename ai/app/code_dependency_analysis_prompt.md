# 代码依赖分析提示词

## 任务描述
请分析项目中的代码依赖关系，确定以下两个文件夹是否可以安全删除：
- `/Users/banyuyang/Documents/knowledgebase/ai_dispatch_twilio_new/backend/ai/app/prompt`
- `/Users/banyuyang/Documents/knowledgebase/ai_dispatch_twilio_new/backend/ai/app/validate`

## 背景信息
项目中现在有重复的文件夹结构：
1. **旧的位置（可能需要删除）：**
   - `app/prompt/` - 包含提示词相关代码
   - `app/validate/` - 包含验证相关代码

2. **新的位置（标准化位置）：**
   - `app/utils/prompts/` - 包含提示词相关代码
   - `app/utils/validators/` - 包含验证相关代码

## 分析步骤

### 1. 文件内容对比
请对比以下文件的内容，确定它们是否完全相同：

**提示词相关文件：**
- `app/prompt/customer_info_prompts.py`
- `app/utils/prompts/customer_info_prompts.py`

**验证器相关文件：**
- `app/validate/customer_validators.py`
- `app/utils/validators/customer_validators.py`

### 2. 导入依赖分析
搜索整个项目中的所有Python文件，查找以下导入语句：

**旧路径的导入：**
```python
from app.prompt import *
from app.prompt.customer_info_prompts import *
from app.validate import *
from app.validate.customer_validators import *
import app.prompt.*
import app.validate.*
```

**新路径的导入：**
```python
from app.utils.prompts import *
from app.utils.prompts.customer_info_prompts import *
from app.utils.validators import *
from app.utils.validators.customer_validators import *
import app.utils.prompts.*
import app.utils.validators.*
```

### 3. 运行时调用分析
检查以下文件中的代码调用：
- `app/main.py`
- `app/routers/ai.py` 
- `app/services/chatr2v3.py`
- `app/services/llm.py`
- `app/services/prompts.py`
- `app/services/retrieve/customer_info_extractors.py`
- `app/dialog_manager.py`
- `app/test_conversation.py`
- `app/test_llm_integration.py`

### 4. 字符串引用检查
搜索代码中是否有字符串形式的路径引用：
```python
"app.prompt"
"app.validate"
"app/prompt"
"app/validate"
```

### 5. 配置文件检查
检查是否有配置文件、环境变量或其他配置引用了这些路径。

## 输出格式

### 分析结果
```
文件内容对比结果：
- prompt文件夹内容是否相同：[是/否]
- validate文件夹内容是否相同：[是/否]

导入依赖分析结果：
- 发现的旧路径导入：[列出所有发现的导入语句和文件位置]
- 发现的新路径导入：[列出所有发现的导入语句和文件位置]

运行时调用分析结果：
- 实际使用的是哪个路径：[app/prompt 或 app/utils/prompts]
- 实际使用的是哪个路径：[app/validate 或 app/utils/validators]

字符串引用检查结果：
- 发现的字符串引用：[列出所有发现的引用和文件位置]
```

### 删除建议
```
可以安全删除的文件夹：
- [ ] app/prompt - 原因：[说明原因]
- [ ] app/validate - 原因：[说明原因]

需要保留的文件夹：
- [ ] app/prompt - 原因：[说明原因]
- [ ] app/validate - 原因：[说明原因]
```

### 清理步骤
如果可以删除，请提供具体的清理步骤：
1. 备份文件夹
2. 执行删除操作
3. 运行测试验证
4. 更新文档

## 注意事项
- 请确保分析所有可能的引用方式
- 考虑动态导入的情况
- 检查是否有相对导入路径
- 确认测试文件中的引用
- 查看是否有IDE配置文件引用这些路径

## 验证方法
删除前请执行以下验证：
1. 运行项目的所有测试
2. 检查项目启动是否正常
3. 验证所有功能模块是否正常工作
4. 确认没有运行时错误

请基于这个提示词进行全面的代码依赖分析。
