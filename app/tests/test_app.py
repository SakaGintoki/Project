import pytest
from main import create_app
from database import db
from models import Voting, Option, Vote

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_voting(client):
    response = client.post('/votings', data={
        'title': 'Test Poll',
        'description': 'Test Description',
        'category': 'Technology',
        'options[]': ['Option 1', 'Option 2']
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Test Poll' in response.data

def test_get_votings_api(client):
    client.post('/votings', data={
        'title': 'API Test Poll',
        'category': 'Technology',
        'options[]': ['Option 1', 'Option 2']
    })
    
    response = client.get('/votings')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) > 0
    assert data[0]['title'] == 'API Test Poll'

def test_submit_vote(client, app):
    client.post('/votings', data={
        'title': 'Vote Test',
        'category': 'Technology',
        'options[]': ['Yes', 'No']
    })
    
    with app.app_context():
        voting = Voting.query.filter_by(title='Vote Test').first()
        option = Option.query.filter_by(voting_id=voting.id, text='Yes').first()
        
        response = client.post('/vote', data={
            'voting_id': voting.id,
            'options[]': [option.id]
        }, follow_redirects=True)
        
        assert response.status_code == 200
        assert b'1 votes' in response.data or b'100.0%' in response.data

def test_duplicate_vote_prevention(client, app):
    client.post('/votings', data={
        'title': 'Duplicate Test',
        'category': 'Technology',
        'options[]': ['Option A', 'Option B']
    })
    
    with app.app_context():
        voting = Voting.query.filter_by(title='Duplicate Test').first()
        option = Option.query.filter_by(voting_id=voting.id, text='Option A').first()
        
        # First vote
        client.post('/vote', data={
            'voting_id': voting.id,
            'options[]': [option.id]
        })
        
        # Second vote from same IP (client)
        response = client.post('/vote', data={
            'voting_id': voting.id,
            'options[]': [option.id]
        }, follow_redirects=True)
        
        assert b'You have already voted on this poll.' in response.data
