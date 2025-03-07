document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const imageInput = document.getElementById('imageInput');
    const workspace = document.getElementById('workspace');
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const maskOverlay = document.getElementById('maskOverlay');
    const sizeSlider = document.getElementById('sizeSlider');
    const opacitySlider = document.getElementById('opacitySlider');
    const sizeValue = document.getElementById('sizeValue');
    const opacityValue = document.getElementById('opacityValue');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const editor = document.getElementById('editor');
    const statusBar = document.querySelector('.status-bar-field');
    const logo = document.querySelector('.logo');

    // Add hover effect to all logo letters
    const allLogoSpans = logo.querySelectorAll('span');
    allLogoSpans.forEach(span => {
        span.addEventListener('mouseover', () => {
            span.style.transform = 'rotate(5deg) scale(1.2)';
        });
        span.addEventListener('mouseout', () => {
            span.style.transform = 'rotate(-5deg)';
        });
    });

    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    // Ensure mask image is loaded
    maskOverlay.src = 'retardio-mask.png';
    maskOverlay.style.display = 'none';

    maskOverlay.onload = () => {
        maskOverlay.style.display = 'block';
    };

    maskOverlay.onerror = () => {
        statusBar.textContent = 'Error loading mask image!';
    };

    // Handle drag and drop
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        statusBar.textContent = 'Drop image here!';
        document.body.classList.add('drag-over');
    });

    document.body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        statusBar.textContent = 'Drop image or click Upload';
        document.body.classList.remove('drag-over');
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.remove('drag-over');
        statusBar.textContent = 'Processing image...';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImage(file);
        } else {
            statusBar.textContent = 'Please drop an image file!';
        }
    });

    // Handle image upload
    uploadBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            statusBar.textContent = 'Processing image...';
            handleImage(file);
        }
    });

    function handleImage(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Calculate size to fit in viewport while maintaining aspect ratio
                const maxWidth = Math.min(800, window.innerWidth - 100);
                const maxHeight = Math.min(600, window.innerHeight - 300);
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                workspace.style.display = 'block';
                // Add visible class after a brief delay to trigger transition
                setTimeout(() => workspace.classList.add('visible'), 50);
                resetMaskPosition();
                statusBar.textContent = 'Drag the mask to position it!';
            };
            img.onerror = () => {
                statusBar.textContent = 'Error loading image. Please try another.';
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            statusBar.textContent = 'Error reading file. Please try again.';
        };
        reader.readAsDataURL(file);
    }

    // Handle mask dragging
    maskOverlay.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mouseleave', dragEnd);

    function dragStart(e) {
        if (e.button !== 0) return; // Only left click
        isDragging = true;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        maskOverlay.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const editorRect = editor.getBoundingClientRect();
        currentX = Math.min(Math.max(e.clientX - initialX, -maskOverlay.offsetWidth/2), editorRect.width - maskOverlay.offsetWidth/2);
        currentY = Math.min(Math.max(e.clientY - initialY, -maskOverlay.offsetHeight/2), editorRect.height - maskOverlay.offsetHeight/2);
        
        setMaskPosition(currentX, currentY);
    }

    function dragEnd() {
        isDragging = false;
        maskOverlay.style.cursor = 'move';
    }

    function setMaskPosition(x, y) {
        maskOverlay.style.transform = `translate(${x}px, ${y}px)`;
    }

    function resetMaskPosition() {
        const editorRect = editor.getBoundingClientRect();
        currentX = (editorRect.width - maskOverlay.offsetWidth) / 2;
        currentY = (editorRect.height - maskOverlay.offsetHeight) / 2;
        setMaskPosition(currentX, currentY);
        sizeSlider.value = 200;
        opacitySlider.value = 100;
        updateMaskSize();
        updateMaskOpacity();
    }

    // Handle mask resizing
    sizeSlider.addEventListener('input', updateMaskSize);
    function updateMaskSize() {
        const size = sizeSlider.value;
        maskOverlay.style.width = `${size}px`;
        sizeValue.textContent = `${size}px`;
    }

    // Handle mask opacity
    opacitySlider.addEventListener('input', updateMaskOpacity);
    function updateMaskOpacity() {
        const opacity = opacitySlider.value;
        maskOverlay.style.opacity = opacity / 100;
        opacityValue.textContent = `${opacity}%`;
    }

    // Reset mask position and properties
    resetBtn.addEventListener('click', resetMaskPosition);

    // Handle final image download
    downloadBtn.addEventListener('click', () => {
        statusBar.textContent = 'Preparing download...';
        
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
        const finalCtx = finalCanvas.getContext('2d');

        // Draw original image
        finalCtx.drawImage(canvas, 0, 0);

        // Draw mask at current position and size
        const maskRect = maskOverlay.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        finalCtx.globalAlpha = maskOverlay.style.opacity;
        finalCtx.drawImage(
            maskOverlay,
            maskRect.left - canvasRect.left,
            maskRect.top - canvasRect.top,
            maskOverlay.offsetWidth,
            maskOverlay.offsetHeight
        );

        try {
            // Create download link
            const link = document.createElement('a');
            link.download = 'retardio-masked-image.png';
            link.href = finalCanvas.toDataURL('image/png');
            link.click();
            statusBar.textContent = 'Image downloaded successfully!';
        } catch (error) {
            statusBar.textContent = 'Error saving image. Please try again.';
        }
    });
});