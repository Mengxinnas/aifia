import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../../financial-qa/api-config';

const PYTHON_BACKEND_URL = getBackendUrl();

export async function POST(request: NextRequest) {
  try {
    console.log('=== 财务分析取消API请求开始 ===');
    
    const body = await request.json();
    console.log('前端请求体:', body);
    
    // 转发请求到Python后端
    const response = await fetch(`${PYTHON_BACKEND_URL}/financial-analysis/cancel`, {
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
      return NextResponse.json(
        { 
          success: false,
          error: `后端服务错误: HTTP ${response.status} - ${errorText}`
        },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('后端响应结果:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('财务分析取消API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `取消任务失败: ${error instanceof Error ? error.message : '未知错误'}`
      },
      { status: 500 }
    );
  }
} 