"""
向量搜索API
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# 导入全局向量服务实例
from app.api.financial_qa.upload.route import vector_service

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    max_context_length: Optional[int] = 2000
    return_metadata: Optional[bool] = False

@router.post("/search")
async def search_documents(request: SearchRequest):
    """
    搜索相关文档片段
    
    Args:
        request: 搜索请求
        
    Returns:
        搜索结果
    """
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="查询不能为空")
        
        # 执行向量搜索
        search_results = vector_service.search(
            query=request.query,
            top_k=request.top_k,
            score_threshold=0.2
        )
        
        # 获取上下文文本
        context = vector_service.get_context_for_qa(
            query=request.query,
            max_context_length=request.max_context_length
        )
        
        response_data = {
            'success': True,
            'context': context,
            'total_results': len(search_results)
        }
        
        # 如果需要返回元数据
        if request.return_metadata:
            response_data['results'] = search_results
        
        return JSONResponse(response_data)
        
    except Exception as e:
        logger.error(f"文档搜索失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 