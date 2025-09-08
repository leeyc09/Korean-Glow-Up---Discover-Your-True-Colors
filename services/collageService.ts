interface CollageOptions {
    userImageSrc: string;
    celebrityImageSrc: string;
    transformedImageSrc: string | null;
    season: string;
    celebrityName: string;
    celebrityDescription: string;
}

/**
 * Loads an image from a given source URL.
 * It handles both data URLs and external URLs, using fetch for external ones
 * to reliably handle CORS for canvas operations.
 * @param src The source URL of the image.
 * @returns A promise that resolves with the loaded HTMLImageElement.
 */
const loadImage = async (src: string): Promise<HTMLImageElement> => {
    // Data URLs can be loaded directly.
    if (src.startsWith('data:')) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => {
                console.error("Failed to load data URL image:", src, err);
                reject(new Error(`Failed to load data URL image: ${src}`));
            };
            img.src = src;
        });
    }

    // For external URLs, use fetch to get a blob, then create an object URL.
    // This is more reliable for CORS and avoids tainting the canvas.
    try {
        const response = await fetch(src, { mode: 'cors' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(objectURL); // Clean up memory
                resolve(img);
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(objectURL); // Clean up memory
                console.error("Failed to load image from object URL:", src, err);
                reject(new Error(`Failed to load image from object URL: ${src}`));
            };
            img.src = objectURL;
        });
    } catch (error) {
        console.error("Failed to fetch or process image:", src, error);
        throw new Error(`Failed to fetch or process image: ${src}`);
    }
};

/**
 * Wraps and draws text on a canvas context.
 * @param context The canvas rendering context.
 * @param text The text to wrap.
 * @param x The starting x-coordinate.
 * @param y The starting y-coordinate.
 * @param maxWidth The maximum width of a line.
 * @param lineHeight The height of each line.
 */
function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

/**
 * Generates a collage image as a Blob from the provided data.
 * @param options The data required to build the collage.
 * @returns A promise that resolves with the generated image Blob, or null if failed.
 */
export const generateCollageBlob = async (options: CollageOptions): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Standard story dimensions
    canvas.width = 1080;
    canvas.height = 1920;

    // Background
    ctx.fillStyle = '#f9fafb'; // gray-50
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load all necessary images in parallel
    const [userImg, transformedImg, celebrityImg] = await Promise.all([
        loadImage(options.userImageSrc),
        options.transformedImageSrc ? loadImage(options.transformedImageSrc) : Promise.resolve(null),
        loadImage(options.celebrityImageSrc)
    ]);

    // --- Drawing starts here ---

    // Main Title
    ctx.font = 'bold 72px sans-serif';
    ctx.fillStyle = '#111827'; // gray-900
    ctx.textAlign = 'center';
    ctx.fillText('My Color Analysis', canvas.width / 2, 140);

    // Season Subtitle
    ctx.font = '52px sans-serif';
    ctx.fillStyle = '#4f46e5'; // indigo-600
    ctx.fillText(`My Season: ${options.season}`, canvas.width / 2, 230);
    
    // User Images Section
    const hasTransformation = !!transformedImg;
    const imagesYPos = 320;
    if (hasTransformation) {
        // Display Before and After images side-by-side
        const imgWidth = 480;
        const imgHeight = 640;
        const gap = 40;
        const startX = (canvas.width - (imgWidth * 2 + gap)) / 2;

        ctx.drawImage(userImg, startX, imagesYPos, imgWidth, imgHeight);
        ctx.drawImage(transformedImg, startX + imgWidth + gap, imagesYPos, imgWidth, imgHeight);

        ctx.font = '36px sans-serif';
        ctx.fillStyle = '#374151'; // gray-700
        ctx.fillText('Before', startX + imgWidth / 2, imagesYPos + imgHeight + 60);
        ctx.fillText('K-Beauty Style', startX + imgWidth + gap + imgWidth / 2, imagesYPos + imgHeight + 60);
    } else {
        // Display only the user's selfie, centered
        const imgWidth = 550;
        const imgHeight = 733;
        const xPos = (canvas.width - imgWidth) / 2;
        ctx.drawImage(userImg, xPos, imagesYPos, imgWidth, imgHeight);

        ctx.font = '36px sans-serif';
        ctx.fillStyle = '#374151';
        ctx.fillText('My Selfie', canvas.width / 2, imagesYPos + imgHeight + 60);
    }

    // K-Celebrity Match Section
    const celebYStart = hasTransformation ? 1080 : 1150;
    ctx.font = 'bold 56px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText('K-Celebrity Match', canvas.width / 2, celebYStart);

    const celebImgSize = 380;
    const celebImgX = (canvas.width - celebImgSize) / 2;
    const celebImgY = celebYStart + 80;

    // Draw celebrity image in a circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(celebImgX + celebImgSize / 2, celebImgY + celebImgSize / 2, celebImgSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(celebrityImg, celebImgX, celebImgY, celebImgSize, celebImgSize);
    ctx.restore();

    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.fillText(options.celebrityName, canvas.width / 2, celebImgY + celebImgSize + 90);

    ctx.font = 'italic 36px sans-serif';
    ctx.fillStyle = '#4b5563'; // gray-600
    wrapText(ctx, `"${options.celebrityDescription}"`, canvas.width / 2, celebImgY + celebImgSize + 150, 800, 48);

    // Footer
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.fillText('Korean Glow-Up', canvas.width / 2, canvas.height - 60);

    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.95);
    });
};