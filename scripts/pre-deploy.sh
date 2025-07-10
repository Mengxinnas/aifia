#!/bin/bash
echo "开始部署前清理..."

# 清理后端临时文件
echo "清理后端临时文件..."
find backend/temp -name "*.docx" -size +1M -delete
find backend/temp -name "*.xlsx" -size +1M -delete
find backend/temp -name "*.pdf" -size +1M -delete

# 清理前端临时文件
echo "清理前端临时文件..."
rm -rf temp/*
rm -f *.csv
rm -rf .next/cache/*

# 清理日志文件
echo "清理日志文件..."
find . -name "*.log" -delete

echo "清理完成！" 