from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DEEPSEEK_API_KEY: str = "sk-0fbeeaa8b1314332b0b331a0e0960bca"
    DEEPSEEK_API_BASE: str = "https://api.deepseek.com/v1"
    
settings = Settings() 