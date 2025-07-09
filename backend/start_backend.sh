#!/bin/bash

echo "正在启动财务分析后端服务（系统Python环境）..."

# 检查Python3环境
if ! command -v python3 &> /dev/null; then
    echo "Python3未安装，请先安装Python3"
    exit 1
fi

# 显示Python版本
echo "使用Python版本: $(python3 --version)"

# 检查关键依赖
echo "检查关键依赖..."
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "FastAPI未安装，请运行 pip3 install fastapi"
    echo "或运行 install_global_dependencies.sh 安装所有依赖"
    exit 1
fi

if ! python3 -c "import uvicorn" &> /dev/null; then
    echo "uvicorn未安装，请运行 pip3 install uvicorn"
    exit 1
fi

echo "依赖检查通过，启动服务..."

# 切换到backend目录
cd "$(dirname "$0")"

# 启动服务（使用python3而不是python）
python3 app.py 