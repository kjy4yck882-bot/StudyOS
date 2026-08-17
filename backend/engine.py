from datetime import datetime
from sqlalchemy.orm import Session
from models import Topic, Mistake

def generate_daily_recommendations(db: Session, limit: int = 3):
    topics = db.query(Topic).all()
    recommendations = []
    now = datetime.utcnow()

    for topic in topics:
        unresolved_mistakes = db.query(Mistake).filter(
            Mistake.topic_id == topic.id,
            Mistake.is_resolved == False
        ).count()

        days_passed = 0
        if topic.last_reviewed_at:
            days_passed = (now - topic.last_reviewed_at).days

        priority_score = (
            (unresolved_mistakes * 4.0) +
            ((100.0 - topic.mastery_score) * 0.5) +
            (days_passed * 1.5)
        )

        suggested_tests = max(1, round((100 - topic.mastery_score) / 20))
        action_text = f"{topic.subject} - {topic.title}: {suggested_tests} test çöz"
        if unresolved_mistakes > 0:
            action_text += f" ve biriken {unresolved_mistakes} yanlış soruyu tekrar et."

        recommendations.append({
            "topic_id": topic.id,
            "subject": topic.subject,
            "title": topic.title,
            "priority_score": round(priority_score, 2),
            "unresolved_mistakes": unresolved_mistakes,
            "action": action_text
        })

    recommendations.sort(key=lambda x: x["priority_score"], reverse=True)
    return recommendations[:limit]