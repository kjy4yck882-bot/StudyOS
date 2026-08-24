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

UPLOAD_DIR = os.path.expanduser("~/StudyOS_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

DATABASE_URL = "sqlite:///./studyos.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
        db.refresh(s)
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

@app.get("/")
def root_check():
    return {"status": "ok", "message": "YKStudy API Live"}

# --- KOÇLUK & PIN ENDPOINTLERİ ---
class AdminPinReq(BaseModel):
    pin: str

@app.post("/api/admin/verify-pin")
def verify_admin_pin(req: AdminPinReq, db: Session = Depends(get_db)):
    current_pin = get_admin_pin(db)
    if req.pin.strip() == current_pin.strip():
        return {"ok": True, "message": "Giriş başarılı"}
    raise HTTPException(status_code=400, detail="Geçersiz PIN kodu!")

class AdminChangePinReq(BaseModel):
    old_pin: str
    new_pin: str

@app.post("/api/admin/change-pin")
def change_admin_pin(req: AdminChangePinReq, db: Session = Depends(get_db)):
    current_pin = get_admin_pin(db)
    if req.old_pin.strip() != current_pin.strip():
        raise HTTPException(status_code=400, detail="Mevcut PIN hatalı!")
    if len(req.new_pin.strip()) < 4:
        raise HTTPException(status_code=400, detail="Yeni PIN en az 4 haneli olmalıdır!")
    
    s = db.query(SystemSetting).filter(SystemSetting.key == "admin_pin").first()
    if s:
        s.value = req.new_pin.strip()
    else:
        s = SystemSetting(key="admin_pin", value=req.new_pin.strip())
        db.add(s)
    db.commit()
    return {"ok": True, "message": "PIN kodu başarıyla güncellendi."}

@app.get("/api/admin/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    users = db.query(User).all()
    user_list = []
    for u in users:
        solved_today = db.query(DailyQuestionGoal).filter(
            DailyQuestionGoal.user_id == u.id,
            DailyQuestionGoal.date_str == datetime.utcnow().strftime("%Y-%m-%d")
        ).first()
        
        user_list.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "xp": u.xp or 0,
            "target_uni": u.target_uni,
            "target_dept": u.target_dept,
            "selected_title": u.selected_title,
            "solved_today": solved_today.solved if solved_today else 0,
            "target_today": solved_today.target if solved_today else 100,
            "is_studying": u.is_studying_now
        })
    return {"users": user_list, "total_users": len(user_list)}

# --- AUTH & USER ---
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

class BuyReq(BaseModel):
    user_id: int
    item_id: str
    item_type: str
    cost: int

@app.post("/api/market/buy")
def buy_market_item(req: BuyReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == int(req.user_id)).first()
    if not user: raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı!")
    
    current_themes = set([t.strip() for t in (user.unlocked_themes or "slate").split(",") if t.strip()])
    current_titles = set([t.strip() for t in (user.unlocked_titles or "🌱 Çırak Öğrenci").split(",") if t.strip()])

    if req.item_type == "theme":
        if req.item_id not in current_themes:
            if (user.xp or 0) < req.cost: raise HTTPException(status_code=400, detail="Yetersiz XP Puanı!")
            user.xp = (user.xp or 0) - req.cost
            current_themes.add(req.item_id)
            user.unlocked_themes = ",".join(current_themes)
    elif req.item_type == "title":
        if req.item_id not in current_titles:
            if (user.xp or 0) < req.cost: raise HTTPException(status_code=400, detail="Yetersiz XP Puanı!")
            user.xp = (user.xp or 0) - req.cost
            current_titles.add(req.item_id)
            user.unlocked_titles = ",".join(current_titles)
        user.selected_title = req.item_id

    db.commit()
    db.refresh(user)
    return {"xp": user.xp, "unlocked_themes": user.unlocked_themes, "unlocked_titles": user.unlocked_titles, "selected_title": user.selected_title}

# --- PDF & EXPORT ---
@app.get("/api/schedule/export-pdf")
def export_schedule_pdf(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(WeeklySchedule)
    if user_id: q = q.filter((WeeklySchedule.user_id == int(user_id)) | (WeeklySchedule.user_id == None))
    tasks = q.all()
    days_order = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
    days_tasks = {d: [] for d in days_order}
    for t in tasks:
        if t.day in days_tasks: days_tasks[t.day].append(t)
            
    cards_html = ""
    for day in days_order:
        t_list = "".join([f"<li style=\"margin-bottom:6px;\"><b>{t.subject}:</b> {t.task}</li>" for t in days_tasks[day]])
        if not t_list: t_list = "<li style=\"color:#94a3b8; list-style:none;\">Plan yok</li>"
        cards_html += f"<div style=\"border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#f8fafc;\"><h3 style=\"margin-top:0; color:#4f46e5;\">{day}</h3><ul style=\"padding-left:16px;\">{t_list}</ul></div>"

    html = f"<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Plan</title><style>body{{font-family:sans-serif;padding:24px;}} .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}}</style></head><body><h2>🎯 YKStudy Haftalık Çalışma Programı</h2><div class=\"grid\">{cards_html}</div><script>window.onload=function(){{window.print();}}</script></body></html>"
    return HTMLResponse(content=html)

@app.get("/api/mistakes/export-book")
def export_mistakes_book(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Mistake)
    if user_id: q = q.filter((Mistake.user_id == int(user_id)) | (Mistake.user_id == None))
    mistakes_list = q.order_by(Mistake.created_at.desc()).all()
    items_html = "".join([f"<div style=\"border:1px solid #cbd5e1; border-radius:8px; padding:14px; margin-bottom:14px; background:#fff;\"><b>Soru #{idx} ({m.tag})</b> - Zorluk: {m.difficulty}/5<div style=\"margin-top:6px; background:#f8fafc; padding:8px;\">{m.note or 'Not yok'}</div></div>" for idx, m in enumerate(mistakes_list, 1)])
    if not items_html: items_html = "<p>Yanlış defterinde soru bulunamadı.</p>"
    html = f"<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Yanlış Defteri</title><style>body{{font-family:sans-serif;padding:24px;}}</style></head><body><h2>📘 YKStudy Yanlış Defteri</h2><div>{items_html}</div><script>window.onload=function(){{window.print();}}</script></body></html>"
    return HTMLResponse(content=html)

# --- DİĞER VERİ ROTALARI ---
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
    new_xp = add_user_xp(user_id or t.user_id, 50, db) if t.mastery_score >= 100 else 0
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
    topic_id: int = Form(1), note: str = Form(""), tag: str = Form("Genel"),
    difficulty: int = Form(3), user_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None), db: Session = Depends(get_db)
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
    c, w = float(req.correct_count), float(req.wrong_count)
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
        if s.is_completed: new_xp = add_user_xp(user_id or s.user_id, 25, db)
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
    b = BookTracker(title=req.title.strip(), subject=req.subject, book_type=req.book_type or "Soru Bankası", total_tests=int(req.total_tests), daily_pace=float(req.daily_pace or 1.5), cover_color=req.cover_color or "from-blue-600 to-indigo-800", user_id=uid)
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
        if user_id: new_xp = add_user_xp(user_id, int(count) * 2, db)
    return {"goal": g, "new_xp": new_xp}

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
        history.append({"date": d_str, "day_num": d.strftime("%d/%m"), "solved": solved, "target": target, "completed": completed})
    
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

@app.get("/api/recommendations")
def get_recommendations(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    return [
        {"priority_score": 95, "action": "Bugün hedeflenen soru sayısına ulaşmak için 2 Pomodoro bloğu tamamlayın."},
        {"priority_score": 88, "action": "ÖSYM soru ağırlığı yüksek Matematik ve Fizik konularını tekrar edin."}
    ]

@app.post("/api/pomodoro")
def add_pomo(duration: int = 25, topic_id: Optional[int] = None, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    p = PomodoroSession(topic_id=int(topic_id) if topic_id else None, duration_minutes=int(duration), user_id=int(user_id) if user_id else None)
    db.add(p)
    db.commit()
    new_xp = add_user_xp(user_id, 40, db)
    return {"ok": True, "new_xp": new_xp}

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


# --- TYT TÜM DERSLER MÜFREDAT HAVUZU ---
CURRICULUM_DATA = [
    # Matematik
    ("Matematik", "Temel Kavramlar & Sayı Basamakları", "Yüksek"),
    ("Matematik", "Bölme - Bölünebilme & OBEB-OKEK", "Orta"),
    ("Matematik", "Rasyonel & Ondalık Sayılar", "Yüksek"),
    ("Matematik", "Basit Eşitsizlikler & Mutlak Değer", "Yüksek"),
    ("Matematik", "Üslü & Köklü İfadeler", "Yüksek"),
    ("Matematik", "Çarpanlara Ayırma", "Orta"),
    ("Matematik", "Oran - Orantı", "Orta"),
    ("Matematik", "Problemler (Sayı, Kesir, Yaş, Yüzde, Hareket)", "Çok Yüksek"),
    ("Matematik", "Kümeler & Kartezyen Çarpım", "Orta"),
    ("Matematik", "Fonksiyonlar (Temel Kavramlar)", "Yüksek"),
    ("Matematik", "Polinomlar & 2. Dereceden Denklemler", "Orta"),
    ("Matematik", "Permütasyon - Kombinasyon - Olasılık", "Yüksek"),
    ("Matematik", "İstatistik & Veri Analizi", "Orta"),

    # Geometri
    ("Geometri", "Doğruda ve Üçgende Açılar", "Yüksek"),
    ("Geometri", "Özel Üçgenler (Dik, İkizkenar, Eşkenar)", "Yüksek"),
    ("Geometri", "Üçgende Alan ve Benzerlik", "Çok Yüksek"),
    ("Geometri", "Çokgenler ve Dörtgenler", "Yüksek"),
    ("Geometri", "Çember ve Daire", "Orta"),
    ("Geometri", "Katı Cisimler (Prizma, Piramit, Koni)", "Yüksek"),

    # Fizik
    ("Fizik", "Fizik Bilimine Giriş & Madde ve Özellikleri", "Orta"),
    ("Fizik", "Kuvvet ve Hareket (1 Boyutta)", "Yüksek"),
    ("Fizik", "İş, Güç ve Enerji", "Yüksek"),
    ("Fizik", "Isı, Sıcaklık ve Genleşme", "Yüksek"),
    ("Fizik", "Elektrostatik & Elektrik Akımı / Devreler", "Yüksek"),
    ("Fizik", "Manyetizma ve Maddesel Özellikler", "Orta"),
    ("Fizik", "Basınç ve Kaldırma Kuvveti", "Yüksek"),
    ("Fizik", "Dalgalar (Ses, Deprem, Su, Yay)", "Orta"),
    ("Fizik", "Optik (Gölge, Yansıma, Kırılma, Mercekler)", "Çok Yüksek"),

    # Kimya
    ("Kimya", "Kimya Bilimi & Simyadan Kimyaya", "Orta"),
    ("Kimya", "Atom ve Periyodik Sistem", "Yüksek"),
    ("Kimya", "Kimyasal Türler Arası Etkileşimler", "Çok Yüksek"),
    ("Kimya", "Maddenin Halleri (Katı, Sıvı, Gaz, Plazma)", "Yüksek"),
    ("Kimya", "Kimyanın Temel Kanunları & Mol Kavramı", "Yüksek"),
    ("Kimya", "Kimyasal Hesaplamalar", "Orta"),
    ("Kimya", "Karışımlar ve Ayırma Teknikleri", "Yüksek"),
    ("Kimya", "Asitler, Bazlar ve Tuzlar", "Yüksek"),
    ("Kimya", "Kimya Her Yerde (Temizlik, Polimer, Gıda)", "Orta"),

    # Biyoloji
    ("Biyoloji", "Canlıların Ortak Özellikleri & Temel Bileşikler", "Yüksek"),
    ("Biyoloji", "Hücre Teorisi, Yapısı ve Organeller", "Çok Yüksek"),
    ("Biyoloji", "Hücre Zarından Madde Geçişleri", "Yüksek"),
    ("Biyoloji", "Canlıların Çeşitliliği ve Sınıflandırılması", "Yüksek"),
    ("Biyoloji", "Hücre Bölünmeleri (Mitoz ve Mayoz)", "Yüksek"),
    ("Biyoloji", "Kalıtım ve Genetik Varyasyonlar", "Çok Yüksek"),
    ("Biyoloji", "Ekosistem Ekolojisi ve Güncel Çevre Sorunları", "Yüksek"),

    # Türkçe
    ("Türkçe", "Sözcükte ve Söz Öbeklerinde Anlam", "Yüksek"),
    ("Türkçe", "Cümlede Anlam ve Kavramlar", "Yüksek"),
    ("Türkçe", "Paragrafta Ana Düşünce ve Yardımcı Düşünceler", "Çok Yüksek"),
    ("Türkçe", "Paragrafta Yapı ve Anlatım Teknikleri", "Çok Yüksek"),
    ("Türkçe", "Ses Bilgisi & Yazım Kuralları & Noktalama", "Yüksek"),
    ("Türkçe", "Sözcükte Yapı ve Ekler", "Orta"),
    ("Türkçe", "Sözcük Türleri (İsim, Sıfat, Zamir, Zarf, Fiil)", "Orta"),
    ("Türkçe", "Cümlenin Ögeleri ve Cümle Türleri", "Orta"),
    ("Türkçe", "Anlatım Bozuklukları", "Düşük"),

    # Sosyal Bilimler (Tarih - Coğrafya - Felsefe - Din)
    ("Tarih", "İlk ve Orta Çağlarda Türk Dünyası", "Orta"),
    ("Tarih", "İslam Medeniyetinin Doğuşu ve İlk Türk İslam Devletleri", "Orta"),
    ("Tarih", "Osmanlı Devleti Kuruluş, Yükselme ve Kültür Medeniyet", "Yüksek"),
    ("Tarih", "Milli Mücadele Dönemi ve Atatürk İlkeleri", "Çok Yüksek"),
    ("Coğrafya", "Doğa ve İnsan & Harita Bilgisi", "Orta"),
    ("Coğrafya", "Dünya'nın Şekli ve Hareketleri & İklim Bilgisi", "Yüksek"),
    ("Coğrafya", "İç ve Dış Kuvvetler & Türkiye'nin Yerşekilleri", "Yüksek"),
    ("Coğrafya", "Nüfus, Yerleşme ve Doğal Afetler", "Yüksek"),
    ("Felsefe", "Felsefeyi Tanıma & Bilgi, Varlık, Ahlak Felsefesi", "Yüksek"),
    ("Din Kültürü", "İslam İnanç Esasları, İbadetler ve Ahlak", "Yüksek")
]

@app.post("/api/topics/load-curriculum")
@app.post("/api/topics/seed")
def load_curriculum(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    uid = int(user_id) if user_id else None
    
    # Kullanıcının mevcut konularını kontrol et
    existing = db.query(Topic).filter((Topic.user_id == uid) if uid else (Topic.user_id == None)).all()
    existing_titles = set([f"{t.subject}:{t.title}" for t in existing])
    
    added_count = 0
    for subj, title, weight in CURRICULUM_DATA:
        key = f"{subj}:{title}"
        if key not in existing_titles:
            t = Topic(
                subject=subj,
                title=title,
                osym_weight=weight,
                user_id=uid,
                theory_done=False,
                source1_done=False,
                source2_done=False,
                mastery_score=0.0
            )
            db.add(t)
            added_count += 1
            
    db.commit()
    return {"ok": True, "added_count": added_count, "message": f"{added_count} adet TYT konusu başarıyla yüklendi!"}
