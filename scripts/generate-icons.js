const fs = require('fs');
const path = require('path');

// Для генерации иконок используем sharp, но сначала проверим его наличие
async function generateIcons() {
  try {
    const sharp = require('sharp');
    const inputPath = path.join(__dirname, '../public/logo12.png');
    const outputDir = path.join(__dirname, '../public');

    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

    console.log('Generating PWA icons...');

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${size}x${size} icon`);
    }

    // Создаем apple-touch-icon
    await sharp(inputPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon');

    // Создаем favicon
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    console.log('✓ Generated favicon-32x32');

    await sharp(inputPath)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
    console.log('✓ Generated favicon-16x16');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('Installing sharp...');
      require('child_process').execSync('npm install sharp --save-dev', { stdio: 'inherit' });
      console.log('Please run this script again.');
    } else {
      console.error('Error generating icons:', error);
    }
  }
}

generateIcons();
