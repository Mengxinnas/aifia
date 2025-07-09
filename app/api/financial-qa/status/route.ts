import { NextResponse } from 'next/server';
import { getBackendUrl } from '../api-config';

const PYTHON_BACKEND_URL = getBackendUrl();

export async function GET() {
  try {
    console.log('尝试连接后端URL:', PYTHON_BACKEND_URL);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('后端响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`后端服务响应错误: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      backend_url: PYTHON_BACKEND_URL,
      stats: result.stats
    });
    
  } catch (error) {
    console.error('状态检查错误:', error);
    return NextResponse.json(
      { 
        success: false,
        backend_url: PYTHON_BACKEND_URL,
        error: error instanceof Error ? error.message : '状态检查失败'
      },
      { status: 500 }
    );
  }
} 