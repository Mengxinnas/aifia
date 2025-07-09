"""
FastAPI主应用程序
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="财务分析API",
    description="财务数据分析和问答系统",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 导入路由
from app.api.financial_qa.upload.route import router as upload_router
from app.api.financial_qa.search.route import router as search_router

# 注册路由
app.include_router(upload_router, prefix="/api/financial_qa", tags=["文件上传"])
app.include_router(search_router, prefix="/api/financial_qa", tags=["向量搜索"])

@app.get("/")
async def root():
    """根路径"""
    return {"message": "财务分析API服务正在运行"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "message": "服务正常运行"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 