const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const logoPath = path.join(publicDir, 'logo.png')

if (!fs.existsSync(logoPath)) {
  console.log('No logo.png found, skipping icon generation')
  process.exit(0)
}

async function generate() {
  for (const size of [192, 512]) {
    const buffer = await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 9, g: 9, b: 11, alpha: 1 } })
      .png()
      .toBuffer()
    fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), buffer)
    console.log(`Generated icon-${size}.png`)
  }
}

generate().catch((e) => {
  console.error(e)
  process.exit(1)
})
