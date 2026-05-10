export default function TestPage() {
  return (
    <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Сервер работает!
        </h1>
        <p className="text-gray-400 mb-2">
          IP: 172.20.10.3:3000
        </p>
        <p className="text-emerald-400 mb-8 text-sm">
          Если вы видите эту страницу, значит сервер доступен по сети
        </p>
        <div className="space-y-3">
          <a 
            href="/map" 
            className="block bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition"
          >
            🗺️ Открыть карту
          </a>
          <a 
            href="/auth/signin" 
            className="block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
          >
            🔐 Войти
          </a>
          <a 
            href="/profile" 
            className="block bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition"
          >
            👤 Профиль
          </a>
          <a 
            href="/" 
            className="block bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition"
          >
            🏠 Главная
          </a>
        </div>
        <div className="mt-8 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
          <p className="text-emerald-400 text-sm">
            💡 Если главная страница не загружается, используйте эти ссылки
          </p>
        </div>
      </div>
    </div>
  );
}
