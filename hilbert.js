// hilbert.js

class Hilbert {
    constructor(order) {
        this.n = 1 << order;
        this.totalPoints = this.n * this.n;
    }

    xy2d(x, y) {
        let rx, ry, s, d = 0;
        for (s = this.n / 2; s > 0; s /= 2) {
            rx = (x & s) > 0 ? 1 : 0;
            ry = (y & s) > 0 ? 1 : 0;
            d += s * s * ((3 * rx) ^ ry);
            [x, y] = this.rot(s, x, y, rx, ry);
        }
        return d;
    }

    d2xy(d) {
        let rx, ry, s, t = d;
        let x = 0;
        let y = 0;
        for (s = 1; s < this.n; s *= 2) {
            rx = 1 & (t / 2);
            ry = 1 & (t ^ rx);
            [x, y] = this.rot(s, x, y, rx, ry);
            x += s * rx;
            y += s * ry;
            t /= 4;
        }
        return [x, y];
    }

    rot(n, x, y, rx, ry) {
        if (ry === 0) {
            if (rx === 1) {
                x = n - 1 - x;
                y = n - 1 - y;
            }
            return [y, x];
        }
        return [x, y];
    }
}

// Pseudo-Random Number Generator
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

class ImageScrambler {
    constructor() {
        this.hilbert = null;
    }

    // Get ordered list of valid coordinates in the image along the Hilbert curve
    getHilbertPath(width, height) {
        const maxDim = Math.max(width, height);
        const order = Math.ceil(Math.log2(maxDim));
        const hilbert = new Hilbert(order);
        const n2 = hilbert.n * hilbert.n;
        
        // This can be memory intensive for large images.
        // We optimize by storing flat indices: y * width + x
        const path = new Uint32Array(width * height);
        let ptr = 0;

        // Iterate through Hilbert curve points
        // Optimization: Use iterative generation to avoid d2xy overhead if possible?
        // d2xy is O(log N). Total O(N^2 log N).
        // For 4096^2, log N = 12. 16M * 12 ops is fine.
        
        for (let d = 0; d < n2; d++) {
            const [x, y] = hilbert.d2xy(d);
            if (x < width && y < height) {
                path[ptr++] = y * width + x;
            }
        }
        return path;
    }

    // Scramble logic
    async scramble(imageData, key, iterations, mode = 'encrypt') {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = new Uint32Array(imageData.data.buffer); // View as 32-bit pixels (ABGR)
        
        // 1. Generate Hilbert Path
        const path = this.getHilbertPath(width, height);
        
        // 2. Generate Permutation based on Key
        // Simple hash of key string to seed
        let seed = 0;
        for (let i = 0; i < key.length; i++) {
            seed = (seed + key.charCodeAt(i) * (i + 1)) | 0; // Simple hash
        }
        
        // We want a permutation of indices [0, ..., path.length - 1]
        // Strategy: "Sort by Random" is robust and easy to implement
        // To support iterations, we apply it multiple times (or just change seed)
        // For 'decrypt', we need the inverse permutation.
        
        // Let's generate a permutation map P where P[i] is the new position of the pixel at i
        // Or P[i] is the source index for position i?
        // Let's say dest[i] = src[P[i]].
        // To decrypt: src[P[i]] = dest[i] => src[j] = dest[P^-1[j]]
        
        const L = path.length;
        const P = new Uint32Array(L);
        for(let i=0; i<L; i++) P[i] = i;

        const prng = mulberry32(seed + 12345); // Seeded PRNG

        // Fisher-Yates Shuffle to generate permutation P
        // We only need to run this once to get a random permutation.
        // But for "Sort by Random", we generate random values and sort indices.
        // Fisher-Yates is O(N) but hard to invert unless we store the swaps.
        // "Sort by Random" is O(N log N) but easy to invert (just invert the P map).
        
        // Let's use Sort by Random.
        // Generate random keys
        const keys = new Float64Array(L);
        for(let i=0; i<L; i++) keys[i] = prng();
        
        // Sort indices based on keys
        // We sort P array based on values in keys
        P.sort((a, b) => keys[a] - keys[b]);
        
        // Now P holds the permutation.
        // encrypt: new_path_index[i] = path[P[i]] (Wait, this permutes the ORDER)
        
        // Let's clarify:
        // We have pixels in Hilbert order: H_pixels = [pixel(path[0]), pixel(path[1]), ...]
        // We want to shuffle this array to Scrambled_H_pixels.
        // Scrambled_H_pixels[i] = H_pixels[P[i]]
        // Then write back: pixel(path[i]) = Scrambled_H_pixels[i]
        //
        // Decrypt:
        // Read pixels: Scrambled_H_pixels[i] = pixel(path[i])
        // Reverse shuffle: H_pixels[P[i]] = Scrambled_H_pixels[i] 
        //                 => H_pixels[j] = Scrambled_H_pixels[P_inv[j]]
        // Write back: pixel(path[j]) = H_pixels[j]
        
        // Calculate Inverse Permutation for decrypt
        let map = P;
        if (mode === 'decrypt') {
            const P_inv = new Uint32Array(L);
            for(let i=0; i<L; i++) P_inv[P[i]] = i;
            map = P_inv;
        }

        // 3. Apply Permutation
        const newPixels = new Uint32Array(L);
        
        // Read original pixels in Hilbert order
        const hilbertPixels = new Uint32Array(L);
        for(let i=0; i<L; i++) {
            hilbertPixels[i] = pixels[path[i]];
        }
        
        // Permute
        if (mode === 'encrypt') {
             for(let i=0; i<L; i++) {
                 newPixels[i] = hilbertPixels[map[i]];
             }
        } else {
             // For decrypt, we are reversing the operation:
             // encrypted[i] = original[P[i]]
             // we have encrypted, want original.
             // original[P[i]] = encrypted[i] -> original[j] = encrypted[P_inv[j]]
             // So:
             for(let i=0; i<L; i++) {
                 newPixels[i] = hilbertPixels[map[i]];
             }
        }
        
        // Wait, my logic above:
        // Encrypt: dest[i] = src[P[i]]
        // Decrypt: dest[i] = src[P_inv[i]]
        // Yes, that's correct.
        
        // 4. Write back to image
        // We write the new pixels back to the SAME Hilbert path positions?
        // Or just fill the image line by line?
        // If we write back to Hilbert path, we preserve the "Hilbert Scramble" effect.
        // If we write linearly, we add another layer of scrambling (Hilbert -> Linear).
        // The reference says "Based on Hilbert Curve", usually implies the data is treated as a Hilbert stream.
        // Let's write back to the Hilbert path locations to keep the spatial property meaningful?
        // Actually, if we just shuffle the stream and write back to the stream, the spatial locality of the *source* is lost.
        // But if P is a "local" shuffle, it's preserved.
        // Our P is global random (Maximum Chaos).
        // If the user wants "Compression Resistance", maybe we should use a simpler P?
        // But the user asked for "Rich functionality".
        // Let's stick to global shuffle for now.
        
        // Optimization: Write directly to pixels array
        for(let i=0; i<L; i++) {
            pixels[path[i]] = newPixels[i];
        }
        
        return imageData;
    }
}
