document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const originalPreview = document.getElementById('original-preview');
    const previewContainer = document.getElementById('preview-container');
    const resultCanvas = document.getElementById('result-canvas');
    const resultContainer = document.getElementById('result-container');
    const resultPlaceholder = document.getElementById('result-placeholder');
    
    const encryptBtn = document.getElementById('encrypt-btn');
    const decryptBtn = document.getElementById('decrypt-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const downloadBtn = document.getElementById('download-btn');
    const downloadActions = document.getElementById('download-actions');
    const loading = document.getElementById('loading');

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
            alert('请上传有效的图片文件。');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                originalPreview.src = e.target.result;
                previewContainer.classList.remove('hidden');
                
                // Set initial canvas size and draw image
                resultCanvas.width = img.width;
                resultCanvas.height = img.height;
                const ctx = resultCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Show result canvas
                resultCanvas.classList.remove('hidden');
                resultPlaceholder.classList.add('hidden');
                downloadActions.classList.remove('hidden');
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

    const processImage = async (action) => {
        if (!originalImage) {
            alert('请先上传图片。');
            return;
        }

        // UI Loading State
        loading.classList.remove('hidden');
        const buttons = [encryptBtn, decryptBtn, restoreBtn, downloadBtn];
        buttons.forEach(btn => btn.disabled = true);

        // Use requestAnimationFrame/setTimeout to allow UI to update
        // Double rAF to ensure paint happens
        requestAnimationFrame(() => {
            requestAnimationFrame(async () => {
                try {
                    // We process what is currently on the result canvas
                    // Or do we always process the original image?
                    // The reference implementation operates on the currently displayed image (img).
                    // "img" in reference is the display element.
                    // Here we use resultCanvas as the source of truth for current state?
                    // No, let's use the resultCanvas as the image source.
                    
                    // Create a temporary image from canvas to pass to processor
                    // Or pass canvas directly. Our processor takes (img, canvas).
                    
                    const tempImg = new Image();
                    tempImg.src = resultCanvas.toDataURL();
                    
                    await new Promise(r => tempImg.onload = r);

                    if (action === 'encrypt') {
                        await ImageProcessor.encrypt(tempImg, resultCanvas);
                    } else if (action === 'decrypt') {
                        await ImageProcessor.decrypt(tempImg, resultCanvas);
                    } else if (action === 'restore') {
                        // Restore to original
                        const ctx = resultCanvas.getContext('2d');
                        resultCanvas.width = originalImage.width;
                        resultCanvas.height = originalImage.height;
                        ctx.drawImage(originalImage, 0, 0);
                    }

                } catch (err) {
                    console.error(err);
                    alert('处理过程中发生错误: ' + err.message);
                } finally {
                    loading.classList.add('hidden');
                    buttons.forEach(btn => btn.disabled = false);
                }
            });
        });
    };

    encryptBtn.addEventListener('click', () => processImage('encrypt'));
    decryptBtn.addEventListener('click', () => processImage('decrypt'));
    
    restoreBtn.addEventListener('click', () => {
        if (!originalImage) return;
        processImage('restore');
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        if (!resultCanvas) return;
        
        // Use JPEG quality 1.0 as per reference (reference says quality 1)
        const link = document.createElement('a');
        link.download = `processed_image.jpg`;
        link.href = resultCanvas.toDataURL('image/jpeg', 1.0);
        link.click();
    });
});
