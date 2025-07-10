import fs from 'fs';
import path from 'path';

export function getBackendUrl(): string {
    // 生产环境使用环境变量
    if (process.env.NODE_ENV === 'production') {
        return process.env.BACKEND_URL || 'https://your-backend.vercel.app';
    }
    
    // 开发环境保持原逻辑
    try {
        const portFile = path.join(process.cwd(), 'backend', 'port.txt');
        const port = fs.existsSync(portFile) 
            ? fs.readFileSync(portFile, 'utf-8').trim()
            : '8000';
        return `http://localhost:${port}`;
    } catch (error) {
        console.warn('无法读取后端端口配置，使用默认端口8000');
        return 'http://localhost:8000';
    }
} 