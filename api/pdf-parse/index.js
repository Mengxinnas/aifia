const AdvancedPDFParser = require('./parser');
const formidable = require('formidable');
const fs = require('fs');

const parser = new AdvancedPDFParser();

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    // 解析上传的文件
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB 限制
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '未找到上传的文件' });
    }

    // 读取文件内容
    const buffer = fs.readFileSync(file.filepath);
    
    // 获取解析选项
    const parseType = fields.parse_type?.[0] || 'general';
    const useAdvanced = fields.use_advanced?.[0] === 'true';
    
    console.log(`解析PDF文件: ${file.originalFilename}, 类型: ${parseType}, 高级: ${useAdvanced}`);

    // 执行解析
    const result = await parser.smartParse(buffer, {
      parseType,
      priority: useAdvanced ? 'quality' : 'speed'
    });

    // 清理临时文件
    fs.unlinkSync(file.filepath);

    // 返回结果
    res.status(200).json({
      success: true,
      filename: file.originalFilename,
      ...result
    });

  } catch (error) {
    console.error('PDF 解析错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 