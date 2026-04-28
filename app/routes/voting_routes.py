import os
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app, url_for
from werkzeug.utils import secure_filename
from database import db
from models import Voting, Option, Vote, Comment, CommentLike
from routes.auth_routes import login_required

import jwt

voting_bp = Blueprint('voting', __name__, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_current_user_optional():
    """Try to extract user from JWT token, return None if not authenticated."""
    from models import User
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return User.query.get(payload['user_id'])
    except Exception:
        return None


def can_access_voting(voting, user):
    if voting.visibility == 'public':
        return True
    return user is not None and voting.user_id == user.id


def sort_comments(comments, sort_by='oldest'):
    if sort_by == 'newest':
        return sorted(comments, key=lambda comment: comment.created_at, reverse=True)
    if sort_by == 'best':
        return sorted(
            comments,
            key=lambda comment: (len(comment.likes), comment.created_at),
            reverse=True,
        )
    return sorted(comments, key=lambda comment: comment.created_at)


def serialize_comment_tree(comment, children_by_parent, current_user_id, poll_owner_id):
    data = comment.to_dict(current_user_id=current_user_id, poll_owner_id=poll_owner_id)
    replies = sort_comments(children_by_parent.get(comment.id, []), 'oldest')
    data['replies'] = [
        serialize_comment_tree(reply, children_by_parent, current_user_id, poll_owner_id)
        for reply in replies
    ]
    data['reply_count'] = len(data['replies'])
    return data


@voting_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to prevent overwriting
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        # Return the URL relative to the host
        return jsonify({'url': f"/uploads/{filename}"}), 200
    return jsonify({'error': 'Invalid file type'}), 400

@voting_bp.route('/votings', methods=['GET'])
def get_votings():
    user = get_current_user_optional()
    
    # Dashboard/General view: Show all public polls + private polls owned by current user
    if user:
        votings = Voting.query.filter(
            db.or_(Voting.visibility == 'public', Voting.user_id == user.id)
        ).order_by(Voting.created_at.desc()).all()
    else:
        votings = Voting.query.filter_by(visibility='public').order_by(Voting.created_at.desc()).all()
        
    return jsonify([v.to_dict() for v in votings])

@voting_bp.route('/votings/public', methods=['GET'])
def get_public_votings():
    # Strictly public feed for homepage
    votings = Voting.query.filter_by(visibility='public').order_by(Voting.created_at.desc()).all()
    return jsonify([v.to_dict() for v in votings])

@voting_bp.route('/votings/<voting_id>')
def voting_detail(voting_id):
    voting = Voting.query.get_or_404(voting_id)
    data = voting.to_dict()
    # Attach ownership flag if user is authenticated
    user = get_current_user_optional()
    is_owner = (user is not None and voting.user_id == user.id)
    data['is_owner'] = is_owner
    
    # Secure API: Hide individual vote counts for anonymous polls if not owner
    if data['is_anonymous'] and not is_owner:
        for option in data['options']:
            option['vote_count'] = 0

    return jsonify(data)

@voting_bp.route('/votings', methods=['POST'])
@login_required
def create_voting():
    # Support both JSON and Form Data (for image uploads)
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        options_texts = []
        try:
            # Frontend sends options as a JSON string within FormData
            options_texts = json.loads(data.get('options', '[]'))
        except:
            pass
    else:
        data = request.get_json() or {}
        options_texts = data.get('options', [])

    title = data.get('title')
    description = data.get('description', '')
    category = data.get('category', 'Other')
    is_multiple_choice = str(data.get('is_multiple_choice', 'false')).lower() == 'true'
    is_anonymous = str(data.get('is_anonymous', 'true')).lower() == 'true'
    visibility = data.get('visibility', 'public')
    end_date_str = data.get('end_date')

    if not title or not options_texts:
        return jsonify({'error': 'Title and at least one option are required.'}), 400

    # Handle image upload if present
    image_url = data.get('image_url', '')
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            image_url = f"/uploads/{filename}"

    end_date = None
    if end_date_str:
        try:
            # Expecting ISO format from frontend datetime-local
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            pass

    new_voting = Voting(
        title=title,
        description=description,
        category=category,
        image_url=image_url,
        is_multiple_choice=is_multiple_choice,
        is_anonymous=is_anonymous,
        visibility=visibility,
        end_date=end_date,
        user_id=request.current_user.id,
    )
    db.session.add(new_voting)
    db.session.flush()

    for text in options_texts:
        if text.strip():
            option = Option(voting_id=new_voting.id, text=text.strip())
            db.session.add(option)

    db.session.commit()
    return jsonify(new_voting.to_dict()), 201


@voting_bp.route('/votings/<voting_id>', methods=['PUT'])
@login_required
def update_voting(voting_id):
    voting = Voting.query.get_or_404(voting_id)

    # Only owner can update
    if voting.user_id != request.current_user.id:
        return jsonify({'error': 'You do not have permission to edit this poll.'}), 403

    title = request.form.get('title')
    description = request.form.get('description', '')
    category = request.form.get('category')
    is_multiple_choice = request.form.get('is_multiple_choice') == 'true'
    is_anonymous = request.form.get('is_anonymous') == 'true'
    visibility = request.form.get('visibility', 'public')
    end_date_str = request.form.get('end_date')
    options_json = request.form.get('options')
    
    if title:
        voting.title = title
    voting.description = description
    if category:
        voting.category = category
    voting.is_multiple_choice = is_multiple_choice
    voting.is_anonymous = is_anonymous
    voting.visibility = visibility

    if end_date_str:
        try:
            voting.end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            pass
    else:
        voting.end_date = None

    # Handle optional image upload during update
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            voting.image_url = f"/uploads/{filename}"

    # Update options if provided
    if options_json:
        try:
            new_options = json.loads(options_json)
            # Remove old options and votes to maintain referential integrity
            Vote.query.filter_by(voting_id=voting.id).delete()
            Option.query.filter_by(voting_id=voting.id).delete()
            for text in new_options:
                if text.strip():
                    option = Option(voting_id=voting.id, text=text.strip())
                    db.session.add(option)
        except json.JSONDecodeError:
            pass

    db.session.commit()
    return jsonify(voting.to_dict()), 200


@voting_bp.route('/votings/<voting_id>/reset', methods=['POST'])
@login_required
def reset_voting(voting_id):
    voting = Voting.query.get_or_404(voting_id)

    # Only owner can reset
    if voting.user_id != request.current_user.id:
        return jsonify({'error': 'You do not have permission to reset this poll.'}), 403

    # Delete all votes associated with this poll
    Vote.query.filter_by(voting_id=voting.id).delete()
    
    # Reset vote count on all options
    for option in voting.options:
        option.vote_count = 0
        
    db.session.commit()
    return jsonify({'message': 'All votes have been reset.'}), 200



@voting_bp.route('/votings/<voting_id>', methods=['DELETE'])
@login_required
def delete_voting(voting_id):
    voting = Voting.query.get_or_404(voting_id)

    # Only owner can delete
    if voting.user_id != request.current_user.id:
        return jsonify({'error': 'You do not have permission to delete this poll.'}), 403

    db.session.delete(voting)
    db.session.commit()
    return jsonify({'message': 'Poll deleted successfully.'}), 200


@voting_bp.route('/votings/<voting_id>/comments', methods=['GET'])
def get_comments(voting_id):
    voting = Voting.query.get_or_404(voting_id)
    user = get_current_user_optional()

    if not can_access_voting(voting, user):
        return jsonify({'error': 'You do not have permission to view comments for this poll.'}), 403

    sort_by = request.args.get('sort', 'oldest')
    if sort_by not in {'oldest', 'newest', 'best'}:
        sort_by = 'oldest'

    comments = Comment.query.filter_by(voting_id=voting.id).all()
    children_by_parent = {}
    root_comments = []
    for comment in comments:
        if comment.parent_id:
            children_by_parent.setdefault(comment.parent_id, []).append(comment)
        else:
            root_comments.append(comment)

    current_user_id = user.id if user else None
    return jsonify([
        serialize_comment_tree(comment, children_by_parent, current_user_id, voting.user_id)
        for comment in sort_comments(root_comments, sort_by)
    ]), 200


@voting_bp.route('/votings/<voting_id>/comments', methods=['POST'])
@login_required
def create_comment(voting_id):
    voting = Voting.query.get_or_404(voting_id)

    if not can_access_voting(voting, request.current_user):
        return jsonify({'error': 'You do not have permission to comment on this poll.'}), 403

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    parent_id = data.get('parent_id')

    if not content:
        return jsonify({'error': 'Comment cannot be empty.'}), 400
    if len(content) > 500:
        return jsonify({'error': 'Comment cannot exceed 500 characters.'}), 400

    parent_comment = None
    if parent_id:
        parent_comment = Comment.query.get(parent_id)
        if not parent_comment or parent_comment.voting_id != voting.id:
            return jsonify({'error': 'Parent comment was not found for this poll.'}), 400

    comment = Comment(
        voting_id=voting.id,
        user_id=request.current_user.id,
        parent_id=parent_comment.id if parent_comment else None,
        content=content,
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict(
        current_user_id=request.current_user.id,
        poll_owner_id=voting.user_id,
    )), 201


@voting_bp.route('/comments/<int:comment_id>/like', methods=['POST'])
@login_required
def like_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)

    if not can_access_voting(comment.voting, request.current_user):
        return jsonify({'error': 'You do not have permission to like this comment.'}), 403

    existing_like = CommentLike.query.filter_by(
        comment_id=comment.id,
        user_id=request.current_user.id,
    ).first()

    if not existing_like:
        db.session.add(CommentLike(comment_id=comment.id, user_id=request.current_user.id))
        db.session.commit()

    return jsonify(comment.to_dict(
        current_user_id=request.current_user.id,
        poll_owner_id=comment.voting.user_id,
    )), 200


@voting_bp.route('/comments/<int:comment_id>/like', methods=['DELETE'])
@login_required
def unlike_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)

    if not can_access_voting(comment.voting, request.current_user):
        return jsonify({'error': 'You do not have permission to unlike this comment.'}), 403

    existing_like = CommentLike.query.filter_by(
        comment_id=comment.id,
        user_id=request.current_user.id,
    ).first()

    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()

    return jsonify(comment.to_dict(
        current_user_id=request.current_user.id,
        poll_owner_id=comment.voting.user_id,
    )), 200


@voting_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    voting = comment.voting

    if comment.user_id != request.current_user.id and voting.user_id != request.current_user.id:
        return jsonify({'error': 'You do not have permission to delete this comment.'}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted successfully.'}), 200


@voting_bp.route('/vote', methods=['POST'])
def submit_vote():
    data = request.get_json(silent=True) or {}
    voting_id = data.get('voting_id')
    option_ids = data.get('options', [])
    ip_address = request.remote_addr
    user = get_current_user_optional()

    if not voting_id or not option_ids:
        return jsonify({'error': 'Please select an option.'}), 400

    # Check for duplicate vote (by IP or User ID)
    filter_args = [Vote.voting_id == voting_id]
    if user:
        filter_args.append(db.or_(Vote.ip_address == ip_address, Vote.user_id == user.id))
    else:
        filter_args.append(Vote.ip_address == ip_address)
    
    existing_vote = Vote.query.filter(*filter_args).first()
    if existing_vote:
        return jsonify({'error': 'You have already voted on this poll.'}), 409

    voting = Voting.query.get_or_404(voting_id)

    # Check if poll has ended
    if voting.end_date and datetime.now(timezone.utc) > voting.end_date.replace(tzinfo=timezone.utc):
        return jsonify({'error': 'This poll has already ended.'}), 400

    # Security: If not multiple choice, allow only one option
    if not voting.is_multiple_choice and len(option_ids) > 1:
        return jsonify({'error': 'This poll only allows a single choice.'}), 400

    # Process votes
    for oid in option_ids:
        option = Option.query.get(oid)
        if option and option.voting_id == voting.id:
            option.vote_count += 1
            # Register each choice in Vote table
            new_vote = Vote(
                voting_id=voting_id, 
                option_id=oid,
                ip_address=ip_address,
                user_id=user.id if user else None
            )
            db.session.add(new_vote)

    db.session.commit()
    return jsonify({'message': 'Vote submitted successfully', 'voting_id': voting_id}), 200

@voting_bp.route('/results/<voting_id>')
def get_results(voting_id):
    voting = Voting.query.get_or_404(voting_id)
    user = get_current_user_optional()
    
    # If private, only creator can view results
    if voting.visibility == 'private':
        if not user or user.id != voting.user_id:
            return jsonify({'error': 'Results for this private poll are only visible to the creator.'}), 403
    data = voting.to_dict()
    total_votes = data['total_votes']
    
    for opt in data['options']:
        opt['percentage'] = round(opt['vote_count'] / total_votes * 100, 1) if total_votes > 0 else 0
    
    # Attach ownership flag
    user = get_current_user_optional()
    data['is_owner'] = (user is not None and voting.user_id == user.id)
    
    # Attach voters if not anonymous
    if not voting.is_anonymous:
        # Group by user to handle multiple choices nicely
        voters_data = {}
        for vote in voting.votes:
            v_id = vote.user_id or f"anon_{vote.ip_address}"
            if v_id not in voters_data:
                voters_data[v_id] = {
                    'name': vote.voter.full_name if vote.voter else 'Guest User',
                    'email': vote.voter.email if vote.voter else '',
                    'choices': [],
                    'time': vote.created_at.isoformat()
                }
            voters_data[v_id]['choices'].append(vote.option.text)
        
        data['voters'] = list(voters_data.values())
    
    return jsonify(data)

@voting_bp.route('/health')
def health_check():
    return {"status": "healthy"}, 200
