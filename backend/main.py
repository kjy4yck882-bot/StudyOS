import os
import hashlib
import sqlite3
import requests
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

app = FastAPI(title="YKStudy OS Pro")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.expanduser("~/StudyOS/backend/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

DATABASE_URL = "sqlite:///" + os.path.expanduser("~/StudyOS/backend/studyos.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def send_telegram_notification(bot_token: str, chat_id: str, message: str):
    if not bot_token or not chat_id:
        return
    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {"chat_id": chat_id, "text": message, "parse_mode": "Markdown"}
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print("Telegram hatası:", e)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String)
    telegram_bot_token = Column(String, nullable=True)
    telegram_chat_id = Column(String, nullable=True)
    parent_telegram_chat_id = Column(String, nullable=True)
    xp = Column(Integer, default=200)
    unlocked_themes = Column(String, default="slate")
    unlocked_titles = Column(String, default="🌱 Çırak Öğrenci")
    selected_title = Column(String, default="🌱 Çırak Öğrenci")
    target_uni = Column(String, default="Gebze Teknik Üniversitesi")
    target_dept = Column(String, default="Bilgisayar Mühendisliği")
    is_studying_now = Column(Boolean, default=False)
    studying_subject = Column(String, default="Matematik")
    last_active = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    subject = Column(String, index=True)
    title = Column(String)
    osym_weight = Column(String, default="Orta")
    theory_done = Column(Boolean, default=False)
    source1_done = Column(Boolean, default=False)
    source2_done = Column(Boolean, default=False)
    mastery_score = Column(Float, default=0.0)

class Mistake(Base):
    __tablename__ = "mistakes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    topic_id = Column(Integer, nullable=True)
    image_path = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    tag = Column(String, default="Genel")
    difficulty = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

class WeeklySchedule(Base):
    __tablename__ = "weekly_schedule"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    day = Column(String)
    subject = Column(String)
    task = Column(String)
    is_completed = Column(Boolean, default=False)

class ExamTrial(Base):
    __tablename__ = "exam_trials"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    title = Column(String)
    exam_type = Column(String)
    correct_count = Column(Float, default=0.0)
    wrong_count = Column(Float, default=0.0)
    net_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class BookTracker(Base):
    __tablename__ = "book_trackers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    title = Column(String)
    subject = Column(String)
    book_type = Column(String, default="Soru Bankası")
    total_tests = Column(Integer, default=30)
    completed_tests = Column(Integer, default=0)
    cover_color = Column(String, default="from-blue-600 to-indigo-800")
    daily_pace = Column(Float, default=1.5)

class DailyQuestionGoal(Base):
    __tablename__ = "daily_question_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    date_str = Column(String)
    target = Column(Integer, default=100)
    solved = Column(Integer, default=0)

class DailyJournal(Base):
    __tablename__ = "daily_journals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    date_str = Column(String)
    rating = Column(Integer, default=5)
    reflection = Column(Text, nullable=True)
    focus_hours = Column(Float, default=0.0)

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    topic_id = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, default=25)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.strip().encode()).hexdigest()

def get_admin_pin(db: Session) -> str:
    s = db.query(SystemSetting).filter(SystemSetting.key == "admin_pin").first()
    if not s:
        s = SystemSetting(key="admin_pin", value="1234")
        db.add(s)
        db.commit()
    return s.value

def add_user_xp(user_id: Optional[int], amount: int, db: Session):
    if not user_id: return 0
    u = db.query(User).filter(User.id == int(user_id)).first()
    if u:
        u.xp = (u.xp or 0) + amount
        db.commit()
        db.refresh(u)
        return u.xp
    return 0

# --- ÜNİVERSİTE VERİTABANI ---
UNI_DATABASE = [
    {
        "uni": "Gebze Teknik Üniversitesi",
        "dept": "Bilgisayar Mühendisliği (İngilizce)",
        "score_type": "SAY",
        "min_score": 486.5,
        "rank": "~14.500",
        "tyt_net": 94.5,
        "ayt_net": 66.0,
        "reqs": { "tyt_turkce": 32.5, "tyt_mat": 33.0, "tyt_fen": 15.5, "tyt_sos": 13.5, "ayt_mat": 34.0, "ayt_fiz": 11.5, "ayt_kim": 10.5, "ayt_biy": 10.0 }
    },
    {
        "uni": "Gebze Teknik Üniversitesi",
        "dept": "Elektronik Mühendisliği (İngilizce)",
        "score_type": "SAY",
        "min_score": 468.0,
        "rank": "~24.000",
        "tyt_net": 88.0,
        "ayt_net": 61.5,
        "reqs": { "tyt_turkce": 30.0, "tyt_mat": 30.5, "tyt_fen": 14.5, "tyt_sos": 13.0, "ayt_mat": 31.0, "ayt_fiz": 10.5, "ayt_kim": 10.0, "ayt_biy": 10.0 }
    },
    {
        "uni": "Gebze Teknik Üniversitesi",
        "dept": "Havacılık ve Uzay Mühendisliği",
        "score_type": "SAY",
        "min_score": 475.2,
        "rank": "~19.800",
        "tyt_net": 91.0,
        "ayt_net": 63.5,
        "reqs": { "tyt_turkce": 31.0, "tyt_mat": 32.0, "tyt_fen": 15.0, "tyt_sos": 13.0, "ayt_mat": 32.5, "ayt_fiz": 11.0, "ayt_kim": 10.0, "ayt_biy": 10.0 }
    },
    {
        "uni": "İstanbul Teknik Üniversitesi (İTÜ)",
        "dept": "Bilgisayar Mühendisliği (İngilizce)",
        "score_type": "SAY",
        "min_score": 536.0,
        "rank": "~1.200",
        "tyt_net": 108.0,
        "ayt_net": 76.5,
        "reqs": { "tyt_turkce": 36.0, "tyt_mat": 38.0, "tyt_fen": 18.5, "tyt_sos": 15.5, "ayt_mat": 39.0, "ayt_fiz": 13.0, "ayt_kim": 12.5, "ayt_biy": 12.0 }
    },
    {
        "uni": "İstanbul Teknik Üniversitesi (İTÜ)",
        "dept": "Yapay Zeka ve Veri Mühendisliği",
        "score_type": "SAY",
        "min_score": 532.5,
        "rank": "~1.900",
        "tyt_net": 106.0,
        "ayt_net": 75.0,
        "reqs": { "tyt_turkce": 35.5, "tyt_mat": 37.5, "tyt_fen": 18.0, "tyt_sos": 15.0, "ayt_mat": 38.5, "ayt_fiz": 12.5, "ayt_kim": 12.0, "ayt_biy": 12.0 }
    },
    {
        "uni": "Orta Doğu Teknik Üniversitesi (ODTÜ)",
        "dept": "Havacılık ve Uzay Mühendisliği",
        "score_type": "SAY",
        "min_score": 528.0,
        "rank": "~2.800",
        "tyt_net": 104.5,
        "ayt_net": 74.0,
        "reqs": { "tyt_turkce": 35.0, "tyt_mat": 37.0, "tyt_fen": 17.5, "tyt_sos": 15.0, "ayt_mat": 38.0, "ayt_fiz": 12.5, "ayt_kim": 12.0, "ayt_biy": 11.5 }
    },
    {
        "uni": "Boğaziçi Üniversitesi",
        "dept": "Yönetim Bilişim Sistemleri (YBS)",
        "score_type": "EA",
        "min_score": 512.0,
        "rank": "~450",
        "tyt_net": 102.0,
        "ayt_net": 69.5,
        "reqs": { "tyt_turkce": 36.0, "tyt_mat": 35.0, "tyt_fen": 15.0, "tyt_sos": 16.0, "ayt_mat": 36.0, "ayt_edebiyat": 22.0, "ayt_tarih": 6.0, "ayt_cog": 5.5 }
    },
    {
        "uni": "Hacettepe Üniversitesi",
        "dept": "Tıp Fakültesi (Türkçe)",
        "score_type": "SAY",
        "min_score": 533.0,
        "rank": "~1.600",
        "tyt_net": 107.0,
        "ayt_net": 75.5,
        "reqs": { "tyt_turkce": 36.5, "tyt_mat": 37.5, "tyt_fen": 18.0, "tyt_sos": 15.0, "ayt_mat": 38.0, "ayt_fiz": 12.5, "ayt_kim": 12.5, "ayt_biy": 12.5 }
    }
]

@app.get("/api/target/search")
def search_target_uni(q: str = ""):
    q_clean = q.lower().strip()
    if not q_clean: return UNI_DATABASE
    return [item for item in UNI_DATABASE if q_clean in item["uni"].lower() or q_clean in item["dept"].lower()]

class LibraryStatusReq(BaseModel):
    user_id: int
    is_studying: bool
    subject: Optional[str] = "Matematik"

@app.post("/api/library/status")
def update_library_status(req: LibraryStatusReq, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == int(req.user_id)).first()
    if u:
        u.is_studying_now = req.is_studying
        u.studying_subject = req.subject or "Matematik"
        u.last_active = datetime.utcnow()
        db.commit()
    return {"ok": True}

@app.get("/api/library/active-students")
def get_active_students(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    timeout = now - timedelta(minutes=20)
    active = db.query(User).filter(User.is_studying_now == True, User.last_active >= timeout).all()
    res = []
    for u in active:
        res.append({
            "id": u.id,
            "username": u.username,
            "title": u.selected_title or "Öğrenci",
            "subject": u.studying_subject or "Genel Odak",
            "xp": u.xp
        })
    return res

@app.post("/api/user/parent-report")
def send_parent_weekly_report(user_id: int, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == int(user_id)).first()
    if not u or not u.telegram_bot_token or not u.telegram_chat_id:
        raise HTTPException(status_code=400, detail="Telegram entegrasyonu bulunamadı.")
    
    chat_target = u.parent_telegram_chat_id or u.telegram_chat_id
    trials = db.query(ExamTrial).filter(ExamTrial.user_id == int(user_id)).order_by(ExamTrial.created_at.desc()).all()
    latest_net = trials[0].net_score if trials else 0.0
    
    seven_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    goals = db.query(DailyQuestionGoal).filter(DailyQuestionGoal.user_id == int(user_id), DailyQuestionGoal.date_str >= seven_days_ago).all()
    weekly_questions = sum(g.solved for g in goals)
    
    pomos = db.query(PomodoroSession).filter(PomodoroSession.user_id == int(user_id), PomodoroSession.created_at >= datetime.utcnow() - timedelta(days=7)).all()
    weekly_hours = round(sum(p.duration_minutes for p in pomos) / 60, 1)

    msg = (
        f"📋 *Haftalık Öğrenci Gelişim Bülteni*\n\n"
        f"👤 *Öğrenci:* {u.username}\n"
        f"🎯 *Hedef:* {u.target_uni} - {u.target_dept}\n\n"
        f"✅ *Son 7 Günde Çözülen Soru:* {weekly_questions} Soru\n"
        f"⏱️ *Toplam Odak Süresi:* {weekly_hours} Saat\n"
        f"📊 *Son Deneme Neti:* {latest_net} Net\n"
        f"⭐ *Toplam XP:* {u.xp} Puan\n\n"
        f"💡 _Düzenli çalışma programı ve deneme takibi sistem tarafından kayıt altına alınmaktadır._"
    )
    send_telegram_notification(u.telegram_bot_token, chat_target, msg)
    return {"message": "Haftalık bülten Telegram'a iletildi!"}

@app.get("/api/trials/{trial_id}/report-card")
def export_trial_report_card(trial_id: int, db: Session = Depends(get_db)):
    t = db.query(ExamTrial).filter(ExamTrial.id == int(trial_id)).first()
    if not t: raise HTTPException(status_code=404, detail="Deneme bulunamadı.")
    u = db.query(User).filter(User.id == t.user_id).first()
    username = u.username if u else "Öğrenci"
    target_uni = u.target_uni if u else "Belirtilmedi"

    html = f"""
    <!DOCTYPE html><html><head><meta charset="utf-8"><title>YKStudy - Deneme Karnesi</title>
    <style>body {{ font-family: sans-serif; padding: 32px; color: #0f172a; }} .card {{ max-width: 700px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }} .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }} .box {{ background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; }}</style></head>
    <body><div class="card"><h2>🎯 Resmi YKS Deneme Karnesi</h2><p>Öğrenci: <b>{username}</b> | Hedef: <b>{target_uni}</b></p>
    <div class="grid"><div class="box">Doğru<h3 style="color:#16a34a;">{t.correct_count}</h3></div><div class="box">Yanlış<h3 style="color:#dc2626;">{t.wrong_count}</h3></div><div class="box">Net Skor<h3 style="color:#4f46e5;">{t.net_score}</h3></div></div>
    <button onclick="window.print()" style="background:#4f46e5; color:#fff; padding:8px 16px; border:none; border-radius:6px; cursor:pointer;">PDF İndir</button></div></body></html>
    """
    return HTMLResponse(content=html)

class VerifyPinReq(BaseModel):
    pin: str

@app.post("/api/admin/verify-pin")
def verify_admin_pin(req: VerifyPinReq, db: Session = Depends(get_db)):
    curr_pin = get_admin_pin(db)
    if req.pin.strip() != curr_pin:
        raise HTTPException(status_code=403, detail="Hatalı Admin PIN Kodu!")
    return {"valid": True}

class ChangePinReq(BaseModel):
    old_pin: str
    new_pin: str

@app.post("/api/admin/change-pin")
def change_admin_pin(req: ChangePinReq, db: Session = Depends(get_db)):
    curr_pin = get_admin_pin(db)
    if req.old_pin.strip() != curr_pin:
        raise HTTPException(status_code=403, detail="Mevcut PIN hatalı!")
    if len(req.new_pin.strip()) < 4:
        raise HTTPException(status_code=400, detail="Yeni PIN en az 4 haneli olmalıdır.")
    s = db.query(SystemSetting).filter(SystemSetting.key == "admin_pin").first()
    s.value = req.new_pin.strip()
    db.commit()
    return {"message": "Admin PIN kodu güncellendi!"}

class RegisterReq(BaseModel):
    username: str
    email: str
    password: str

class LoginReq(BaseModel):
    account: str
    password: str

@app.post("/api/auth/register")
def register(req: RegisterReq, db: Session = Depends(get_db)):
    u_clean = req.username.strip()
    e_clean = req.email.strip().lower()
    
    if db.query(User).filter(User.username == u_clean).first():
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı kullanımda.")
    if db.query(User).filter(User.email == e_clean).first():
        raise HTTPException(status_code=400, detail="Bu e-posta kullanımda.")
    
    user = User(
        username=u_clean, email=e_clean, password_hash=hash_pw(req.password),
        xp=200, unlocked_themes="slate", unlocked_titles="🌱 Çırak Öğrenci",
        selected_title="🌱 Çırak Öğrenci", last_login=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "user_id": user.id, "username": user.username, "email": user.email, "xp": user.xp, 
        "unlocked_themes": user.unlocked_themes, "unlocked_titles": user.unlocked_titles, "selected_title": user.selected_title, "message": "Kayıt başarılı"
    }

@app.post("/api/auth/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    acc = req.account.strip()
    acc_lower = acc.lower()
    user = db.query(User).filter((User.username == acc) | (User.email == acc_lower)).first()
    if not user or user.password_hash != hash_pw(req.password):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı!")
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {
        "user_id": user.id, "username": user.username, "email": user.email, "xp": user.xp or 0,
        "unlocked_themes": user.unlocked_themes or "slate", "unlocked_titles": user.unlocked_titles or "🌱 Çırak Öğrenci",
        "selected_title": user.selected_title or "🌱 Çırak Öğrenci", "target_uni": user.target_uni,
        "target_dept": user.target_dept, "telegram_bot_token": user.telegram_bot_token,
        "telegram_chat_id": user.telegram_chat_id, "message": "Giriş başarılı"
    }

@app.get("/api/user/profile")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == int(user_id)).first()
    if not u: raise HTTPException(status_code=404)
    return {
        "user_id": u.id, "username": u.username, "email": u.email, "xp": u.xp or 0,
        "unlocked_themes": u.unlocked_themes or "slate", "unlocked_titles": u.unlocked_titles or "🌱 Çırak Öğrenci",
        "selected_title": u.selected_title or "🌱 Çırak Öğrenci", "target_uni": u.target_uni, "target_dept": u.target_dept
    }

# --- HATASIZ ÇALIŞAN MAĞAZA (MARKET) ENDPOINT'İ ---
class BuyReq(BaseModel):
    user_id: int
    item_id: str
    item_type: str
    cost: int

@app.post("/api/market/buy")
def buy_market_item(req: BuyReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == int(req.user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı!")
    
    current_themes = set([t.strip() for t in (user.unlocked_themes or "slate").split(",") if t.strip()])
    current_titles = set([t.strip() for t in (user.unlocked_titles or "🌱 Çırak Öğrenci").split(",") if t.strip()])

    if req.item_type == "theme":
        if req.item_id not in current_themes:
            if (user.xp or 0) < req.cost:
                raise HTTPException(status_code=400, detail="Yetersiz XP Puanı!")
            user.xp = (user.xp or 0) - req.cost
            current_themes.add(req.item_id)
            user.unlocked_themes = ",".join(current_themes)
    elif req.item_type == "title":
        if req.item_id not in current_titles:
            if (user.xp or 0) < req.cost:
                raise HTTPException(status_code=400, detail="Yetersiz XP Puanı!")
            user.xp = (user.xp or 0) - req.cost
            current_titles.add(req.item_id)
            user.unlocked_titles = ",".join(current_titles)
        user.selected_title = req.item_id

    db.commit()
    db.refresh(user)
    return {
        "xp": user.xp, 
        "unlocked_themes": user.unlocked_themes, 
        "unlocked_titles": user.unlocked_titles, 
        "selected_title": user.selected_title, 
        "message": "İşlem başarıyla tamamlandı!"
    }

class TargetReq(BaseModel):
    target_uni: str
    target_dept: str

@app.post("/api/user/target")
def update_target(req: TargetReq, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if user_id:
        u = db.query(User).filter(User.id == int(user_id)).first()
        if u:
            u.target_uni = req.target_uni
            u.target_dept = req.target_dept
            db.commit()
    return {"ok": True}

class TelegramConfig(BaseModel):
    bot_token: str
    chat_id: str

@app.post("/api/user/telegram")
def update_telegram(req: TelegramConfig, user_id: int, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == int(user_id)).first()
    if not u: raise HTTPException(status_code=404)
    u.telegram_bot_token = req.bot_token.strip()
    u.telegram_chat_id = req.chat_id.strip()
    db.commit()
    send_telegram_notification(u.telegram_bot_token, u.telegram_chat_id, "🎯 *YKStudy Bildirimleri Aktif!*")
    return {"message": "Telegram ayarları kaydedildi!"}

@app.get("/api/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.last_login.desc()).all()
    res = []
    for u in users:
        solved_count = sum(g.solved for g in db.query(DailyQuestionGoal).filter(DailyQuestionGoal.user_id == u.id).all())
        trials_count = db.query(ExamTrial).filter(ExamTrial.user_id == u.id).count()
        res.append({
            "id": u.id, "username": u.username, "email": u.email, "xp": u.xp or 0,
            "selected_title": u.selected_title, "last_login": u.last_login.strftime("%d.%m.%Y %H:%M") if u.last_login else "-",
            "solved_count": solved_count, "trials_count": trials_count
        })
    return res

class AdminSetXpReq(BaseModel):
    username: str
    new_xp: int

@app.post("/api/admin/set-xp")
def set_user_xp(req: AdminSetXpReq, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.username == req.username.strip()).first()
    if not u: raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı!")
    u.xp = req.new_xp
    db.commit()
    db.refresh(u)
    return {"message": f"{u.username} adlı kullanıcının XP'si {u.xp} yapıldı!", "xp": u.xp}

@app.get("/api/streak/history")
def get_streak_history(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    history = []
    today = datetime.now().date()
    q = db.query(DailyQuestionGoal)
    if user_id: q = q.filter(DailyQuestionGoal.user_id == int(user_id))
    all_goals = {g.date_str: g for g in q.all()}
    
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        g = all_goals.get(d_str)
        solved = g.solved if g else 0
        target = g.target if g else 100
        completed = solved >= target and solved > 0
        history.append({
            "date": d_str, "day_num": d.strftime("%d/%m"),
            "solved": solved, "target": target, "completed": completed
        })
    
    current_streak = 0
    today_str = today.strftime("%Y-%m-%d")
    today_goal = all_goals.get(today_str)
    if today_goal and today_goal.solved >= today_goal.target and today_goal.solved > 0:
        current_streak += 1
    
    check_date = today - timedelta(days=1)
    while True:
        c_str = check_date.strftime("%Y-%m-%d")
        g = all_goals.get(c_str)
        if g and g.solved >= g.target and g.solved > 0:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break
            
    return {"streak": current_streak, "days": history}

# --- TEMEL EKLEME ENDPOINTLERİ ---
class TrialCreate(BaseModel):
    title: str
    exam_type: str
    correct_count: float
    wrong_count: float
    user_id: Optional[int] = None

@app.get("/api/trials")
def get_trials(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(ExamTrial)
    if user_id: q = q.filter((ExamTrial.user_id == int(user_id)) | (ExamTrial.user_id == None))
    return q.order_by(ExamTrial.created_at.asc()).all()

@app.post("/api/trials")
def add_trial(req: TrialCreate, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    uid = int(req.user_id or user_id) if (req.user_id or user_id) else None
    c = float(req.correct_count)
    w = float(req.wrong_count)
    net = round(c - (w * 0.25), 2)
    t = ExamTrial(title=req.title.strip(), exam_type=req.exam_type, correct_count=c, wrong_count=w, net_score=net, user_id=uid)
    db.add(t)
    db.commit()
    db.refresh(t)
    new_xp = add_user_xp(uid, 75, db)
    return {"trial": t, "new_xp": new_xp}

@app.delete("/api/trials/{id}")
def delete_trial(id: int, db: Session = Depends(get_db)):
    db.query(ExamTrial).filter(ExamTrial.id == int(id)).delete()
    db.commit()
    return {"ok": True}

class TopicCreate(BaseModel):
    subject: str
    title: str
    osym_weight: Optional[str] = "Orta"
    user_id: Optional[int] = None

@app.get("/api/topics")
def get_topics(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Topic)
    if user_id: q = q.filter((Topic.user_id == int(user_id)) | (Topic.user_id == None))
    return q.all()

@app.post("/api/topics")
def add_topic(req: TopicCreate, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    uid = int(req.user_id or user_id) if (req.user_id or user_id) else None
    topic = Topic(subject=req.subject, title=req.title.strip(), osym_weight=req.osym_weight or "Orta", user_id=uid)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    new_xp = add_user_xp(uid, 20, db)
    return {"topic": topic, "new_xp": new_xp}

@app.put("/api/topics/{topic_id}/matrix")
def update_matrix(topic_id: int, field: str, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    t = db.query(Topic).filter(Topic.id == int(topic_id)).first()
    if not t: raise HTTPException(status_code=404)
    if field == "theory": t.theory_done = not t.theory_done
    elif field == "source1": t.source1_done = not t.source1_done
    elif field == "source2": t.source2_done = not t.source2_done
    t.mastery_score = float((30 if t.theory_done else 0) + (35 if t.source1_done else 0) + (35 if t.source2_done else 0))
    db.commit()
    db.refresh(t)
    new_xp = 0
    if t.mastery_score >= 100:
        new_xp = add_user_xp(user_id or t.user_id, 50, db)
    return {"topic": t, "new_xp": new_xp}

@app.delete("/api/topics/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    db.query(Topic).filter(Topic.id == int(topic_id)).delete()
    db.commit()
    return {"ok": True}

@app.get("/api/mistakes")
def get_mistakes(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Mistake)
    if user_id: q = q.filter((Mistake.user_id == int(user_id)) | (Mistake.user_id == None))
    return q.order_by(Mistake.created_at.desc()).all()

@app.post("/api/mistakes")
async def add_mistake(
    topic_id: int = Form(1),
    note: str = Form(""),
    tag: str = Form("Genel"),
    difficulty: int = Form(3),
    user_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    image_rel = None
    if file and file.filename:
        filename = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
        dest = os.path.join(UPLOAD_DIR, filename)
        with open(dest, "wb") as f:
            f.write(await file.read())
        image_rel = f"/uploads/{filename}"

    m = Mistake(topic_id=int(topic_id), note=note, tag=tag, difficulty=int(difficulty), image_path=image_rel, user_id=int(user_id) if user_id else None)
    db.add(m)
    db.commit()
    db.refresh(m)
    new_xp = add_user_xp(user_id, 15, db)
    return {"mistake": m, "new_xp": new_xp}

@app.delete("/api/mistakes/{id}")
def delete_mistake(id: int, db: Session = Depends(get_db)):
    db.query(Mistake).filter(Mistake.id == int(id)).delete()
    db.commit()
    return {"ok": True}

class ScheduleCreate(BaseModel):
    day: str
    subject: str
    task: str
    user_id: Optional[int] = None

@app.get("/api/schedule")
def get_schedule(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(WeeklySchedule)
    if user_id: q = q.filter((WeeklySchedule.user_id == int(user_id)) | (WeeklySchedule.user_id == None))
    return q.all()

@app.post("/api/schedule")
def add_schedule(req: ScheduleCreate, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    uid = int(req.user_id or user_id) if (req.user_id or user_id) else None
    s = WeeklySchedule(day=req.day, subject=req.subject, task=req.task.strip(), user_id=uid)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@app.put("/api/schedule/{task_id}/toggle")
def toggle_schedule(task_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    s = db.query(WeeklySchedule).filter(WeeklySchedule.id == int(task_id)).first()
    new_xp = 0
    if s:
        s.is_completed = not s.is_completed
        db.commit()
        db.refresh(s)
        if s.is_completed:
            new_xp = add_user_xp(user_id or s.user_id, 25, db)
    return {"task": s, "new_xp": new_xp}

@app.delete("/api/schedule/{task_id}")
def delete_schedule(task_id: int, db: Session = Depends(get_db)):
    db.query(WeeklySchedule).filter(WeeklySchedule.id == int(task_id)).delete()
    db.commit()
    return {"ok": True}

class BookCreate(BaseModel):
    title: str
    subject: str
    book_type: Optional[str] = "Soru Bankası"
    total_tests: int
    daily_pace: Optional[float] = 1.5
    cover_color: Optional[str] = "from-blue-600 to-indigo-800"
    user_id: Optional[int] = None

@app.get("/api/books")
def get_books(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(BookTracker)
    if user_id: q = q.filter((BookTracker.user_id == int(user_id)) | (BookTracker.user_id == None))
    return q.all()

@app.post("/api/books")
def add_book(req: BookCreate, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    uid = int(req.user_id or user_id) if (req.user_id or user_id) else None
    b = BookTracker(
        title=req.title.strip(), subject=req.subject, book_type=req.book_type or "Soru Bankası",
        total_tests=int(req.total_tests), daily_pace=float(req.daily_pace or 1.5),
        cover_color=req.cover_color or "from-blue-600 to-indigo-800", user_id=uid
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

@app.put("/api/books/{id}/inc")
def inc_book(id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    b = db.query(BookTracker).filter(BookTracker.id == int(id)).first()
    new_xp = 0
    if b and b.completed_tests < b.total_tests:
        b.completed_tests += 1
        db.commit()
        db.refresh(b)
        new_xp = add_user_xp(user_id or b.user_id, 10, db)
    return {"book": b, "new_xp": new_xp}

@app.delete("/api/books/{id}")
def delete_book(id: int, db: Session = Depends(get_db)):
    db.query(BookTracker).filter(BookTracker.id == int(id)).delete()
    db.commit()
    return {"ok": True}

@app.get("/api/goals/today")
def get_today_goal(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    t = datetime.now().strftime("%Y-%m-%d")
    q = db.query(DailyQuestionGoal).filter(DailyQuestionGoal.date_str == t)
    if user_id: q = q.filter(DailyQuestionGoal.user_id == int(user_id))
    goal = q.first()
    if not goal:
        goal = DailyQuestionGoal(date_str=t, target=100, solved=0, user_id=int(user_id) if user_id else None)
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal

@app.post("/api/goals/set-target")
def set_question_target(target: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    t = datetime.now().strftime("%Y-%m-%d")
    q = db.query(DailyQuestionGoal).filter(DailyQuestionGoal.date_str == t)
    if user_id: q = q.filter(DailyQuestionGoal.user_id == int(user_id))
    g = q.first()
    if not g:
        g = DailyQuestionGoal(date_str=t, target=int(target), solved=0, user_id=int(user_id) if user_id else None)
        db.add(g)
    else:
        g.target = int(target)
    db.commit()
    db.refresh(g)
    return g

@app.post("/api/goals/add-solved")
def add_solved(count: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    t = datetime.now().strftime("%Y-%m-%d")
    q = db.query(DailyQuestionGoal).filter(DailyQuestionGoal.date_str == t)
    if user_id: q = q.filter(DailyQuestionGoal.user_id == int(user_id))
    g = q.first()
    new_xp = 0
    if g:
        g.solved += int(count)
        db.commit()
        db.refresh(g)
        if user_id:
            new_xp = add_user_xp(user_id, int(count) * 2, db)
    return {"goal": g, "new_xp": new_xp}

class JournalCreate(BaseModel):
    rating: int
    reflection: str
    focus_hours: float

@app.get("/api/journal/today")
def get_journal(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    t = datetime.utcnow().strftime("%Y-%m-%d")
    q = db.query(DailyJournal).filter(DailyJournal.date_str == t)
    if user_id: q = q.filter(DailyJournal.user_id == int(user_id))
    return q.first() or {"rating": 5, "reflection": "", "focus_hours": 0}

@app.post("/api/journal")
def save_journal(req: JournalCreate, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    t = datetime.utcnow().strftime("%Y-%m-%d")
    q = db.query(DailyJournal).filter(DailyJournal.date_str == t)
    if user_id: q = q.filter(DailyJournal.user_id == int(user_id))
    j = q.first()
    if not j:
        j = DailyJournal(date_str=t, rating=req.rating, reflection=req.reflection, focus_hours=req.focus_hours, user_id=int(user_id) if user_id else None)
        db.add(j)
    else:
        j.rating = req.rating
        j.reflection = req.reflection
        j.focus_hours = req.focus_hours
    db.commit()
    db.refresh(j)
    new_xp = add_user_xp(user_id, 30, db)
    return {"journal": j, "new_xp": new_xp}

@app.post("/api/pomodoro")
def add_pomo(duration: int = 25, topic_id: Optional[int] = None, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    p = PomodoroSession(topic_id=int(topic_id) if topic_id else None, duration_minutes=int(duration), user_id=int(user_id) if user_id else None)
    db.add(p)
    db.commit()
    new_xp = add_user_xp(user_id, 40, db)
    return {"ok": True, "new_xp": new_xp}

@app.get("/api/recommendations")
def get_recommendations(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    return [
        {"priority_score": 95, "action": "Bugün hedeflenen soru sayısına ulaşmak için 2 Pomodoro bloğu tamamlayın."},
        {"priority_score": 88, "action": "ÖSYM soru ağırlığı yüksek Matematik ve Fizik konularını tekrar edin."},
        {"priority_score": 82, "action": "Hedef üniversite taban netiyle arandaki farkı kapatmak için branş denemesi çöz."}
    ]

@app.post("/api/admin/seed-curriculum")
def seed_curriculum(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    curriculum = [
        ("Matematik", "Temel Kavramlar & Sayı Basamakları", "Çok Yüksek"),
        ("Matematik", "Bölme - Bölünebilme & EBOB-EKOK", "Orta"),
        ("Matematik", "Rasyonel Sayılar & Basit Eşitsizlikler", "Yüksek"),
        ("Matematik", "Problemler (Sayı, Kesir, Yaş, Yüzde)", "Çok Yüksek"),
        ("Matematik", "Fonksiyonlar & Polinomlar", "Çok Yüksek"),
        ("Matematik", "Trigonometri", "Çok Yüksek"),
        ("Matematik", "Türev ve İntegral", "Çok Yüksek"),
        ("Fizik", "Kuvvet, Hareket ve Newton Yasaları", "Çok Yüksek"),
        ("Fizik", "İş, Güç, Enerji & Elektrostatik", "Yüksek"),
        ("Fizik", "Optik & Dalgalar", "Çok Yüksek"),
        ("Kimya", "Atomun Yapısı & Periyodik Tablo", "Çok Yüksek"),
        ("Kimya", "Kimyasal Türler & Tepkimeler", "Yüksek"),
        ("Biyoloji", "Hücre Bölünmeleri & Kalıtım", "Çok Yüksek"),
        ("Biyoloji", "Ekoloji & Canlılar Dünyası", "Yüksek"),
        ("Edebiyat", "Şiir Bilgisi & Edebi Sanatlar", "Çok Yüksek"),
        ("Edebiyat", "Divan & Tanzimat Edebiyatı", "Çok Yüksek"),
        ("Edebiyat", "Cumhuriyet Dönemi Edebiyatı", "Çok Yüksek")
    ]
    for sub, tit, w in curriculum:
        db.add(Topic(subject=sub, title=tit, osym_weight=w, user_id=int(user_id) if user_id else None))
    db.commit()
    return {"message": "Müfredat başarıyla aktarıldı."}

@app.post("/api/admin/reset-database")
def reset_db(pin: str, db: Session = Depends(get_db)):
    curr_pin = get_admin_pin(db)
    if pin != curr_pin: raise HTTPException(status_code=403, detail="Geçersiz PIN!")
    db.query(Mistake).delete()
    db.query(PomodoroSession).delete()
    db.query(WeeklySchedule).delete()
    db.query(ExamTrial).delete()
    db.query(BookTracker).delete()
    db.query(DailyJournal).delete()
    db.query(DailyQuestionGoal).delete()
    db.query(Topic).delete()
    db.commit()
    return {"message": "Tüm veritabanı sıfırlandı."}


@app.get("/api/schedule/export-pdf")
def export_schedule_pdf(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(WeeklySchedule)
    if user_id:
        q = q.filter((WeeklySchedule.user_id == int(user_id)) | (WeeklySchedule.user_id == None))
    tasks = q.all()
    
    days_order = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
    days_tasks = {d: [] for d in days_order}
    for t in tasks:
        if t.day in days_tasks:
            days_tasks[t.day].append(t)
            
    cards_html = ""
    for day in days_order:
        t_list = "".join([f"<li style=\"margin-bottom:6px;\"><b>{t.subject}:</b> {t.task} {\"<span style=\\\"color:#16a34a;\\\">(✓)</span>\" if t.is_completed else \"\"}</li>" for t in days_tasks[day]])
        if not t_list:
            t_list = "<li style=\"color:#94a3b8; list-style:none;\">Planlanan görev yok</li>"
        cards_html += f"""
        <div style=\"border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#f8fafc;\">
            <h3 style=\"margin-top:0; color:#4f46e5; border-bottom:1px solid #cbd5e1; padding-bottom:4px; font-size:14px;\">{day}</h3>
            <ul style=\"padding-left:16px; margin:0; font-size:12px; color:#1e293b;\">{t_list}</ul>
        </div>
        """

    html = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>YKStudy - Haftalık Çalışma Programı</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }}
            .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }}
            @media print {{
                body {{ padding: 0; }}
                button {{ display: none; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1 style="margin:0; font-size:20px; color:#1e1b4b;">🎯 YKStudy Haftalık Çalışma Programı</h1>
                <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Kişisel YKS Hazırlık ve Hedef Çizelgesi</p>
            </div>
            <button onclick="window.print()" style="background:#4f46e5; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ PDF Olarak Yazdır</button>
        </div>
        <div class="grid">
            {cards_html}
        </div>
        <script>
            window.onload = function() {{ setTimeout(function() {{ window.print(); }}, 600); }}
        </script>
    </body>
    </html>"""
    return HTMLResponse(content=html)

@app.get("/api/mistakes/export-book")
def export_mistakes_book(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Mistake)
    if user_id:
        q = q.filter((Mistake.user_id == int(user_id)) | (Mistake.user_id == None))
    mistakes_list = q.order_by(Mistake.created_at.desc()).all()

    items_html = ""
    for idx, m in enumerate(mistakes_list, 1):
        img_tag = f"<img src=\"{m.image_path}\" style=\"max-height:220px; max-width:100%; border-radius:6px; border:1px solid #e2e8f0; margin-bottom:8px;\">" if m.image_path else ""
        items_html += f"""
        <div style=\"border:1px solid #cbd5e1; border-radius:8px; padding:14px; margin-bottom:14px; page-break-inside:avoid; background:#ffffff;\">
            <div style=\"display:flex; justify-content:space-between; margin-bottom:6px; font-size:11px;\">
                <span style=\"background:#e0e7ff; color:#3730a3; padding:2px 6px; border-radius:4px; font-weight:bold;\">Soru #{idx} - {m.tag}</span>
                <span style=\"color:#64748b;\">Zorluk: {m.difficulty}/5</span>
            </div>
            {img_tag}
            <div style=\"background:#f8fafc; padding:8px; border-radius:6px; border-left:3px solid #6366f1; font-size:12px; color:#334155;\">
                <b>Öğrenci Notu / Çözüm Analizi:</b><br>{m.note or "Not eklenmemiş."}
            </div>
        </div>
        """

    if not items_html:
        items_html = "<p style=\"color:#64748b; text-align:center; padding:40px;\">Yanlış defterinde kayıtlı soru bulunmuyor.</p>"

    html = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>YKStudy - Yanlış Defteri Kitapçığı</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; background: #f1f5f9; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; }}
            @media print {{
                body {{ padding: 0; background: #fff; }}
                button {{ display: none; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1 style="margin:0; font-size:20px; color:#064e3b;">📘 YKStudy Yanlış Soru ve Analiz Kitapçığı</h1>
                <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Tekrar ve Nokta Atışı Eksik Kapatma Fasikülü</p>
            </div>
            <button onclick="window.print()" style="background:#10b981; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ PDF Olarak İndir</button>
        </div>
        <div>
            {items_html}
        </div>
        <script>
            window.onload = function() {{ setTimeout(function() {{ window.print(); }}, 600); }}
        </script>
    </body>
    </html>"""
    return HTMLResponse(content=html)
