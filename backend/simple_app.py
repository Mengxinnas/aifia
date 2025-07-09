#!/usr/bin/env python3
"""简化的测试后端"""

import os
import sys
import tempfile
from typing import Dict, List, Optional
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 创建FastAPI应用
app = FastAPI(title="简化财务分析API", version="1.0.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 简单的内存存储
simple_document_store = {}

class QuestionRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "简化财务分析API服务正常运行",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/status")
async def get_status():
    """获取系统状态"""
    return {
        "success": True,
        "stats": {
            "total_documents": len(simple_document_store),
            "total_vectors": 0,
            "tfidf_fitted": False,
            "files": [
                {
                    "filename": info["filename"],
                    "text_length": len(info["text"])
                }
                for info in simple_document_store.values()
            ]
        }
    }

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """简化的文件上传处理"""
    print(f"\n=== 开始处理上传文件 ===")
    print(f"文件名: {file.filename}")
    print(f"文件类型: {file.content_type}")
    
    temp_path = None
    
    try:
        # 检查文件名
        if not file.filename:
            result = {
                "success": False,
                "message": "文件名不能为空"
            }
            print(f"返回结果: {result}")
            return result
        
        # 获取文件扩展名
        file_ext = os.path.splitext(file.filename)[1].lower()
        print(f"文件扩展名: {file_ext}")
        
        # 支持的文件类型
        supported_types = ['.txt', '.csv']  # 只支持最基本的类型
        if file_ext not in supported_types:
            result = {
                "success": False,
                "message": f"当前只支持 {', '.join(supported_types)} 文件"
            }
            print(f"返回结果: {result}")
            return result
        
        # 读取文件内容
        print("开始读取文件内容...")
        content = await file.read()
        print(f"文件大小: {len(content)} 字节")
        
        if len(content) == 0:
            result = {
                "success": False,
                "message": "上传的文件为空"
            }
            print(f"返回结果: {result}")
            return result
        
        # 创建临时文件
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(content)
            temp_path = tmp_file.name
            print(f"临时文件路径: {temp_path}")
        
        # 读取文本内容
        text = ""
        for encoding in ['utf-8', 'gbk', 'gb2312']:
            try:
                with open(temp_path, 'r', encoding=encoding) as f:
                    text = f.read()
                print(f"成功使用 {encoding} 编码读取文件")
                break
            except UnicodeDecodeError:
                print(f"编码 {encoding} 读取失败")
                continue
        
        if not text:
            result = {
                "success": False,
                "message": "无法解码文件内容"
            }
            print(f"返回结果: {result}")
            return result
        
        print(f"文本内容长度: {len(text)}")
        print(f"文本预览: {text[:100]}...")
        
        # 存储到内存
        doc_id = len(simple_document_store)
        simple_document_store[doc_id] = {
            'filename': file.filename,
            'text': text,
            'text_length': len(text)
        }
        
        print(f"文档已存储，ID: {doc_id}")
        
        result = {
            "success": True,
            "message": f"成功处理文件：{file.filename}",
            "stats": {
                "text_length": len(text),
                "chunks_count": 1,
                "vector_dimension": 0,
                "vectors_created": 0
            }
        }
        
        print(f"准备返回结果: {result}")
        return result
        
    except Exception as e:
        print(f"\n=== 捕获到异常 ===")
        print(f"异常类型: {type(e).__name__}")
        print(f"异常信息: {str(e)}")
        
        import traceback
        print("详细堆栈跟踪:")
        traceback.print_exc()
        
        result = {
            "success": False,
            "message": f"处理失败: {str(e)}"
        }
        print(f"返回错误结果: {result}")
        return result
        
    finally:
        # 清理临时文件
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                print(f"已删除临时文件: {temp_path}")
            except Exception as e:
                print(f"删除临时文件失败: {str(e)}")
        print("=== 文件处理结束 ===\n")

@app.delete("/documents")
async def clear_documents():
    """清除所有文档"""
    global simple_document_store
    simple_document_store = {}
    return {
        "success": True,
        "message": "成功清除所有文档"
    }

if __name__ == "__main__":
    try:
        print("启动简化后端服务...")
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="info"
        )
    except Exception as e:
        print(f"启动服务器失败: {e}")
        sys.exit(1) 