# 更新脚本使用说明

## 快速开始

### Windows用户
```bash
scripts\update.bat "你的更新描述"
```

### Linux/Mac用户
```bash
./scripts/update.sh "你的更新描述"
```

## 脚本功能

更新脚本会自动执行以下操作：
1. 显示当前Git状态
2. 添加所有更改
3. 提交更改（附带更新描述）
4. 提示你更新CHANGELOG.md

## 更新流程

### 步骤1：运行更新脚本
```bash
# Windows
scripts\update.bat "新增盐化工公司详情页"

# Linux/Mac
./scripts/update.sh "新增盐化工公司详情页"
```

### 步骤2：更新CHANGELOG.md
脚本会提示你更新CHANGELOG.md，按以下格式添加：

```markdown
## [2025-07-23] - 新增盐化工公司详情页

### 新增
- 新增盐化工板块5家公司的详情页
- 包含：中盐化工、三友化工、远兴能源、滨化股份、鲁西化工

### 数据更新
- 更新盐化工产品价格数据
```

### 步骤3：提交CHANGELOG.md
```bash
git add CHANGELOG.md
git commit -m "docs: 更新CHANGELOG.md"
```

## 自动同步

项目已配置post-commit hook，每次git commit后会自动推送到GitHub。

## 版本号规则

- **主版本号 (MAJOR)**：重大功能变更或架构调整
- **次版本号 (MINOR)**：新增功能或数据
- **修订号 (PATCH)**：Bug修复或小改动

示例：
- `0.1.0` → `0.2.0`：新增硅化工板块完整数据
- `0.1.0` → `0.1.1`：修复产品价格显示问题

## 更新日志格式

详见 [CHANGELOG.md](../CHANGELOG.md)

## 常见问题

**Q: 忘记更新CHANGELOG.md怎么办？**
A: 可以在下一次提交时补充，或者单独提交：
```bash
git add CHANGELOG.md
git commit -m "docs: 补充更新日志"
```

**Q: 如何撤销上一次提交？**
A: 使用以下命令（谨慎使用）：
```bash
git reset --soft HEAD~1
```

**Q: 如何查看提交历史？**
A: 使用以下命令：
```bash
git log --oneline -10
```
