// app/api/qa/ask/route.ts
import { NextResponse } from 'next/server';

// 使用环境变量管理API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com";

export async function POST(request: Request) {
  try {
    // 检查API密钥是否配置
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY未配置');
      return NextResponse.json(
        { error: 'API配置错误：缺少API密钥' },
        { status: 500 }
      );
    }

    const { question, context } = await request.json();
    
    console.log('调用DeepSeek V3流式模型:', question);

    const payload = {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: context || "您是一位专业的财务会计专家助手，请简洁准确地回答问题。"
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      top_p: 0.8,
      stream: true
    };

    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API错误:', response.status, errorText);
      return NextResponse.json(
        { error: `API请求失败: ${response.status}` },
        { status: response.status }
      );
    }

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let isClosed = false;

        if (!reader) {
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
          return;
        }

        try {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('API流式响应结束');
              if (!isClosed) {
                controller.close();
                isClosed = true;
              }
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // 按行处理缓冲区
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个不完整的行

            for (const line of lines) {
              const trimmedLine = line.trim();
              
              // 跳过空行和keep-alive
              if (!trimmedLine || trimmedLine === ': keep-alive') {
                continue;
              }
              
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim();
                
                if (data === '[DONE]') {
                  console.log('收到结束标记');
                  if (!isClosed) {
                    controller.close();
                    isClosed = true;
                  }
                  return;
                }

                if (data && data !== '') {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      console.log('发送内容片段:', content);
                      if (!isClosed) {
                        controller.enqueue(
                          new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                        );
                      }
                    }
                  } catch (parseError) {
                    console.log('解析数据失败:', data, parseError);
                    continue;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('流式处理错误:', error);
          if (!isClosed) {
            try {
              controller.error(error);
            } catch (controllerError) {
              console.error('Controller错误:', controllerError);
            }
            isClosed = true;
          }
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
    console.error('API调用错误:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '处理请求时出错'
      },
      { status: 500 }
    );
  }
}

// 替换现有的formatDate函数
const formatDate = (dateString: string) => {
  if (!isClient) {
    return "加载中..." // 服务器端显示占位符
  }
  
  try {
    const date = new Date(dateString)
    // ✅ 使用更稳定的时间格式
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    return "时间格式错误"
  }
}