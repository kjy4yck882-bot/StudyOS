import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  BookOpen, Clock, AlertCircle, Plus, Play, Pause, RotateCcw, 
  Upload, Sparkles, Download, Calendar, User, LogOut, Check, 
  Trash2, X, FileText, Target, Award, Layers, Volume2, VolumeX,
  CheckSquare, Edit3, Bot, Loader2, Lock, Unlock, KeyRound, Mail, UserPlus, LogIn, Send, Palette, Printer,
  Flame, TrendingUp, Compass, Calculator, Zap, ShieldAlert, ShoppingBag, Crown, Users, ArrowUpRight,
  Search, CheckCircle2, BarChart2, Key, BookMarked, Radio, Activity
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000`;

const SUBJECTS = ["Matematik", "Fizik", "Kimya", "Biyoloji", "Edebiyat", "Coğrafya", "Tarih", "DKAB"];
const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const TAGS = ["Kavram Eksikliği", "İşlem Hatası", "Yeni Nesil / Soru Tipi", "Süre Yetmedi", "Dikkat Dağınıklığı", "Formül Unutuldu"];

const DAILY_FORMULAS = [
  { title: "Kosinüs Teoremi", desc: "a² = b² + c² - 2bc · cos(A)", subject: "Matematik" },
  { title: "Kondansatör Enerjisi", desc: "E = ½ C · V² = ½ Q · V", subject: "Fizik" },
  { title: "İdeal Gaz Denklemi", desc: "P · V = n · R · T (Paran Varsa Ne Rahat)", subject: "Kimya" },
  { title: "Fotosentez Işıktan Bağımsız", desc: "6 CO₂ + 18 ATP + 12 NADPH ➔ Glikoz", subject: "Biyoloji" },
  { title: "Düzgün Hızlanan Hareket", desc: "x = v₀·t + ½ a·t² | v² = v₀² + 2a·x", subject: "Fizik" }
];

const THEMES = {
  slate: { id: 'slate', name: 'Midnight Slate', cost: 0, bg: 'bg-slate-950 text-slate-100', card: 'bg-slate-900', border: 'border-slate-800', primaryBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white', accentText: 'text-indigo-400', innerCard: 'bg-slate-950', dotColor: 'bg-slate-800' },
  matrix: { id: 'matrix', name: 'Emerald Matrix', cost: 250, bg: 'bg-black text-emerald-100', card: 'bg-zinc-950', border: 'border-emerald-900/60', primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white', accentText: 'text-emerald-400', innerCard: 'bg-zinc-900/80', dotColor: 'bg-emerald-500' },
  cyberpunk: { id: 'cyberpunk', name: 'Cyberpunk Neon', cost: 400, bg: 'bg-neutral-950 text-pink-50', card: 'bg-neutral-900', border: 'border-fuchsia-900/50', primaryBtn: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white', accentText: 'text-fuchsia-400', innerCard: 'bg-neutral-950', dotColor: 'bg-fuchsia-500' },
  tokyo: { id: 'tokyo', name: 'Tokyo Night (Neon)', cost: 500, bg: 'bg-[#0a0f1d] text-cyan-50', card: 'bg-[#11182c]', border: 'border-cyan-900/40', primaryBtn: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold', accentText: 'text-cyan-400', innerCard: 'bg-[#0a0f1d]', dotColor: 'bg-cyan-400' },
  nordic: { id: 'nordic', name: 'Nordic Glacier', cost: 350, bg: 'bg-sky-950 text-sky-50', card: 'bg-sky-900/70', border: 'border-sky-800/60', primaryBtn: 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold', accentText: 'text-sky-300', innerCard: 'bg-sky-950/80', dotColor: 'bg-sky-400' },
  sunset: { id: 'sunset', name: 'Sunset Amber', cost: 450, bg: 'bg-stone-950 text-orange-50', card: 'bg-stone-900', border: 'border-orange-900/50', primaryBtn: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white', accentText: 'text-orange-400', innerCard: 'bg-stone-950', dotColor: 'bg-orange-500' },
  dracula: { id: 'dracula', name: 'Dracula Velvet', cost: 600, bg: 'bg-[#0f0c1b] text-purple-100', card: 'bg-[#18132b]', border: 'border-purple-900/50', primaryBtn: 'bg-purple-600 hover:bg-purple-500 text-white', accentText: 'text-purple-400', innerCard: 'bg-[#0f0c1b]', dotColor: 'bg-purple-600' },
  forest: { id: 'forest', name: 'Deep Forest', cost: 550, bg: 'bg-[#07130c] text-emerald-50', card: 'bg-[#0d2217]', border: 'border-emerald-800/40', primaryBtn: 'bg-teal-600 hover:bg-teal-500 text-white', accentText: 'text-teal-400', innerCard: 'bg-[#07130c]', dotColor: 'bg-teal-500' },
  light: { id: 'light', name: 'Clean Academic', cost: 150, bg: 'bg-slate-100 text-slate-900', card: 'bg-white text-slate-800', border: 'border-slate-200', primaryBtn: 'bg-blue-600 hover:bg-blue-500 text-white', accentText: 'text-blue-600', innerCard: 'bg-slate-50', dotColor: 'bg-blue-600' },
  gold: { id: 'gold', name: 'Royal Gold (VIP)', cost: 900, bg: 'bg-stone-950 text-amber-100', card: 'bg-stone-900', border: 'border-amber-700/60', primaryBtn: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 font-bold', accentText: 'text-amber-400', innerCard: 'bg-stone-950', dotColor: 'bg-amber-400' }
};

const TITLES = [
  { id: '🌱 Çırak Öğrenci', name: '🌱 Çırak Öğrenci', cost: 0 },
  { id: '🏹 Problem Avcısı', name: '🏹 Problem Avcısı', cost: 200 },
  { id: '🦉 Gece Savaşçısı', name: '🦉 Gece Savaşçısı', cost: 400 },
  { id: '⚡ TYT Canavarı', name: '⚡ TYT Canavarı', cost: 750 },
  { id: '👑 Derece Adayı (VIP)', name: '👑 Derece Adayı (VIP)', cost: 1200 }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ykstudy_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentThemeKey, setCurrentThemeKey] = useState(() => localStorage.getItem('ykstudy_theme') || 'slate');
  const activeTheme = THEMES[currentThemeKey] || THEMES.slate;

  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('hub');

  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [newAdminGoal, setNewAdminGoal] = useState('');
  const [oldPinChange, setOldPinChange] = useState('');
  const [newPinChange, setNewPinChange] = useState('');

  const [adminUsersList, setAdminUsersList] = useState([]);
  const [targetUsernameForXp, setTargetUsernameForXp] = useState('');
  const [customXpAmount, setCustomXpAmount] = useState('');

  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [trials, setTrials] = useState([]);
  const [todayGoal, setTodayGoal] = useState({ target: 100, solved: 0 });
  const [streakData, setStreakData] = useState({ streak: 0, days: [] });
  const [books, setBooks] = useState([]);
  const [journal, setJournal] = useState({ rating: 5, reflection: '', focus_hours: 0 });

  const [onlineStudents, setOnlineStudents] = useState([]);
  const [isStudyingInLibrary, setIsStudyingInLibrary] = useState(false);
  const [studyingSubjectName, setStudyingSubjectName] = useState(SUBJECTS[0]);

  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [uniSearchResults, setUniSearchResults] = useState([]);
  const [selectedUniDetail, setSelectedUniDetail] = useState(null);

  const [customSubjectAdd, setCustomSubjectAdd] = useState(SUBJECTS[0]);
  const [customQuestionCount, setCustomQuestionCount] = useState(25);

  const [tytTurkceNet, setTytTurkceNet] = useState(32);
  const [tytSosyalNet, setTytSosyalNet] = useState(14);
  const [tytMatNet, setTytMatNet] = useState(30);
  const [tytFenNet, setTytFenNet] = useState(15);
  const [aytMatNet, setAytMatNet] = useState(32);
  const [aytFizNet, setAytFizNet] = useState(11);
  const [aytKimNet, setAytKimNet] = useState(10);
  const [aytBiyNet, setAytBiyNet] = useState(10);
  const [aytEdebNet, setAytEdebNet] = useState(0);
  const [aytTarNet, setAytTarNet] = useState(0);
  const [aytCogNet, setAytCogNet] = useState(0);
  const [simObp, setSimObp] = useState(90);

  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicWeight, setNewTopicWeight] = useState('Yüksek');
  const [filterTag, setFilterTag] = useState('Tümü');

  const [timerMode, setTimerMode] = useState('pomodoro');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [stopwatchSecs, setStopwatchSecs] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [ambientType, setAmbientType] = useState('rain');
  const audioCtxRef = useRef(null);

  const [mistakeTopicId, setMistakeTopicId] = useState('');
  const [mistakeTag, setMistakeTag] = useState(TAGS[0]);
  const [mistakeDiff, setMistakeDiff] = useState(3);
  const [mistakeNote, setMistakeNote] = useState('');
  const [mistakeFile, setMistakeFile] = useState(null);

  const [schedDay, setSchedDay] = useState(DAYS[0]);
  const [schedSubject, setSchedSubject] = useState(SUBJECTS[0]);
  const [schedTask, setSchedTask] = useState('');

  const [trialTitle, setTrialTitle] = useState('');
  const [trialType, setTrialType] = useState('TYT');
  const [trialCorrect, setTrialCorrect] = useState('');
  const [trialWrong, setTrialWrong] = useState('');

  const [bookTitle, setBookTitle] = useState('');
  const [bookSub, setBookSub] = useState(SUBJECTS[0]);
  const [bookType, setBookType] = useState('Soru Bankası');
  const [bookCover, setBookCover] = useState('from-blue-600 to-indigo-800');
  const [bookTests, setBookTests] = useState(30);
  const [bookPace, setBookPace] = useState(2);

  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const target = new Date('2027-06-20T10:15:00');
    setDaysRemaining(Math.max(0, Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24))));
  }, []);

  const changeTheme = (key) => {
    setCurrentThemeKey(key);
    localStorage.setItem('ykstudy_theme', key);
  };

  const updateProfileXp = (newXp) => {
    if (newXp !== undefined && newXp !== null && currentUser) {
      const updated = { ...currentUser, xp: newXp };
      localStorage.setItem('ykstudy_user', JSON.stringify(updated));
      setCurrentUser(updated);
    }
  };

  const searchUniversities = async (q) => {
    try {
      const res = await axios.get(`${API_BASE}/api/target/search`, { params: { q } });
      setUniSearchResults(res.data || []);
      if (res.data && res.data.length > 0 && !selectedUniDetail) {
        setSelectedUniDetail(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLibraryStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/library/active-students`);
      setOnlineStudents(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLibraryPresence = async () => {
    if (!currentUser?.id) return;
    const nextState = !isStudyingInLibrary;
    setIsStudyingInLibrary(nextState);
    try {
      await axios.post(`${API_BASE}/api/library/status`, {
        user_id: parseInt(currentUser.id),
        is_studying: nextState,
        subject: studyingSubjectName
      });
      fetchLibraryStudents();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    if (!currentUser?.id) return;
    const uid = currentUser.id;
    try {
      const [resTopics, resRecs, resMistakes, resSched, resTrials, resGoal, resBooks, resJourn, resStreak, resProfile] = await Promise.all([
        axios.get(`${API_BASE}/api/topics`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/recommendations`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/mistakes`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/schedule`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/trials`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/goals/today`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/books`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/journal/today`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/streak/history`, { params: { user_id: uid } }),
        axios.get(`${API_BASE}/api/user/profile`, { params: { user_id: uid } })
      ]);
      setTopics(resTopics.data || []);
      setRecommendations(resRecs.data || []);
      setMistakes(resMistakes.data || []);
      setSchedule(resSched.data || []);
      setTrials(resTrials.data || []);
      if (resGoal.data) {
        setTodayGoal(resGoal.data);
        setNewAdminGoal(resGoal.data.target);
      }
      setBooks(resBooks.data || []);
      if (resJourn.data) setJournal(resJourn.data);
      if (resStreak.data) setStreakData(resStreak.data);
      if (resProfile.data) {
        const uData = { ...currentUser, ...resProfile.data };
        localStorage.setItem('ykstudy_user', JSON.stringify(uData));
        setCurrentUser(uData);
      }

      if (resTopics.data && resTopics.data.length > 0) {
        setSelectedTopic(prev => prev || resTopics.data[0].id);
        setMistakeTopicId(prev => prev || resTopics.data[0].id);
      }
      searchUniversities('');
      fetchLibraryStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`);
      setAdminUsersList(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchData();
      if (currentUser.telegram_bot_token) setTgToken(currentUser.telegram_bot_token);
      if (currentUser.telegram_chat_id) setTgChatId(currentUser.telegram_chat_id);
    }
  }, [currentUser?.id]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword) {
      setAuthError("Lütfen alanları doldurun.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        account: authUsername.trim(),
        password: authPassword
      });
      const userData = { 
        id: res.data.user_id, 
        username: res.data.username, 
        email: res.data.email, 
        xp: res.data.xp || 100,
        unlocked_themes: res.data.unlocked_themes || "slate",
        unlocked_titles: res.data.unlocked_titles || "🌱 Çırak Öğrenci",
        selected_title: res.data.selected_title || "🌱 Çırak Öğrenci",
        telegram_bot_token: res.data.telegram_bot_token,
        telegram_chat_id: res.data.telegram_chat_id,
        target_uni: res.data.target_uni,
        target_dept: res.data.target_dept
      };
      localStorage.setItem('ykstudy_user', JSON.stringify(userData));
      setCurrentUser(userData);
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Giriş başarısız.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authEmail.trim() || !authPassword) {
      setAuthError("Lütfen tüm alanları doldurun.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        username: authUsername.trim(),
        email: authEmail.trim(),
        password: authPassword
      });
      const userData = { id: res.data.user_id, username: res.data.username, email: res.data.email, xp: 200, unlocked_themes: "slate", unlocked_titles: "🌱 Çırak Öğrenci", selected_title: "🌱 Çırak Öğrenci" };
      localStorage.setItem('ykstudy_user', JSON.stringify(userData));
      setCurrentUser(userData);
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Kayıt yapılamadı.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ykstudy_user');
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
  };

  const handleBuyItem = async (itemId, itemType, cost) => {
    if (!currentUser?.id) return;
    const currentUnlockedThemes = (currentUser?.unlocked_themes || "slate").split(",").map(s => s.trim());
    const currentUnlockedTitles = (currentUser?.unlocked_titles || "🌱 Çırak Öğrenci").split(",").map(s => s.trim());

    if (itemType === "theme" && currentUnlockedThemes.includes(itemId)) {
      changeTheme(itemId);
      return;
    }
    if (itemType === "title" && currentUnlockedTitles.includes(itemId)) {
      const updated = { ...currentUser, selected_title: itemId };
      localStorage.setItem('ykstudy_user', JSON.stringify(updated));
      setCurrentUser(updated);
      return;
    }

    if ((currentUser?.xp || 0) < cost) {
      alert("Bu ürünü almak için yeterli XP puanınız yok!");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/market/buy`, {
        user_id: parseInt(currentUser.id),
        item_id: itemId,
        item_type: itemType,
        cost: parseInt(cost)
      });
      alert(res.data.message);
      const updated = { 
        ...currentUser, 
        xp: res.data.xp, 
        unlocked_themes: res.data.unlocked_themes, 
        unlocked_titles: res.data.unlocked_titles,
        selected_title: res.data.selected_title 
      };
      localStorage.setItem('ykstudy_user', JSON.stringify(updated));
      setCurrentUser(updated);
      if (itemType === 'theme') {
        changeTheme(itemId);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Alışveriş başarısız oldu.");
    }
  };

  const handleAdminSetXp = async (e) => {
    e.preventDefault();
    if (!targetUsernameForXp.trim() || customXpAmount === '') {
      alert("Kullanıcı adı ve XP girin.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/admin/set-xp`, {
        username: targetUsernameForXp.trim(),
        new_xp: parseInt(customXpAmount)
      });
      alert(res.data.message);
      if (currentUser && currentUser.username.toLowerCase() === targetUsernameForXp.trim().toLowerCase()) {
        updateProfileXp(res.data.xp);
      }
      fetchAdminUsers();
      setTargetUsernameForXp('');
      setCustomXpAmount('');
    } catch (err) {
      alert(err.response?.data?.detail || "XP güncellenemedi.");
    }
  };

  const handleChangeAdminPin = async (e) => {
    e.preventDefault();
    if (!oldPinChange || !newPinChange) {
      alert("PIN alanlarını doldurun.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/admin/change-pin`, {
        old_pin: oldPinChange.trim(),
        new_pin: newPinChange.trim()
      });
      alert(res.data.message);
      setOldPinChange('');
      setNewPinChange('');
    } catch (err) {
      alert(err.response?.data?.detail || "PIN değiştirilemedi.");
    }
  };

  const handleSendParentReport = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.post(`${API_BASE}/api/user/parent-report`, null, { params: { user_id: currentUser.id } });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.detail || "Telegram bildirimi gönderilemedi.");
    }
  };

  const handleSelectTargetUniversity = async (item) => {
    setSelectedUniDetail(item);
    try {
      await axios.post(`${API_BASE}/api/user/target`, {
        target_uni: item.uni,
        target_dept: item.dept
      }, { params: { user_id: currentUser?.id } });
      const updated = { ...currentUser, target_uni: item.uni, target_dept: item.dept };
      localStorage.setItem('ykstudy_user', JSON.stringify(updated));
      setCurrentUser(updated);
      alert(`🎯 Hedef "${item.uni} - ${item.dept}" olarak kilitlendi!`);
    } catch (err) {
      alert("Hedef kaydedilemedi.");
    }
  };

  const handleSaveTelegram = async (e) => {
    e.preventDefault();
    if (!tgToken || !tgChatId || !currentUser?.id) {
      alert("Lütfen Bot Token ve Chat ID girin.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/user/telegram`, {
        bot_token: tgToken,
        chat_id: tgChatId
      }, { params: { user_id: currentUser.id } });
      alert(res.data.message);
      const updatedUser = { ...currentUser, telegram_bot_token: tgToken, telegram_chat_id: tgChatId };
      localStorage.setItem('ykstudy_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    } catch (err) {
      alert("Telegram bağlantısı kurulamadı.");
    }
  };

  const handleUpdateGoalFromAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminGoal || parseInt(newAdminGoal) <= 0 || !currentUser?.id) return;
    try {
      await axios.post(`${API_BASE}/api/goals/set-target`, null, { 
        params: { target: parseInt(newAdminGoal), user_id: currentUser.id } 
      });
      alert(`Günlük hedef ${newAdminGoal} soru yapıldı!`);
      fetchData();
    } catch (err) {
      alert("Hedef güncellenemedi.");
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive) {
      if (timerMode === 'pomodoro') {
        if (secondsLeft > 0) {
          interval = setInterval(() => setSecondsLeft(sec => sec - 1), 1000);
        } else {
          clearInterval(interval);
          setIsActive(false);
          if (selectedTopic && currentUser?.id) {
            axios.post(`${API_BASE}/api/pomodoro`, null, { params: { topic_id: selectedTopic, duration: 25, user_id: currentUser.id } }).then((res) => {
              if (res.data?.new_xp) updateProfileXp(res.data.new_xp);
              fetchData();
            });
          }
          alert("Pomodoro bitti! +40 XP");
        }
      } else {
        interval = setInterval(() => setStopwatchSecs(s => s + 1), 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, timerMode]);

  const stopAmbient = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setAmbientPlaying(false);
  };

  const startAmbient = (type) => {
    stopAmbient();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (type === 'alpha') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(40, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(50, ctx.currentTime);
        lfo.connect(osc.frequency);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        lfo.start();
      } else {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'rain') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          } else if (type === 'ocean') {
            output[i] = (lastOut + (0.008 * white)) / 1.008;
            lastOut = output[i];
            output[i] *= 4.5;
          } else if (type === 'fire') {
            const crackle = Math.random() > 0.99 ? (Math.random() * 2 - 1) * 2 : 0;
            output[i] = ((lastOut + (0.015 * white)) / 1.015) + crackle;
            lastOut = output[i];
            output[i] *= 2.0;
          } else if (type === 'wind') {
            output[i] = (lastOut + (0.005 * white)) / 1.005;
            lastOut = output[i];
            output[i] *= 5.0;
          } else {
            output[i] = white * 0.15;
          }
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.25;
        whiteNoise.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start(0);
      }
      setAmbientPlaying(true);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAmbient = () => {
    if (ambientPlaying) stopAmbient();
    else startAmbient(ambientType);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/admin/verify-pin`, { pin: adminPinInput.trim() });
      setIsAdminAuthenticated(true);
      setAdminError('');
      setAdminPinInput('');
      fetchAdminUsers();
    } catch (err) {
      setAdminError(err.response?.data?.detail || "Hatalı Admin PIN!");
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle || !newTopicTitle.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/api/topics`, {
        subject: selectedSubject,
        title: newTopicTitle.trim(),
        osym_weight: newTopicWeight,
        user_id: currentUser ? currentUser.id : null
      });
      const created = res.data.topic || res.data;
      setTopics(prev => [...prev, created]);
      setNewTopicTitle('');
      if (!mistakeTopicId) setMistakeTopicId(created.id);
      if (!selectedTopic) setSelectedTopic(created.id);
      if (res.data.new_xp) updateProfileXp(res.data.new_xp);
      alert("Konu eklendi! (+20 XP)");
    } catch (err) {
      console.error(err);
      alert("Konu eklenemedi.");
    }
  };

  const handleUploadMistake = async (e) => {
    e.preventDefault();
    const topicIdToSend = mistakeTopicId || (topics.length > 0 ? topics[0].id : 1);

    try {
      const formData = new FormData();
      formData.append('topic_id', topicIdToSend);
      formData.append('note', mistakeNote || '');
      formData.append('tag', mistakeTag || 'Genel');
      formData.append('difficulty', mistakeDiff || 3);
      if (currentUser?.id) formData.append('user_id', currentUser.id);
      if (mistakeFile) formData.append('file', mistakeFile);

      const res = await axios.post(`${API_BASE}/api/mistakes`, formData);
      const created = res.data.mistake || res.data;
      setMistakes(prev => [created, ...prev]);
      setMistakeNote('');
      setMistakeFile(null);
      if (res.data.new_xp) updateProfileXp(res.data.new_xp);
      alert("Soru kaydedildi! (+15 XP)");
    } catch (err) {
      console.error(err);
      alert("Soru kaydedilemedi.");
    }
  };

  const handleAddSolved = async (count) => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.post(`${API_BASE}/api/goals/add-solved`, null, { params: { count, user_id: currentUser.id } });
      if (res.data?.goal) setTodayGoal(res.data.goal);
      if (res.data?.new_xp) updateProfileXp(res.data.new_xp);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMatrix = async (topicId, field) => {
    try {
      const res = await axios.put(`${API_BASE}/api/topics/${topicId}/matrix`, null, { params: { field, user_id: currentUser?.id } });
      const updated = res.data.topic || res.data;
      setTopics(prev => prev.map(t => t.id === topicId ? updated : t));
      if (res.data.new_xp) updateProfileXp(res.data.new_xp);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (confirm("Bu konuyu silmek istiyor musunuz?")) {
      await axios.delete(`${API_BASE}/api/topics/${topicId}`);
      setTopics(prev => prev.filter(t => t.id !== topicId));
    }
  };

  const handleDeleteMistake = async (id) => {
    if (confirm("Soruyu silmek istiyor musunuz?")) {
      await axios.delete(`${API_BASE}/api/mistakes/${id}`);
      setMistakes(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddTrial = async (e) => {
    e.preventDefault();
    if (!trialTitle || !trialTitle.trim() || !trialCorrect) return;
    try {
      const res = await axios.post(`${API_BASE}/api/trials`, {
        title: trialTitle.trim(),
        exam_type: trialType,
        correct_count: parseFloat(trialCorrect),
        wrong_count: parseFloat(trialWrong || 0),
        user_id: currentUser ? currentUser.id : null
      });
      const created = res.data.trial || res.data;
      setTrials(prev => [...prev, created]);
      setTrialTitle('');
      setTrialCorrect('');
      setTrialWrong('');
      if (res.data.new_xp) updateProfileXp(res.data.new_xp);
      alert("Deneme kaydedildi! (+75 XP)");
    } catch (err) {
      console.error(err);
      alert("Deneme kaydedilemedi.");
    }
  };

  const handleDeleteTrial = async (id) => {
    await axios.delete(`${API_BASE}/api/trials/${id}`);
    setTrials(prev => prev.filter(t => t.id !== id));
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!bookTitle || !bookTitle.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/api/books`, {
        title: bookTitle.trim(),
        subject: bookSub,
        book_type: bookType,
        cover_color: bookCover,
        total_tests: parseInt(bookTests),
        daily_pace: parseFloat(bookPace || 2),
        user_id: currentUser ? currentUser.id : null
      });
      setBooks(prev => [...prev, res.data]);
      setBookTitle('');
      alert("Kitap/Fasikül rafa başarıyla eklendi!");
    } catch (err) {
      console.error(err);
      alert("Kitap eklenemedi.");
    }
  };

  const handleIncBook = async (id) => {
    setBooks(prev => prev.map(b => {
      if (b.id === id && b.completed_tests < b.total_tests) {
        return { ...b, completed_tests: b.completed_tests + 1 };
      }
      return b;
    }));

    try {
      const res = await axios.put(`${API_BASE}/api/books/${id}/inc`, null, { params: { user_id: currentUser?.id } });
      if (res.data?.new_xp) updateProfileXp(res.data.new_xp);
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleDeleteBook = async (id) => {
    await axios.delete(`${API_BASE}/api/books/${id}`);
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveJournal = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.post(`${API_BASE}/api/journal`, {
        rating: parseInt(journal.rating),
        reflection: journal.reflection || '',
        focus_hours: parseFloat(journal.focus_hours || 0)
      }, { params: { user_id: currentUser.id } });
      if (res.data?.new_xp) updateProfileXp(res.data.new_xp);
      alert("Günün değerlendirmesi kaydedildi! (+30 XP)");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!schedTask || !schedTask.trim()) {
      alert("Lütfen görev açıklaması yazın.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/schedule`, {
        day: schedDay,
        subject: schedSubject,
        task: schedTask.trim(),
        user_id: currentUser ? currentUser.id : null
      });
      setSchedule(prev => [...prev, res.data]);
      setSchedTask('');
      alert("Görev eklendi!");
    } catch (err) {
      console.error(err);
      alert("Görev eklenemedi.");
    }
  };

  const handleToggleSchedule = async (taskId) => {
    setSchedule(prev => prev.map(s => s.id === taskId ? { ...s, is_completed: !s.is_completed } : s));
    try {
      const res = await axios.put(`${API_BASE}/api/schedule/${taskId}/toggle`, null, { params: { user_id: currentUser?.id } });
      if (res.data?.new_xp) updateProfileXp(res.data.new_xp);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSchedule = async (e, taskId) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/api/schedule/${taskId}`);
      setSchedule(prev => prev.filter(s => s.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const userXp = currentUser?.xp || 0;
  const userLevel = Math.floor(userXp / 250) + 1;
  const levelProgress = Math.min(100, Math.round(((userXp % 250) / 250) * 100));
  
  const unlockedThemeList = (currentUser?.unlocked_themes || "slate").split(",").map(s => s.trim());
  const unlockedTitleList = (currentUser?.unlocked_titles || "🌱 Çırak Öğrenci").split(",").map(s => s.trim());

  const totalTytNet = (tytTurkceNet + tytSosyalNet + tytMatNet + tytFenNet);
  const totalAytSayNet = (aytMatNet + aytFizNet + aytKimNet + aytBiyNet);
  const totalAytEaNet = (aytMatNet + aytEdebNet + aytTarNet + aytCogNet);

  const calcTytScore = Math.round(100 + (totalTytNet * 3.3) + (simObp * 0.6));
  const calcSayScore = Math.round(100 + (totalTytNet * 1.32) + (totalAytSayNet * 3.0) + (simObp * 0.6));
  const calcEaScore = Math.round(100 + (totalTytNet * 1.32) + (totalAytEaNet * 3.0) + (simObp * 0.6));

  const filteredMistakes = filterTag === 'Tümü' ? mistakes : mistakes.filter(m => m.tag === filterTag);
  const weakTopics = topics.filter(t => (t.mastery_score || 0) < 60 && t.osym_weight === 'Çok Yüksek');

  const NAV_TABS = [
    { id: 'hub', label: 'Ana Panel', icon: Sparkles },
    { id: 'market', label: 'XP Mağazası', icon: ShoppingBag },
    { id: 'questions', label: 'Günlük Soru', icon: Target },
    { id: 'books', label: 'Görsel Kitap Rafı', icon: BookMarked },
    { id: 'library', label: 'Sanal Kütüphane', icon: Radio },
    { id: 'radar', label: 'Tercih Radarı', icon: Compass },
    { id: 'matrix', label: 'Müfredat Matrisi', icon: CheckSquare },
    { id: 'trials', label: 'Deneme Analizi', icon: Award },
    { id: 'sim', label: 'Puan Simülatörü', icon: Calculator }
  ];

  // GİRİŞ / KAYIT EKRANI
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">YKStudy Pro</h1>
            <p className="text-xs text-slate-400 mt-1">YKS & Akademik Verimlilik İşletim Sistemi</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${authMode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              <LogIn className="w-4 h-4" /> Giriş Yap
            </button>
            <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${authMode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              <UserPlus className="w-4 h-4" /> Kayıt Ol
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kullanıcı Adı veya E-posta</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input type="text" required placeholder="kullaniciadi veya ornek@mail.com" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              {authError && <p className="text-xs text-rose-400 text-center font-medium">{authError}</p>}
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-sm font-semibold text-white transition shadow-lg shadow-indigo-600/20">Giriş Yap</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input type="email" required placeholder="ornek@posta.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kullanıcı Adı</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input type="text" required placeholder="Kullanıcı adınızı belirleyin" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Şifre Oluştur</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input type="password" required placeholder="En az 6 karakter" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              {authError && <p className="text-xs text-rose-400 text-center font-medium">{authError}</p>}
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">Hesap Oluştur ve Başla</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // KOÇLUK & ADMİN PANELİ
  if (activeTab === 'admin') {
    return (
      <div className={`min-h-screen ${activeTheme.bg} p-6 md:p-10 font-sans transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <button 
                onClick={() => setActiveTab('hub')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-2 flex items-center gap-1 transition"
              >
                ← Öğrenci Paneline Geri Dön
              </button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-500" /> YKStudy Profesyonel Koçluk & Yönetim Merkezi
              </h1>
              <p className="text-xs opacity-70 mt-0.5">Öğrenci takibi, veli bilgilendirmeleri, PIN ve sistem yönetimi.</p>
            </div>
            {isAdminAuthenticated && (
              <button 
                onClick={() => setIsAdminAuthenticated(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" /> Paneli Kilitle
              </button>
            )}
          </div>

          {!isAdminAuthenticated ? (
            <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-8 max-w-md mx-auto shadow-2xl text-center`}>
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold mb-1">Koçluk Girişi Gerekli</h2>
              <p className="text-xs opacity-70 mb-6">Yönetim paneline erişmek için güvenlik PIN kodunuzu girin.</p>
              
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <input 
                    type="password" 
                    maxLength={10} 
                    placeholder="Admin PIN (Varsayılan: 1234)" 
                    value={adminPinInput} 
                    onChange={(e) => { setAdminPinInput(e.target.value); setAdminError(''); }} 
                    className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-xl px-4 py-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-rose-500`} 
                  />
                  {adminError && <p className="text-xs text-rose-400 mt-2">{adminError}</p>}
                </div>
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 py-3 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition">
                  <KeyRound className="w-4 h-4" /> Koçluk Merkezini Aç
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${activeTheme.card} p-5 rounded-2xl border ${activeTheme.border} space-y-3`}>
                  <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                    <Key className="w-4 h-4" /> Admin PIN Kodunu Değiştir
                  </h3>
                  <form onSubmit={handleChangeAdminPin} className="space-y-2">
                    <input type="password" placeholder="Mevcut PIN" value={oldPinChange} onChange={e => setOldPinChange(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
                    <input type="password" placeholder="Yeni PIN (min 4 hane)" value={newPinChange} onChange={e => setNewPinChange(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
                    <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs transition">
                      PIN'i Güncelle
                    </button>
                  </form>
                </div>

                <div className={`${activeTheme.card} p-5 rounded-2xl border ${activeTheme.border} space-y-3`}>
                  <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Kullanıcıya Özel XP Ayarla
                  </h3>
                  <form onSubmit={handleAdminSetXp} className="space-y-2">
                    <input type="text" placeholder="Kullanıcı Adı" value={targetUsernameForXp} onChange={e => setTargetUsernameForXp(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
                    <input type="number" placeholder="Yeni XP Değeri" value={customXpAmount} onChange={e => setCustomXpAmount(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
                    <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition">
                      XP'yi Güncelle
                    </button>
                  </form>
                </div>
              </div>

              <div className={`${activeTheme.card} p-5 rounded-2xl border ${activeTheme.border}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Kayıtlı Öğrenciler & Durum Tablosu ({adminUsersList.length})
                  </h3>
                  <button onClick={fetchAdminUsers} className="text-[11px] bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-md hover:bg-blue-600 hover:text-white transition font-medium">
                    Yenile
                  </button>
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${activeTheme.border} opacity-70`}>
                        <th className="py-2.5 px-3">Kullanıcı</th>
                        <th className="py-2.5 px-3">E-posta</th>
                        <th className="py-2.5 px-3 text-center font-bold text-yellow-400">XP</th>
                        <th className="py-2.5 px-3">Unvan</th>
                        <th className="py-2.5 px-3 text-center">Çözülen Soru</th>
                        <th className="py-2.5 px-3 text-center">Deneme Sayısı</th>
                        <th className="py-2.5 px-3 text-right">Son Giriş</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {adminUsersList.map(u => (
                        <tr key={u.id} className="hover:bg-slate-900/60">
                          <td className="py-2 px-3 font-semibold text-slate-200">{u.username}</td>
                          <td className="py-2 px-3 opacity-70">{u.email || "-"}</td>
                          <td className="py-2 px-3 text-center font-black text-yellow-400">{u.xp}</td>
                          <td className="py-2 px-3"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">{u.selected_title || "Öğrenci"}</span></td>
                          <td className="py-2 px-3 text-center text-emerald-400 font-bold">{u.solved_count}</td>
                          <td className="py-2 px-3 text-center text-indigo-400 font-bold">{u.trials_count}</td>
                          <td className="py-2 px-3 text-right opacity-60 text-[10px]">{u.last_login}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${activeTheme.card} p-5 rounded-2xl border ${activeTheme.border} space-y-3`}>
                  <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                    <Send className="w-4 h-4" /> Telegram Bot Entegrasyonu
                  </h3>
                  <form onSubmit={handleSaveTelegram} className="space-y-2">
                    <input type="text" placeholder="Bot Token" value={tgToken} onChange={e => setTgToken(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
                    <input type="text" placeholder="Chat ID" value={tgChatId} onChange={e => setTgChatId(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
                    <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-lg text-xs transition">
                      Bot Bilgilerini Kaydet
                    </button>
                  </form>
                </div>

                <div className={`${activeTheme.card} p-5 rounded-2xl border border-rose-900/30 space-y-3`}>
                  <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Veritabanı Sıfırlama (Tehlikeli Bölge)
                  </h3>
                  <p className="text-xs opacity-70">Tüm öğrenci deneme kayıtlarını, sorularını ve çalışma sürelerini temizler.</p>
                  <button onClick={async () => { const pin = prompt("Admin PIN:"); if(pin){ const res = await axios.post(`${API_BASE}/api/admin/reset-database`, null, { params: { pin } }); alert(res.data.message); fetchData(); } }} className="w-full bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 py-2.5 rounded-lg text-xs font-semibold transition">
                    🗑️ Tüm Veritabanını Sıfırla
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ANA ARAYÜZ (TÜM SEKMELER DAHİL)
  return (
    <div className={`min-h-screen ${activeTheme.bg} p-4 md:p-8 font-sans transition-colors duration-300`}>
      <header className={`max-w-7xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4 border-b ${activeTheme.border} pb-4`}>
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">YKStudy Pro</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded border border-amber-400/20">
                {currentUser?.selected_title || "🌱 Çırak Öğrenci"}
              </span>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Hedefe: <b>{daysRemaining} Gün</b></span>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-xs font-bold text-orange-400">{streakData.streak} Günlük Seri</span>
          </div>
        </div>

        {/* SAĞ ÜST DOCK BUTONLARI */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-2 ${activeTheme.card} border ${activeTheme.border} px-3 py-1.5 rounded-xl text-xs shadow-sm`}>
            <Zap className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="flex items-center gap-1.5 font-bold">
                <span>Lv.{userLevel}</span>
                <span className="text-yellow-400 font-extrabold">{userXp} XP</span>
              </div>
              <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${levelProgress}%` }} />
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('market')}
            title="XP Mağazası & Market"
            className={`p-2 rounded-xl border transition shadow-sm ${
              activeTab === 'market' 
                ? 'bg-amber-500 text-stone-950 border-amber-400' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-stone-950'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button 
            onClick={handleSendParentReport}
            title="Haftalık Veli/Koç Telegram Raporu Gönder"
            className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setActiveTab('admin')}
            title="Koçluk & Yönetim Paneli"
            className="p-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl transition shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          <div className={`flex items-center ${activeTheme.card} border ${activeTheme.border} rounded-xl p-1`}>
            <button onClick={toggleAmbient} className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${ambientPlaying ? activeTheme.primaryBtn : 'opacity-70 hover:opacity-100'}`}>
              {ambientPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <select 
              value={ambientType} 
              onChange={(e) => { 
                setAmbientType(e.target.value); 
                if (ambientPlaying) startAmbient(e.target.value); 
              }} 
              className="bg-transparent text-[11px] px-1.5 focus:outline-none"
            >
              <option value="rain" className="bg-slate-900 text-white">🌧️ Yağmur Sesi</option>
              <option value="ocean" className="bg-slate-900 text-white">🌊 Okyanus Dalgası</option>
              <option value="fire" className="bg-slate-900 text-white">🔥 Şömine Çatırtısı</option>
              <option value="wind" className="bg-slate-900 text-white">🌲 Orman & Rüzgar</option>
              <option value="alpha" className="bg-slate-900 text-white">🧠 40Hz Alpha Dalgası</option>
              <option value="whitenoise" className="bg-slate-900 text-white">📻 Beyaz Gürültü</option>
            </select>
          </div>

          <div className={`flex items-center gap-2 ${activeTheme.card} border ${activeTheme.border} px-3 py-1.5 rounded-xl text-xs`}>
            <User className={`w-3.5 h-3.5 ${activeTheme.accentText}`} />
            <span className="font-semibold">{currentUser?.username}</span>
            <button onClick={handleLogout} title="Çıkış Yap" className="opacity-70 hover:text-rose-400 ml-2 p-0.5 transition">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* DOCK BAR */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-center sm:justify-start">
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl ${activeTheme.card} border ${activeTheme.border} shadow-xl overflow-x-auto max-w-full`}>
          {NAV_TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isSelected 
                    ? `${activeTheme.primaryBtn} shadow-md scale-105` 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={`whitespace-nowrap transition-all duration-300 ${isSelected ? 'inline-block' : 'hidden group-hover:inline-block'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEKME: XP MAĞAZASI */}
      {activeTab === 'market' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-6 shadow-lg space-y-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                  <ShoppingBag className="w-6 h-6" /> XP Mağazası & Ödül Marketi
                </h2>
                <p className="text-xs opacity-70 mt-1">Soru çözerek, deneme girerek ve Pomodoro tamamlayarak kazandığın XP'leri harca!</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 px-5 py-2.5 rounded-2xl text-center">
                <span className="text-[10px] opacity-70 block font-semibold">Mevcut Bakiyeniz</span>
                <span className="text-2xl font-black text-yellow-400">{userXp} XP</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200">
                <Palette className="w-4 h-4 text-indigo-400" /> Kilitli Arayüz Temaları ({Object.keys(THEMES).length} Çeşit)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.values(THEMES).map(th => {
                  const isUnlocked = unlockedThemeList.includes(th.id);
                  const isEquipped = currentThemeKey === th.id;
                  return (
                    <div key={th.id} className={`${activeTheme.innerCard} border ${activeTheme.border} p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{th.name}</h4>
                          <span className="text-[11px] opacity-60 font-semibold">{th.cost === 0 ? "Başlangıç (Ücretsiz)" : `${th.cost} XP`}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border border-slate-700 ${th.dotColor}`} />
                      </div>

                      {isUnlocked ? (
                        <button
                          onClick={() => changeTheme(th.id)}
                          disabled={isEquipped}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                            isEquipped ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 cursor-default' : `${activeTheme.primaryBtn}`
                          }`}
                        >
                          {isEquipped ? "✓ Aktif Kullanılıyor" : "Temayı Uygula"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyItem(th.id, 'theme', th.cost)}
                          className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:opacity-90 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Lock className="w-3.5 h-3.5" /> Aç ({th.cost} XP)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200">
                <Crown className="w-4 h-4 text-yellow-400" /> Profil Unvanları & Rozetler
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {TITLES.map(tit => {
                  const isUnlocked = unlockedTitleList.includes(tit.name);
                  const isEquipped = (currentUser?.selected_title || '🌱 Çırak Öğrenci') === tit.name;
                  return (
                    <div key={tit.id} className={`${activeTheme.innerCard} border ${activeTheme.border} p-4 rounded-xl flex items-center justify-between gap-3 shadow-md`}>
                      <div>
                        <div className="font-bold text-xs text-slate-200">{tit.name}</div>
                        <span className="text-[11px] opacity-60 font-semibold">{tit.cost === 0 ? "Başlangıç" : `${tit.cost} XP`}</span>
                      </div>
                      {isEquipped ? (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg font-bold">Aktif</span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleBuyItem(tit.name, 'title', 0)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
                        >
                          Kuşan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyItem(tit.name, 'title', tit.cost)}
                          className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:opacity-90 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" /> Aç ({tit.cost} XP)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SEKME 1: ANA PANEL */}
      {activeTab === 'hub' && (
        <main className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-5 shadow-lg`}>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" /> Günün 3 Kritik ÖSYM Formülü
              </div>
              <span className="text-[10px] opacity-60">Hafıza Kartları</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DAILY_FORMULAS.slice(0, 3).map((f, idx) => (
                <div key={idx} className={`${activeTheme.innerCard} p-3.5 rounded-xl border ${activeTheme.border} space-y-1`}>
                  <div className="flex justify-between items-center text-[10px] font-bold opacity-75">
                    <span>{f.subject}</span>
                    <span className="text-amber-400">#ÖSYM</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">{f.title}</h4>
                  <div className="font-mono text-xs text-indigo-300 font-bold mt-1 bg-slate-900/80 p-1.5 rounded">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {weakTopics.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Zayıf Halka Tespit Edildi! (Tahmini +{(weakTopics.length * 1.25).toFixed(1)} Net Fırsatı)</h4>
                  <p className="text-[11px] opacity-80 text-rose-200">
                    ÖSYM ağırlığı yüksek olan <b>{weakTopics.map(w => w.title).slice(0, 2).join(', ')}</b> konularında ustalık puanınız düşük.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('matrix')}
                className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0"
              >
                Matriste İncele
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className={`${activeTheme.card} border ${activeTheme.border} rounded-xl p-5 shadow-lg`}>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <h2>Haftalık Çalışma Programı</h2>
                  </div>
                  <button onClick={() => window.open(`${API_BASE}/api/schedule/export-pdf?user_id=${currentUser?.id}`, '_blank')} className="text-[11px] bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition">
                    <Printer className="w-3 h-3" /> A4 Yazdır
                  </button>
                </div>

                <form onSubmit={handleAddSchedule} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
                  <select value={schedDay} onChange={(e) => setSchedDay(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-2 py-1.5 text-xs`}>
                    {DAYS.map(d => <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>)}
                  </select>
                  <select value={schedSubject} onChange={(e) => setSchedSubject(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-2 py-1.5 text-xs`}>
                    {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
                  </select>
                  <input type="text" placeholder="Görev (örn: 2 test çöz)" value={schedTask} onChange={(e) => setSchedTask(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-1.5 text-xs sm:col-span-1 focus:outline-none`} />
                  <button type="submit" className={`${activeTheme.primaryBtn} rounded-lg text-xs font-medium py-1.5 text-white transition`}>Ekle</button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {DAYS.map(day => {
                    const dayTasks = schedule.filter(s => s.day === day);
                    return (
                      <div key={day} className={`${activeTheme.innerCard} p-3 rounded-lg border ${activeTheme.border}`}>
                        <h4 className="text-xs font-semibold text-indigo-400 mb-2 border-b border-slate-800 pb-1">{day}</h4>
                        {dayTasks.length === 0 ? (
                          <p className="text-[10px] opacity-50">Plan yok</p>
                        ) : (
                          <div className="space-y-1.5">
                            {dayTasks.map(t => (
                              <div 
                                key={t.id} 
                                onClick={() => handleToggleSchedule(t.id)} 
                                className={`p-2 rounded cursor-pointer flex items-center justify-between text-xs border transition group ${
                                  t.is_completed 
                                    ? 'bg-emerald-950/20 border-emerald-900/50 text-slate-400 line-through' 
                                    : `${activeTheme.card} border ${activeTheme.border} hover:border-indigo-500/50`
                                }`}
                              >
                                <span className="truncate pr-2 select-none"><b>{t.subject}:</b> {t.task}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {t.is_completed && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                  <button 
                                    onClick={(e) => handleDeleteSchedule(e, t.id)} 
                                    title="Görevi Sil"
                                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${activeTheme.card} border ${activeTheme.border} rounded-xl p-5 shadow-lg`}>
                <div className="flex items-center gap-2 mb-3 font-semibold">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <h2>Günün Değerlendirmesi & Koç Notu</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] opacity-70 block mb-1">Günün Verimliliği (1-5)</label>
                    <select value={journal.rating} onChange={(e) => setJournal({...journal, rating: parseInt(e.target.value)})} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg p-2 text-xs`}>
                      <option value={5} className="bg-slate-900 text-white">⭐⭐⭐⭐⭐ Mükemmel</option>
                      <option value={4} className="bg-slate-900 text-white">⭐⭐⭐⭐ İyi</option>
                      <option value={3} className="bg-slate-900 text-white">⭐⭐⭐ Orta</option>
                      <option value={2} className="bg-slate-900 text-white">⭐⭐ Verimsiz</option>
                      <option value={1} className="bg-slate-900 text-white">⭐ Kötü</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] opacity-70 block mb-1">Net Odak Süresi (Saat)</label>
                    <input type="number" step="0.5" value={journal.focus_hours} onChange={(e) => setJournal({...journal, focus_hours: parseFloat(e.target.value) || 0})} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg p-2 text-xs`} />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] opacity-70 block mb-1">Bugünün Özeti ve Analizi</label>
                    <textarea rows={2} value={journal.reflection || ''} onChange={(e) => setJournal({...journal, reflection: e.target.value})} placeholder="Örn: Paragraf ve Fizik iyi gitti..." className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg p-2 text-xs focus:outline-none`} />
                  </div>
                </div>
                <button onClick={handleSaveJournal} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition">Günü Kaydet (+30 XP)</button>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${activeTheme.card} border ${activeTheme.border} rounded-xl p-6 shadow-lg text-center`}>
                <div className={`flex justify-center gap-2 mb-4 ${activeTheme.innerCard} p-1 rounded-lg max-w-[200px] mx-auto border ${activeTheme.border}`}>
                  <button onClick={() => { setTimerMode('pomodoro'); setIsActive(false); }} className={`flex-1 py-1 rounded text-xs font-medium transition ${timerMode === 'pomodoro' ? `${activeTheme.primaryBtn} text-white` : 'opacity-60'}`}>Pomodoro</button>
                  <button onClick={() => { setTimerMode('stopwatch'); setIsActive(false); }} className={`flex-1 py-1 rounded text-xs font-medium transition ${timerMode === 'stopwatch' ? `${activeTheme.primaryBtn} text-white` : 'opacity-60'}`}>Kronometre</button>
                </div>

                <div className={`text-5xl font-mono font-bold tracking-wider mb-5 ${activeTheme.accentText}`}>
                  {timerMode === 'pomodoro' ? formatTime(secondsLeft) : formatTime(stopwatchSecs)}
                </div>

                <div className="mb-4">
                  <select value={selectedTopic || ''} onChange={(e) => setSelectedTopic(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs w-full`}>
                    {topics.length === 0 ? <option value="">Önce konu ekleyin</option> : topics.map(t => <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.subject} - {t.title}</option>)}
                  </select>
                </div>

                <div className="flex justify-center gap-3">
                  <button onClick={() => setIsActive(!isActive)} className={`${activeTheme.primaryBtn} px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition text-white`}>
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {isActive ? 'Durdur' : 'Başlat'}
                  </button>
                  <button onClick={() => { setIsActive(false); if(timerMode === 'pomodoro') setSecondsLeft(25*60); else setStopwatchSecs(0); }} className={`${activeTheme.innerCard} hover:opacity-80 px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition border ${activeTheme.border}`}>
                    <RotateCcw className="w-4 h-4" /> Sıfırla
                  </button>
                </div>
              </div>

              {/* YANLIŞ SORU EKLEME FORMU */}
              <div className={`${activeTheme.card} border ${activeTheme.border} rounded-xl p-5 shadow-lg`}>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                  <h3 className="font-semibold flex items-center gap-1.5 text-xs text-emerald-400">
                    <Upload className="w-4 h-4" /> Yanlış Soru Ekle
                  </h3>
                  <button type="button" onClick={() => window.open(`${API_BASE}/api/mistakes/export-book?user_id=${currentUser?.id}`, '_blank')} className="text-[11px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition">
                    <Download className="w-3 h-3" /> Kitapçık
                  </button>
                </div>

                <form onSubmit={handleUploadMistake} className="space-y-2.5">
                  <select value={mistakeTopicId || (topics.length > 0 ? topics[0].id : '')} onChange={(e) => setMistakeTopicId(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs w-full`}>
                    {topics.length === 0 ? <option value="1">Genel Konu</option> : topics.map(t => <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.subject} - {t.title}</option>)}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] opacity-70 block mb-0.5">Hata Nedeni</label>
                      <select value={mistakeTag} onChange={(e) => setMistakeTag(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-2 py-1.5 text-xs w-full`}>
                        {TAGS.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] opacity-70 block mb-0.5">Zorluk Seviyesi</label>
                      <select value={mistakeDiff} onChange={(e) => setMistakeDiff(parseInt(e.target.value))} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-2 py-1.5 text-xs w-full`}>
                        <option value={1} className="bg-slate-900 text-white">★☆☆ Kolay</option>
                        <option value={3} className="bg-slate-900 text-white">★★☆ Orta</option>
                        <option value={5} className="bg-slate-900 text-white">★★★ Zor / Yeni Nesil</option>
                      </select>
                    </div>
                  </div>

                  <textarea rows={3} placeholder="Neden yanlış yaptın? Nerede takıldın?..." value={mistakeNote} onChange={(e) => setMistakeNote(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none resize-none`} />
                  <input type="file" accept="image/*" onChange={(e) => setMistakeFile(e.target.files[0])} className="text-xs opacity-70 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer w-full" />
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-xs font-semibold transition text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Deftere Kaydet (+15 XP)
                  </button>
                </form>
              </div>

              <div className={`${activeTheme.card} border ${activeTheme.border} rounded-xl p-4 shadow-lg max-h-80 overflow-y-auto`}>
                <div className={`flex items-center justify-between mb-3 border-b ${activeTheme.border} pb-2`}>
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Yanlış Defteri ({filteredMistakes.length})</span>
                  </div>
                  <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className={`${activeTheme.innerCard} text-[10px] border ${activeTheme.border} rounded px-1.5 py-0.5`}>
                    <option value="Tümü" className="bg-slate-900 text-white">Tüm Etiketler</option>
                    {TAGS.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                  </select>
                </div>
                {filteredMistakes.length === 0 ? (
                  <p className="text-xs opacity-50">Seçili filtrede kayıtlı soru bulunmuyor.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredMistakes.map(m => (
                      <div key={m.id} className={`p-2.5 ${activeTheme.innerCard} rounded border ${activeTheme.border} flex gap-2 items-center justify-between text-xs`}>
                        <div className="flex items-center gap-2 truncate">
                          {m.image_path && <img src={`${API_BASE}${m.image_path}`} alt="Soru" className="w-10 h-10 object-cover rounded border border-slate-800 shrink-0" />}
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-medium">{m.tag}</span>
                              <span className="text-[10px] opacity-60">Zorluk: {m.difficulty}/5</span>
                            </div>
                            <span className="truncate block opacity-80">{m.note || "Not yok"}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteMistake(m.id)} className="opacity-60 hover:text-rose-400 p-1 transition shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* SEKME: GÖRSEL FASİKÜL VE KİTAP RAFI */}
      {activeTab === 'books' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-6 shadow-lg space-y-6`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-indigo-400" /> Fasikül & Deneme Rafı (Görsel Kütüphane)
                </h2>
                <p className="text-xs opacity-70 mt-1">Soru bankası, fasikül ve branş denemesi kaynaklarını görsel kitap rafında takip et.</p>
              </div>
            </div>

            <form onSubmit={handleAddBook} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input type="text" placeholder="Kaynak Adı (örn: 3D TYT Matematik)" value={bookTitle} onChange={e => setBookTitle(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none sm:col-span-2`} />
              <select value={bookSub} onChange={e => setBookSub(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-2 py-2 text-xs`}>
                {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
              </select>
              <select value={bookType} onChange={e => setBookType(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-2 py-2 text-xs`}>
                <option value="Soru Bankası">Soru Bankası</option>
                <option value="Fasikül">Fasikül</option>
                <option value="Branş Denemesi">Branş Denemesi</option>
              </select>
              <input type="number" placeholder="Toplam Test" value={bookTests} onChange={e => setBookTests(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
              <button type="submit" className={`${activeTheme.primaryBtn} rounded-lg text-xs font-semibold py-2 text-white transition`}>Rafa Ekle</button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
              {books.map(b => {
                const percent = Math.round((b.completed_tests / (b.total_tests || 1)) * 100);
                const isFinished = b.completed_tests >= b.total_tests;
                return (
                  <div key={b.id} className="relative group bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition">
                    <div className="flex gap-3 items-start">
                      <div className={`w-12 h-16 rounded-lg bg-gradient-to-b ${b.subject === 'Matematik' ? 'from-blue-600 to-indigo-900' : b.subject === 'Fizik' ? 'from-purple-600 to-slate-900' : 'from-emerald-600 to-teal-900'} shadow-md border border-white/20 shrink-0 flex flex-col justify-between p-1.5 text-[8px] font-bold text-white text-center`}>
                        <span className="truncate">{b.subject}</span>
                        <span className="text-[7px] opacity-80">{b.book_type || 'Kaynak'}</span>
                      </div>
                      <div className="truncate flex-1">
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.2 rounded font-bold">{b.subject}</span>
                        <h4 className="text-xs font-bold text-slate-100 mt-1 truncate">{b.title}</h4>
                        <span className="text-[10px] opacity-60 block mt-0.5">{b.book_type || 'Soru Bankası'}</span>
                      </div>
                      <button onClick={() => handleDeleteBook(b.id)} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] opacity-75 mb-1">
                        <span>{b.completed_tests} / {b.total_tests} Test</span>
                        <span className="font-bold">%{percent}</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleIncBook(b.id)} 
                      disabled={isFinished}
                      className={`w-full py-1.5 rounded-xl text-xs font-semibold transition ${
                        isFinished ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isFinished ? "✓ Tamamlandı" : "+1 Test Çözüldü (+10 XP)"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEKME: SANAL KÜTÜPHANE */}
      {activeTab === 'library' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-6 shadow-lg space-y-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
                  <Radio className="w-5 h-5 animate-pulse" /> Sanal Kütüphane / Birlikte Çalışma Odası
                </h2>
                <p className="text-xs opacity-70 mt-1">Şu anda sistemde ders çalışan diğer öğrencilerle eşzamanlı odaklan.</p>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={studyingSubjectName} 
                  onChange={e => setStudyingSubjectName(e.target.value)} 
                  className={`bg-slate-900 border ${activeTheme.border} rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none`}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s} Çalışıyorum</option>)}
                </select>
                <button 
                  onClick={toggleLibraryPresence}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                    isStudyingInLibrary 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isStudyingInLibrary ? "Masadan Kalk" : "Masa Başına Geç"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {onlineStudents.map(student => (
                <div key={student.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-lg">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-sm">
                      {student.username ? student.username[0].toUpperCase() : 'Ö'}
                    </div>
                    <span className="w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full absolute -bottom-0.5 -right-0.5 animate-ping" />
                    <span className="w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                      <span>{student.username}</span>
                      {student.id === currentUser?.id && <span className="text-[9px] text-indigo-400">(Sen)</span>}
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold block">{student.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">📚 {student.subject}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEKME: GÜNLÜK SORU */}
      {activeTab === 'questions' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-6 shadow-lg space-y-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" /> Günlük Soru Takip & Odak Merkezi
                </h2>
                <p className="text-xs opacity-70 mt-1">Bugün çözdüğün soruları ders bazlı sisteme işle, hedefini tamamla ve seriyi koru.</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-xl text-center">
                <span className="text-[10px] opacity-70 block font-semibold">Bugün Toplam Çözülen</span>
                <span className="text-xl font-bold text-blue-400">{todayGoal.solved} Soru</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${activeTheme.innerCard} p-5 rounded-xl border ${activeTheme.border} space-y-4`}>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" /> Soru Girişi Yap
                </h3>
                <div>
                  <label className="text-[11px] opacity-70 block mb-1">Ders Seçin</label>
                  <select 
                    value={customSubjectAdd} 
                    onChange={(e) => setCustomSubjectAdd(e.target.value)} 
                    className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs`}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] opacity-70 block mb-1">Çözülen Soru Sayısı</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={customQuestionCount} 
                    onChange={(e) => setCustomQuestionCount(parseInt(e.target.value) || 0)} 
                    className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} 
                  />
                </div>
                <button 
                  onClick={() => { handleAddSolved(customQuestionCount); alert(`${customSubjectAdd} için ${customQuestionCount} soru kaydedildi!`); }}
                  className={`w-full ${activeTheme.primaryBtn} py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5`}
                >
                  <Check className="w-4 h-4" /> Soruları Kaydet (+{customQuestionCount * 2} XP)
                </button>
              </div>

              <div className={`md:col-span-2 ${activeTheme.innerCard} p-5 rounded-xl border ${activeTheme.border} flex flex-col justify-between space-y-4`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold opacity-80">Bugünün Hedef İlerlemesi</span>
                    <span className="text-xs font-bold text-emerald-400">%{Math.min(100, Math.round((todayGoal.solved / (todayGoal.target || 1)) * 100))}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (todayGoal.solved / (todayGoal.target || 1)) * 100)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[10, 25, 50].map(cnt => (
                    <button 
                      key={cnt} 
                      onClick={() => handleAddSolved(cnt)} 
                      className={`p-3 rounded-xl border ${activeTheme.border} bg-slate-900/60 hover:bg-slate-800 text-center transition`}
                    >
                      <span className="text-xs font-bold text-slate-100 block">+{cnt} Soru</span>
                      <span className="text-[10px] text-yellow-400 font-semibold">+{cnt * 2} XP</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <span className="opacity-70">Hedefe Kalan Soru:</span>
                  <span className="font-bold text-indigo-400">{Math.max(0, todayGoal.target - todayGoal.solved)} Soru</span>
                </div>
              </div>
            </div>

            <div className={`${activeTheme.innerCard} p-5 rounded-xl border ${activeTheme.border}`}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-orange-400">
                <Flame className="w-4 h-4" /> Son 30 Günlük Zinciri Kırma Isı Haritası ({streakData.streak} Günlük Kesintisiz Seri)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-2">
                {streakData.days.map((d, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl border text-center transition ${
                      d.completed ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] font-semibold opacity-70">{d.day_num}</div>
                    <div className="text-xs font-bold mt-0.5">{d.solved} / {d.target}</div>
                    <div className="text-[9px] mt-1 font-bold">{d.completed ? '🔥 Tamam' : '—'}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SEKME: TERCİH RADARI */}
      {activeTab === 'radar' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-6 shadow-lg space-y-6`}>
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" /> Akıllı Üniversite & Bölüm Tercih Rehberi
              </h2>
              <p className="text-xs opacity-70 mt-1">Üniversite veya bölüm ara; kaç puan, kaç net ve hangi dersten kaç net gerektiğini canlı incele.</p>
            </div>

            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input 
                type="text" 
                placeholder="Üniversite veya bölüm ara (örn: Gebze Teknik, İTÜ, Bilgisayar, Tıp, ODTÜ)..." 
                value={uniSearchQuery}
                onChange={(e) => { setUniSearchQuery(e.target.value); searchUniversities(e.target.value); }}
                className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${activeTheme.innerCard} p-4 rounded-xl border ${activeTheme.border} max-h-96 overflow-y-auto space-y-2`}>
                <h3 className="text-xs font-bold opacity-70 mb-2 uppercase">Bulunan Bölümler ({uniSearchResults.length})</h3>
                {uniSearchResults.map((item, i) => (
                  <div 
                    key={i}
                    onClick={() => handleSelectTargetUniversity(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      selectedUniDetail?.dept === item.dept && selectedUniDetail?.uni === item.uni
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{item.uni}</div>
                    <div className="text-[11px] opacity-75">{item.dept}</div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded font-bold text-yellow-400">{item.score_type}</span>
                      <span className="opacity-70">{item.rank}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedUniDetail && (
                <div className={`md:col-span-2 ${activeTheme.innerCard} p-6 rounded-xl border ${activeTheme.border} space-y-5 flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold">{selectedUniDetail.score_type} PUAN TÜRÜ</span>
                        <h3 className="text-lg font-bold mt-1 text-slate-100">{selectedUniDetail.uni}</h3>
                        <p className="text-xs opacity-75">{selectedUniDetail.dept}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs opacity-70 block">Taban Puan / Sıralama</span>
                        <span className="text-lg font-bold text-indigo-400">{selectedUniDetail.min_score} Puan</span>
                        <span className="text-[11px] text-slate-400 block">{selectedUniDetail.rank}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                        <span className="text-[11px] opacity-70 block">Gereken Toplam TYT</span>
                        <span className="text-2xl font-black text-blue-400">{selectedUniDetail.tyt_net} Net</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                        <span className="text-[11px] opacity-70 block">Gereken Toplam AYT</span>
                        <span className="text-2xl font-black text-indigo-400">{selectedUniDetail.ayt_net} Net</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-300 mb-2.5">📘 Hangi Dersten Kaç Net Yapmanız Lazım? (Ortalama)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {Object.entries(selectedUniDetail.reqs).map(([key, val]) => (
                        <div key={key} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center">
                          <span className="opacity-75 uppercase text-[10px] font-semibold">{key.replace('_', ' ')}</span>
                          <span className="font-bold text-emerald-400">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
                    <span>Bu üniversiteyi hedefin olarak sabitledin mi?</span>
                    <button 
                      onClick={() => handleSelectTargetUniversity(selectedUniDetail)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      Rotamı Buna Ayarla
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SEKME: MÜFREDAT MATRİSİ */}
      {activeTab === 'matrix' && (
        <div className={`max-w-7xl mx-auto ${activeTheme.card} border ${activeTheme.border} rounded-xl p-6 shadow-lg`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><CheckSquare className="w-5 h-5 text-blue-400" /> Müfredat & ÖSYM Soru Ağırlık Matrisi</h2>
              <p className="text-xs opacity-70 mt-1">ÖSYM çıkmış soru sıklığına göre konuları önceliklendirin ve tamamlayın.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {SUBJECTS.map((sub) => (
                <button key={sub} onClick={() => setSelectedSubject(sub)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${selectedSubject === sub ? activeTheme.primaryBtn : `${activeTheme.innerCard} border ${activeTheme.border}`}`}>{sub}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddTopic} className="flex flex-wrap gap-2 mb-6 max-w-xl">
            <input type="text" placeholder={`${selectedSubject} için yeni konu ekle...`} value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs flex-1 focus:outline-none`} />
            <select value={newTopicWeight} onChange={(e) => setNewTopicWeight(e.target.value)} className={`${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-2 py-2 text-xs`}>
              <option value="Çok Yüksek">🔥 ÖSYM: Çok Yüksek</option>
              <option value="Yüksek">⚡ ÖSYM: Yüksek</option>
              <option value="Orta">📘 ÖSYM: Orta</option>
            </select>
            <button type="submit" className={`${activeTheme.primaryBtn} px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition`}><Plus className="w-4 h-4" /> Konu Ekle (+20 XP)</button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${activeTheme.border} opacity-70`}>
                  <th className="py-3 px-4">Konu Başlığı</th>
                  <th className="py-3 px-4 text-center">ÖSYM Frekansı</th>
                  <th className="py-3 px-4 text-center">Konu Anlatımı (%30)</th>
                  <th className="py-3 px-4 text-center">1. Kaynak Test (%35)</th>
                  <th className="py-3 px-4 text-center">2. Kaynak / MEB (%35)</th>
                  <th className="py-3 px-4 text-center">Ustalık Skoru</th>
                  <th className="py-3 px-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {topics.filter(t => t.subject === selectedSubject).length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center opacity-50">Bu ders için henüz konu eklenmedi.</td></tr>
                ) : (
                  topics.filter(t => t.subject === selectedSubject).map(t => (
                    <tr key={t.id} className="hover:opacity-80">
                      <td className="py-3 px-4 font-medium">{t.title}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.osym_weight === 'Çok Yüksek' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          t.osym_weight === 'Yüksek' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {t.osym_weight || 'Orta'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center"><input type="checkbox" checked={t.theory_done || false} onChange={() => handleToggleMatrix(t.id, 'theory')} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" /></td>
                      <td className="py-3 px-4 text-center"><input type="checkbox" checked={t.source1_done || false} onChange={() => handleToggleMatrix(t.id, 'source1')} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" /></td>
                      <td className="py-3 px-4 text-center"><input type="checkbox" checked={t.source2_done || false} onChange={() => handleToggleMatrix(t.id, 'source2')} className="w-4 h-4 accent-purple-600 rounded cursor-pointer" /></td>
                      <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 rounded text-[11px] font-bold ${t.mastery_score >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>%{Math.round(t.mastery_score || 0)}</span></td>
                      <td className="py-3 px-4 text-center"><button onClick={() => handleDeleteTopic(t.id)} className="opacity-60 hover:text-rose-400 p-1"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEKME: DENEME ANALİZİ */}
      {activeTab === 'trials' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-6 shadow-lg`}>
            <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Deneme Net Gelişim Çizgi Grafiği
            </h3>
            {trials.length < 2 ? (
              <p className="text-xs opacity-50 py-8 text-center">Çizgi grafiği için en az 2 deneme kaydedilmiş olmalıdır.</p>
            ) : (
              <div className="w-full overflow-x-auto py-4">
                {(() => {
                  const width = Math.max(600, trials.length * 100);
                  const height = 180;
                  const padding = 30;
                  const maxNet = Math.max(...trials.map(t => t.net_score), 120);
                  const minNet = Math.min(...trials.map(t => t.net_score), 0);
                  
                  const points = trials.map((t, idx) => {
                    const x = padding + (idx * (width - 2 * padding)) / (trials.length - 1);
                    const y = height - padding - ((t.net_score - minNet) / ((maxNet - minNet) || 1)) * (height - 2 * padding);
                    return { x, y, ...t };
                  });

                  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
                      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" />
                      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" />
                      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#818cf8" stroke="#1e1b4b" strokeWidth="2" />
                          <text x={p.x} y={p.y - 10} fill="#a5b4fc" fontSize="11" fontWeight="bold" textAnchor="middle">{p.net_score}</text>
                          <text x={p.x} y={height - 10} fill="#94a3b8" fontSize="10" textAnchor="middle">{p.title.slice(0, 10)}</text>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${activeTheme.card} border ${activeTheme.border} rounded-xl p-5 shadow-lg`}>
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-xs"><Award className="w-4 h-4 text-indigo-400" /> Yeni Deneme Kaydet</h3>
              <form onSubmit={handleAddTrial} className="space-y-3">
                <input type="text" placeholder="Deneme Adı (örn: 3D TYT)" value={trialTitle} onChange={(e) => setTrialTitle(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs focus:outline-none`} />
                <select value={trialType} onChange={(e) => setTrialType(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-2 text-xs`}>
                  <option value="TYT" className="bg-slate-900 text-white">TYT Genel Deneme</option>
                  <option value="AYT" className="bg-slate-900 text-white">AYT Genel Deneme</option>
                  <option value="Brans" className="bg-slate-900 text-white">Branş Denemesi</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] opacity-70 block mb-1">Doğru</label>
                    <input type="number" step="1" placeholder="Doğru" value={trialCorrect} onChange={(e) => setTrialCorrect(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-1.5 text-xs focus:outline-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-70 block mb-1">Yanlış</label>
                    <input type="number" step="1" placeholder="Yanlış" value={trialWrong} onChange={(e) => setTrialWrong(e.target.value)} className={`w-full ${activeTheme.innerCard} border ${activeTheme.border} rounded-lg px-3 py-1.5 text-xs focus:outline-none`} />
                  </div>
                </div>
                <button type="submit" className={`w-full ${activeTheme.primaryBtn} py-2 rounded-lg text-xs font-semibold transition`}>Neti Hesapla (+75 XP)</button>
              </form>
            </div>

            <div className={`lg:col-span-2 ${activeTheme.card} border ${activeTheme.border} rounded-xl p-5 shadow-lg`}>
              <h3 className="font-semibold mb-4 text-xs">Deneme Net Geçmişi & Karneler</h3>
              {trials.length === 0 ? (
                <p className="text-xs opacity-50">Henüz deneme kaydı girilmedi.</p>
              ) : (
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${activeTheme.border} opacity-70`}>
                        <th className="py-2 px-3">Deneme</th>
                        <th className="py-2 px-3">Tür</th>
                        <th className="py-2 px-3 text-center">Doğru</th>
                        <th className="py-2 px-3 text-center">Yanlış</th>
                        <th className={`py-2 px-3 text-center font-bold ${activeTheme.accentText}`}>Net</th>
                        <th className="py-2 px-3 text-center">Karne</th>
                        <th className="py-2 px-3 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {trials.map(t => (
                        <tr key={t.id} className="hover:opacity-80">
                          <td className="py-2.5 px-3 font-medium">{t.title}</td>
                          <td className="py-2.5 px-3"><span className={`${activeTheme.innerCard} px-2 py-0.5 rounded text-[10px] border ${activeTheme.border}`}>{t.exam_type}</span></td>
                          <td className="py-2.5 px-3 text-center text-emerald-400">{t.correct_count}</td>
                          <td className="py-2.5 px-3 text-center text-rose-400">{t.wrong_count}</td>
                          <td className={`py-2.5 px-3 text-center font-bold text-sm ${activeTheme.accentText}`}>{t.net_score}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button 
                              onClick={() => window.open(`${API_BASE}/api/trials/${t.id}/report-card`, '_blank')}
                              className="text-[10px] bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-1 rounded transition font-bold"
                            >
                              📄 Karne
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center"><button onClick={() => handleDeleteTrial(t.id)} className="opacity-60 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEKME: DERS BAZLI PUAN SİMÜLATÖRÜ */}
      {activeTab === 'sim' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${activeTheme.card} border ${activeTheme.border} rounded-2xl p-6 shadow-lg space-y-6`}>
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" /> Profesyonel TYT - AYT Puan & Sıralama Simülatörü
              </h2>
              <p className="text-xs opacity-70 mt-1">Ders ders netlerini ve diploma notunu girerek gerçek ÖSYM katsayılarıyla puan ve sıralamanı hesapla.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${activeTheme.innerCard} p-4 rounded-xl border ${activeTheme.border} space-y-3`}>
                <h3 className="text-xs font-bold text-blue-400 uppercase">📘 TYT Netleri ({totalTytNet} / 120 Net)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">Türkçe (40)</label>
                    <input type="number" step="0.5" max="40" value={tytTurkceNet} onChange={e => setTytTurkceNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">Sosyal (20)</label>
                    <input type="number" step="0.5" max="20" value={tytSosyalNet} onChange={e => setTytSosyalNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">Matematik (40)</label>
                    <input type="number" step="0.5" max="40" value={tytMatNet} onChange={e => setTytMatNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">Fen Bilimleri (20)</label>
                    <input type="number" step="0.5" max="20" value={tytFenNet} onChange={e => setTytFenNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                </div>
              </div>

              <div className={`${activeTheme.innerCard} p-4 rounded-xl border ${activeTheme.border} space-y-3`}>
                <h3 className="text-xs font-bold text-indigo-400 uppercase">⚡ AYT Sayısal & EA Netleri</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">AYT Mat (40)</label>
                    <input type="number" step="0.5" max="40" value={aytMatNet} onChange={e => setAytMatNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">Fizik (14)</label>
                    <input type="number" step="0.5" max="14" value={aytFizNet} onChange={e => setAytFizNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">Kimya (13)</label>
                    <input type="number" step="0.5" max="13" value={aytKimNet} onChange={e => setAytKimNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] opacity-70 block mb-0.5">Biyoloji (13)</label>
                    <input type="number" step="0.5" max="13" value={aytBiyNet} onChange={e => setAytBiyNet(parseFloat(e.target.value)||0)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-2.5 py-1.5 text-xs focus:outline-none`} />
                  </div>
                </div>
              </div>

              <div className={`${activeTheme.innerCard} p-4 rounded-xl border ${activeTheme.border} flex flex-col justify-between space-y-3`}>
                <div>
                  <h3 className="text-xs font-bold text-amber-400 uppercase">🎓 Diploma Notu (OBP)</h3>
                  <label className="text-[10px] opacity-70 block mt-2 mb-0.5">Diploma Puanı (50 - 100)</label>
                  <input type="number" step="0.5" min="50" max="100" value={simObp} onChange={e => setSimObp(parseFloat(e.target.value)||50)} className={`w-full ${activeTheme.card} border ${activeTheme.border} rounded px-3 py-2 text-xs focus:outline-none`} />
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                  <span>OBP Katkısı: <b>+{(simObp * 0.6).toFixed(1)} Puan</b></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-xl border border-blue-500/30">
                <span className="text-xs text-blue-400 font-bold uppercase">TYT Yerleştirme</span>
                <div className="text-3xl font-black text-white mt-1">{calcTytScore}</div>
                <span className="text-[11px] text-slate-400 mt-1 block">Tahmini Sıralama: ~{(Math.max(500, 1500000 - calcTytScore * 2600)).toLocaleString('tr-TR')}</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-indigo-500/30">
                <span className="text-xs text-indigo-400 font-bold uppercase">SAYISAL (SAY) Yerleştirme</span>
                <div className="text-3xl font-black text-white mt-1">{calcSayScore}</div>
                <span className="text-[11px] text-slate-400 mt-1 block">Tahmini Sıralama: ~{(Math.max(250, 800000 - calcSayScore * 1350)).toLocaleString('tr-TR')}</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-amber-500/30">
                <span className="text-xs text-amber-400 font-bold uppercase">EŞİT AĞIRLIK (EA) Yerleştirme</span>
                <div className="text-3xl font-black text-white mt-1">{calcEaScore}</div>
                <span className="text-[11px] text-slate-400 mt-1 block">Tahmini Sıralama: ~{(Math.max(300, 900000 - calcEaScore * 1450)).toLocaleString('tr-TR')}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
