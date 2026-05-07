
// Весь код обёрнут в IIFE (Immediately Invoked Function Expression).
// Это изолирует переменные от глобальной области видимости,
// чтобы они не конфликтовали с другими скриптами на странице.
// (() => { ... })(); — стрелочная функция, вызываемая сразу.
// ======================================================

(() => {

    // "use strict" включает строгий режим JS:
    // — запрещает необъявленные переменные
    // — делает ошибки явными (не молчит)
    // — улучшает производительность движка
    "use strict";

    // ======================================================
    // ⚙️ УТИЛИТЫ
    // ======================================================

    // 🔹 throttle — функция-ограничитель частоты вызовов.
    // Принимает: fn — целевая функция, delay — минимальный интервал в мс.
    // Возвращает: обёрнутую функцию, которая вызывает fn не чаще раза в delay мс.
    // Используется для оптимизации scroll-событий (иначе они срабатывают сотни раз в секунду).
    function throttle(fn, delay) {
        // last хранит timestamp последнего успешного вызова
        // начальное значение 0 — первый вызов всегда пройдёт
        let last = 0;

        // Возвращаем новую функцию, которая запоминает аргументы через rest-параметр ...args
        return (...args) => {
            // Date.now() возвращает текущее время в миллисекундах
            const now = Date.now();

            // Если с прошлого вызова прошло достаточно времени — выполняем
            if (now - last >= delay) {
                last = now;    // обновляем метку времени
                fn(...args);   // вызываем оригинальную функцию с переданными аргументами
            }
        };
    }


    // ======================================================
    //  DOM  — ГЛАВНАЯ ТОЧКА ВХОДА
    // ======================================================
    // DOMContentLoaded срабатывает, когда HTML полностью разобран.
    // Мы не используем window.onload, потому что нам не нужно ждать
    // загрузки картинок и прочих ресурсов.
    document.addEventListener("DOMContentLoaded", () => {

        // Вызываем все модули инициализации по порядку
        initToggleGenres();      // 1. кнопка показать/скрыть жанры
        initSectionAnimation();  // 2. анимация появления секций при скролле
        initActiveLinks();       // 3. подсветка активной ссылки в sidebar    
        initSearch();            // 5. поиск по тексту с подсветкой
        initGuitar();            // 6. гитара: анимация качания + звук
        loadGenresFromXML();     // 7. загрузка жанров из XML-файла

    });


    //  1. ПОКАЗ / СКРЫТИЕ СПИСКА ЖАНРОВ
  
    function initToggleGenres() {

        // Находим кнопку по id="toggleBtn"
        const btn  = document.getElementById("toggleBtn");

        // Находим список жанров по id="genreList"
        const list = document.getElementById("genreList");

        // Защита: если кнопка или список не найдены — выходим из функции
        // Это предотвращает ошибки TypeError при работе с null
        if (!btn || !list) return;

        // Добавляем обработчик клика на кнопку
        btn.addEventListener("click", () => {

            // classList.toggle добавляет класс, если его нет, и убирает, если есть
            list.classList.toggle("active");

            // Меняем текст кнопки в зависимости от текущего состояния списка
            // Тернарный оператор: условие ? значение_если_true : значение_если_false
            btn.textContent = list.classList.contains("active")
                ? "Скрыть"    // класс "active" есть → список открыт → кнопка "Скрыть"
                : "Показать"; // класса нет → список скрыт → кнопка "Показать"
        });
    }



// Анимация появления секций при прокрутке страницы
function initSectionAnimation() {

    // Получаем все секции на странице
    const sections = document.querySelectorAll("section");

    // Создаём наблюдатель (IntersectionObserver)
    const observer = new IntersectionObserver((entries, obs) => {

        // entries — массив элементов, которые изменили видимость
        entries.forEach(entry => {

            // Если секция попала в область видимости
            if (entry.isIntersecting) {

                // Добавляем класс .show → запускается CSS-анимация
                entry.target.classList.add("show");

                // Прекращаем наблюдение за этой секцией
                // чтобы не тратить ресурсы
                obs.unobserve(entry.target);
            }
        });

    }, {
        // Срабатывает, когда видно хотя бы 10% секции
        threshold: 0.1
    });

    // Подключаем observer ко всем секциям
    sections.forEach(section => observer.observe(section));
}



    //  3. АКТИВНЫЕ ССЫЛКИ В SIDEBAR

    // Подсвечивает ссылку в сайдбаре, если соответствующая секция
    // находится в зоне видимости при скролле.
    function initActiveLinks() {

        // Выбираем все ссылки <a> внутри элементов с классом .info-box1
        const links = document.querySelectorAll(".info-box1 a");

        // Защита: нет ссылок — выходим
        if (!links.length) return;

        // Для каждой ссылки находим соответствующую секцию по href.
        // Например: href="#history" → document.querySelector("#history")
        // Array.from преобразует NodeList в массив, чтобы использовать .map()
        const sections = Array.from(links).map(link =>
            document.querySelector(link.getAttribute("href")) // может вернуть null
        );

        // Функция, определяющая, какая секция сейчас активна
        function updateActiveLink() {

            // scrollY — текущая позиция прокрутки страницы (пиксели от верха)
            const scrollY = window.scrollY;

            // Перебираем все секции с их индексами
            sections.forEach((section, i) => {

                // Пропускаем null (если секция не найдена по href)
                if (!section) return;

                // offsetTop — расстояние от верха документа до начала секции
                // Вычитаем 140px — это "зона захвата" (чтобы активировалась чуть раньше)
                const offset = section.offsetTop - 140;

                // offsetHeight — высота секции в пикселях
                const height = section.offsetHeight;

                // Проверяем: скролл находится в диапазоне [начало секции; конец секции]
                const isActive =
                    scrollY >= offset &&          // прокрутили до начала секции
                    scrollY < offset + height;    // ещё не прокрутили до следующей

                // toggle(className, force) добавляет класс если force=true, убирает если false
                links[i].classList.toggle("active", isActive);
            });
        }

        // Слушаем событие прокрутки с throttle(100мс) для производительности.
        // Без throttle функция бы вызывалась ~60 раз в секунду при скролле.
        window.addEventListener("scroll", throttle(updateActiveLink, 100));
    }


    
    //  4. CANVAS ФОН 
    
    // Рисует движущиеся точки и соединяет близкие из них линиями.
    (function initUnifiedCanvas() {
        const canvas = document.getElementById("bgCanvas");
        if (!canvas) return; // нет canvas — выходим

        const ctx = canvas.getContext("2d");

        /* --- Размер canvas === размер окна --- */
        function resize() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize, { passive: true });


        /* 
           ЧАСТИЦЫ (фоновые точки)*/

        let particles = [];

        // Создаём массив из count случайных частиц
        function createParticles(count = 80) {
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x:      Math.random() * canvas.width,    // случайная X
                    y:      Math.random() * canvas.height,   // случайная Y
                    size:   Math.random() * 2 + 0.5,         // радиус 0.5–2.5px
                    speedX: (Math.random() - 0.5) * 0.4,    // скорость по X (−0.2..+0.2)
                    speedY: (Math.random() - 0.5) * 0.4     // скорость по Y
                });
            }
        }
        createParticles();


        /* 
           МУЗЫКАЛЬНЫЕ НОТЫ */

        // Набор музыкальных символов Unicode
        const NOTE_SYMBOLS = ['♩', '♪', '♫', '♬', '𝄞', '𝄢', '𝅗𝅥'];
        const NOTE_COUNT   = 20; // сколько нот одновременно на экране
        let   notes        = [];

        // Создаём одну ноту со случайными параметрами
        function createNote(randomY = false) {
            return {
                x:           Math.random() * canvas.width,
                // randomY=true — для инициализации (разброс по всей высоте),
                // false — для перерождения (нота появляется снизу)
                y:           randomY ? Math.random() * canvas.height : canvas.height + 20,
                symbol:      NOTE_SYMBOLS[Math.floor(Math.random() * NOTE_SYMBOLS.length)],
                size:        12 + Math.random() * 16,          // 12–28px
                opacity:     0,                                  // начинаем невидимой
                maxOpacity:  0.08 + Math.random() * 0.18,      // предел прозрачности
                state:       'fadein',                          // fadein → visible → fadeout
                fadeSpeed:   0.003 + Math.random() * 0.005,    // скорость смены прозрачности
                speedY:      0.25 + Math.random() * 0.45,      // скорость подъёма вверх
                wobbleAmp:   8 + Math.random() * 15,           // амплитуда горизонтального покачивания
                wobbleFreq:  0.015 + Math.random() * 0.025,    // частота покачивания
                wobblePhase: Math.random() * Math.PI * 2,      // начальная фаза (десинхронизация)
                rotation:    (Math.random() - 0.5) * 0.01,     // медленное вращение
                angle:       (Math.random() - 0.5) * 0.4       // начальный угол наклона
            };
        }

        // Инициализация: ноты разбросаны по всей высоте экрана
        for (let i = 0; i < NOTE_COUNT; i++) {
            const note  = createNote(true);
            note.opacity = Math.random() * note.maxOpacity; // случайная начальная прозрачность
            note.state   = 'visible';                        // сразу видимые
            notes.push(note);
        }

        // Ускоряем ноты при скролле пользователя (небольшой буст)
        let scrollBoost = 0;
        window.addEventListener('scroll', () => {
            scrollBoost = 0.8; // добавляем 0.8px/кадр при скролле
        }, { passive: true });


        /* 
           ОСНОВНОЙ ЦИКЛ ОТРИСОВКИ
           Единый RAF-цикл: частицы → линии → ноты */
        function draw() {

            // ── Очистка ── один clearRect на кадр для всех слоёв
            ctx.clearRect(0, 0, canvas.width, canvas.height);


            // ── Слой 1: Частицы (белые точки) ──
            particles.forEach(p => {
                // Двигаем частицу
                p.x += p.speedX;
                p.y += p.speedY;

                // Отражаем от границ canvas (эффект «бильярдного шара»)
                if (p.x < 0 || p.x > canvas.width)  p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height)  p.speedY *= -1;

                // Рисуем кружок
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.25)";
                ctx.fill();
            });


            // ── Слой 2: Линии между близкими частицами ──
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx   = particles[i].x - particles[j].x;
                    const dy   = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy); // расстояние между частицами

                    if (dist < 110) { // линия видна только если частицы достаточно близко
                        ctx.beginPath();
                        ctx.strokeStyle = "rgba(255,255,255,0.10)";
                        ctx.lineWidth   = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }


            // ── Слой 3: Музыкальные ноты ──

            // Плавно снижаем скролл-буст каждый кадр
            if (scrollBoost > 0) scrollBoost *= 0.92;

            notes.forEach((note, i) => {

                // Движение: вверх + горизонтальное покачивание
                note.y           -= note.speedY + scrollBoost;
                note.wobblePhase += note.wobbleFreq;
                note.x           += Math.sin(note.wobblePhase) * 0.4;
                note.angle       += note.rotation;

                // Управление прозрачностью (три состояния)
                if (note.state === 'fadein') {
                    note.opacity += note.fadeSpeed; // нарастаем
                    if (note.opacity >= note.maxOpacity) {
                        note.opacity = note.maxOpacity;
                        note.state   = 'visible'; // достигли максимума
                    }
                } else if (note.state === 'visible') {
                    // Когда нота поднялась выше 30% высоты экрана — начинаем гасить
                    if (note.y < canvas.height * 0.3) {
                        note.state = 'fadeout';
                    }
                } else if (note.state === 'fadeout') {
                    note.opacity -= note.fadeSpeed * 1.5; // гасим быстрее, чем появлялись
                }

                // Нота вышла за верхний край или полностью прозрачна → перерождаем
                if (note.y < -30 || note.opacity <= 0) {
                    notes[i] = createNote(false); // новая нота снизу
                    return;
                }

                // Рисуем ноту с поворотом
                ctx.save();
                ctx.translate(note.x, note.y);       // двигаем начало координат в позицию ноты
                ctx.rotate(note.angle);               // поворачиваем
                ctx.globalAlpha = Math.max(0, note.opacity); // прозрачность (не ниже 0)
                ctx.fillStyle   = 'rgba(255, 255, 255, 1)';
                ctx.font        = `${note.size}px serif`;
                ctx.textAlign   = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(note.symbol, 0, 0);
                ctx.restore(); // возвращаем состояние контекста
            });


            requestAnimationFrame(draw); // следующий кадр
        }

        draw(); // запускаем единый цикл

    })(); 



// Поиск по странице с подсветкой найденных слов
function initSearch() {

    // Находим поле ввода
    const searchInput = document.getElementById("searchInput");

    // Если поля нет — выходим, чтобы избежать ошибок
    if (!searchInput) return;

    // Берём все текстовые элементы, по которым будем искать
    const elements = document.querySelectorAll("section p, section li");

    // Сохраняем исходный HTML каждого элемента
    // Это важно, чтобы потом можно было вернуть текст без подсветки
    elements.forEach(el => {
        el.dataset.original = el.innerHTML;
    });

    // Срабатывает при каждом вводе текста
    searchInput.addEventListener("input", () => {

        // Получаем текст поиска (в нижнем регистре и без лишних пробелов)
        const query = searchInput.value.toLowerCase().trim();

        elements.forEach(el => {

            // Берём оригинальный HTML
            const original = el.dataset.original;

            // Если строка пустая — просто возвращаем исходный текст
            if (!query) {
                el.innerHTML = original;
                return;
            }

            // Экранируем спецсимволы, чтобы не ломать регулярное выражение
            const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            // Создаём регулярное выражение для поиска (без учёта регистра)
            const regex = new RegExp(`(${safeQuery})`, "gi");

            // Заменяем найденные совпадения, оборачивая их в span с классом highlight
            el.innerHTML = original.replace(
                regex,
                `<span class="highlight">$1</span>`
            );
        });
    });
}





//  ЛОГИКА ВЗАИМОДЕЙСТВИЯ С ГИТАРОЙ

function initGuitar() {

    // Находим элемент гитары по id="guitar"
    // Это <img>, на которое  кликаем
    const guitar = document.getElementById("guitar");

    //  Находим аудио-элемент по id="guitarSound"
    // Это <audio>, который будет воспроизводить звук
    const sound = document.getElementById("guitarSound");

    //  Защита от ошибок:
    // если по какой-то причине элементов нет в HTML —
    // просто выходим из функции, чтобы не было TypeError
    if (!guitar || !sound) return;


    
    //  ОБРАБОТЧИК КЛИКА ПО ГИТАРЕ
    
    guitar.addEventListener("click", () => {

        
        //  ПЕРЕЗАПУСК CSS-АНИМАЦИИ КАЧАНИЯ (swing)

        //  Убираем класс "swing"
        // Это останавливает текущую анимацию (если она уже играла)
        guitar.classList.remove("swing");

    
        // Обращение к offsetWidth заставляет браузер пересчитать layout
        // Без этого remove + add могут "склеиться" и анимация не перезапустится
        void guitar.offsetWidth;

        // Снова добавляем класс "swing"
        // Теперь анимация гарантированно запускается заново
        guitar.classList.add("swing");


        //  ВОСПРОИЗВЕДЕНИЕ ЗВУКА


        //  Сбрасываем звук в начало
        // Это важно, если пользователь кликает быстро несколько раз
        sound.currentTime = 0;

        // Устанавливаем громкость (от 0.0 до 1.0)
        sound.volume = 0.5;

        //  Запускаем воспроизведение
        // Пользователь уже кликнул → браузер разрешает звук
        sound.play();


        //  ЭФФЕКТ "УДАРА" 

        // Мгновенно увеличиваем гитару
        // Создаёт ощущение, что по ней "ударили"
        guitar.style.transform = "scale(1.15)";

        // ⏱ Через 150 миллисекунд возвращаем обратно
        // setTimeout — асинхронная задержка
        setTimeout(() => {
            guitar.style.transform = "";
        }, 150);

    });
}




    //  ЗАГРУЗКА ЖАНРОВ ИЗ XML-ФАЙЛА

    // Загружает файл data/index.xml, парсит его и
    // динамически создаёт элементы <li> в списке жанров.
    function loadGenresFromXML() {

        // fetch() — Fetch API для асинхронных HTTP-запросов.
        // Возвращает Promise с объектом Response.
        fetch("data/index.xml")

            // Первый .then: получаем ответ сервера
            .then(response => {

                // response.ok = true, если статус 200-299
                // Если файл не найден (404) — явно бросаем ошибку
                if (!response.ok) {
                    throw new Error("XML не найден");
                }

                // response.text() возвращает тело ответа как строку
                // (используем text(), а не json(), т.к. XML это не JSON)
                return response.text();
            })

            // Второй .then: работаем с текстом XML
            .then(data => {

                // DOMParser позволяет парсить XML/HTML-строку в DOM-дерево
                const parser = new DOMParser();

                // parseFromString(строка, тип) — парсим XML
                // Результат: Document-объект, как обычный HTML-документ
                const xml = parser.parseFromString(data, "text/xml");

                // getElementsByTagName("genre") — возвращает HTMLCollection всех тегов <genre>
                const genres = xml.getElementsByTagName("genre");

                // Находим контейнер списка в HTML-документе
                const list = document.getElementById("genreList");

                // Защита: если список не найден — выходим
                if (!list) return;

                // Очищаем список перед заполнением
                // (на случай повторного вызова функции)
                list.innerHTML = "";

                // Перебираем все элементы <genre> в XML
                // getElementsByTagName возвращает HTMLCollection — итерируем через for
                for (let i = 0; i < genres.length; i++) {

                    // Получаем текстовое содержимое тега <name> внутри текущего <genre>
                    // [0] — берём первый элемент (он всегда один)
                    // .textContent — только текст, без HTML-тегов
                    const name = genres[i]
                        .getElementsByTagName("name")[0]
                        .textContent;

                    // Аналогично для тега <description>
                    const desc = genres[i]
                        .getElementsByTagName("description")[0]
                        .textContent;

                    // Создаём новый элемент <li> в DOM
                    const li = document.createElement("li");

                    // Устанавливаем HTML-содержимое: жирное название + описание
                    li.innerHTML = `<strong>${name}</strong> — ${desc}`;

                    // Добавляем <li> в конец списка <ul>
                    list.appendChild(li);
                }

            })

            // .catch: обрабатываем любые ошибки (сеть недоступна, XML не найден и т.д.)
            .catch(error => {
                // console.error выводит ошибку красным в консоли браузера
                console.error("Ошибка загрузки XML:", error);
            });
    }

// Конец IIFE — функция вызывается сразу после объявления
})();