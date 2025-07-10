from fastapi import APIRouter, Depends, HTTPException
from app.models.qa import QuestionRequest, AnswerResponse
from app.services.qa_service import QAService
from typing import Optional

router = APIRouter(
    prefix="/api/qa",
    tags=["qa"],
    responses={404: {"description": "Not found"}},
)

# 依赖注入
async def get_qa_service():
    return QAService()

@router.post("/ask", response_model=AnswerResponse)
async def ask_question(
    question_request: QuestionRequest,
    qa_service: QAService = Depends(get_qa_service)
):
    """
    处理用户提问并返回答案
    
    Args:
        question_request: 用户的问题请求
        qa_service: 问答服务实例（通过依赖注入获得）
        
    Returns:
        AnswerResponse: 包含答案的响应对象
    """
    try:
        return await qa_service.get_answer(question_request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理问题时发生错误: {str(e)}"
        ) 