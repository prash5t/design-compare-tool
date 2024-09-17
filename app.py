from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
from PIL import Image
import cv2
import numpy as np

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_files():
    if 'figma_image' not in request.files or 'built_image' not in request.files:
        return jsonify({'error': 'Both images are required'}), 400

    figma_image = request.files['figma_image']
    built_image = request.files['built_image']

    if figma_image.filename == '' or built_image.filename == '':
        return jsonify({'error': 'Both images are required'}), 400

    if figma_image and allowed_file(figma_image.filename) and built_image and allowed_file(built_image.filename):
        figma_filename = secure_filename(figma_image.filename)
        built_filename = secure_filename(built_image.filename)

        figma_path = os.path.join(app.config['UPLOAD_FOLDER'], figma_filename)
        built_path = os.path.join(app.config['UPLOAD_FOLDER'], built_filename)

        figma_image.save(figma_path)
        built_image.save(built_path)

        # Perform image comparison
        comparison_result = compare_images(figma_path, built_path)

        return jsonify(comparison_result)

    return jsonify({'error': 'Invalid file format'}), 400


def compare_images(figma_path, built_path):
    # Implement image comparison logic here
    # This is a placeholder function, you'll need to implement the actual comparison
    figma_img = cv2.imread(figma_path)
    built_img = cv2.imread(built_path)

    # Example: Compare color histograms
    figma_hist = cv2.calcHist([figma_img], [0, 1, 2], None, [
                              8, 8, 8], [0, 256, 0, 256, 0, 256])
    built_hist = cv2.calcHist([built_img], [0, 1, 2], None, [
                              8, 8, 8], [0, 256, 0, 256, 0, 256])

    similarity = cv2.compareHist(figma_hist, built_hist, cv2.HISTCMP_CORREL)

    return {
        'similarity': similarity,
        'message': f'The images are {similarity * 100:.2f}% similar based on color histograms.'
    }


if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)
