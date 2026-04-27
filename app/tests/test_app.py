import pytest
import json
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
    response = client.post('/api/votings',
        data=json.dumps({
            'title': 'Test Poll',
            'description': 'Test Description',
            'category': 'Technology',
            'options': ['Option 1', 'Option 2']
        }),
        content_type='application/json'
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['title'] == 'Test Poll'
    assert len(data['options']) == 2

def test_get_votings_api(client):
    client.post('/api/votings',
        data=json.dumps({
            'title': 'API Test Poll',
            'category': 'Technology',
            'options': ['Option 1', 'Option 2']
        }),
        content_type='application/json'
    )

    response = client.get('/api/votings')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) > 0
    assert data[0]['title'] == 'API Test Poll'

def test_submit_vote(client, app):
    create_res = client.post('/api/votings',
        data=json.dumps({
            'title': 'Vote Test',
            'category': 'Technology',
            'options': ['Yes', 'No']
        }),
        content_type='application/json'
    )
    voting_data = create_res.get_json()

    with app.app_context():
        option = Option.query.filter_by(voting_id=voting_data['id'], text='Yes').first()

        response = client.post('/api/vote',
            data=json.dumps({
                'voting_id': voting_data['id'],
                'options': [option.id]
            }),
            content_type='application/json'
        )

        assert response.status_code == 200
        result = response.get_json()
        assert result['message'] == 'Vote submitted successfully'

def test_duplicate_vote_prevention(client, app):
    create_res = client.post('/api/votings',
        data=json.dumps({
            'title': 'Duplicate Test',
            'category': 'Technology',
            'options': ['Option A', 'Option B']
        }),
        content_type='application/json'
    )
    voting_data = create_res.get_json()

    with app.app_context():
        option = Option.query.filter_by(voting_id=voting_data['id'], text='Option A').first()

        # First vote
        client.post('/api/vote',
            data=json.dumps({
                'voting_id': voting_data['id'],
                'options': [option.id]
            }),
            content_type='application/json'
        )

        # Second vote from same IP
        response = client.post('/api/vote',
            data=json.dumps({
                'voting_id': voting_data['id'],
                'options': [option.id]
            }),
            content_type='application/json'
        )

        assert response.status_code == 409
        data = response.get_json()
        assert 'already voted' in data['error']
