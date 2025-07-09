import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../../../financial-qa/api-config';

const PYTHON_BACKEND_URL = getBackendUrl();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    console.log('=== 财务报告下载API请求开始 ===');
    
    const { filename } = await params;
    console.log('下载文件名:', filename);
    
    // 转发请求到Python后端
    const response = await fetch(`${PYTHON_BACKEND_URL}/financial-report/download/${filename}`);
    
    console.log(`后端响应状态: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法读取错误信息');
      console.error(`后端HTTP错误: ${response.status}, 内容: ${errorText}`);
      return NextResponse.json(
        { 
          success: false,
          error: `下载失败: HTTP ${response.status} - ${errorText}`
        },
        { status: response.status }
      );
    }
    
    // 获取文件内容
    const fileContent = await response.arrayBuffer();
    
    // 修复：处理中文文件名编码
    const encodedFilename = encodeURIComponent(filename);
    
    // 修复：返回正确的文件响应
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fileContent.byteLength.toString()
      }
    });
    
  } catch (error) {
    console.error('财务报告下载API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`
      },
      { status: 500 }
    );
  }
} 