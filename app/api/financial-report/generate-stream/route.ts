import { NextRequest } from 'next/server';
import { getBackendUrl } from '../../financial-qa/api-config';

const PYTHON_BACKEND_URL = getBackendUrl();

export async function POST(request: NextRequest) {
  try {
    console.log('=== 流式财务报告生成API请求开始 ===');
    
    const body = await request.json();
    console.log('前端请求体:', body);
    
    // 转发请求到Python后端
    const response = await fetch(`${PYTHON_BACKEND_URL}/financial-report/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log(`后端响应状态: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法读取错误信息');
      console.error(`后端HTTP错误: ${response.status}, 内容: ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `后端服务错误: HTTP ${response.status} - ${errorText}`
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
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
      }
    });
    
  } catch (error) {
    console.error('流式财务报告生成API错误:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `报告生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 