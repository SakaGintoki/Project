from database import db
from datetime import datetime

class Voting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    is_multiple_choice = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    options = db.relationship('Option', backref='voting', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'image_url': self.image_url,
            'is_multiple_choice': self.is_multiple_choice,
            'created_at': self.created_at.isoformat(),
            'total_votes': sum(option.vote_count for option in self.options)
        }

class Option(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    voting_id = db.Column(db.Integer, db.ForeignKey('voting.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    vote_count = db.Column(db.Integer, default=0)

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    voting_id = db.Column(db.Integer, db.ForeignKey('voting.id'), nullable=False)
    ip_address = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
