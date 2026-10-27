export type Language = "en" | "bn";
export type TranslationValues = Record<string, string | number>;

export const bangla: Record<string, string> = {
  "Kana Challenge": "কানা কুইজ",
  "A LITTLE CHALLENGE, EVERY DAY": "প্রতিদিন ছোট্ট একটি চ্যালেঞ্জ",
  "A few familiar characters. A fresh little challenge.":
    "পরিচিত কিছু অক্ষর নিয়ে নতুন একটি চ্যালেঞ্জ।",
  "How many characters do you remember?": "অক্ষরগুলো কতটা মনে আছে?",
  "Quick quiz": "কুইজ খেলো",
  "Quiz this lesson": "এই পাঠের কুইজ",
  "Both scripts": "দুটোই",
  "Choose your rows": "সারি বেছে নাও",
  "Select all": "সব নির্বাচন",
  "Number of questions": "প্রশ্নের সংখ্যা",
  "Question timer": "প্রশ্নের টাইমার",
  "Optional · 15 seconds per question": "ঐচ্ছিক · প্রতি প্রশ্নে ১৫ সেকেন্ড",
  On: "চালু",
  Off: "বন্ধ",
  "Questions and choices stay within your selected rows.":
    "প্রশ্ন ও উত্তরের অপশন নির্বাচিত সারি থেকেই আসবে।",
  "Personal best: {score}/{total}": "নিজের সেরা: {score}/{total}",
  "{count} characters selected": "{count}টি অক্ষর নির্বাচিত",
  "Start quiz": "শুরু করো",
  "Leave quiz": "বের হও",
  "Question {current} of {total}": "প্রশ্ন {current} / {total}",
  "Quiz progress": "কুইজের অগ্রগতি",
  "Combo: {count}": "টানা সঠিক: {count}",
  "{count} seconds": "{count} সেকেন্ড",
  Paused: "বিরতি",
  "What is this character?": "অক্ষরটির উচ্চারণ কী?",
  "Choose the pronunciation": "উচ্চারণ বেছে নাও",
  "Correct!": "সঠিক!",
  "Time is up": "সময় শেষ",
  "A little more practice.": "আরেকটু অনুশীলন করো।",
  "See results": "ফলাফল দেখো",
  "Next question": "পরের প্রশ্ন",
  "MISTAKES REVIEWED": "ভুলগুলো আবার অনুশীলন হলো",
  "ONE SMALL QUIZ. REAL PRACTICE.": "ছোট্ট কুইজ, শেখার আরও এক ধাপ।",
  "Nicely done!": "ভালো করেছ!",
  "{count}% correct": "{count}% সঠিক উত্তর",
  "Best combo: {count}": "সর্বোচ্চ টানা সঠিক: {count}",
  "Give these another look": "এই অক্ষরগুলো আরেকবার দেখো",
  "Retry mistakes": "ভুলগুলো আবার খেলো",
  "Practice these in writing": "এই অক্ষরগুলো লিখে শেখো",
  "Every answer correct. Keep growing!": "সব উত্তর সঠিক। এভাবেই এগিয়ে চলো!",
  "Play again": "আবার খেলো",
  "Change rows": "সারি বদলাও",
  "Leave this quiz?": "কুইজ থেকে বের হবে?",
  "This unfinished quiz will not be saved.": "অসম্পূর্ণ কুইজটি সেভ হবে না।",
  "Keep playing": "খেলতে থাকো",
  "Quiz progress could not be saved. You can still play.":
    "কুইজের অগ্রগতি সেভ করা যায়নি। খেলা চালিয়ে যেতে পারো।",
  "Remove downloaded audio?": "ডাউনলোড করা অডিও সরাবে?",
  "You will need an internet connection to play or download these recordings again. Your progress and settings will stay saved.":
    "এই রেকর্ডিংগুলো আবার শুনতে বা ডাউনলোড করতে ইন্টারনেট লাগবে। তোমার অগ্রগতি ও সেটিংস সেভ থাকবে।",
  "Could not remove audio. Please try again.":
    "অডিও সরানো যায়নি। আবার চেষ্টা করো।",
  Cancel: "বাতিল",
  "Remove audio": "অডিও সরাও",
  "Removing…": "সরানো হচ্ছে…",
  Home: "হোম",
  Lessons: "পাঠ",
  Library: "অক্ষর",
  Progress: "অগ্রগতি",
  More: "আরও",
  Help: "সাহায্য",
  "More options": "আরও বিকল্প",
  "Main navigation": "প্রধান নেভিগেশন",
  "Kaku home": "কাকু হোম",
  "Offline access is available in the production app.":
    "প্রোডাকশন অ্যাপে অফলাইন সুবিধা পাওয়া যায়।",
  "App update": "অ্যাপ আপডেট",
  "Finish practice in all open Kaku tabs, then try again.":
    "খোলা সব কাকু ট্যাবে অনুশীলন শেষ করে আবার চেষ্টা করো।",
  "A new version of Kaku is ready.": "কাকুর নতুন সংস্করণ প্রস্তুত।",
  "Update and reload": "আপডেট করে আবার খোলো",
  "Kaku on your device": "তোমার ডিভাইসে কাকু",
  "You are offline. Your notebook is ready.":
    "তুমি অফলাইনে আছো। তোমার খাতা প্রস্তুত।",
  "You are offline. Connect to prepare Kaku for offline use.":
    "তুমি অফলাইনে আছো। অফলাইনে ব্যবহারের জন্য কাকুকে প্রস্তুত করতে ইন্টারনেটে সংযোগ করো।",
  "Offline setup failed. You can still practise online.":
    "অফলাইন প্রস্তুতি সম্পন্ন হয়নি। অনলাইনে অনুশীলন করতে পারবে।",
  "Ready offline: lessons, practice, and progress.":
    "অফলাইনে প্রস্তুত: পাঠ, অনুশীলন ও অগ্রগতি।",
  "Preparing offline access…": "অফলাইনে ব্যবহারের জন্য প্রস্তুত হচ্ছে…",
  "Retry offline setup": "অফলাইন প্রস্তুতি আবার চেষ্টা করো",
  "Kaku is installed": "কাকু ইনস্টল করা আছে",
  "Install Kaku": "কাকু ইনস্টল করো",
  "Open your notebook from your home screen or desktop.":
    "হোম স্ক্রিন বা ডেস্কটপ থেকে তোমার খাতা খোলো।",
  "Not now": "এখন নয়",
  "How to install": "কীভাবে ইনস্টল করবে",
  "On iPhone or iPad: open the Share menu, then choose Add to Home Screen. You may need to choose Open as Web App.":
    "iPhone বা iPad-এ Share মেনু খুলে Add to Home Screen বেছে নাও। Open as Web App বেছে নিতে হতে পারে।",
  "On desktop or Android: look for Install Kaku or Install app in your browser menu. On Mac Safari, choose File → Add to Dock. Options vary by browser.":
    "ডেস্কটপ বা Android-এ ব্রাউজারের মেনুতে Install Kaku বা Install app খুঁজে দেখো। Mac Safari-তে File → Add to Dock বেছে নাও। ব্রাউজার অনুযায়ী বিকল্প আলাদা হতে পারে।",
  "Offline pronunciation": "অফলাইন উচ্চারণ",
  "{count} of {total} recordings saved.":
    "{total}টি রেকর্ডিংয়ের মধ্যে {count}টি সেভ করা হয়েছে।",
  "Played audio is saved automatically. Download all recordings to hear every kana offline.":
    "শোনা অডিও স্বয়ংক্রিয়ভাবে সেভ হয়। সব কানা অফলাইনে শুনতে সব রেকর্ডিং ডাউনলোড করো।",
  "Downloading…": "ডাউনলোড হচ্ছে…",
  "Download all audio": "সব অডিও ডাউনলোড করো",
  "Cancel download": "ডাউনলোড বাতিল করো",
  "Remove downloaded audio": "ডাউনলোড করা অডিও সরাও",
  "Audio download progress": "অডিও ডাউনলোডের অগ্রগতি",
  "Could not save audio. Check your connection and available storage, then retry. Saved recordings will be reused.":
    "অডিও সেভ করা যায়নি। সংযোগ ও খালি স্টোরেজ পরীক্ষা করে আবার চেষ্টা করো। সেভ করা রেকর্ডিং আবার ডাউনলোড করতে হবে না।",
  "Your browser may clear offline files and progress. Export a backup to keep your notebook safe.":
    "ব্রাউজার অফলাইন ফাইল ও অগ্রগতি মুছে ফেলতে পারে। তোমার খাতা নিরাপদ রাখতে ব্যাকআপ এক্সপোর্ট করো।",
  "Could not play audio. Check your connection and media volume, then try again.":
    "অডিও চালানো যায়নি। ইন্টারনেট সংযোগ ও মিডিয়ার ভলিউম পরীক্ষা করে আবার চেষ্টা করো।",
  Overview: "এক নজরে",
  "My lessons": "আমার পাঠ",
  "Character library": "অক্ষরের সংগ্রহ",
  Review: "রিভিউ",
  "My progress": "আমার অগ্রগতি",
  Settings: "সেটিংস",
  "Writing practice": "লেখার অনুশীলন",
  "Opening your notebook…": "তোমার খাতা খুলছে…",
  "A LITTLE EVERY DAY": "প্রতিদিন অল্প অল্প",
  "YOUR LEARNING SPACE": "তোমার শেখার জায়গা",
  "Small strokes.": "ছোট ছোট আঁচড়।",
  "Beautiful beginnings.": "সুন্দর শুরু।",
  "Make a little space for": "প্রতিদিন একটু সময় রাখো",
  "Japanese, every day.": "জাপানি শেখার জন্য।",
  "A little help": "একটু সাহায্য",
  "Your little notebook": "তোমার ছোট্ট খাতা",
  "Saved on this device": "এই ডিভাইসে সেভ করা",
  "My workspace": "আমার শেখার জায়গা",
  "Close navigation": "মেনু বন্ধ করো",
  "Open navigation": "মেনু খোলো",
  "Open your settings": "তোমার সেটিংস খোলো",
  "Your browser couldn’t save progress. This session still works; enable browser storage to keep your notebook.":
    "ব্রাউজারে অগ্রগতি সেভ করা যায়নি। এখন অনুশীলন করতে পারবে; খাতাটি রাখতে ব্রাউজারের স্টোরেজ চালু করো।",
  "A LITTLE BETTER, EVERY DAY": "প্রতিদিন একটু একটু উন্নতি",
  "Your next chapter starts here": "শেখার নতুন শুরু এখানেই",
  "Slow down, pick up your pen, and make your mark.":
    "ধীরে শুরু করো, কলম ধরো, নিজের মতো করে লেখো।",
  "FIND YOUR FLOW": "নিজের ছন্দ খুঁজে নাও",
  "Lasting progress.": "শেখা থাকুক মনে।",
  "Learn to write Japanese, one character at a time.":
    "একটি একটি অক্ষর লিখে জাপানি শেখো।",
  "No rush. Just you, your pen, and a little practice.":
    "তাড়া নেই। তুমি, তোমার কলম আর একটু অনুশীলন।",
  "Continue learning": "শেখা চালিয়ে যাও",
  "Start your first lesson": "প্রথম পাঠ শুরু করো",
  "Three simple steps. A skill that stays.": "তিনটি সহজ ধাপ। শেখা থাকবে মনে।",
  "to write is to learn": "লিখতে লিখতেই শেখা",
  "Your learning paths": "তোমার শেখার পথ",
  "View all lessons": "সব পাঠ দেখো",
  "NEXT CHAPTER": "পরের অধ্যায়",
  "START HERE": "এখান থেকে শুরু",
  Hiragana: "হিরাগানা",
  Katakana: "কাতাকানা",
  hiragana: "হিরাগানা",
  katakana: "কাতাকানা",
  "A new shape. A familiar sound.": "নতুন আকার, পরিচিত ধ্বনি।",
  "Your foundation in Japanese.": "জাপানি শেখার ভিত্তি।",
  "A little, every day": "প্রতিদিন অল্প অল্প",
  "characters today": "আজকের অক্ষর",
  "Your daily moment, beautifully done.":
    "আজকের লক্ষ্য সুন্দরভাবে পূর্ণ হয়েছে।",
  "A few minutes is all it takes.": "কয়েক মিনিটই যথেষ্ট।",
  "Adjust daily goal": "দৈনিক লক্ষ্য বদলাও",
  "A rhythm that helps it stick": "এই ছন্দে শেখা থাকবে মনে",
  "Less guessing. More remembering.": "অনুমান কম, মনে থাকবে বেশি।",
  "Follow the stroke": "স্ট্রোক অনুসরণ করো",
  "Start with a little direction.": "নির্দেশনা দেখে শুরু করো।",
  "One guided stroke at a time.": "একবারে একটি স্ট্রোক লেখো।",
  "Trace the character": "অক্ষর ট্রেস করো",
  "Let the outline guide your hand.": "হালকা রেখার ওপর হাত চালাও।",
  "Feel the shape come together.": "অক্ষরের আকার চিনে নাও।",
  "Make it your own": "মনে করে লেখো",
  "No guides. Just your memory.": "গাইড নেই। শুধু মনে করে লেখা।",
  "You know more than you think.": "ভাবছ তার চেয়েও বেশি শিখেছ।",
  "A journey of a thousand miles begins with a single step.":
    "হাজার মাইলের যাত্রাও শুরু হয় একটি পদক্ষেপ দিয়ে।",
  "ONE CHARACTER AT A TIME": "একবারে একটি অক্ষর",
  "Find your next little step.": "শেখার পরের ধাপ বেছে নাও।",
  "A few characters. Three rounds of practice. Something new to carry with you.":
    "কয়েকটি অক্ষর, তিন ধাপে অনুশীলন। নতুন কিছু শিখে এগিয়ে যাও।",
  "Every lesson is open. Start anywhere, and come back as often as you like.":
    "সব পাঠ খোলা। যেখান থেকে খুশি শুরু করো, যতবার ইচ্ছা ফিরে এসো।",
  "YOUR POCKET REFERENCE": "হাতের কাছেই অক্ষরের পরিচয়",
  "Meet the characters.": "অক্ষরগুলোর সঙ্গে পরিচিত হও।",
  "Explore the shapes, hear the sounds, and make a little time for the ones you love.":
    "আকার দেখো, উচ্চারণ শোনো, পছন্দের অক্ষরগুলো একটু লিখে দেখো।",
  "Search characters": "অক্ষর খোঁজো",
  "Search character or reading…": "অক্ষর বা উচ্চারণ দিয়ে খোঁজো…",
  "Clear search": "খোঁজা মুছে দাও",
  "No characters found.": "কোনো অক্ষর পাওয়া যায়নি।",
  "Try a character or a reading like “shi”.":
    "একটি অক্ষর বা “shi”-এর মতো উচ্চারণ দিয়ে খোঁজো।",
  "A LITTLE REPETITION GOES A LONG WAY": "বারবার লিখলে শেখা থাকে মনে",
  "Make it feel familiar.": "আরেকবার লিখে ঝালিয়ে নাও।",
  "Revisit the tricky ones, or put together a practice session of your own.":
    "কঠিন অক্ষরগুলো আবার লেখো, অথবা নিজের অনুশীলন সাজিয়ে নাও।",
  "A fresh page. No reviews due.": "এখন কোনো রিভিউ বাকি নেই।",
  "A gentle refresher helps your practice stay with you.":
    "আরেকটু অনুশীলনে শেখা আরও ভালোভাবে মনে থাকবে।",
  "You’re up to date. Choose a few characters below for extra practice.":
    "সব রিভিউ শেষ। বাড়তি অনুশীলনের জন্য নিচে কয়েকটি অক্ষর বেছে নাও।",
  "Finish your first lesson and your review collection will grow here.":
    "প্রথম পাঠ শেষ করলে তোমার রিভিউর অক্ষর এখানে আসবে।",
  "Start review": "রিভিউ শুরু করো",
  "Start a lesson": "একটি পাঠ শুরু করো",
  "Your own little session": "নিজের মতো অনুশীলন",
  "Choose the characters you’d like to revisit.":
    "যে অক্ষরগুলো আবার লিখতে চাও, বেছে নাও।",
  "Clear selection": "বাছাই মুছে দাও",
  "Practice selected": "বাছাই করা অক্ষর লেখো",
  "EVERY STROKE ADDS UP": "প্রতিটি স্ট্রোকেই এগিয়ে যাও",
  "See how far you’ve come.": "কতটা এগিয়েছ, দেখে নাও।",
  "Your progress, at your pace. There’s no finish line to rush toward.":
    "নিজের গতিতে এগিয়ে যাও। তাড়াহুড়ো করে শেষ করার কিছু নেই।",
  "Characters practiced": "অনুশীলন করা অক্ষর",
  "of 92 basic kana": "মোট ৯২টি মূল কানার মধ্যে",
  "Recalled independently": "সাহায্য ছাড়া লিখেছ",
  "without hints or retries": "ইঙ্গিত বা আবার চেষ্টা ছাড়া",
  "Current streak": "টানা অনুশীলন",
  "day of making time": "দিন সময় দিয়েছ",
  "days of making time": "দিন সময় দিয়েছ",
  "Practice sessions": "অনুশীলনের সংখ্যা",
  "completed character cycles": "তিন ধাপ শেষ করা অক্ষর",
  "A week of little moments": "এক সপ্তাহের ছোট ছোট চর্চা",
  "Last 7 days": "গত ৭ দিন",
  Today: "আজ",
  "Your latest pages": "সাম্প্রতিক অনুশীলন",
  "Keep practicing": "আরও অনুশীলন করো",
  "Your story starts with a stroke.": "একটি স্ট্রোকেই হোক শুরু।",
  "Complete a lesson and watch your notebook fill up.":
    "একটি পাঠ শেষ করো, তোমার খাতা ভরে উঠবে।",
  "Start learning": "শেখা শুরু করো",
  "MAKE YOURSELF AT HOME": "নিজের মতো করে সাজিয়ে নাও",
  "Your practice, your way.": "তোমার অনুশীলন, তোমার মতো।",
  "A few small adjustments for a space that feels like yours.":
    "কয়েকটি ছোট পরিবর্তনে শেখার জায়গাটি হোক তোমার নিজের।",
  "Your daily rhythm": "তোমার দৈনিক ছন্দ",
  "Daily character goal": "দৈনিক অক্ষরের লক্ষ্য",
  "A gentle target. You can always do a little more.":
    "ছোট একটি লক্ষ্য। চাইলে আরও বেশি লিখতে পারো।",
  "Writing grid": "লেখার ঘর",
  "Subtle guide lines to help with balance and placement.":
    "অক্ষরের ভারসাম্য ও অবস্থান ঠিক রাখতে হালকা সহায়ক রেখা।",
  "Audio prompts": "উচ্চারণ শোনা",
  "Allow pronunciation playback when reviewing characters.":
    "অক্ষর অনুশীলনের সময় উচ্চারণ শোনার সুযোগ রাখো।",
  "Reduced motion": "কম অ্যানিমেশন",
  "Pause looping stroke animation and keep transitions gentle.":
    "বারবার চলা স্ট্রোক অ্যানিমেশন বন্ধ রাখো, পরিবর্তন কমাও।",
  "Keep your notebook safe": "তোমার খাতা যত্নে রাখো",
  "Your progress is stored in this browser, on this device. Clearing browser data removes it. Keep a backup to bring your practice with you.":
    "তোমার অগ্রগতি এই ডিভাইসের এই ব্রাউজারে থাকে। ব্রাউজারের ডেটা মুছলে এটিও মুছে যাবে। অনুশীলনের তথ্য সঙ্গে রাখতে ব্যাকআপ রাখো।",
  "Export progress": "অগ্রগতির ব্যাকআপ নাও",
  "Import progress": "ব্যাকআপ ফিরিয়ে আনো",
  "Start with a fresh page": "নতুন করে শুরু করো",
  "Remove your practice history from this device.":
    "এই ডিভাইস থেকে অনুশীলনের ইতিহাস মুছে দাও।",
  "Reset progress": "অগ্রগতি মুছে দাও",
  "A little credit, where it’s due.": "যাঁদের অবদান আছে।",
  "Character stroke data by": "অক্ষরের স্ট্রোক ডেটা:",
  ", © Ulrich Apel and contributors. Reference paths and sampled stroke guides are shared under":
    ", © Ulrich Apel ও সহযোগীরা। রেফারেন্স পথ ও সেগুলো থেকে তৈরি স্ট্রোক গাইডের লাইসেন্স:",
  "Read the license.": "লাইসেন্স পড়ো।",
  "Made for a little progress, every day.":
    "প্রতিদিন একটু এগিয়ে যাওয়ার জন্য।",
  "Your pace. Your practice.": "তোমার গতি। তোমার অনুশীলন।",
  "Dismiss notification": "বার্তা সরাও",
  "Character details": "অক্ষরের বিস্তারিত",
  "Play pronunciation": "উচ্চারণ শোনো",
  "Practiced before": "আগে অনুশীলন করেছ",
  "A new little beginning": "নতুন শেখার শুরু",
  "Practice this character": "এই অক্ষর অনুশীলন করো",
  "How to practice": "যেভাবে অনুশীলন করবে",
  "WELCOME TO YOUR LITTLE NOTEBOOK": "তোমার ছোট্ট খাতায় স্বাগতম",
  "Three steps. A little more confidence.": "তিনটি ধাপে বাড়ুক আত্মবিশ্বাস।",
  "01 · Follow the stroke": "০১ · স্ট্রোক অনুসরণ করো",
  "02 · Trace the character": "০২ · অক্ষর ট্রেস করো",
  "03 · Write from memory": "০৩ · মনে করে লেখো",
  "Draw the highlighted path, starting at the numbered dot. The animation shows the direction.":
    "সংখ্যা দেওয়া বিন্দু থেকে উজ্জ্বল রেখাটি অনুসরণ করে লেখো। অ্যানিমেশন লেখার দিক দেখাবে।",
  "Follow the faint outline with the same stroke order.":
    "একই স্ট্রোকের ক্রম মেনে হালকা রেখার ওপর লেখো।",
  "Read the prompt and write without a guide. Hint is always there if you need it.":
    "উচ্চারণ দেখে গাইড ছাড়া লেখো। দরকার হলে ইঙ্গিত নিতে পারো।",
  "Lift your pen or finger after each stroke. We check it automatically and move forward when you finish.":
    "প্রতিটি স্ট্রোকের পরে কলম বা আঙুল ওঠাও। স্ট্রোক নিজে থেকেই যাচাই হবে; শেষ হলে পরের ধাপে যাবে।",
  "Got it": "বুঝেছি",
  "Reset practice history": "অনুশীলনের ইতিহাস মুছে দাও",
  "Start with a fresh page?": "নতুন করে শুরু করবে?",
  "This removes all practice history on this device. Your settings stay. Export a backup first if you’d like to keep your progress.":
    "এই ডিভাইসের সব অনুশীলনের ইতিহাস মুছে যাবে। সেটিংস থাকবে। অগ্রগতি রাখতে চাইলে আগে ব্যাকআপ নাও।",
  "Keep my progress": "আমার অগ্রগতি রাখো",
  "Close dialog": "উইন্ডো বন্ধ করো",
  "Choose script": "লিপি বেছে নাও",
  "Your notebook backup is ready.": "তোমার খাতার ব্যাকআপ তৈরি হয়েছে।",
  "Your practice history has been restored.":
    "তোমার অনুশীলনের ইতিহাস ফিরে এসেছে।",
  "Could not restore this file. Choose a valid Kaku backup.":
    "এই ফাইল থেকে তথ্য ফেরানো যায়নি। সঠিক Kaku ব্যাকআপ বেছে নাও।",
  "A fresh page, ready for you.": "নতুন পাতা তোমার জন্য প্রস্তুত।",
  "Take your time. Every stroke is a small step forward.":
    "ধীরে লেখো। প্রতিটি স্ট্রোকেই একটু এগিয়ে যাচ্ছ।",
  "A fresh start. You’ve got this.": "আবার শুরু করো। তুমি পারবে।",
  "Now trace the whole character. Let your hand remember.":
    "এবার পুরো অক্ষর ট্রেস করো। হাতের চর্চায় মনে রাখো।",
  "No outline this time. Trust what you’ve learned.":
    "এবার কোনো রেখা নেই। যা শিখেছ, মনে করে লেখো।",
  "A new character. Start with the highlighted stroke.":
    "নতুন অক্ষর। উজ্জ্বল স্ট্রোক দিয়ে শুরু করো।",
  "Beautifully written! Three steps, one character learned.":
    "সুন্দর লিখেছ! তিন ধাপে একটি অক্ষর শিখলে।",
  "Nicely done. Ready for a little less guidance?":
    "দারুণ হয়েছে। এবার একটু কম সাহায্যে লেখো।",
  "ONE SMALL SESSION. REAL PROGRESS.": "ছোট্ট অনুশীলন, সত্যিকারের অগ্রগতি",
  "Look what you wrote.": "দেখো, কী সুন্দর লিখেছ!",
  "recalled independently": "সাহায্য ছাড়া লিখেছ",
  "to practice again": "আবার অনুশীলন করবে",
  "rounds completed": "ধাপ শেষ হয়েছে",
  "Practice tricky characters": "কঠিন অক্ষর আবার লেখো",
  "Back to my lessons": "আমার পাঠে ফিরে যাও",
  "Back to lessons": "পাঠে ফিরে যাও",
  "Stroke guide": "স্ট্রোক গাইড",
  "Trace guide": "ট্রেস গাইড",
  "From memory": "মনে করে লেখা",
  "WRITE FROM MEMORY": "মনে করে লেখো",
  "FOLLOW THE OUTLINE": "হালকা রেখা অনুসরণ করো",
  "LET’S TAKE IT STROKE BY STROKE": "একটি একটি স্ট্রোক করে লেখো",
  "Follow the highlighted stroke. We’ll guide you, one line at a time.":
    "উজ্জ্বল স্ট্রোক অনুসরণ করো। একবারে একটি রেখা দেখানো হবে।",
  "Trace the soft outline. You’re getting a feel for the character.":
    "হালকা রেখার ওপর লেখো। এভাবেই অক্ষরের আকার মনে থাকবে।",
  "Your turn. Write the character with no guides to help you.":
    "এবার তোমার পালা। কোনো গাইড ছাড়াই অক্ষরটি লেখো।",
  "Japanese audio is unavailable. Enable a Japanese voice in your device settings, then try again.":
    "জাপানি উচ্চারণ শোনা যাচ্ছে না। ডিভাইসের সেটিংসে জাপানি কণ্ঠ চালু করে আবার চেষ্টা করো।",
  "Audio is unavailable in this browser. Follow the reading above.":
    "এই ব্রাউজারে উচ্চারণ শোনা যাচ্ছে না। উপরের উচ্চারণ দেখে লেখো।",
  Undo: "আগের স্ট্রোক মুছো",
  Clear: "সব মুছো",
  Hint: "ইঙ্গিত",
  Replay: "আবার দেখো",
  "Try that stroke again.": "স্ট্রোকটি আবার লেখো।",
  "YOU’VE GOT THIS": "তুমি পারবে",
  "YOUR CHARACTER": "তোমার অক্ষর",
  "Stroke count": "স্ট্রোক সংখ্যা",
  Lesson: "পাঠ",
  "A LITTLE CONTEXT": "একটি উদাহরণ",
  "Progress is a practice,": "অগ্রগতি আসে চর্চায়,",
  "not a perfect stroke.": "নিখুঁত একটি স্ট্রোকে নয়।",
  "Draw a stroke on the writing pad.": "লেখার ঘরে একটি স্ট্রোক লেখো।",
  "A little longer. Follow the stroke all the way through.":
    "আরেকটু লম্বা করো। স্ট্রোকটি শেষ পর্যন্ত লেখো।",
  "Try one smooth stroke at a time.": "একবারে একটি মসৃণ স্ট্রোক লেখো।",
  "Try the other direction. Watch where the stroke starts.":
    "উল্টো দিক থেকে চেষ্টা করো। স্ট্রোকের শুরুর জায়গাটি দেখো।",
  "Check the starting point, then give it another try.":
    "কোথা থেকে শুরু হবে দেখো, তারপর আবার চেষ্টা করো।",
  "Almost. Follow the shape and position a little more closely.":
    "প্রায় হয়েছে। আকার আর অবস্থানটা আরেকটু মিলিয়ে লেখো।",
  "Take another look at where this stroke ends.":
    "স্ট্রোকটি কোথায় শেষ হবে, আরেকবার দেখে নাও।",
  "Lovely stroke. Keep going.": "সুন্দর স্ট্রোক। লিখতে থাকো।",
  Vowels: "স্বরধ্বনি",
  "K row": "ক-বর্গ",
  "S row": "স-বর্গ",
  "T row": "ত-বর্গ",
  "N row": "ন-বর্গ",
  "H row": "হ-বর্গ",
  "M row": "ম-বর্গ",
  "Y row": "ইয়-বর্গ",
  "R row": "র-বর্গ",
  "W row & n": "ওয়-বর্গ ও n",
  "Your review": "তোমার রিভিউ",
  morning: "সকাল",
  dog: "কুকুর",
  sea: "সাগর",
  station: "স্টেশন",
  sound: "শব্দ",
  umbrella: "ছাতা",
  tree: "গাছ",
  mouth: "মুখ",
  smoke: "ধোঁয়া",
  voice: "কণ্ঠস্বর",
  "cherry blossom": "চেরি ফুল",
  salt: "লবণ",
  sushi: "সুশি",
  world: "পৃথিবী",
  sky: "আকাশ",
  egg: "ডিম",
  map: "মানচিত্র",
  moon: "চাঁদ",
  hand: "হাত",
  bird: "পাখি",
  summer: "গ্রীষ্ম",
  garden: "বাগান",
  cloth: "কাপড়",
  cat: "বিড়াল",
  seaweed: "সামুদ্রিক শৈবাল",
  flower: "ফুল",
  sun: "সূর্য",
  boat: "নৌকা",
  room: "ঘর",
  star: "তারা",
  window: "জানালা",
  ear: "কান",
  insect: "পোকা",
  eye: "চোখ",
  forest: "বন",
  mountain: "পাহাড়",
  snow: "তুষার",
  night: "রাত",
  camel: "উট",
  apple: "আপেল",
  absence: "অনুপস্থিতি",
  zero: "শূন্য",
  six: "ছয়",
  crocodile: "কুমির",
  "object marker": "কর্ম নির্দেশক",
  book: "বই",
  "{count} characters": "{count}টি অক্ষর",
  "{count} / 46 characters": "{count} / ৪৬টি অক্ষর",
  "{count} day": "{count} দিন",
  "{count} days": "{count} দিন",
  "{count} stroke": "{count}টি স্ট্রোক",
  "{count} strokes": "{count}টি স্ট্রোক",
  "{count} characters written": "{count}টি অক্ষর লিখেছ",
  "{count} selected": "{count}টি বাছাই করা",
  "{count} characters are ready for another look.":
    "{count}টি অক্ষর আবার অনুশীলনের সময় হয়েছে।",
  "{count} characters, at your own pace.":
    "{count}টি অক্ষর, তোমার নিজের গতিতে।",
  "{done}/{total} practiced": "{done}/{total} অনুশীলন হয়েছে",
  "Character {current} of {total}": "অক্ষর {current} / {total}",
  "Stroke {current} of {total}": "স্ট্রোক {current} / {total}",
  "Write “{reading}”": "“{reading}” লেখো",
  "Hear {reading}": "“{reading}”-এর উচ্চারণ শোনো",
  "You gave {count} characters your full attention. That’s how a habit begins.":
    "{count}টি অক্ষর মন দিয়ে লিখেছ। এভাবেই অভ্যাস তৈরি হয়।",
  "Writing pad. {total} strokes, {done} completed.":
    "লেখার ঘর। মোট {total}টি স্ট্রোক, {done}টি শেষ হয়েছে।",
  "Interface language": "অ্যাপের ভাষা",
  "Choose Bangla or English. Your learning progress stays the same.":
    "বাংলা বা English বেছে নাও। শেখার অগ্রগতি একই থাকবে।",
  Language: "ভাষা",
  "Switch to English": "ইংরেজিতে দেখো",
  "Switch to Bangla": "বাংলায় দেখো",
};

export function localeFor(language: Language): string {
  return language === "bn" ? "bn-BD" : "en-US";
}

export function translate(
  language: Language,
  key: string,
  values: TranslationValues = {},
): string {
  const template = language === "bn" ? (bangla[key] ?? key) : key;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    if (value === undefined) return placeholder;
    return typeof value === "number"
      ? new Intl.NumberFormat(localeFor(language)).format(value)
      : value;
  });
}
