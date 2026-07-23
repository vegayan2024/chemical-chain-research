#!/bin/bash
# 化工产业链项目更新脚本
# 使用方法: ./scripts/update.sh "更新描述"

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 化工产业链项目更新脚本 ===${NC}"

# 检查是否有更新描述
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供更新描述${NC}"
    echo "使用方法: ./scripts/update.sh \"更新描述\""
    echo "示例: ./scripts/update.sh \"新增盐化工公司详情页\""
    exit 1
fi

UPDATE_DESC="$1"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M:%S)

echo -e "${YELLOW}更新描述:${NC} $UPDATE_DESC"
echo -e "${YELLOW}更新时间:${NC} $DATE $TIME"
echo ""

# 1. 显示当前状态
echo -e "${GREEN}[1/4] 检查Git状态...${NC}"
git status --short

# 2. 添加所有更改
echo -e "${GREEN}[2/4] 添加更改...${NC}"
git add .

# 3. 提交更改
echo -e "${GREEN}[3/4] 提交更改...${NC}"
git commit -m "$UPDATE_DESC

更新时间: $DATE $TIME"

# 4. 提示更新CHANGELOG.md
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}📝 请更新 CHANGELOG.md 文件${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "请在 CHANGELOG.md 中添加以下内容:"
echo ""
echo -e "${GREEN}## [$DATE] - $UPDATE_DESC${NC}"
echo ""
echo "### 新增/修改/修复/数据更新"
echo "- 详细描述你的更新内容"
echo ""
echo -e "${YELLOW}更新完成后，运行:${NC}"
echo "  git add CHANGELOG.md"
echo "  git commit -m \"docs: 更新CHANGELOG.md\""
echo ""
echo -e "${GREEN}✅ 更新完成！${NC}"
