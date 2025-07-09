"""端口管理模块"""
import socket
import psutil
import json
import os
from typing import Optional, Tuple

class PortManager:
    def __init__(self, config_file: str = "port_config.json"):
        self.config_file = config_file
        self.port_config = self._load_config()

    def _load_config(self) -> dict:
        """加载端口配置"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {"last_port": None}

    def _save_config(self, port: int):
        """保存端口配置"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump({"last_port": port}, f)
        except:
            pass

    def _is_port_in_use(self, port: int) -> Tuple[bool, Optional[int]]:
        """检查端口是否被占用，返回(是否占用, 进程ID)"""
        try:
            # 使用更简单的socket检查方法
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                result = s.connect_ex(('localhost', port))
                if result == 0:
                    # 端口被占用，尝试找到占用的进程
                    try:
                        for proc in psutil.process_iter(['pid', 'name']):
                            try:
                                # 修复：直接调用connections()方法而不是通过info字典
                                connections = proc.connections()
                                for conn in connections:
                                    if hasattr(conn, 'laddr') and conn.laddr.port == port:
                                        return True, proc.info['pid']
                            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                                continue
                        return True, None  # 端口被占用但找不到进程
                    except Exception:
                        return True, None  # 端口被占用但查找进程时出错
                else:
                    return False, None  # 端口可用
        except Exception:
            # 如果socket检查失败，假设端口可用
            return False, None

    def _kill_process(self, pid: int) -> bool:
        """终止进程"""
        try:
            process = psutil.Process(pid)
            process.terminate()
            process.wait(timeout=3)
            return True
        except:
            return False

    def find_available_port(self, start_port: int, end_port: int) -> Optional[int]:
        """在指定范围内查找可用端口"""
        for port in range(start_port, end_port + 1):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('', port))
                    return port
            except:
                continue
        return None

    def get_port(self, preferred_port: int, port_range: Tuple[int, int]) -> int:
        """获取可用端口"""
        # 1. 尝试使用上次的端口
        last_port = self.port_config.get("last_port")
        if last_port:
            is_used, pid = self._is_port_in_use(last_port)
            if not is_used:
                self._save_config(last_port)
                return last_port
            elif pid and self._kill_process(pid):
                self._save_config(last_port)
                return last_port

        # 2. 尝试使用首选端口
        is_used, pid = self._is_port_in_use(preferred_port)
        if not is_used:
            self._save_config(preferred_port)
            return preferred_port
        elif pid and self._kill_process(pid):
            self._save_config(preferred_port)
            return preferred_port

        # 3. 在端口范围内查找可用端口
        available_port = self.find_available_port(*port_range)
        if available_port:
            self._save_config(available_port)
            return available_port

        raise RuntimeError(f"无法找到可用端口在范围 {port_range[0]}-{port_range[1]}") 