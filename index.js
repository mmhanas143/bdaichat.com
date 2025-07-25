// প্রয়োজনীয় HTML এলিমেন্টগুলো সিলেক্ট করা
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loading-indicator');
const settingsButton = document.getElementById('settingsButton');
const settingsMenu = document.getElementById('settingsMenu');
const lightThemeButton = document.getElementById('lightTheme');
const darkThemeButton = document.getElementById('darkTheme');
const langBnButton = document.getElementById('langBn');
const langEnButton = document.getElementById('langEn');
const aboutOption = document.getElementById('aboutOption');
const aboutModal = document.getElementById('aboutModal');
const closeAboutModalButton = document.getElementById('closeAboutModal');

// চ্যাট হিস্ট্রি সংরক্ষণের জন্য একটি অ্যারে
let chatHistory = [];

// অনুবাদ ডেটা
const translations = {
    bn: {
        appTitle: 'Gemini এর সাথে চ্যাট করুন',
        initialMessage: 'হ্যালো! আমি Gemini। আপনি আমাকে যেকোনো প্রশ্ন করতে পারেন।',
        inputPlaceholder: 'এখানে আপনার বার্তা লিখুন...',
        themeLabel: 'থিম',
        lightTheme: 'লাইট',
        darkTheme: 'ডার্ক',
        languageLabel: 'ভাষা',
        langBn: 'বাংলা',
        langEn: 'ইংলিশ',
        aboutOption: 'সম্পর্কে',
        aboutTitle: 'সম্পর্কে',
        errorMessage: 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        noResponse: 'দুঃখিত, আমি কোনো উত্তর খুঁজে পাইনি।'
    },
    en: {
        appTitle: 'Chat with Gemini',
        initialMessage: 'Hello! I am Gemini. You can ask me anything.',
        inputPlaceholder: 'Type your message here...',
        themeLabel: 'Theme',
        lightTheme: 'Light',
        darkTheme: 'Dark',
        languageLabel: 'Language',
        langBn: 'Bengali',
        langEn: 'English',
        aboutOption: 'About',
        aboutTitle: 'About',
        errorMessage: 'An error occurred. Please try again.',
        noResponse: 'Sorry, I could not find a response.'
    }
};

let currentLanguage = localStorage.getItem('appLanguage') || 'en'; // ডিফল্ট ভাষা ইংলিশ

// ভাষা সেট করার ফাংশন
const setLanguage = (lang) => {
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.dataset.langKey;
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
            if (element.id === 'userInput') { // ইনপুট প্লেসহোল্ডার আলাদাভাবে সেট করা
                element.placeholder = translations[currentLanguage][key];
            }
        }
    });
    // প্রাথমিক বার্তা যদি লোড হওয়ার আগে যোগ হয়ে থাকে, তাহলে সেটা আপডেট করা
    const initialMsgElement = document.getElementById('initialMessage').querySelector('p');
    if (initialMsgElement) {
        initialMsgElement.textContent = translations[currentLanguage].initialMessage;
    }
};

// থিম টগল করার ফাংশন
const toggleTheme = (theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
};

// ব্যবহারকারীর মেসেজ পাঠানোর ফাংশন
const sendMessage = async () => {
    const userMessage = userInput.value.trim();
    if (userMessage === '') return; // খালি মেসেজ পাঠানো হবে না

    // ব্যবহারকারীর মেসেজ চ্যাটবক্সে দেখানো
    addMessageToChatbox(userMessage, 'user');
    userInput.value = ''; // ইনপুট ফিল্ড খালি করা

    // লোডিং ইন্ডিকেটর দেখানো
    loadingIndicator.classList.remove('hidden');
    scrollToBottom();

    try {
        // Gemini API কল করার জন্য প্রস্তুতি
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // এখানে কোনো API Key দেওয়ার প্রয়োজন নেই
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // API তে fetch request পাঠানো
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // API থেকে পাওয়া উত্তর বের করা
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            
            const geminiResponse = result.candidates[0].content.parts[0].text;
            chatHistory.push({ role: "model", parts: [{ text: geminiResponse }] });
            
            // Gemini-এর উত্তর চ্যাটবক্সে দেখানো
            addMessageToChatbox(geminiResponse, 'gemini');
        } else {
            // যদি কোনো উত্তর না পাওয়া যায়
            addMessageToChatbox(translations[currentLanguage].noResponse, 'gemini');
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        addMessageToChatbox(translations[currentLanguage].errorMessage, 'gemini');
    } finally {
        // লোডিং ইন্ডিকেটর লুকানো
        loadingIndicator.classList.add('hidden');
        scrollToBottom();
    }
};

// চ্যাটবক্সে নতুন মেসেজ যোগ করার ফাংশন
const addMessageToChatbox = (message, sender) => {
    const messageWrapper = document.createElement('div');
    const messageElement = document.createElement('div');
    
    messageElement.innerHTML = message.replace(/\n/g, '<br>'); // Newlines to <br>
    
    // প্রেরকের উপর ভিত্তি করে স্টাইল সেট করা
    if (sender === 'user') {
        messageWrapper.className = 'flex justify-end';
        messageElement.className = 'bg-blue-600 text-white p-3 rounded-xl max-w-lg';
    } else {
        messageWrapper.className = 'flex justify-start';
        messageElement.className = 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-xl max-w-lg';
    }
    
    messageWrapper.appendChild(messageElement);
    chatbox.appendChild(messageWrapper);
    scrollToBottom();
};

// চ্যাটবক্সের নিচে স্ক্রল করার ফাংশন
const scrollToBottom = () => {
    chatbox.scrollTop = chatbox.scrollHeight;
};

// ইভেন্ট লিসেনার্স
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // ফর্ম সাবমিট হওয়া আটকানো
        sendMessage();
    }
});

// সেটিংস মেনু টগল করা
settingsButton.addEventListener('click', (event) => {
    event.stopPropagation(); // ইভেন্ট প্রোপাগেশন বন্ধ করা যাতে ডকুমেন্ট ক্লিক ইভেন্ট মেনু বন্ধ না করে
    settingsMenu.classList.toggle('hidden');
});

// থিম পরিবর্তনের জন্য ইভেন্ট লিসেনার
lightThemeButton.addEventListener('click', (event) => {
    event.preventDefault();
    toggleTheme('light');
    settingsMenu.classList.add('hidden'); // মেনু বন্ধ করা
});

darkThemeButton.addEventListener('click', (event) => {
    event.preventDefault();
    toggleTheme('dark');
    settingsMenu.classList.add('hidden'); // মেনু বন্ধ করা
});

// ভাষা পরিবর্তনের জন্য ইভেন্ট লিসেনার
langBnButton.addEventListener('click', (event) => {
    event.preventDefault();
    setLanguage('bn');
    settingsMenu.classList.add('hidden'); // মেনু বন্ধ করা
});

langEnButton.addEventListener('click', (event) => {
    event.preventDefault();
    setLanguage('en');
    settingsMenu.classList.add('hidden'); // মেনু বন্ধ করা
});

// এবাউট অপশনে ক্লিক করলে মডাল দেখানো
aboutOption.addEventListener('click', (event) => {
    event.preventDefault();
    aboutModal.classList.remove('hidden');
    settingsMenu.classList.add('hidden'); // মেনু বন্ধ করা
});

// এবাউট মডাল বন্ধ করা
closeAboutModalButton.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
});

// মডালের বাইরে ক্লিক করলে মডাল বন্ধ করা
aboutModal.addEventListener('click', (event) => {
    if (event.target === aboutModal) {
        aboutModal.classList.add('hidden');
    }
});

// ডকুমেন্ট এর যেকোনো জায়গায় ক্লিক করলে সেটিংস মেনু বন্ধ করা
document.addEventListener('click', (event) => {
    if (!settingsButton.contains(event.target) && !settingsMenu.contains(event.target)) {
        settingsMenu.classList.add('hidden');
    }
});

// পেজ লোড হওয়ার সময় থিম এবং ভাষা সেট করা
document.addEventListener('DOMContentLoaded', () => {
    // থিম লোড করা
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        toggleTheme(savedTheme);
    } else {
        // সিস্টেম প্রেফারেন্স চেক করা যদি কোনো থিম সেভ না থাকে
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            toggleTheme('dark');
        } else {
            toggleTheme('light');
        }
    }

    // ভাষা লোড করা
    setLanguage(currentLanguage);
});

