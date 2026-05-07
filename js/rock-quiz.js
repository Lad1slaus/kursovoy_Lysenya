

document.addEventListener("DOMContentLoaded", () => {
    // score    — счётчик правильных ответов (увеличивается при верном ответе)
    // answered — счётчик всех отвеченных вопросов (любых, верных и неверных)
    // total    — общее количество вопросов (определяется по DOM при загрузке)
    let score    = 0;
    let answered = 0;

    // Находим все карточки вопросов (блоки с классом .question)
    const questions  = document.querySelectorAll(".question");

    // total — фиксируем количество вопросов один раз
    // questions.length — свойство NodeList (аналог массива)
    const total      = questions.length;

    // Элемент для текстового отображения счёта ("Вопросов: 3 / 10 | Правильных: 2")
    const progressEl = document.getElementById("progress");

    // Элемент — заливка прогресс-бара (ширина меняется через JS)
    const fillEl     = document.getElementById("progressFill");

    // Все ссылки в сайдбаре (навигация по вопросам)
    const links      = document.querySelectorAll(".info-box1 a");

    // ФУНКЦИЯ ОБНОВЛЕНИЯ ПРОГРЕССА
    // Вызывается после каждого ответа.
    // Обновляет: текстовый счётчик и ширину полоски прогресса.
    function updateProgress() {

        // Защита: если элемент счётчика не найден в HTML — выходим
        if (!progressEl) return;

        // Обновляем текст счётчика:
        // шаблонная строка (template literal) удобнее конкатенации строк
        progressEl.textContent =
            `Вопросов: ${answered} / ${total} | Правильных: ${score}`;

        // Обновляем прогресс-бар (если элемент найден)
        if (fillEl) {
            // percent: доля отвеченных вопросов от 0 до 100
            // Защита от деления на 0 (total > 0)
            const percent = total > 0 ? (answered / total) * 100 : 0;

            // Устанавливаем ширину заливки через inline-стиль
            // CSS transition обеспечит плавное изменение ширины
            fillEl.style.width = percent + "%";
        }
    }

    // Вызываем сразу при загрузке — показываем "0 / N" до первого ответа
    updateProgress();

    //  ЛОГИКА ОТВЕТОВ НА ВОПРОСЫ
    
    // Для каждой карточки .question вешаем обработчики на все кнопки .answer.
    // После клика: блокируем повторный ответ, подсвечиваем верный/неверный вариант,
    // помечаем ссылку в сайдбаре, скроллим к следующему вопросу.
    questions.forEach(question => {

        // Находим все кнопки ответов внутри данного вопроса
        const answers = question.querySelectorAll(".answer");

        // Для каждой кнопки ответа
        answers.forEach(btn => {

            btn.addEventListener("click", () => {

                // Проверяем: если вопрос уже отвечен — игнорируем клик.
                // Класс "answered" добавляется ниже при первом ответе.
                // Это предотвращает изменение score при повторных кликах.
                if (question.classList.contains("answered")) return;

                // Помечаем вопрос как отвеченный
                question.classList.add("answered");

                // Увеличиваем счётчик отвеченных вопросов
                answered++;

                // Находим кнопку с правильным ответом.
                // Класс .correct задан в HTML-разметке вопроса заранее.
                const correctBtn = question.querySelector(".correct");

                // Проверяем: нажата ли правильная кнопка?
                if (btn.classList.contains("correct")) {

                    //  Правильный ответ
                    score++;                              // увеличиваем счёт правильных
                    btn.classList.add("correct-active"); // CSS: зелёная подсветка кнопки

                    // Анимация подтверждения (определена в CSS через @keyframes correctAnim)
                    btn.style.animation = "correctAnim 0.4s ease";

                } else {

                    //  Неправильный ответ
                    btn.classList.add("wrong");          // CSS: красная подсветка нажатой кнопки
                    btn.style.animation = "shake 0.3s"; // CSS: анимация тряски (@keyframes shake)

                    // Дополнительно подсвечиваем правильный вариант зелёным,
                    // чтобы пользователь видел верный ответ
                    if (correctBtn) {
                        correctBtn.classList.add("correct-active");
                    }
                }

                // Подсвечиваем соответствующую ссылку в сайдбаре.
                // Каждый вопрос имеет id (например id="q1"),
                // а ссылка в сайдбаре: <a href="#q1">
                const link = document.querySelector(`a[href="#${question.id}"]`);
                if (link) {
                    if (btn.classList.contains("correct")) {
                        link.classList.add("done");       // зелёный класс из CSS
                    } else {
                        link.classList.add("wrong-link"); // красный класс из CSS
                    }
                }

                // Обновляем счётчик и прогресс-бар
                updateProgress();

                // Авто-скролл к следующему вопросу через 500мс.
                // setTimeout откладывает выполнение — пользователь успевает
                // увидеть подсветку правильного/неправильного ответа.
                setTimeout(() => {

                    // nextElementSibling — следующий элемент-сосед в DOM
                    const next = question.nextElementSibling;

                    // Скроллим только если следующий элемент тоже является вопросом
                    if (next && next.classList.contains("question")) {
                        // scrollIntoView с behavior:"smooth" — плавная прокрутка
                        // block:"center" — вопрос появляется по центру экрана
                        next.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 500); // задержка 500 миллисекунд

                // Проверяем: все ли вопросы отвечены?
                if (answered === total) showResult(); // показываем итоговый блок
            });

        });

    });

    //  АУДИО-ПЛЕЕР
    
    // Простой плеер: кнопка play/pause, одновременно играет только один трек.
    // В отличие от genres.js здесь нет прогресс-бара (упрощённая версия).
    document.querySelectorAll(".audio-box").forEach(box => {

        // Находим кнопку и аудио внутри каждого блока .audio-box
        const btn   = box.querySelector(".play-btn");
        const audio = box.querySelector("audio");

        // Если нет кнопки или аудио — пропускаем блок
        if (!btn || !audio) return;

        btn.addEventListener("click", () => {

            // Останавливаем все ДРУГИЕ аудио на странице
            document.querySelectorAll("audio").forEach(a => {
                if (a !== audio) {              // пропускаем текущее аудио
                    a.pause();                  // ставим на паузу
                    a.currentTime = 0;          // перематываем на начало

                    // Возвращаем текст кнопки другого плеера обратно на "▶ Воспроизвести"
                    // ?. — опциональная цепочка: защита если closest() вернёт null
                    const otherBtn = a.closest(".audio-box")?.querySelector(".play-btn");
                    if (otherBtn) otherBtn.textContent = "▶ Воспроизвести";
                }
            });

            // Переключаем состояние текущего трека
            if (!audio.paused) {
                // Трек играет → пауза
                audio.pause();
                btn.textContent = "▶ Воспроизвести"; // возвращаем иконку play
            } else {
                // Трек на паузе → воспроизведение
                audio.currentTime = 0; // начинаем с начала
                audio.play();
                btn.textContent = "⏸ Пауза"; // меняем иконку на pause
            }
        });

    });

    //  НАВИГАЦИЯ ПО ВОПРОСАМ (клик на ссылку в сайдбаре)
    
    // Переопределяем стандартное поведение ссылок (#id)
    // для плавного скролла с корректным отступом от верха.
    links.forEach(link => {

        link.addEventListener("click", e => {

            // Отменяем стандартное поведение браузера —
            // он бы прыгнул к якорю мгновенно, без анимации
            e.preventDefault();

            // Получаем href ссылки (например "#q3") и ищем элемент
            const target = document.querySelector(link.getAttribute("href"));

            // Если элемент не найден — выходим
            if (!target) return;

            // window.scrollTo: плавная прокрутка до нужной позиции.
            // target.offsetTop — расстояние от верха документа до элемента.
            // - 120px — отступ, чтобы элемент не прилипал к самому верху экрана.
            window.scrollTo({
                top:      target.offsetTop - 120,
                behavior: "smooth"
            });
        });

    });

    //  SCROLL SPY — АКТИВНАЯ ССЫЛКА В НАВИГАЦИИ
    
    // При прокрутке определяем, какой вопрос находится
    // в центральной зоне видимости, и подсвечиваем его ссылку в сайдбаре.
    window.addEventListener("scroll", () => {

        // scrollY — текущая позиция прокрутки от верха документа (в пикселях)
        const scrollY = window.scrollY;

        // Перебираем все вопросы
        questions.forEach(q => {

            // offsetTop — расстояние от верха документа до начала вопроса.
            // - 150 — зона захвата: ссылка активируется чуть раньше, чем вопрос достигнет верха
            const offset = q.offsetTop - 150;

            // offsetHeight — высота блока вопроса в пикселях
            const height = q.offsetHeight;

            // Проверяем, находится ли скролл в диапазоне вопроса
            if (scrollY >= offset && scrollY < offset + height) {

                // Убираем класс "active" у ВСЕХ вопросов и ссылок
                questions.forEach(el => el.classList.remove("active"));
                q.classList.add("active"); // делаем текущий вопрос активным

                // Синхронно обновляем навигацию в сайдбаре
                links.forEach(l => l.classList.remove("active"));

                // Ищем ссылку с href="#id_текущего_вопроса"
                const link = document.querySelector(`a[href="#${q.id}"]`);
                if (link) link.classList.add("active"); // подсвечиваем нужную ссылку
            }
        });

    // passive: true — сообщаем браузеру, что обработчик не вызовет preventDefault().
    // Это позволяет браузеру оптимизировать прокрутку (не ждать окончания обработчика).
    }, { passive: true });

    //  АНИМАЦИИ ПОЯВЛЕНИЯ (IntersectionObserver)
    
    // Вопросы и секции начально скрыты через CSS (opacity:0, translateY:40px).
    // Когда элемент попадает в viewport — добавляем класс "show" → элемент появляется.
    const elements = document.querySelectorAll(".question, section");

    // IntersectionObserver: следит за видимостью элементов в области просмотра
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {

            // Если элемент вошёл в зону видимости — показываем его
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                // Примечание: здесь нет obs.unobserve() — эффект может повторяться
                // (в отличие от genres.js, где отписываемся после первого показа)
            }
        });
    }, { threshold: 0.2 }); // 20% элемента должно быть видно для срабатывания

    // Запускаем наблюдение за каждым элементом
    elements.forEach(el => observer.observe(el));

    //  ПОКАЗ ИТОГОВОГО БЛОКА
    
    // Вызывается когда answered === total (все вопросы отвечены).
    // Плавно скроллит к блоку .final-summary.
    function showResult() {
        const summary = document.querySelector(".final-summary");
        if (summary) {
            // scrollIntoView: прокручивает к элементу
            // block:"center" — располагает элемент по центру экрана
            summary.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    //  CANVAS-ФОН

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

    })(); 

    //  ПОИСК ПО СТРАНИЦЕ
    
    // ИСПРАВЛЕНО: оригинальный текст сохраняется в dataset.original
    // при загрузке страницы ОДИН РАЗ (а не при каждом вводе).
    // Ранее при втором поиске теги <span class="highlight"> попадали
    // в "оригинальный текст" и накапливались — поиск ломался.
    const searchInput = document.getElementById("searchInput");

    // ИСПРАВЛЕНО: проверяем наличие элемента перед использованием.
    // Если поля поиска нет в HTML (например, на другой странице) —
    // код не выбросит ошибку TypeError.
    if (searchInput) {

        // Выбираем параграфы внутри секций для поиска
        const paragraphs = document.querySelectorAll("section p");

        // Сохраняем ОРИГИНАЛЬНЫЙ текст (без тегов) в data-атрибут каждого параграфа.
        // dataset.original = p.textContent (только текст, без HTML-тегов).
        // Сохраняем только если ещё не сохранён (защита от двойной инициализации).
        paragraphs.forEach(p => {
            if (!p.dataset.original) {
                // textContent (не innerHTML!) — сохраняем чистый текст без HTML-тегов
                // Это ключевое отличие от genres.js где сохраняем innerHTML
                p.dataset.original = p.textContent;
            }
        });

        // Обработчик ввода в поле поиска
        // "input" срабатывает при каждом изменении (в отличие от "change")
        searchInput.addEventListener("input", () => {

            // Получаем поисковый запрос в нижнем регистре
            const query = searchInput.value.toLowerCase();

            paragraphs.forEach(p => {

                // Берём сохранённый оригинальный текст (без тегов подсветки)
                const originalText = p.dataset.original;

                // Если запрос пуст — восстанавливаем исходный текст
                if (!query) {
                    p.innerHTML = originalText;
                    return; // выходим из текущей итерации forEach
                }

                // Создаём регулярное выражение:
                // g = глобальный поиск (все вхождения)
                // i = без учёта регистра
                // Скобки вокруг query создают группу захвата $1
                const regex = new RegExp(`(${query})`, "gi");

                // Заменяем все совпадения на текст, обёрнутый в <span class="highlight">
                // $1 — найденный текст в оригинальном регистре (сохраняем регистр пользователя)
                p.innerHTML = originalText.replace(
                    regex,
                    `<span class="highlight">$1</span>`
                );
            });
        });
    }

    //  РАСКАЧИВАНИЕ ГИТАРЫ
    // ИСПРАВЛЕНО: перенесено внутрь DOMContentLoaded.
    // Ранее этот код был СНАРУЖИ события — при загрузке скрипта
    // в <head> или через defer DOM ещё не был готов,
    // getElementById("guitar") возвращал null, и addEventListener
    // бросал: "Cannot read properties of null (reading 'addEventListener')".
    const guitar = document.getElementById("guitar");
    const sound  = document.getElementById("guitarSound");

    // Проверяем наличие обоих элементов (защита)
    if (guitar && sound) {
        guitar.addEventListener("click", () => {

            // Перезапуск CSS-анимации: убрать класс → reflow → добавить класс
            guitar.classList.remove("swing"); // 1. останавливаем анимацию

            // 2. Форсируем reflow: обращение к offsetWidth заставляет браузер
            //    пересчитать стили прямо сейчас, до следующей инструкции.
            //    Без этого браузер объединит remove+add и анимация не перезапустится.
            void guitar.offsetWidth;

            guitar.classList.add("swing"); // 3. запускаем анимацию заново

            // Воспроизводим звук гитары
            sound.currentTime = 0;  // перематываем в начало
            sound.volume = 0.5;     // устанавливаем громкость 50%
            sound.play();           // воспроизводим
        });
    }

}); // ← конец DOMContentLoaded