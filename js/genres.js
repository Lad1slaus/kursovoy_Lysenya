
// DOMContentLoaded — ждём, пока HTML полностью разобран браузером.
// Все функции вызываются только после того, как DOM готов,
// иначе getElementById/querySelector вернут null.
document.addEventListener("DOMContentLoaded", () => {
   
    initSectionsToggle();    // 2. вешаем обработчики на сворачиваемые секции
    initAudioPlayers();      // 3. инициализируем все аудио-плееры на странице
    initSectionAnimation();  // 1. запускаем IntersectionObserver для анимации появления
    initGuitarSwing();       // 5. ← ИСПРАВЛЕН БАГ: раньше вызывался ВНЕ DOMContentLoaded,
                             //    из-за чего getElementById("guitar") возвращал null
                             //    и addEventListener падал с ошибкой TypeError
    loadGenresFromXML();     // 6. ← загружаем список групп из XML-файла
});


//  АНИМАЦИЯ ПОЯВЛЕНИЯ СЕКЦИЙ

// Секции начально скрыты (opacity:0, translateY:40px в CSS).
// IntersectionObserver отслеживает момент, когда секция
// попадает в область видимости и добавляет класс "show".
function initSectionAnimation() {

    // Выбираем все теги <section> на странице
    const sections = document.querySelectorAll("section");

    // Защита: если секций нет — выходим, ничего не делаем
    if (!sections.length) return;

    // Создаём наблюдатель за видимостью элементов.
    // entries — массив изменений (что стало видимым / скрылось)
    // obs — ссылка на сам observer (нужна для отписки)
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {

            // entry.isIntersecting = true → элемент попал в зону видимости
            if (entry.isIntersecting) {

                // Добавляем класс "show" → CSS делает секцию видимой
                // (opacity: 1, transform: translateY(0))
                entry.target.classList.add("show");

                // Отписываемся от наблюдения за этим элементом —
                // анимация нужна только один раз при первом появлении
                obs.unobserve(entry.target);
            }
        });
    }, {
        // threshold: 0.2 → срабатывать, когда 20% секции видно на экране
        // (чуть больше, чем на главной — 0.1, для более заметного эффекта)
        threshold: 0.2
    });

    // Запускаем наблюдение за каждой секцией
    sections.forEach(section => observer.observe(section));
}


//  2. СВОРАЧИВАЕМЫЕ СЕКЦИИ
function initSectionsToggle() {

    // Выбираем все заголовки h2 внутри секций
    const titles = document.querySelectorAll("section h2");

    // Для каждого заголовка добавляем обработчик клика
    titles.forEach(title => {
        title.addEventListener("click", () => {

            // closest("section") поднимается вверх по DOM и находит
            // ближайшего родителя с тегом <section>
            const section = title.closest("section");

            // Ищем блок с классом .genre-content внутри этой секции
            const content = section.querySelector(".genre-content");

            // Если блока нет — выходим (защита от ошибок)
            if (!content) return;

            // Проверяем текущее состояние: открыт ли контент?
            const isOpen = content.classList.contains("open");

            if (isOpen) {
                // Если открыт → закрываем: убираем класс "open" у контента и секции
                // CSS при этом: max-height → 0, opacity → 0 (плавно через transition)
                content.classList.remove("open");
                section.classList.remove("open");
            } else {
                // Если закрыт → открываем: добавляем класс "open"
                // CSS при этом: max-height → 2000px, opacity → 1
                content.classList.add("open");
                section.classList.add("open");
            }
            // Класс "open" на секции также поворачивает стрелку h2::after на 180°
        });
    });
}

//  3. АУДИО ПЛЕЕРЫ

// Инициализирует все плееры с классом .player на странице.
// Функции: play/pause, полоса прогресса, перемотка, конец трека.
// Одновременно может играть только один трек.
function initAudioPlayers() {

    // Находим все блоки плееров на странице
    const players = document.querySelectorAll(".player");

    // Перебираем каждый плеер
    players.forEach(player => {

        // Находим элементы управления внутри конкретного плеера
        const btn         = player.querySelector(".play-btn");   // кнопка play/pause
        const audio       = player.querySelector("audio");       // тег <audio>
        const progress    = player.querySelector(".progress");   // контейнер прогресс-бара (кликабельный)
        const progressBar = player.querySelector(".progress-bar"); // заливка прогресса (меняет ширину)

        // Если нет кнопки или аудио — пропускаем этот плеер
        if (!btn || !audio) return;

        //  PLAY / PAUSE
        btn.addEventListener("click", () => {

            // Останавливаем ВСЕ другие аудио на странице перед запуском нового.
            // Это гарантирует, что одновременно играет только один трек.
            document.querySelectorAll("audio").forEach(a => {
                if (a !== audio) {                                   // пропускаем текущий трек
                    a.pause();                                       // ставим на паузу
                    a.closest(".player")?.classList.remove("playing"); // убираем класс playing
                    // ?. — опциональная цепочка: если closest вернёт null, ошибки не будет

                    const b = a.closest(".player")?.querySelector(".play-btn");
                    if (b) b.textContent = "▶"; // возвращаем иконку play другим кнопкам
                }
            });

            // Переключаем текущий трек
            if (audio.paused) {
                // Трек на паузе → запускаем
                audio.play();
                player.classList.add("playing");  // класс "playing" запускает анимацию эквалайзера в CSS
                btn.textContent = "⏸";           // меняем иконку на pause
            } else {
                // Трек играет → ставим на паузу
                audio.pause();
                player.classList.remove("playing"); // останавливаем эквалайзер
                btn.textContent = "▶";              // возвращаем иконку play
            }
        });

        //  ПРОГРЕСС 
        // timeupdate — событие аудио, срабатывает ~4 раза в секунду во время воспроизведения
        audio.addEventListener("timeupdate", () => {

            // audio.duration может быть NaN до загрузки метаданных — защита
            if (!audio.duration) return;

            // Вычисляем процент прослушанного: currentTime / duration * 100
            // Устанавливаем ширину заливки в процентах
            progressBar.style.width = (audio.currentTime / audio.duration * 100) + "%";
        });

        //  ПЕРЕМОТКА
        // Клик по полосе прогресса перематывает трек в нужную позицию
        progress.addEventListener("click", (e) => {

            // Аналогичная защита от NaN
            if (!audio.duration) return;

            // e.offsetX — позиция клика в пикселях относительно левого края .progress
            // progress.clientWidth — полная ширина полосы в пикселях
            // Пропорция даёт долю от 0 до 1, умножаем на длину трека
            audio.currentTime = (e.offsetX / progress.clientWidth) * audio.duration;
        });

        //   КОНЕЦ ТРЕКА
        // "ended" — событие аудио, срабатывает когда трек дошёл до конца
        audio.addEventListener("ended", () => {
            player.classList.remove("playing"); // останавливаем эквалайзер
            btn.textContent = "▶";             // возвращаем иконку play
            progressBar.style.width = "0%";    // сбрасываем полосу прогресса в 0
        });
    });
}



//  4. CANVAS ФОН 

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
           ЧАСТИЦЫ (фоновые точки)
            */

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


//  5. РАСКАЧИВАНИЕ ГИТАРЫ

// По клику на изображение гитары воспроизводится CSS-анимация
// качания (swing) и звук гитары.
function initGuitarSwing() {

    // Находим изображение гитары и аудиоэлемент
    const guitar = document.getElementById("guitar");
    const sound  = document.getElementById("guitarSound");

    // Если элементов нет — выходим (защита)
    if (!guitar || !sound) return;

    // Обработчик клика на гитару
    guitar.addEventListener("click", () => {

        // Перезапуск анимации: просто добавить класс снова не сработает,
        // если анимация уже идёт — браузер её проигнорирует.
        guitar.classList.remove("swing"); // 1. убираем класс → анимация останавливается

        // 2. void guitar.offsetWidth — обращение к offsetWidth принудительно вызывает
        //    reflow (пересчёт стилей браузером). Без этого браузер "склеит"
        //    remove+add в одну операцию и анимация не перезапустится.
        void guitar.offsetWidth;

        guitar.classList.add("swing"); // 3. добавляем класс снова → анимация запускается заново

        // Воспроизводим звук гитары с начала
        sound.currentTime = 0;   // перематываем на начало (если уже играл)
        sound.volume = 0.5;      // громкость 50%
        sound.play();            // запускаем воспроизведение
    });
}


//  6. ЗАГРУЗКА ГРУПП ИЗ XML-ФАЙЛА

// Загружает data/genres.xml и заполняет списки групп
// в соответствующих секциях страницы.
// Каждый <genre id="..."> в XML соответствует <section id="..."> в HTML.
function loadGenresFromXML() {

    // fetch — асинхронный HTTP-запрос к XML-файлу
    fetch("data/genres.xml")

        // Первый .then: получаем Response-объект
        .then(response => {

            // response.ok = true при статусе 200-299
            // Если файл не найден (404) — явно бросаем ошибку
            if (!response.ok) throw new Error("XML не найден");

            // response.text() — читаем тело ответа как строку
            return response.text();
        })

        // Второй .then: работаем с XML-строкой
        .then(data => {

            // DOMParser умеет парсить XML и HTML строки в DOM-объект
            const parser = new DOMParser();

            // parseFromString(строка, тип) — парсим как XML
            const xml    = parser.parseFromString(data, "text/xml");

            // getElementsByTagName возвращает HTMLCollection всех тегов <genre>
            const genres = xml.getElementsByTagName("genre");

            // Перебираем все жанры из XML
            for (let i = 0; i < genres.length; i++) {

                // getAttribute("id") — читаем атрибут id текущего <genre>
                // Например: <genre id="trash-metal"> → genreId = "trash-metal"
                const genreId = genres[i].getAttribute("id");

                // getElementsByTagName("band") — все теги <band> внутри текущего <genre>
                const bands   = genres[i].getElementsByTagName("band");

                // Ищем соответствующую секцию в HTML по id
                // Например: <section id="trash-metal">
                const section = document.getElementById(genreId);

                // Если секция не найдена — пропускаем этот жанр
                if (!section) continue;

                // Ищем список <ul> внутри найденной секции
                const ul = section.querySelector("ul");

                // Если списка нет — пропускаем
                if (!ul) continue;

                // Очищаем старый список (если был захардкожен в HTML)
                ul.innerHTML = "";

                // Перебираем все группы этого жанра
                for (let j = 0; j < bands.length; j++) {

                    // Создаём элемент <li>
                    const li = document.createElement("li");

                    // Вставляем название группы, обёрнутое в span.kw-red (красный стиль)
                    // bands[j].textContent — текст из тега <band>Metallica</band> → "Metallica"
                    li.innerHTML = `<span class="kw-red">${bands[j].textContent}</span>`;

                    // Добавляем <li> в список
                    ul.appendChild(li);
                }
            }
        })

        // .catch: обрабатываем ошибки сети или парсинга
        .catch(error => {
            console.error("Ошибка загрузки XML:", error);
        });
}