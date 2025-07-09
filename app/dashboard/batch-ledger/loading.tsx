export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
          🐷
        </div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  )
}
