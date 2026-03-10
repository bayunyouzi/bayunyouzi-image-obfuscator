# Image Obfuscator

A web-based tool to obfuscate images using Hilbert Space-Filling Curves.
Inspired by [singularpoint.cn](https://singularpoint.cn/hideImg1.html).

## Features

- **Client-side processing**: All processing happens in your browser. No images are uploaded to a server.
- **Hilbert Curve Scrambling**: Uses space-filling curves to scramble pixel positions while preserving some locality (in specific modes) or maximizing chaos.
- **Key-based Encryption**: Secure your images with a password. The same password is required to decrypt.
- **Compression Resistant**: The scrambling method allows the image to be saved as PNG/JPEG and still be recoverable (with some quality loss for JPEG).

## How to Run

### Local Development

1. Clone the repository.
2. Open `index.html` in your browser.
   - Note: For the Web Worker or certain features to work properly, you might need to serve it via a local server (e.g., VS Code Live Server, or `python -m http.server`).

### Deployment (Zeabur)

This project is ready for deployment on [Zeabur](https://zeabur.com).

1. Create a new project on Zeabur.
2. Connect your GitHub repository.
3. Zeabur will automatically detect the `Dockerfile` and deploy the static site using Nginx.

## Technical Details

- **Algorithm**: The image pixels are reordered based on a Hilbert Curve traversal.
- **Obfuscation**: A seeded permutation (using the provided key) shuffles the pixels along the 1D Hilbert path.
- **Reversibility**: The process is fully reversible if the image is saved losslessly (PNG). If saved as JPEG, artifacts may appear upon decryption but the content remains recognizable.

## License

MIT
