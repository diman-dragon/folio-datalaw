# Changelog
## 0.0.1
- Каркас: Capacitor Android (`com.datalaw.folio`), GitHub Actions сборка, VS Code задачи
- Просмотр PDF (pdf.js, ленивый рендер страниц, pinch/кнопки zoom, переход на страницу, запоминание последней страницы)
- Библиотека документов внутри приложения (IndexedDB), «Открыть с помощью Folio» (intent VIEW application/pdf)
- Темы: светлая (песочный + тёмно-коричневый), тёмная (чистый AMOLED); ночной режим страниц PDF
- Языки: авто / ru / en
- Реестр форматов (`formats/registry.js`) — точка расширения для будущих модулей
- Проверки контракта: `npm run check`
