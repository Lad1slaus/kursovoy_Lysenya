
document.addEventListener("DOMContentLoaded", () => {


    /* 
       1. АНИМАЦИЯ ПОЯВЛЕНИЯ СЕКЦИЙ
       
       IntersectionObserver отслеживает каждую <section>.
       Когда секция появляется в viewport хотя бы на 10%,
       добавляем CSS-класс .show → запускается плавный
       transition (opacity + translateY), заданный в CSS.
       После срабатывания отписываемся (obs.unobserve),
       чтобы не тратить ресурсы на уже показанные секции.
       */
    const sections = document.querySelectorAll("section");

    const sectionObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {            // секция вошла в зону видимости
                entry.target.classList.add("show"); // запускаем CSS-анимацию
                obs.unobserve(entry.target);        // больше не следим за этой секцией
            }
        });
    }, {
        threshold: 0.1 // 10% секции должно быть видно для срабатывания
    });

    // Подключаем наблюдатель ко всем секциям
    sections.forEach(section => sectionObserver.observe(section));


    /* 
       2. ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРНЫМ ССЫЛКАМ
       
       Находим все ссылки вида href="#some-id".
       При клике предотвращаем стандартный прыжок
       и плавно прокручиваем к целевому элементу.
        */
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href"); // получаем "#id"
            const targetEl = document.querySelector(targetId); // ищем элемент

            if (targetEl) {
                e.preventDefault(); // отменяем стандартный скролл-прыжок
                targetEl.scrollIntoView({
                    behavior: "smooth", // анимированная прокрутка
                    block: "start"      // выравниваем к верху viewport
                });
            }
        });
    });


    /* 
       3. МОДАЛЬНОЕ ОКНО ДЛЯ КАРТОЧЕК
       
       Клик по любой карточке (.card) открывает модальное окно.
       Данные берутся из:
         - img.src / img.alt   → изображение
         - p.textContent       → заголовок
         - data-info атрибут   → описание (может быть многострочным)
       Если data-info содержит переносы строк → рендерим
       нумерованный список (удобно для треклистов).
       Иначе → просто текст.
        */
    const modal      = document.getElementById("modal");
    const modalImg   = document.getElementById("modal-img");
    const modalTitle = document.getElementById("modal-title");
    const modalText  = document.getElementById("modal-text");
    const closeBtn   = document.querySelector(".close");

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        card.addEventListener("click", () => {
            const img  = card.querySelector("img");
            const text = card.querySelector("p");

            // Заполняем картинку и заголовок из карточки
            modalImg.src         = img.src;
            modalImg.alt         = img.alt;
            modalTitle.textContent = text.textContent;

            const rawText = card.dataset.info || ""; // берём data-info или пустую строку

            // Разбиваем текст на строки, убираем пустые и пробелы по краям
            const items = rawText
                .split("\n")
                .map(item => item.trim())
                .filter(item => item.length > 0);

            if (items.length > 1) {
                // Несколько строк → нумерованный список (треклист, факты)
                modalText.innerHTML = `
                    <ul class="track-list">
                        ${items.map((item, index) => `
                            <li>
                                <span class="track-number">${index + 1}.</span>
                                ${item}
                            </li>
                        `).join("")}
                    </ul>
                `;
            } else {
                // Одна строка → простой текст
                modalText.textContent = rawText;
            }

            modal.classList.add("show");            // показываем модалку
            document.body.style.overflow = "hidden"; // блокируем прокрутку страницы
        });
    });


    /* 
       4. ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
       
       Три способа закрыть модалку:
         А) кнопка «×» (closeBtn)
         Б) клик по тёмному фону вне .modal-content
         В) клавиша Escape
        */
    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove("show");   // скрываем через CSS-переход
        document.body.style.overflow = ""; // разблокируем прокрутку страницы
        if (modalText) modalText.innerHTML = ""; // очищаем содержимое
    };

    // А) Кнопка закрытия (крестик)
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // Б) Клик по полупрозрачному фону (НЕ по .modal-content)
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal(); // только если кликнули именно на фон
        });
    }

    // В) Нажатие Escape закрывает модалку
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });


    /* 
       5. АКТИВНЫЕ ССЫЛКИ В САЙДБАРЕ
       
       При прокрутке определяем, какая <section> находится
       в зоне видимости, и добавляем класс .active нужной
       ссылке в сайдбаре.

        */
    const navLinks     = document.querySelectorAll(".info-box a");
    const pageSections = document.querySelectorAll("section");

    const updateActiveLink = () => {
        const scrollY = window.scrollY; // текущая позиция прокрутки

        pageSections.forEach(section => {
            const offset = section.offsetTop - 140; // верхняя граница с запасом
            const height = section.offsetHeight;    // высота секции

            // Проверяем, находится ли скролл внутри этой секции
            if (scrollY >= offset && scrollY < offset + height) {
                const id = section.getAttribute("id"); // получаем id секции

                navLinks.forEach(link => {
                    link.classList.remove("active"); // снимаем active со всех

                    // Совпадение по href="#id" — надёжнее, чем совпадение по индексу
                    if (link.getAttribute("href") === `#${id}`) {
                        link.classList.add("active");
                    }
                });
            }
        });
    };

    // Слушаем скролл (passive: не блокируем нативную прокрутку)
    window.addEventListener("scroll", updateActiveLink, { passive: true });


    /* 
       6. ЕДИНЫЙ CANVAS-РЕНДЕР
    
       Решение: объединяем всё в один цикл draw():
         1) clearRect — очищаем canvas один раз за кадр
         2) рисуем частицы (dots)
         3) рисуем соединительные линии между ними
         4) рисуем музыкальные ноты поверх

       Таким образом все слои отрисовываются в правильном
       порядке и ничто не затирает другое.
       */
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
           ЧАСТИЦЫ (фоновые точки) */

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
           МУЗЫКАЛЬНЫЕ НОТЫ
            */

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
           Единый RAF-цикл: частицы → линии → ноты
           */
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

    })(); // немедленно вызываемая функция (IIFE) изолирует переменные


    /* 
       7. МИНИ-ВИДЕО ПЛЕЕР
       
       Клик по изображению-заголовку группы (#videoTrigger)
       открывает маленький плеер в правом нижнем углу.
       Источник видео берётся из data-video атрибута триггера.
       */
    const trigger     = document.getElementById("videoTrigger");
    const videoModal  = document.getElementById("videoModal");
    const cornerVideo = document.getElementById("cornerVideo");
    const videoClose  = document.getElementById("videoClose");

    if (trigger && videoModal && cornerVideo) {

        trigger.addEventListener("click", () => {
            const videoSrc = trigger.dataset.video; // путь к видео из data-video
            if (!videoSrc) return;

            // Подставляем src в <source> и перезагружаем элемент
            const source = cornerVideo.querySelector("source");
            source.src   = videoSrc;
            cornerVideo.load();

            videoModal.classList.add("show"); // делаем плеер видимым
            cornerVideo.currentTime = 0;      // перематываем в начало
            cornerVideo.play();               // запускаем воспроизведение
        });

        // Закрытие плеера: пауза + скрытие
        const closeVideo = () => {
            videoModal.classList.remove("show");
            cornerVideo.pause();
            cornerVideo.currentTime = 0; // сбрасываем позицию
        };

        if (videoClose) videoClose.addEventListener("click", closeVideo);
    }


    /* 

       Позволяет перетаскивать плеер по экрану мышью
       и пальцем (touch-события).

       БАГ-ФИX: при начале drag вычисляем смещение курсора
       относительно левого-верхнего угла элемента через
       getBoundingClientRect(). Без этого при первом
       клике элемент резко прыгает к курсору.
       */
    const draggable = document.getElementById("videoModal");

    if (draggable) {
        let isDragging = false; // флаг: идёт ли перетаскивание
        let offsetX    = 0;    // смещение курсора от левого края элемента
        let offsetY    = 0;    // смещение курсора от верхнего края элемента

        // Начало перетаскивания (mousedown)
        draggable.addEventListener("mousedown", (e) => {
            isDragging = true;

            const rect = draggable.getBoundingClientRect(); // реальное положение элемента
            offsetX    = e.clientX - rect.left;             // сколько пикселей от курсора до левого края
            offsetY    = e.clientY - rect.top;              // сколько пикселей от курсора до верхнего края

            draggable.style.transition = "none"; // отключаем плавность во время drag
            e.preventDefault(); // предотвращаем выделение текста
        });

        // Движение мыши: перемещаем элемент
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            // Переключаемся на left/top, убираем right/bottom
            draggable.style.left   = (e.clientX - offsetX) + "px";
            draggable.style.top    = (e.clientY - offsetY) + "px";
            draggable.style.right  = "auto";
            draggable.style.bottom = "auto";
        });

        // Конец перетаскивания
        document.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;
            draggable.style.transition = ""; // восстанавливаем CSS-переходы
        });

        // Touch: начало касания
        draggable.addEventListener("touchstart", (e) => {
            const touch = e.touches[0]; // первый палец
            isDragging  = true;
            const rect  = draggable.getBoundingClientRect();
            offsetX     = touch.clientX - rect.left;
            offsetY     = touch.clientY - rect.top;
            draggable.style.transition = "none";
        }, { passive: true });

        // Touch: движение пальца
        document.addEventListener("touchmove", (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            draggable.style.left   = (touch.clientX - offsetX) + "px";
            draggable.style.top    = (touch.clientY - offsetY) + "px";
            draggable.style.right  = "auto";
            draggable.style.bottom = "auto";
        }, { passive: true });

        // Touch: палец поднят
        document.addEventListener("touchend", () => {
            isDragging = false;
            draggable.style.transition = "";
        });
    }


    /* 
       РАСКАЧИВАНИЕ ГИТАРЫ + ЗВУК
       
       Клик по изображению гитары (#guitar):
         — сбрасывает и перезапускает CSS-анимацию .swing
           (принудительный reflow через offsetWidth)
         — воспроизводит звук гитарного аккорда
        */
    const guitar = document.getElementById("guitar");
    const sound  = document.getElementById("guitarSound");

    if (guitar && sound) {
        guitar.addEventListener("click", () => {
            // Убираем класс .swing, форсируем перерисовку, добавляем обратно
            // — это единственный способ перезапустить CSS-анимацию
            guitar.classList.remove("swing");
            void guitar.offsetWidth; // принудительный reflow (браузер «забывает» предыдущую анимацию)
            guitar.classList.add("swing");

            // Воспроизводим звук аккорда с начала
            sound.currentTime = 0;
            sound.volume      = 0.5; // половина громкости
            sound.play();
        });
    }


    /*  ПО СТРАНИЦЕ С ПОДСВЕТКОЙ
       
       При вводе в поле #searchInput ищем совпадения
       во всех параграфах внутри <section> и подсвечиваем
       найденный текст через <span class="highlight">.

       БАГ-ФИX: ранее сохранялся textContent (без тегов),
       а при восстановлении использовался тоже textContent —
       в итоге терялись span.kw, span.kw-red и другие теги.
       Теперь сохраняем innerHTML, чтобы при очистке поиска
       полностью восстанавливать исходную HTML-разметку.

       При повторном поиске всегда берём оригинальный текст
       (data-original), чтобы не накапливать вложенные <span>.
       */
    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
        const paragraphs = document.querySelectorAll("section p");

        // Сохраняем оригинальный innerHTML каждого параграфа один раз при загрузке
        paragraphs.forEach(p => {
            p.dataset.originalHtml = p.innerHTML; // BUG-FIX: innerHTML вместо textContent
        });

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();

            paragraphs.forEach(p => {
                const originalHtml = p.dataset.originalHtml;

                if (!query) {
                    // Пустой запрос — восстанавливаем исходный HTML (со всеми span.kw)
                    p.innerHTML = originalHtml;
                    return;
                }

                // Для поиска используем текстовый контент (без тегов),
                // но оборачиваем совпадения в оригинальном HTML-тексте
                // Подход: работаем с textContent для поиска, а highlight накладываем на innerHTML
                const tempDiv  = document.createElement("div");
                tempDiv.innerHTML = originalHtml; // временный контейнер

                // Рекурсивная функция: обходит текстовые узлы и оборачивает совпадения
                function highlightTextNodes(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        // Текстовый узел: ищем совпадение
                        const text      = node.textContent;
                        const lowerText = text.toLowerCase();

                        if (lowerText.includes(query)) {
                            // Экранируем спецсимволы регулярных выражений
                            const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex     = new RegExp(`(${safeQuery})`, "gi");

                            // Создаём обёртку и заменяем текстовый узел
                            const wrapper  = document.createElement("span");
                            wrapper.innerHTML = text.replace(
                                regex,
                                `<span class="highlight">$1</span>`
                            );
                            // Вставляем все дочерние узлы обёртки вместо текстового узла
                            node.replaceWith(...wrapper.childNodes);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Элементный узел: рекурсивно обходим дочерние узлы
                        // (клонируем childNodes в массив, т.к. список живой и меняется при replaceWith)
                        [...node.childNodes].forEach(child => highlightTextNodes(child));
                    }
                }

                highlightTextNodes(tempDiv); // обрабатываем
                p.innerHTML = tempDiv.innerHTML; // вставляем результат в параграф
            });
        });
    }


}); // ── конец DOMContentLoaded ──