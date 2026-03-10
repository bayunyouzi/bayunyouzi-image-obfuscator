// hilbert.js

// Generalized Hilbert ('gilbert') space-filling curve for arbitrary-sized 2D rectangular grids.
// Based on the provided implementation.

function gilbert2d(width, height) {
    /**
     * Generalized Hilbert ('gilbert') space-filling curve for arbitrary-sized
     * 2D rectangular grids. Generates discrete 2D coordinates to fill a rectangle
     * of size (width x height).
     */
    const coordinates = [];
    if (width >= height) {
        generate2d(0, 0, width, 0, 0, height, coordinates);
    } else {
        generate2d(0, 0, 0, height, width, 0, coordinates);
    }
    return coordinates;
}

function generate2d(x, y, ax, ay, bx, by, coordinates) {
    const w = Math.abs(ax + ay);
    const h = Math.abs(bx + by);
    const dax = Math.sign(ax), day = Math.sign(ay); // unit major direction
    const dbx = Math.sign(bx), dby = Math.sign(by); // unit orthogonal direction
    
    if (h === 1) {
        // trivial row fill
        for (let i = 0; i < w; i++) {
            coordinates.push([x, y]);
            x += dax;
            y += day;
        }
        return;
    }
    if (w === 1) {
        // trivial column fill
        for (let i = 0; i < h; i++) {
            coordinates.push([x, y]);
            x += dbx;
            y += dby;
        }
        return;
    }
    
    let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2);
    let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2);
    const w2 = Math.abs(ax2 + ay2);
    const h2 = Math.abs(bx2 + by2);
    
    if (2 * w > 3 * h) {
        if ((w2 % 2) && (w > 2)) {
            // prefer even steps
            ax2 += dax;
            ay2 += day;
        }
        // long case: split in two parts only
        generate2d(x, y, ax2, ay2, bx, by, coordinates);
        generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by, coordinates);
    } else {
        if ((h2 % 2) && (h > 2)) {
            // prefer even steps
            bx2 += dbx;
            by2 += dby;
        }
        // standard case: one step up, one long horizontal, one step down
        generate2d(x, y, bx2, by2, ax2, ay2, coordinates);
        generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2, coordinates);
        generate2d(x + (ax - dax) + (bx2 - dbx), y + (ay - day) + (by2 - dby),
            -bx2, -by2, -(ax - ax2), -(ay - ay2), coordinates);
    }
}

// Image processing functions
const ImageProcessor = {
    // Encrypt (Obfuscate)
    encrypt: (img, canvas) => {
        return new Promise((resolve) => {
            const width = canvas.width = img.width;
            const height = canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            
            const imgdata = ctx.getImageData(0, 0, width, height);
            const imgdata2 = new ImageData(width, height);
            
            const curve = gilbert2d(width, height);
            const offset = Math.round((Math.sqrt(5) - 1) / 2 * width * height);
            
            for(let i = 0; i < width * height; i++){
                const old_pos = curve[i];
                // New position logic from reference
                const new_pos = curve[(i + offset) % (width * height)];
                
                // Calculate pixel indices
                const old_p = 4 * (old_pos[0] + old_pos[1] * width);
                const new_p = 4 * (new_pos[0] + new_pos[1] * width);
                
                // Copy pixel data (R, G, B, A)
                // Reference copies FROM old_pos TO new_pos
                // Wait, reference code:
                // const old_pos = curve[i]
                // const new_pos = curve[(i + offset) % (width * height)]
                // const old_p = 4 * (old_pos[0] + old_pos[1] * width)
                // const new_p = 4 * (new_pos[0] + new_pos[1] * width)
                // imgdata2.data.set(imgdata.data.slice(old_p, old_p + 4), new_p)
                //
                // This means: Destination[new_pos] = Source[old_pos]
                
                // Using TypedArray set for speed
                for(let j=0; j<4; j++) {
                    imgdata2.data[new_p + j] = imgdata.data[old_p + j];
                }
            }
            
            ctx.putImageData(imgdata2, 0, 0);
            resolve();
        });
    },

    // Decrypt (De-obfuscate)
    decrypt: (img, canvas) => {
        return new Promise((resolve) => {
            const width = canvas.width = img.width;
            const height = canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            
            const imgdata = ctx.getImageData(0, 0, width, height);
            const imgdata2 = new ImageData(width, height);
            
            const curve = gilbert2d(width, height);
            const offset = Math.round((Math.sqrt(5) - 1) / 2 * width * height);
            
            for(let i = 0; i < width * height; i++){
                const old_pos = curve[i];
                const new_pos = curve[(i + offset) % (width * height)];
                
                const old_p = 4 * (old_pos[0] + old_pos[1] * width);
                const new_p = 4 * (new_pos[0] + new_pos[1] * width);
                
                // Reference code:
                // imgdata2.data.set(imgdata.data.slice(new_p, new_p + 4), old_p)
                // This means: Destination[old_pos] = Source[new_pos]
                // This is the inverse operation.
                
                for(let j=0; j<4; j++) {
                    imgdata2.data[old_p + j] = imgdata.data[new_p + j];
                }
            }
            
            ctx.putImageData(imgdata2, 0, 0);
            resolve();
        });
    }
};
