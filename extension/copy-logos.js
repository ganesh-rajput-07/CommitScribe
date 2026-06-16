const fs = require('fs');
const path = require('path');

const srcDark = '/home/tusharhedange/.gemini/antigravity/brain/7e53eb48-8a4f-4b4d-a572-da0205c42211/logo_dark_wireframe_1781249642407.png';
const srcLight = '/home/tusharhedange/.gemini/antigravity/brain/7e53eb48-8a4f-4b4d-a572-da0205c42211/logo_light_wireframe_1781249655621.png';

const destDark = path.join(__dirname, 'logo_dark.png');
const destLight = path.join(__dirname, 'logo_light.png');

try {
    if (fs.existsSync(srcDark)) {
        fs.copyFileSync(srcDark, destDark);
        console.log('Copied logo_dark.png');
    }
    if (fs.existsSync(srcLight)) {
        fs.copyFileSync(srcLight, destLight);
        console.log('Copied logo_light.png');
    }
} catch (e) {
    console.error('Failed to copy logos:', e.message);
}
