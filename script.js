document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const originalPreview = document.getElementById('original-preview');
    const previewContainer = document.getElementById('preview-container');
    const resultCanvas = document.getElementById('result-canvas');
    const resultContainer = document.getElementById('result-container');
    const resultPlaceholder = document.getElementById('result-placeholder');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');
    const downloadActions = document.getElementById('download-actions');
    const loading = document.getElementById('loading');
    const keyInput = document.getElementById('key');
    const modeSelect = document.getElementById('mode');
    const iterationsInput = document.getElementById('iterations');
    const iterationsVal = document.getElementById('iterations-val');

    let originalImage = null;
    let processedImageData = null;

    // Helper to format bytes
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // Handle File Selection
    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                originalPreview.src = e.target.result;
                previewContainer.classList.remove('hidden');
                
                // Clear previous result
                resultCanvas.classList.add('hidden');
                resultPlaceholder.classList.remove('hidden');
                downloadActions.classList.add('hidden');
                processedImageData = null;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Update Iterations Value
    iterationsInput.addEventListener('input', (e) => {
        iterationsVal.textContent = e.target.value;
    });

    // Process Image
    processBtn.addEventListener('click', async () => {
        if (!originalImage) {
            alert('Please upload an image first.');
            return;
        }

        const key = keyInput.value.trim();
        if (!key) {
            alert('Please enter a key.');
            return;
        }

        const mode = modeSelect.value;
        const iterations = parseInt(iterationsInput.value, 10);

        // UI Loading State
        loading.classList.remove('hidden');
        processBtn.disabled = true;

        // Use setTimeout to allow UI to update before heavy processing
        setTimeout(async () => {
            try {
                // Draw original image to canvas to get data
                const canvas = document.createElement('canvas');
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(originalImage, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Scramble
                const scrambler = new ImageScrambler();
                
                // We need to implement scramble in hilbert.js properly
                // Assuming ImageScrambler is available globally
                
                // For demo, let's just do one pass. Iterations can be added later.
                // The scramble method in hilbert.js is async? No, but let's treat it as synchronous heavy task.
                // Wait, I made it async in the definition.
                
                let currentImageData = imageData;
                
                if (mode === 'encrypt') {
                    for(let i=0; i<iterations; i++) {
                         await scrambler.scramble(currentImageData, key + (i > 0 ? i : ''), 1, 'encrypt');
                    }
                } else {
                    // For decryption, we must apply the inverse operations in reverse order
                    for(let i=iterations-1; i>=0; i--) {
                         await scrambler.scramble(currentImageData, key + (i > 0 ? i : ''), 1, 'decrypt');
                    }
                }

                // Show Result
                resultCanvas.width = canvas.width;
                resultCanvas.height = canvas.height;
                const resultCtx = resultCanvas.getContext('2d');
                resultCtx.putImageData(currentImageData, 0, 0);
                
                resultCanvas.classList.remove('hidden');
                resultPlaceholder.classList.add('hidden');
                downloadActions.classList.remove('hidden');
                
                processedImageData = currentImageData;

            } catch (err) {
                console.error(err);
                alert('An error occurred during processing: ' + err.message);
            } finally {
                loading.classList.add('hidden');
                processBtn.disabled = false;
            }
        }, 100);
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        if (!resultCanvas) return;
        
        // Use quality 1.0 (max) for JPEG, or PNG for lossless
        // The reference mentioned JPEG quality 1.
        // We'll offer PNG by default for lossless de-obfuscation.
        // If we use JPEG, artifacts will destroy the ability to de-obfuscate perfectly.
        
        const link = document.createElement('a');
        link.download = `obfuscated-${Date.now()}.png`;
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    });
});
