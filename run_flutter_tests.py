import subprocess
import os
import shutil


def run_flutter_tests():
    # Run the Flutter test
    result = subprocess.run(
        ['flutter', 'test', 'test/screenshot_generator.dart'], capture_output=True, text=True)

    if result.returncode != 0:
        print("Error running Flutter tests:")
        print(result.stderr)
        return False

    # Move screenshots to the upload folder
    source_dir = '.'  # Current directory where screenshots are generated
    dest_dir = 'uploads/flutter_screenshots'  # Destination directory

    os.makedirs(dest_dir, exist_ok=True)

    for file in os.listdir(source_dir):
        if file.startswith('screenshot_') and file.endswith('.png'):
            shutil.move(os.path.join(source_dir, file),
                        os.path.join(dest_dir, file))

    return True


if __name__ == '__main__':
    if run_flutter_tests():
        print("Screenshots generated and moved successfully.")
    else:
        print("Failed to generate screenshots.")
