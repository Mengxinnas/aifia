import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../../financial-qa/api-config';

const PYTHON_BACKEND_URL = getBackendUrl();
const DEEPSEEK_API_KEY = "sk-c0c506ed07dc47a6b3713506a2ebd3c3";
const DEEPSEEK_API_BASE = "https://api.deepseek.com";

export async function POST(request: NextRequest) {
  try {
    const { analysis_type, company_name } = await request.json();
    
    console.log('=== 直接流式财务分析API请求开始 ===');
    console.log('分析类型:', analysis_type);
    console.log('公司名称:', company_name);
    
    // 首先获取已上传的文档内容
    const statusResponse = await fetch(`${PYTHON_BACKEND_URL}/status`);
    if (!statusResponse.ok) {
      throw new Error('无法连接到后端服务');
    }
    
    const statusResult = await statusResponse.json();
    if (!statusResult.success || statusResult.data.document_count === 0) {
      throw new Error('请先上传财务数据文件');
    }
    
    // 获取文档内容 - 调用后端的获取文档接口
    const docsResponse = await fetch(`${PYTHON_BACKEND_URL}/documents`);
    if (!docsResponse.ok) {
      throw new Error('获取文档内容失败');
    }
    
    const docsResult = await docsResponse.json();
    if (!docsResult.success || !docsResult.data.documents) {
      throw new Error('文档内容为空');
    }
    
    // 组合所有文档内容
    let allText = "";
    docsResult.data.documents.forEach((doc: any) => {
      allText += `\n\n=== 文件: ${doc.filename} ===\n`;
      allText += doc.text;
    });
    
    console.log('文档内容长度:', allText.length);
    
    // 构建分析模板
    const getAnalysisTemplate = (analysisType: string) => {
      switch (analysisType) {
        case 'comprehensive':
          return `你是一位资深的财务分析师，请基于提供的财务数据文档生成一份专业的综合财务分析报告。

请直接分析文档内容，按照以下结构输出：

# 财务分析报告

## 1. 执行摘要
- 核心发现和结论
- 主要风险点
- 关键建议

## 2. 财务状况分析
- 资产负债结构分析
- 盈利能力评估
- 现金流状况

## 3. 经营能力分析
- 营运效率评估
- 成长能力分析
- 市场竞争力

## 4. 风险评估
- 财务风险识别
- 经营风险分析
- 风险控制建议

## 5. 投资建议
- 投资价值评估
- 改进建议
- 未来展望

请确保分析专业、客观，基于实际数据得出结论。`;
        case 'profitability':
          return `请专门针对盈利能力进行深度分析：

# 盈利能力专项分析

## 1. 收入质量分析
## 2. 成本控制效果
## 3. 利润率变化趋势
## 4. 盈利能力行业对比
## 5. 盈利能力改善建议`;
        case 'liquidity':
          return `请专门针对流动性和偿债能力进行分析：

# 流动性与偿债能力分析

## 1. 短期流动性分析
## 2. 长期偿债能力
## 3. 现金流量充足性
## 4. 债务结构合理性
## 5. 偿债风险评估`;
        case 'efficiency':
          return `请专门针对营运效率进行分析：

# 营运效率专项分析

## 1. 资产利用效率
## 2. 存货管理效率
## 3. 应收账款管理
## 4. 供应链效率
## 5. 运营效率改善建议`;
        default:
          return `请对提供的财务数据进行专业分析，生成结构化的财务分析报告。`;
      }
    };
    
    const template = getAnalysisTemplate(analysis_type);
    const textSummary = allText.length > 5000 ? allText.substring(0, 5000) + "..." : allText;
    
    const analysisPrompt = `${template}

基于以下财务文档内容进行分析：

${textSummary}

请直接对文档内容进行专业分析，生成结构化的财务分析报告。
要求：
1. 使用markdown格式
2. 结构清晰，层次分明
3. 基于实际数据进行分析
4. 提供具体可行的建议
5. 用中文输出`;

    // 调用DeepSeek流式API
    const payload = {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "你是一位专业的财务分析师，擅长财务报表分析和企业经营分析。请提供专业、客观、实用的财务分析报告。"
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      stream: true
    };

    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API错误:', response.status, errorText);
      throw new Error(`API请求失败: ${response.status}`);
    }

    // 创建ReadableStream来处理流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          // 发送开始状态
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'status', message: '开始分析财务数据...' })}\n\n`)
          );
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'analysis_start' })}\n\n`)
          );

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // 发送完成状态
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ type: 'analysis_complete' })}\n\n`)
              );
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ type: 'analysis_complete' })}\n\n`)
                  );
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    // 发送内容块到前端
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ type: 'analysis_chunk', content })}\n\n`)
                    );
                  }
                } catch (parseError) {
                  // 忽略解析错误，继续处理下一行
                  continue;
                }
              }
            }
          }
        } catch (error) {
          console.error('流式处理错误:', error);
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'error', message: `分析失败: ${error.message}` })}\n\n`)
          );
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('直接流式财务分析API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '处理失败'
      },
      { status: 500 }
    );
  }
} 