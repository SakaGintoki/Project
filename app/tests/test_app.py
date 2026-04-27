import pytest
import json
from database import db
from models import Option

def auth_headers(client, email="test@example.com", full_name="Test User"):
    response = client.post('/api/auth/register',
        data=json.dumps({
            'full_name': full_name,
            'email': email,
            'password': 'Test1234',
            'confirm_password': 'Test1234'
        }),
        content_type='application/json'
    )
    token = response.get_json()['token']
    return {'Authorization': f'Bearer {token}'}

def create_poll(client, headers, title="Test Poll", visibility="public"):
    response = client.post('/api/votings',
        data=json.dumps({
            'title': title,
            'description': 'Test Description',
            'category': 'Technology',
            'visibility': visibility,
            'options': ['Option 1', 'Option 2']
        }),
        content_type='application/json',
        headers=headers
    )
    return response.get_json()

def create_comment(client, voting_id, headers, content, parent_id=None):
    payload = {'content': content}
    if parent_id is not None:
        payload['parent_id'] = parent_id
    response = client.post(f"/api/votings/{voting_id}/comments",
        data=json.dumps(payload),
        content_type='application/json',
        headers=headers
    )
    return response

@pytest.fixture
def app(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")
    from main import create_app

    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SECRET_KEY": "test-secret-key",
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_voting(client):
    headers = auth_headers(client)
    response = client.post('/api/votings',
        data=json.dumps({
            'title': 'Test Poll',
            'description': 'Test Description',
            'category': 'Technology',
            'options': ['Option 1', 'Option 2']
        }),
        content_type='application/json',
        headers=headers
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['title'] == 'Test Poll'
    assert len(data['options']) == 2

def test_get_votings_api(client):
    headers = auth_headers(client)
    client.post('/api/votings',
        data=json.dumps({
            'title': 'API Test Poll',
            'category': 'Technology',
            'options': ['Option 1', 'Option 2']
        }),
        content_type='application/json',
        headers=headers
    )

    response = client.get('/api/votings')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) > 0
    assert data[0]['title'] == 'API Test Poll'

def test_submit_vote(client, app):
    headers = auth_headers(client)
    create_res = client.post('/api/votings',
        data=json.dumps({
            'title': 'Vote Test',
            'category': 'Technology',
            'options': ['Yes', 'No']
        }),
        content_type='application/json',
        headers=headers
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
    headers = auth_headers(client)
    create_res = client.post('/api/votings',
        data=json.dumps({
            'title': 'Duplicate Test',
            'category': 'Technology',
            'options': ['Option A', 'Option B']
        }),
        content_type='application/json',
        headers=headers
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


def test_create_and_list_comments(client):
    headers = auth_headers(client)
    voting_data = create_poll(client, headers, title="Comment Test")

    create_res = create_comment(client, voting_data['id'], headers, 'This is a thoughtful comment.')

    assert create_res.status_code == 201
    created = create_res.get_json()
    assert created['content'] == 'This is a thoughtful comment.'
    assert created['author'] == 'Test User'
    assert created['can_delete'] is True

    list_res = client.get(f"/api/votings/{voting_data['id']}/comments")
    assert list_res.status_code == 200
    comments = list_res.get_json()
    assert len(comments) == 1
    assert comments[0]['content'] == 'This is a thoughtful comment.'
    assert comments[0]['can_delete'] is False
    assert comments[0]['like_count'] == 0
    assert comments[0]['replies'] == []


def test_guest_cannot_create_comment(client):
    headers = auth_headers(client)
    voting_data = create_poll(client, headers, title="Guest Comment Test")

    response = client.post(f"/api/votings/{voting_data['id']}/comments",
        data=json.dumps({'content': 'Guest comment'}),
        content_type='application/json'
    )

    assert response.status_code == 401


def test_comment_delete_permissions(client):
    owner_headers = auth_headers(client, email="owner@example.com", full_name="Owner")
    commenter_headers = auth_headers(client, email="commenter@example.com", full_name="Commenter")
    outsider_headers = auth_headers(client, email="outsider@example.com", full_name="Outsider")
    voting_data = create_poll(client, owner_headers, title="Delete Comment Test")

    create_res = create_comment(client, voting_data['id'], commenter_headers, 'Please keep this civil.')
    comment_id = create_res.get_json()['id']

    denied_res = client.delete(f"/api/comments/{comment_id}", headers=outsider_headers)
    assert denied_res.status_code == 403

    owner_delete_res = client.delete(f"/api/comments/{comment_id}", headers=owner_headers)
    assert owner_delete_res.status_code == 200

    list_res = client.get(f"/api/votings/{voting_data['id']}/comments")
    assert list_res.get_json() == []


def test_private_poll_comments_are_restricted(client):
    owner_headers = auth_headers(client, email="private-owner@example.com", full_name="Owner")
    other_headers = auth_headers(client, email="private-other@example.com", full_name="Other User")
    voting_data = create_poll(client, owner_headers, title="Private Comment Test", visibility="private")

    guest_res = client.get(f"/api/votings/{voting_data['id']}/comments")
    assert guest_res.status_code == 403

    other_res = client.post(f"/api/votings/{voting_data['id']}/comments",
        data=json.dumps({'content': 'Can I join?'}),
        content_type='application/json',
        headers=other_headers
    )
    assert other_res.status_code == 403

    owner_res = client.post(f"/api/votings/{voting_data['id']}/comments",
        data=json.dumps({'content': 'Owner note.'}),
        content_type='application/json',
        headers=owner_headers
    )
    assert owner_res.status_code == 201


def test_comment_replies_are_nested(client):
    owner_headers = auth_headers(client, email="reply-owner@example.com", full_name="Owner")
    commenter_headers = auth_headers(client, email="reply-user@example.com", full_name="Reply User")
    voting_data = create_poll(client, owner_headers, title="Reply Test")

    parent_res = create_comment(client, voting_data['id'], owner_headers, 'Parent comment')
    parent_id = parent_res.get_json()['id']
    reply_res = create_comment(
        client,
        voting_data['id'],
        commenter_headers,
        'This is a reply.',
        parent_id=parent_id,
    )

    assert reply_res.status_code == 201
    assert reply_res.get_json()['parent_id'] == parent_id

    list_res = client.get(f"/api/votings/{voting_data['id']}/comments")
    comments = list_res.get_json()
    assert len(comments) == 1
    assert comments[0]['content'] == 'Parent comment'
    assert len(comments[0]['replies']) == 1
    assert comments[0]['replies'][0]['content'] == 'This is a reply.'


def test_comment_like_unlike_and_best_sort(client):
    owner_headers = auth_headers(client, email="sort-owner@example.com", full_name="Owner")
    liker_one_headers = auth_headers(client, email="liker-one@example.com", full_name="Liker One")
    liker_two_headers = auth_headers(client, email="liker-two@example.com", full_name="Liker Two")
    voting_data = create_poll(client, owner_headers, title="Sort Test")

    first = create_comment(client, voting_data['id'], owner_headers, 'First comment').get_json()
    second = create_comment(client, voting_data['id'], owner_headers, 'Second comment').get_json()

    client.post(f"/api/comments/{first['id']}/like", headers=liker_one_headers)
    client.post(f"/api/comments/{first['id']}/like", headers=liker_one_headers)
    client.post(f"/api/comments/{first['id']}/like", headers=liker_two_headers)
    client.post(f"/api/comments/{second['id']}/like", headers=liker_one_headers)

    best_res = client.get(f"/api/votings/{voting_data['id']}/comments?sort=best", headers=liker_one_headers)
    best_comments = best_res.get_json()
    assert best_comments[0]['id'] == first['id']
    assert best_comments[0]['like_count'] == 2
    assert best_comments[0]['liked_by_current_user'] is True
    assert best_comments[1]['like_count'] == 1

    unlike_res = client.delete(f"/api/comments/{first['id']}/like", headers=liker_one_headers)
    assert unlike_res.status_code == 200
    assert unlike_res.get_json()['like_count'] == 1
    assert unlike_res.get_json()['liked_by_current_user'] is False


def test_comment_time_sorting(client):
    headers = auth_headers(client, email="time-owner@example.com", full_name="Owner")
    voting_data = create_poll(client, headers, title="Time Sort Test")

    first = create_comment(client, voting_data['id'], headers, 'Oldest comment').get_json()
    second = create_comment(client, voting_data['id'], headers, 'Newest comment').get_json()

    oldest_res = client.get(f"/api/votings/{voting_data['id']}/comments?sort=oldest")
    newest_res = client.get(f"/api/votings/{voting_data['id']}/comments?sort=newest")

    assert oldest_res.get_json()[0]['id'] == first['id']
    assert newest_res.get_json()[0]['id'] == second['id']
