@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo === 化工产业链项目更新脚本 ===
echo.

REM 检查是否有更新描述
if "%~1"=="" (
    echo 错误: 请提供更新描述
    echo 使用方法: scripts\update.bat "更新描述"
    echo 示例: scripts\update.bat "新增盐化工公司详情页"
    exit /b 1
)

set "UPDATE_DESC=%~1"
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "DATE=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%"
set "TIME=%datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%"

echo 更新描述: %UPDATE_DESC%
echo 更新时间: %DATE% %TIME%
echo.

REM 1. 显示当前状态
echo [1/4] 检查Git状态...
git status --short
echo.

REM 2. 添加所有更改
echo [2/4] 添加更改...
git add .
echo.

REM 3. 提交更改
echo [3/4] 提交更改...
git commit -m "%UPDATE_DESC%"

更新时间: %DATE% %TIME%"
echo.

REM 4. 提示更新CHANGELOG.md
echo ========================================
echo 📝 请更新 CHANGELOG.md 文件
echo ========================================
echo.
echo 请在 CHANGELOG.md 中添加以下内容:
echo.
echo ## [%DATE%] - %UPDATE_DESC%
echo.
echo ### 新增/修改/修复/数据更新
echo - 详细描述你的更新内容
echo.
echo 更新完成后，运行:
echo   git add CHANGELOG.md
echo   git commit -m "docs: 更新CHANGELOG.md"
echo.
echo ✅ 更新完成！

endlocal
