const fs = require('fs');
const https = require('https');
const path = require('path');

const LOGO_URL = "https://scontent.fbfh15-1.fna.fbcdn.net/v/t39.30808-6/553847420_122119716686977479_5765612005474135840_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGYoc5isZ54tqRS9amnP5SCrZ2LrwbPbzetnYuvBs9vN1G5RcQEGZRDdeCL9Q99nvGeMO_CB1dFMf07RkNxEJTE&_nc_ohc=hcHJayRqLZ4Q7kNvwEPwg3T&_nc_oc=AdlpVEklIt7p0ps6yE1IGlHMOcxHdaXJvYQaG3QYos4E_VYesJEuk2vVH1l8uSHny-KqJTyQlfy6VoKp3_kP54OU&_nc_zt=23&_nc_ht=scontent.fbfh15-1.fna&_nc_gid=oFWMehzimRYe6j488AFUpA&oh=00_AfgFXpSoIwMCbAqJFqThZeoRNbaCVMVezlapdk23SbxRmA&oe=6927E03A";

const FILES = [
    { name: 'icon-192x192.png', dest: 'public/icons/icon-192x192.png' },
    { name: 'icon-512x512.png', dest: 'public/icons/icon-512x512.png' },
    { name: 'favicon.ico', dest: 'public/favicon.ico' }
];

// Ensure directory exists
if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
}

function downloadFile(url, dest) {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Failed to download: ${response.statusCode}`);
            return;
        }
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`✅ Downloaded ${dest}`);
        });
    }).on('error', (err) => {
        fs.unlink(dest);
        console.error(`Error downloading ${dest}: ${err.message}`);
    });
}

console.log("🔄 Fixing assets...");
FILES.forEach(f => downloadFile(LOGO_URL, f.dest));
