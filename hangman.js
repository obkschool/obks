// متغيرات عامة للعبة
const API_KEY = "AIzaSyCrAicHcB2IUqkMS846--MFJo6u0UqKbII";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// حالة اللعبة
let gameState = {
    word: "",
    hint: "",
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrongGuesses: 6,
    gameOver: false,
    won: false
};

let currentTopic = "";
let soundEnabled = true;

// العناصر في الصفحة
const topicInput = document.getElementById('topic-input');
const startGameBtn = document.getElementById('start-game-btn');
const topicButtons = document.querySelectorAll('.topic-btn');
const loadingSection = document.getElementById('loading');
const loadingTopic = document.getElementById('loading-topic');
const topicSelection = document.getElementById('topic-selection');
const gameArea = document.getElementById('game-area');
const resultsSection = document.getElementById('results');
const wordDisplay = document.getElementById('word-display');
const keyboard = document.getElementById('keyboard');
const attemptsCount = document.getElementById('attempts-count');
const currentTopicDisplay = document.getElementById('current-topic');
const hintBtn = document.getElementById('hint-btn');
const hintText = document.getElementById('hint-text');
const newWordBtn = document.getElementById('new-word-btn');
const backBtn = document.getElementById('back-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const shareBtn = document.getElementById('share-btn');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultWord = document.getElementById('result-word');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const hangmanParts = document.querySelectorAll('.hangman-part');
const stars = document.querySelectorAll('.star');

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log("تم تحميل صفحة لعبة الرجل المشنوق");
    
    // إضافة مستمعات الأحداث
    setupEventListeners();
    
    // تعيين السمة المظلمة/الفاتحة من التخزين المحلي
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
    document.body.classList.toggle("light-theme", isLightTheme);
    themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">${isLightTheme ? 'dark_mode' : 'light_mode'}</span>`;
    
    // تعيين حالة الصوت من التخزين المحلي
    soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    soundToggleBtn.innerHTML = `<span class="material-symbols-rounded">${soundEnabled ? 'volume_up' : 'volume_off'}</span>`;
    
    // إنشاء لوحة المفاتيح
    createKeyboard();
});

// إضافة مستمعات الأحداث
function setupEventListeners() {
    // زر بدء اللعبة
    startGameBtn.addEventListener('click', () => {
        const topic = topicInput.value.trim();
        if (topic) {
            startGame(topic);
        } else {
            alert("الرجاء إدخال موضوع للعبة");
        }
    });
    
    // أزرار المواضيع الشائعة
    topicButtons.forEach(button => {
        button.addEventListener('click', () => {
            const topic = button.getAttribute('data-topic');
            startGame(topic);
        });
    });
    
    // زر التلميح
    hintBtn.addEventListener('click', showHint);
    
    // زر كلمة جديدة
    newWordBtn.addEventListener('click', () => {
        startGame(currentTopic);
    });
    
    // زر العودة
    backBtn.addEventListener('click', showTopicSelection);
    
    // زر اللعب مرة أخرى
    playAgainBtn.addEventListener('click', () => {
        startGame(currentTopic);
    });
    
    // زر مشاركة النتيجة
    shareBtn.addEventListener('click', shareResults);
    
    // زر تبديل السمة
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // زر تبديل الصوت
    soundToggleBtn.addEventListener('click', toggleSound);
}

// بدء اللعبة
async function startGame(topic) {
    // عرض شاشة التحميل
    topicSelection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    gameArea.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    loadingTopic.textContent = topic;
    
    // تعيين الموضوع الحالي
    currentTopic = topic;
    currentTopicDisplay.textContent = topic;
    
    try {
        // الحصول على كلمة وتلميح من الذكاء الاصطناعي
        const data = await generateWordAndHint(topic);
        
        // إعادة تعيين حالة اللعبة
        gameState = {
            word: data.word,
            hint: data.hint,
            guessedLetters: [],
            wrongGuesses: 0,
            maxWrongGuesses: 6,
            gameOver: false,
            won: false
        };
        
        console.log("الكلمة:", gameState.word);
        console.log("التلميح:", gameState.hint);
        
        // إعادة تعيين واجهة اللعبة
        resetGameUI();
        
        // عرض شاشة اللعبة
        loadingSection.classList.add('hidden');
        gameArea.classList.remove('hidden');
        
        // تحديث عرض الكلمة
        updateWordDisplay();
        
        // تشغيل صوت بدء اللعبة
        playSound('start');
        
    } catch (error) {
        console.error("خطأ في بدء اللعبة:", error);
        alert("حدث خطأ أثناء تحميل اللعبة. الرجاء المحاولة مرة أخرى.");
        showTopicSelection();
    }
}

// إنشاء لوحة المفاتيح
function createKeyboard() {
    keyboard.innerHTML = '';
    const letters = 'أابتثجحخدذرزسشصضطظعغفقكلمنهويئء';

    
    letters.split('').forEach(letter => {
        const key = document.createElement('button');
        key.textContent = letter;
        key.className = 'key';
        key.setAttribute('data-letter', letter);
        key.addEventListener('click', () => handleGuess(letter));
        keyboard.appendChild(key);
    });
}

// معالجة التخمين
function handleGuess(letter) {
    // التحقق من أن اللعبة لم تنته وأن الحرف لم يتم تخمينه من قبل
    if (gameState.gameOver || gameState.guessedLetters.includes(letter)) {
        return;
    }
    
    // إضافة الحرف إلى قائمة الحروف المخمنة
    gameState.guessedLetters.push(letter);
    
    // تعطيل زر الحرف
    const key = keyboard.querySelector(`[data-letter="${letter}"]`);
    key.disabled = true;
    
    // التحقق مما إذا كان الحرف موجودًا في الكلمة
    if (gameState.word.includes(letter)) {
        // الحرف صحيح
        key.classList.add('correct');
        playSound('correct');
        updateWordDisplay();
        
        // التحقق من الفوز
        checkWinCondition();
    } else {
        // الحرف خاطئ
        key.classList.add('wrong');
        gameState.wrongGuesses++;
        attemptsCount.textContent = gameState.maxWrongGuesses - gameState.wrongGuesses;
        playSound('wrong');
        
        // تحديث رسم الرجل المشنوق
        updateHangmanDrawing();
        
        // التحقق من الخسارة
        if (gameState.wrongGuesses >= gameState.maxWrongGuesses) {
            endGame(false);
        }
    }
}

// تحديث عرض الكلمة
function updateWordDisplay() {
    wordDisplay.innerHTML = '';
    
    // تحويل الكلمة إلى مصفوفة من الأحرف
    const wordArray = [...gameState.word];
    
    // إنشاء صندوق لكل حرف
    wordArray.forEach(letter => {
        const letterBox = document.createElement('div');
        letterBox.className = 'letter-box';
        
        // إظهار الحرف إذا تم تخمينه أو إخفاؤه
        if (gameState.guessedLetters.includes(letter)) {
            letterBox.textContent = letter;
            letterBox.classList.add('guessed');
        } else {
            letterBox.textContent = '';
        }
        
        wordDisplay.appendChild(letterBox);
    });
}

// تحديث رسم الرجل المشنوق
function updateHangmanDrawing() {
    // إظهار الجزء المناسب من الرسم بناءً على عدد التخمينات الخاطئة
    if (gameState.wrongGuesses > 0 && gameState.wrongGuesses <= 6) {
        const partIndex = gameState.wrongGuesses + 3; // نبدأ من الرأس (بعد القاعدة والعمود والعارضة والحبل)
        if (hangmanParts[partIndex]) {
            hangmanParts[partIndex].classList.remove('hidden');
        }
    }
}

// التحقق من شرط الفوز
function checkWinCondition() {
    // التحقق من أن جميع أحرف الكلمة تم تخمينها
    const allLettersGuessed = [...gameState.word].every(letter => 
        gameState.guessedLetters.includes(letter)
    );
    
    if (allLettersGuessed) {
        endGame(true);
    }
}

// إنهاء اللعبة
function endGame(won) {
    gameState.gameOver = true;
    gameState.won = won;
    
    // تعطيل جميع الأزرار
    const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
        key.disabled = true;
    });
    
    // عرض النتيجة
    setTimeout(() => {
        gameArea.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        if (won) {
            resultTitle.textContent = "مبروك! لقد فزت!";
            resultMessage.textContent = `لقد نجحت في تخمين الكلمة بعد ${gameState.wrongGuesses} محاولات خاطئة.`;
            playSound('win');
            
            // تفعيل النجوم بناءً على الأداء
            const starsToActivate = gameState.wrongGuesses <= 2 ? 3 : 
                                   gameState.wrongGuesses <= 4 ? 2 : 1;
            
            for (let i = 0; i < starsToActivate; i++) {
                stars[i].classList.add('active');
            }
        } else {
            resultTitle.textContent = "للأسف! لقد خسرت";
            resultMessage.textContent = "انتهت محاولاتك. حاول مرة أخرى!";
            playSound('lose');
        }
        
        resultWord.textContent = gameState.word;
    }, 1000);
}

// إعادة تعيين واجهة اللعبة
function resetGameUI() {
    // إعادة تعيين عداد المحاولات
    attemptsCount.textContent = gameState.maxWrongGuesses;
    
    // إخفاء التلميح
    hintText.classList.add('hidden');
    
    // إعادة تعيين لوحة المفاتيح
    const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
        key.disabled = false;
        key.classList.remove('correct', 'wrong');
    });
    
    // إعادة تعيين رسم الرجل المشنوق
    hangmanParts.forEach((part, index) => {
        if (index > 3) { // نحتفظ بالقاعدة والعمود والعارضة والحبل
            part.classList.add('hidden');
        }
    });
    
    // إعادة تعيين النجوم
    stars.forEach(star => {
        star.classList.remove('active');
    });
}

// إظهار التلميح - تحسين وظيفة التلميح
function showHint() {
    // التأكد من وجود تلميح
    if (!gameState.hint || gameState.hint.trim() === "") {
        gameState.hint = "تلميح غير متوفر لهذه الكلمة، حاول تخمينها!";
    }
    
    // عرض التلميح بشكل واضح
    hintText.textContent = gameState.hint;
    hintText.classList.remove('hidden');
    hintBtn.disabled = true;
    hintBtn.classList.add('used');
    
    // تشغيل صوت التلميح
    playSound('hint');
    
    // إظهار إشعار للمستخدم
    showNotification('تم عرض التلميح!', 'info');
}

// إضافة وظيفة الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // إزالة الإشعار بعد فترة
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// إظهار شاشة اختيار الموضوع
function showTopicSelection() {
    gameArea.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    topicSelection.classList.remove('hidden');
}

// مشاركة النتائج
function shareResults() {
    const text = `لقد ${gameState.won ? 'فزت' : 'خسرت'} في لعبة الرجل المشنوق! الكلمة كانت: ${gameState.word}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'نتيجة لعبة الرجل المشنوق',
            text: text
        }).catch(console.error);
    } else {
        // نسخ النص إلى الحافظة
        navigator.clipboard.writeText(text)
            .then(() => alert('تم نسخ النتيجة إلى الحافظة'))
            .catch(err => console.error('خطأ في نسخ النص: ', err));
    }
}

// تبديل السمة
function toggleTheme() {
    const isLightTheme = document.body.classList.toggle('light-theme');
    const themeIcon = isLightTheme ? 'dark_mode' : 'light_mode';
    themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">${themeIcon}</span>`;
    localStorage.setItem("themeColor", themeIcon);
}

// تبديل الصوت
function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundIcon = soundEnabled ? 'volume_up' : 'volume_off';
    soundToggleBtn.innerHTML = `<span class="material-symbols-rounded">${soundIcon}</span>`;
    localStorage.setItem("soundEnabled", soundEnabled);
}

// تشغيل الأصوات
function playSound(type) {
    if (!soundEnabled) return;
    
    // هنا يمكن إضافة أكواد تشغيل الصوت
    console.log(`تشغيل صوت: ${type}`);
}

// توليد كلمة وتلميح من الذكاء الاصطناعي
async function generateWordAndHint(topic) {
    try {
        const prompt = `
        أعطني كلمة واحدة باللغة العربية عن موضوع "${topic}" مناسبة للعبة الرجل المشنوق، وتلميح واضح عنها.
        يجب أن تكون الكلمة مكونة من 3 إلى 8 أحرف.
        
        قم بتنسيق الإجابة كالتالي فقط:
        الكلمة: [الكلمة]
        التلميح: [تلميح واضح عن الكلمة]
        `;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالذكاء الاصطناعي: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        // استخراج الكلمة والتلميح من النص بشكل أكثر دقة
        const wordMatch = text.match(/الكلمة: (.+?)(?:\n|$)/);
        const hintMatch = text.match(/التلميح: (.+?)(?:\n|$)/);
        
        if (!wordMatch || !hintMatch) {
            throw new Error('لم يتم العثور على كلمة أو تلميح في استجابة الذكاء الاصطناعي');
        }
        
        const word = wordMatch[1].trim();
        const hint = hintMatch[1].trim();
        
        // التحقق من صحة الكلمة
        if (word.length < 3 || word.length > 8) {
            throw new Error('الكلمة المولدة غير مناسبة من حيث الطول');
        }
        
        return { word, hint };
    } catch (error) {
        console.error('خطأ في توليد الكلمة والتلميح:', error);
        // إرجاع كلمة وتلميح افتراضيين في حالة الخطأ
        const defaultWord = getDefaultWord(topic);
        const defaultHint = getDefaultHint(defaultWord);
        return { word: defaultWord, hint: defaultHint };
    }
}

// تحسين الكلمات الافتراضية
function getDefaultWord(topic) {
    const defaultWords = {
        "الفضاء والكواكب": ["نجوم", "مريخ", "قمر", "كوكب", "مجرة"],
        "الحيوانات": ["أسد", "نمر", "فيل", "زرافة", "دلفين"],
        "التاريخ الإسلامي": ["مسجد", "خلافة", "صحابة", "هجرة", "فتح"],
        "الرياضيات": ["أرقام", "جمع", "طرح", "ضرب", "قسمة"],
        "جسم الإنسان": ["قلب", "رئة", "كبد", "دماغ", "عظام"],
        "الجغرافيا": ["جبال", "بحار", "أنهار", "صحراء", "غابة"]
    };
    
    // اختيار كلمة عشوائية من المصفوفة إذا كانت موجودة
    if (defaultWords[topic]) {
        const words = defaultWords[topic];
        return words[Math.floor(Math.random() * words.length)];
    }
    
    // كلمات عامة إذا لم يكن الموضوع موجودًا
    const generalWords = ["كتاب", "قلم", "ماء", "شمس", "قمر", "باب", "نافذة"];
    return generalWords[Math.floor(Math.random() * generalWords.length)];
}

// إضافة تلميحات افتراضية
function getDefaultHint(word) {
    const hints = {
        "نجوم": "تضيء في السماء ليلاً",
        "مريخ": "الكوكب الأحمر في المجموعة الشمسية",
        "قمر": "يدور حول الأرض ويضيء ليلاً",
        "كوكب": "جرم سماوي يدور حول الشمس",
        "مجرة": "تجمع هائل من النجوم والكواكب في الفضاء",
        "أسد": "ملك الغابة",
        "نمر": "حيوان مفترس مخطط",
        "فيل": "أكبر الحيوانات البرية",
        "زرافة": "حيوان طويل الرقبة",
        "دلفين": "ثدييات بحرية ذكية",
        "مسجد": "مكان للعبادة في الإسلام",
        "خلافة": "نظام حكم إسلامي",
        "صحابة": "من عاصروا النبي محمد",
        "هجرة": "انتقال النبي من مكة إلى المدينة",
        "فتح": "انتصار المسلمين في معركة",
        "أرقام": "رموز تستخدم في الحساب",
        "جمع": "عملية حسابية لإضافة الأرقام",
        "طرح": "عملية حسابية لإيجاد الفرق",
        "ضرب": "عملية حسابية للتكرار",
        "قسمة": "عملية حسابية للتوزيع",
        "قلب": "عضو ضخ الدم في الجسم",
        "رئة": "عضو التنفس في الجسم",
        "كبد": "عضو تنقية السموم في الجسم",
        "دماغ": "مركز التفكير في الجسم",
        "عظام": "الهيكل الصلب للجسم",
        "جبال": "مرتفعات أرضية شاهقة",
        "بحار": "مسطحات مائية مالحة",
        "أنهار": "مجاري مائية عذبة",
        "صحراء": "منطقة جافة قليلة الأمطار",
        "غابة": "منطقة كثيفة الأشجار",
        "كتاب": "مجموعة من الصفحات تحتوي على معلومات",
        "قلم": "أداة للكتابة",
        "ماء": "سائل الحياة",
        "شمس": "نجم يمنح الأرض الضوء والحرارة",
        "باب": "مدخل للمنزل أو الغرفة",
        "نافذة": "فتحة في الجدار للتهوية والإضاءة"
    };
    
    return hints[word] || "حاول تخمين الكلمة!";
}