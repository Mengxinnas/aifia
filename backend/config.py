"""后端服务配置文件"""
import os
from typing import Dict, Any

# 基础配置
BASE_CONFIG: Dict[str, Any] = {
    "HOST": "0.0.0.0",
    "PORT": 8000,
    "PORT_RANGE": (8000, 8010),  # 可用端口范围
    "BACKUP_PORT": 8001,  # 备用端口
}

# 向量化配置
VECTOR_CONFIG: Dict[str, Any] = {
    "VECTOR_DIMENSION": 384,
    "CHUNK_SIZE": 1000,  # 增加块大小
    "MIN_CHUNK_LENGTH": 1,  # 降低最小块长度要求
}

# 文件处理配置
FILE_CONFIG: Dict[str, Any] = {
    "ALLOWED_EXTENSIONS": ('.txt', '.pdf', '.docx', '.xlsx', '.xls', '.csv'),
    "TEMP_DIR": "temp",
    "MAX_FILE_SIZE": 20 * 1024 * 1024,  # 增加到20MB
}

def ensure_temp_dir():
    """确保临时目录存在"""
    if not os.path.exists(FILE_CONFIG["TEMP_DIR"]):
        os.makedirs(FILE_CONFIG["TEMP_DIR"])

def get_temp_path(filename: str) -> str:
    """获取临时文件路径"""
    return os.path.join(FILE_CONFIG["TEMP_DIR"], f"temp_{filename}") 