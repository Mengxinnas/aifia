import { NextRequest, NextResponse } from 'next/server';

// DeepSeek API配置
const DEEPSEEK_API_KEY = "sk-c0c506ed07dc47a6b3713506a2ebd3c3";
const DEEPSEEK_API_BASE = "https://api.deepseek.com/v1";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: '问题不能为空' },
        { status: 400 }
      );
    }

    // 1. 从向量数据库检索相关上下文
    const contextResponse = await fetch('http://localhost:8000/api/financial_qa/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: question,
        max_context_length: 2000 
      }),
    });

    let context = '';
    if (contextResponse.ok) {
      const contextResult = await contextResponse.json();
      context = contextResult.context || '';
    }

    // 2. 构建系统提示词
    const systemPrompt = `你是一个专业的财务分析助手。请基于以下文档内容回答用户的问题。

文档内容：
${context}

请注意：
1. 只基于提供的文档内容回答问题
2. 如果文档中没有相关信息，请明确说明
3. 回答要准确、专业，并提供具体的数据支持
4. 使用中文回答`;

    // 3. 调用DeepSeek API生成回答
    const payload = {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    };

    const deepseekResponse = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API错误:', errorText);
      throw new Error(`AI服务调用失败: ${deepseekResponse.status}`);
    }

    const aiResult = await deepseekResponse.json();
    const answer = aiResult.choices[0].message.content;

    // 4. 获取相关文档片段信息
    const sourceResponse = await fetch('http://localhost:8000/api/financial_qa/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: question,
        top_k: 3,
        return_metadata: true
      }),
    });

    let sources = [];
    if (sourceResponse.ok) {
      const sourceResult = await sourceResponse.json();
      sources = sourceResult.results || [];
    }

    return NextResponse.json({
      success: true,
      answer,
      sources,
      context_used: context.length > 0,
      question
    });

  } catch (error) {
    console.error('问答处理错误:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '问答处理失败',
        success: false 
      },
      { status: 500 }
    );
  }
} 