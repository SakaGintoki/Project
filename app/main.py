import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from database import db
from routes.voting_routes import voting_bp
from routes.auth_routes import auth_bp

def create_app():
    # Serve React build in production
    static_folder = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
    app = Flask(__name__, static_folder=static_folder, static_url_path='')

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///votely.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-this-in-prod')
    
    # Upload config
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Security: Limit max content length for uploads (e.g., 5MB)
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

    CORS(app)

    db.init_app(app)

    # Register blueprints - Order matters if there are overlapping prefixes
    app.register_blueprint(auth_bp)
    app.register_blueprint(voting_bp)

    @app.route('/api/test')
    def api_test():
        return jsonify({"message": "API is reachable", "status": "ok"}), 200

    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Serve React app for all non-API routes (SPA fallback)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    with app.app_context():
        db.create_all()

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if hasattr(e, 'code') and hasattr(e, 'description'):
            return jsonify(error=str(e.description)), e.code
        # Non-HTTP exceptions
        import traceback
        print(traceback.format_exc())
        return jsonify(error=str(e), traceback=traceback.format_exc()), 500

    @app.after_request
    def set_secure_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
