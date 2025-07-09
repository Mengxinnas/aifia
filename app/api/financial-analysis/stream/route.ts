import { NextRequest } from 'next/server';
import { getBackendUrl } from '../../financial-qa/api-config';

const PYTHON_BACKEND_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    console.log('=== 流式财务分析API请求开始 ===');
    
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('analysis_type') || 'comprehensive';
    const taskId = searchParams.get('task_id') || '';
    
    console.log('分析类型:', analysisType);
    console.log('任务ID:', taskId);
    
    // 转发请求到Python后端
    const backendUrl = `${PYTHON_BACKEND_URL}/financial-analysis/stream?analysis_type=${analysisType}&task_id=${taskId}`;
    console.log('转发到后端URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Cache-Control': 'no-cache'
      },
    });
    
    console.log(`后端响应状态: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法读取错误信息');
      console.error(`后端HTTP错误: ${response.status}, 内容: ${errorText}`);
      
      return new Response(
        `data: ${JSON.stringify({ type: 'error', message: `后端服务错误: HTTP ${response.status} - ${errorText}` })}\n\n`,
        { 
          status: 200,
          headers: { 
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      );
    }
    
    // 返回流式响应
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
    
  } catch (error) {
    console.error('流式财务分析API错误:', error);
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: `分析失败: ${error instanceof Error ? error.message : '未知错误'}` })}\n\n`,
      { 
        status: 200,
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );
  }
} 