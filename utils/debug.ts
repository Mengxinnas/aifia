// 调试工具函数
export const debugAPI = {
  // 测试上传API
  testUpload: async (file: File) => {
    const formData = new FormData()
    formData.append('files', file)
    
    try {
      const response = await fetch('/api/financial-qa/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      console.log('上传测试结果:', result)
      return result
    } catch (error) {
      console.error('上传测试失败:', error)
      return null
    }
  },

  // 测试问答API
  testQA: async (question: string) => {
    try {
      const response = await fetch('/api/financial-qa/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })
      const result = await response.json()
      console.log('问答测试结果:', result)
      return result
    } catch (error) {
      console.error('问答测试失败:', error)
      return null
    }
  }
}

// 在浏览器控制台中使用
// window.debugAPI = debugAPI 