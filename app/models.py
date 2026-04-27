import uuid
from database import db
from datetime import datetime

def generate_uuid():
    return uuid.uuid4().hex

class User(db.Model):
    id = db.Column(db.String(32), primary_key=True, default=generate_uuid)
    full_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    votings = db.relationship('Voting', backref='author', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
        }

class Voting(db.Model):
    id = db.Column(db.String(32), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    is_multiple_choice = db.Column(db.Boolean, default=False)
    is_anonymous = db.Column(db.Boolean, default=True)
    visibility = db.Column(db.String(20), default='public')
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.String(32), db.ForeignKey('user.id'), nullable=True)
    options = db.relationship('Option', backref='voting', lazy=True, cascade="all, delete-orphan")
    votes = db.relationship('Vote', backref='voting', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'image_url': self.image_url,
            'is_multiple_choice': self.is_multiple_choice,
            'is_anonymous': self.is_anonymous,
            'visibility': self.visibility,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'created_at': self.created_at.isoformat(),
            'total_votes': sum(option.vote_count for option in self.options),
            'options': [option.to_dict() for option in self.options],
            'author': self.author.full_name if self.author else None,
            'user_id': self.user_id,
        }

class Option(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    voting_id = db.Column(db.String(32), db.ForeignKey('voting.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    vote_count = db.Column(db.Integer, default=0)
    votes = db.relationship('Vote', backref='option', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'vote_count': self.vote_count
        }

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    voting_id = db.Column(db.String(32), db.ForeignKey('voting.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('option.id'), nullable=False)
    user_id = db.Column(db.String(32), db.ForeignKey('user.id'), nullable=True)
    ip_address = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    voter = db.relationship('User', backref='votes_cast', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'voter': self.voter.full_name if self.voter else 'Guest User',
            'option_text': self.option.text,
            'created_at': self.created_at.isoformat()
        }

