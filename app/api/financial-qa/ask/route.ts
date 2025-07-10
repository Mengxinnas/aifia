import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../api-config';

const PYTHON_BACKEND_URL = getBackendUrl();
// 使用环境变量管理API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';

export async function POST(request: NextRequest) {
  try {
    // 检查API密钥是否配置
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY未配置');
      return NextResponse.json(
        { 
          success: false,
          error: 'API配置错误：缺少API密钥' 
        },
        { status: 500 }
      );
    }

    const { question } = await request.json();
    
    console.log('=== 问答API调试信息 ===');
    console.log('问题:', question);
    console.log('DEEPSEEK_API_KEY已配置:', !!DEEPSEEK_API_KEY);
    console.log('DEEPSEEK_API_BASE:', DEEPSEEK_API_BASE);
    
    if (!question || !question.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: '问题不能为空' 
        },
        { status: 400 }
      );
    }

    // 调用Python后端获取相关文本
    console.log('调用后端URL:', `${PYTHON_BACKEND_URL}/ask`);
    const response = await fetch(`${PYTHON_BACKEND_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: question.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '查询相关文本失败');
    }

    const result = await response.json();
    console.log('后端返回结果:', result.success);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message || '查询失败',
      });
    }

    // 获取相关文本
    const context = result.answer.context;
    
    if (!context || !context.trim()) {
      return NextResponse.json({
        success: false,
        error: '未找到相关文档内容',
      });
    }

    console.log('开始调用DeepSeek API');
    
    // 使用相关文本构建prompt并调用DeepSeek生成回答
    const systemPrompt = `你是一个专业的财务分析助手。请基于以下文档内容回答用户的问题。

文档内容：
${context}

要求：
1. 只基于上述文档内容回答
2. 如果文档中没有相关信息，请明确说明
3. 引用具体的数据和文件来源
4. 使用中文回答`;

    const aiResponse = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
    });

    console.log('DeepSeek API响应状态:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      console.error('DeepSeek API错误:', errorData);
      
      return NextResponse.json({
        success: true,
        answer: `基于您上传的文档，我找到了以下相关内容：

${context}

注意：AI 分析服务暂时不可用（${errorData.error || 'API调用失败'}），显示的是原始搜索结果。`,
        sources: result.answer.relevant_chunks,
        context_used: true,
      });
    }

    const aiResult = await aiResponse.json();
    console.log('DeepSeek API调用成功');
    
    return NextResponse.json({
      success: true,
      answer: aiResult.choices[0].message.content,
      sources: result.answer.relevant_chunks,
      context_used: true,
    });

  } catch (error) {
    console.error('问答处理错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '处理失败'
      },
      { status: 500 }
    );
  }
} 