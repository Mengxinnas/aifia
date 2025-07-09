#!/bin/bash

echo "=== 在系统全局Python环境中安装依赖 ==="

# 检查Python版本
python_version=$(python3 --version 2>&1)
echo "当前Python版本: $python_version"

# 安装依赖
echo "正在安装FastAPI相关依赖..."
pip3 install fastapi>=0.68.0
pip3 install uvicorn>=0.15.0
pip3 install pydantic>=2.0.0

echo "正在安装数据处理依赖..."
pip3 install pandas>=1.5.0
pip3 install numpy>=1.24.0
pip3 install scikit-learn>=1.3.0

echo "正在安装文件处理依赖..."
pip3 install pymupdf>=1.21.1
pip3 install python-docx>=0.8.11
pip3 install openpyxl>=3.1.0

echo "正在安装中文处理依赖..."
pip3 install jieba>=0.42.1

echo "正在安装向量搜索依赖..."
pip3 install faiss-cpu>=1.7.4

echo "正在安装其他依赖..."
pip3 install python-dotenv>=0.19.0
pip3 install aiohttp>=3.8.5
pip3 install requests>=2.28.0
pip3 install psutil>=5.8.0

echo "=== 依赖安装完成 ===" 