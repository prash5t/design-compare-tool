from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
from PIL import Image
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from flask_cors import CORS  # Add this import

app = Flask(__name__)
CORS(app)  # Add this line to enable CORS

# Configuration
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_files():
    print("Files received:", request.files)
    print("Form data:", request.form)

    if 'figma_image' not in request.files or 'built_image' not in request.files:
        missing = []
        if 'figma_image' not in request.files:
            missing.append('figma_image')
        if 'built_image' not in request.files:
            missing.append('built_image')
        return jsonify({'error': f'Missing files: {", ".join(missing)}'}), 400

    figma_image = request.files['figma_image']
    built_image = request.files['built_image']

    print("Figma image:", figma_image.filename)
    print("Built image:", built_image.filename)

    if figma_image.filename == '' or built_image.filename == '':
        empty = []
        if figma_image.filename == '':
            empty.append('figma_image')
        if built_image.filename == '':
            empty.append('built_image')
        return jsonify({'error': f'Empty filenames: {", ".join(empty)}'}), 400

    # Remove the allowed_file check as it's not defined
    figma_filename = secure_filename(figma_image.filename)
    built_filename = secure_filename(built_image.filename)

    figma_path = os.path.join(app.config['UPLOAD_FOLDER'], figma_filename)
    built_path = os.path.join(app.config['UPLOAD_FOLDER'], built_filename)

    # Ensure the upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    figma_image.save(figma_path)
    built_image.save(built_path)

    # Perform image comparison
    comparison_result = compare_images(figma_path, built_path)

    return jsonify({
        'similarity': comparison_result['similarity'],
        'message': comparison_result['message'],
        'comparison_image': comparison_result['comparison_image']
    })


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


def compare_images(figma_path, built_path):
    # Read images
    figma_img = cv2.imread(figma_path)
    built_img = cv2.imread(built_path)

    # Ensure images are the same size
    figma_img = cv2.resize(figma_img, (built_img.shape[1], built_img.shape[0]))

    # Convert images to grayscale
    figma_gray = cv2.cvtColor(figma_img, cv2.COLOR_BGR2GRAY)
    built_gray = cv2.cvtColor(built_img, cv2.COLOR_BGR2GRAY)

    # Compute SSIM between the two images
    (score, diff) = ssim(figma_gray, built_gray, full=True)

    # The diff image contains the actual image differences
    diff = (diff * 255).astype("uint8")

    # Threshold the difference image, followed by finding contours
    thresh = cv2.threshold(
        diff, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    contours = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if len(contours) == 2 else contours[1]

    # Create a mask image that we will use to visualize the differences
    mask = np.zeros(figma_img.shape, dtype='uint8')
    filled_after = figma_img.copy()

    for c in contours:
        area = cv2.contourArea(c)
        if area > 40:
            x, y, w, h = cv2.boundingRect(c)
            cv2.rectangle(figma_img, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.rectangle(built_img, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.drawContours(mask, [c], 0, (0, 255, 0), -1)
            cv2.drawContours(filled_after, [c], 0, (0, 0, 255), -1)

    # Create the comparison image
    comparison = np.hstack((figma_img, built_img, filled_after))

    # Save the comparison image
    comparison_filename = f'comparison_{os.path.basename(figma_path)}_{os.path.basename(built_path)}.jpg'
    comparison_path = os.path.join(
        app.config['UPLOAD_FOLDER'], comparison_filename)
    cv2.imwrite(comparison_path, comparison)

    return {
        'similarity': score * 100,
        'message': f'The images are {score * 100:.2f}% similar based on structural similarity.',
        'comparison_image': comparison_filename
    }


if __name__ == '__main__':
    app.run(debug=True)
