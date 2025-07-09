from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import qa

app = FastAPI(
    title="Fia API",
    description="Fia金融智能助手API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(qa.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Fia API"} 