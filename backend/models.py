from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    title = Column(String, index=True)
    theory_done = Column(Boolean, default=False)
    source1_done = Column(Boolean, default=False)
    source2_done = Column(Boolean, default=False)
    mastery_score = Column(Float, default=0.0)

    mistakes = relationship("Mistake", back_populates="topic")
    pomodoros = relationship("PomodoroSession", back_populates="topic")

class Mistake(Base):
    __tablename__ = "mistakes"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    note = Column(Text, default="")
    tag = Column(String, default="Genel")
    difficulty = Column(Integer, default=3)
    is_resolved = Column(Boolean, default=False)
    image_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    topic = relationship("Topic", back_populates="mistakes")

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    duration_minutes = Column(Integer, default=25)
    created_at = Column(DateTime, default=datetime.utcnow)

    topic = relationship("Topic", back_populates="pomodoros")

class WeeklySchedule(Base):
    __tablename__ = "weekly_schedules"
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String)
    subject = Column(String)
    task = Column(String)
    is_completed = Column(Boolean, default=False)

class ExamTrial(Base):
    __tablename__ = "exam_trials"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    exam_type = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    correct_count = Column(Float, default=0.0)
    wrong_count = Column(Float, default=0.0)
    net_score = Column(Float, default=0.0)

class DailyQuestionGoal(Base):
    __tablename__ = "daily_question_goals"
    id = Column(Integer, primary_key=True, index=True)
    date_str = Column(String, index=True)
    target = Column(Integer, default=100)
    solved = Column(Integer, default=0)

class BookTracker(Base):
    __tablename__ = "book_trackers"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    subject = Column(String)
    total_tests = Column(Integer, default=0)
    completed_tests = Column(Integer, default=0)

class DailyJournal(Base):
    __tablename__ = "daily_journals"
    id = Column(Integer, primary_key=True, index=True)
    date_str = Column(String, unique=True, index=True)
    rating = Column(Integer, default=5)
    reflection = Column(Text, default="")
    focus_hours = Column(Float, default=0.0)