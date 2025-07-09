import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { documentStore } from '@/app/lib/document-store';
import { getBackendUrl } from '../api-config';

const PYTHON_BACKEND_URL = getBackendUrl();

// 文件解析函数
async function parseFile(file: File): Promise<string> {
  const filename = file.name.toLowerCase();
  
  try {
    if (filename.endsWith('.txt')) {
      return await file.text();
    }
    
    if (filename.endsWith('.csv')) {
      const text = await file.text();
      return text;
    }
    
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      let content = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_csv(worksheet);
        content += `工作表: ${sheetName}\n${sheetData}\n\n`;
      });
      
      return content;
    }
    
    if (filename.endsWith('.pdf')) {
      // PDF解析需要特殊处理，这里返回提示信息
      return `PDF文件: ${file.name}\n注意：PDF文件解析需要专门的库支持。当前返回文件信息。`;
    }
    
    // 其他格式尝试作为文本处理
    return await file.text();
    
  } catch (error) {
    console.error(`解析文件 ${file.name} 失败:`, error);
    throw new Error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 文本分块函数
function chunkText(text: string, chunkSize: number = 500): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    if (currentChunk.length + line.length <= chunkSize) {
      currentChunk += line + '\n';
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = line + '\n';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 20); // 过滤过短的块
}

// 提取关键词
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  
  // 财务相关关键词匹配
  const financialTerms = [
    '收入', '支出', '利润', '成本', '费用', '资产', '负债', '现金流',
    '投资', '融资', '销售', '营业', '净利', '毛利', '税收', '折旧',
    '应收', '应付', '存货', '固定资产', '流动资产', '权益', '股本',
    '盈利', '亏损', '增长', '下降', '季度', '年度', '月份'
  ];
  
  financialTerms.forEach(term => {
    if (text.includes(term)) {
      keywords.add(term);
    }
  });
  
  // 提取数字相关信息
  const numberMatches = text.match(/\d+[,.]?\d*[万千亿元%]/g);
  if (numberMatches) {
    numberMatches.slice(0, 5).forEach(match => keywords.add(match));
  }
  
  return Array.from(keywords).slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 前端API开始处理上传请求 ===');
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log(`接收到 ${files.length} 个文件`);
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '没有上传文件' 
        },
        { status: 400 }
      );
    }

    const results = [];
    
    // 逐个处理文件
    for (const file of files) {
      try {
        console.log(`开始处理文件: ${file.name}, 大小: ${file.size} bytes`);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        
        console.log(`调用后端API: ${PYTHON_BACKEND_URL}/upload`);
        
        const response = await fetch(`${PYTHON_BACKEND_URL}/upload`, {
          method: 'POST',
          body: uploadFormData,
        });
        
        console.log(`后端响应状态: ${response.status}`);
        console.log(`后端响应头:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => '无法读取错误信息');
          console.error(`后端HTTP错误: ${response.status}, 内容: ${errorText}`);
          results.push({
            filename: file.name,
            status: 'error',
            error: `后端服务错误: HTTP ${response.status} - ${errorText}`
          });
          continue;
        }
        
        let result;
        try {
          const responseText = await response.text();
          console.log(`后端原始响应长度: ${responseText.length}`);
          console.log(`后端原始响应内容: ${responseText}`);
          
          if (!responseText.trim()) {
            console.error('后端返回空响应');
            results.push({
              filename: file.name,
              status: 'error',
              error: '后端返回空响应'
            });
            continue;
          }
          
          result = JSON.parse(responseText);
          console.log(`解析后的结果类型: ${typeof result}`);
          console.log(`解析后的结果:`, result);
          
        } catch (parseError) {
          console.error(`解析后端响应失败:`, parseError);
          console.error(`尝试解析的内容:`, await response.text().catch(() => '无法重新读取'));
          results.push({
            filename: file.name,
            status: 'error',
            error: `JSON解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`
          });
          continue;
        }
        
        // 详细检查result结构
        console.log(`result是否存在: ${result !== null && result !== undefined}`);
        console.log(`result类型: ${typeof result}`);
        console.log(`result.success存在: ${'success' in result}`);
        console.log(`result.success类型: ${typeof result.success}`);
        console.log(`result.success值: ${result.success}`);
        
        if (!result || typeof result !== 'object') {
          console.error(`后端返回非对象数据:`, result);
          results.push({
            filename: file.name,
            status: 'error',
            error: `后端返回非对象数据: ${typeof result}`
          });
          continue;
        }
        
        if (!('success' in result)) {
          console.error(`后端返回缺少success字段:`, Object.keys(result));
          results.push({
            filename: file.name,
            status: 'error',
            error: `后端返回缺少success字段，包含字段: ${Object.keys(result).join(', ')}`
          });
          continue;
        }
        
        if (!result.success) {
          console.error(`后端处理失败: ${file.name}`, result.message);
          results.push({
            filename: file.name,
            status: 'error',
            error: result.message || '后端处理失败'
          });
          continue;
        }
        
        // 成功处理
        const fileResult = {
          filename: file.name,
          status: 'success' as const,
          chunks_count: result.stats?.chunks_count || 1,
          text_length: result.stats?.text_length || 0
        };
        
        results.push(fileResult);
        console.log(`文件处理成功: ${file.name}`, fileResult);
        
      } catch (fileError) {
        console.error(`处理文件 ${file.name} 时出错:`, fileError);
        results.push({
          filename: file.name,
          status: 'error',
          error: fileError instanceof Error ? fileError.message : '网络或处理错误'
        });
      }
    }

    // 获取更新后的统计信息
    let stats = null;
    try {
      console.log('获取后端状态信息...');
      const statusResponse = await fetch(`${PYTHON_BACKEND_URL}/status`);
      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        if (statusResult && statusResult.success) {
          stats = statusResult.stats;
          console.log('状态信息获取成功:', stats);
        }
      }
    } catch (error) {
      console.warn('获取状态信息失败:', error);
    }

    const successCount = results.filter(r => r && r.status === 'success').length;
    console.log(`=== 处理完成: ${successCount}/${results.length} 个文件成功 ===`);

    const finalResult = {
      success: true,
      results: results,
      stats: stats,
      message: `处理完成: ${successCount}/${results.length} 个文件成功`
    };
    
    console.log('最终返回结果:', finalResult);

    return NextResponse.json(finalResult);
    
  } catch (error) {
    console.error('前端API处理错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '前端API处理失败',
        results: []
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const files = documentStore.getFileNames();
    const totalChunks = documentStore.getTotalChunks();

    const stats = {
      total_vectors: totalChunks,
      dimension: 384,
      total_chunks: totalChunks,
      files
    };

    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('获取统计信息错误:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '获取统计信息失败',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // 清空文档存储
    documentStore.clear();
    
    return NextResponse.json({
      success: true,
      message: '索引已清空'
    });
    
  } catch (error) {
    console.error('清空索引错误:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '清空索引失败',
        success: false 
      },
      { status: 500 }
    );
  }
} 