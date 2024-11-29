# Import các thư viện cần thiết
from flask import Flask, render_template, jsonify, request
import logging
from maze_generator import generate_maze

# Khởi tạo ứng dụng Flask
app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

# Route cho trang chủ
@app.route('/')
def index():
    return render_template('maze.html')

# API tạo mê cung mới
@app.route('/api/maze', methods=['POST'])
def create_maze():
    try:
        data = request.get_json()
        width = max(7, (int(data.get('width', 33)) // 2) * 2 + 1)
        height = max(7, (int(data.get('height', 33)) // 2) * 2 + 1)

        maze = {
            'width': width,
            'height': height,
            'grid': generate_maze(width, height)
        }

        return jsonify(maze), 201

    except Exception as e:
        app.logger.error(f"Maze generation failed: {str(e)}")
        return jsonify({'error': f'Maze generation failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)