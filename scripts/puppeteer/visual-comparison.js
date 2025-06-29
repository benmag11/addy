const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VisualComparison {
  constructor() {
    this.screenshotsDir = path.join(__dirname, '../../screenshots');
    this.targetDir = path.join(__dirname, '../../target-screenshots');
    this.diffDir = path.join(__dirname, '../../diff-screenshots');
    this.browser = null;
    this.page = null;
    
    // Ensure directories exist
    [this.screenshotsDir, this.targetDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async init() {
    this.browser = await puppeteer.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async takeScreenshots(url = 'http://localhost:3000') {
    console.log('🔄 Taking screenshots at different breakpoints...');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'laptop', width: 1024, height: 768 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    await this.page.goto(url, { waitUntil: 'networkidle2' });

    const screenshots = {};
    
    for (const viewport of viewports) {
      await this.page.setViewport(viewport);
      
      const screenshotPath = path.join(this.screenshotsDir, `current-${viewport.name}.png`);
      await this.page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      screenshots[viewport.name] = screenshotPath;
      console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height}) screenshot saved`);
    }

    return screenshots;
  }

  async compareWithTarget(viewportName) {
    const currentPath = path.join(this.screenshotsDir, `current-${viewportName}.png`);
    const targetPath = path.join(this.targetDir, `target-${viewportName}.png`);
    
    if (!fs.existsSync(targetPath)) {
      console.log(`⚠️  No target screenshot found for ${viewportName}`);
      return { similarity: 0, message: 'No target image' };
    }

    // Basic file size comparison (simple heuristic)
    const currentStats = fs.statSync(currentPath);
    const targetStats = fs.statSync(targetPath);
    
    const sizeDiff = Math.abs(currentStats.size - targetStats.size) / targetStats.size;
    const similarity = Math.max(0, (1 - sizeDiff) * 100);
    
    console.log(`📊 ${viewportName}: ${similarity.toFixed(1)}% similar (file size comparison)`);
    
    return { 
      similarity: similarity.toFixed(1),
      message: `File size difference: ${(sizeDiff * 100).toFixed(1)}%`
    };
  }

  async runComparison() {
    console.log('🚀 Starting visual comparison process...\n');
    
    try {
      await this.init();
      const screenshots = await this.takeScreenshots();
      
      console.log('\n📋 Comparison Results:');
      console.log('═'.repeat(50));
      
      const results = {};
      for (const [viewport, screenshotPath] of Object.entries(screenshots)) {
        const comparison = await this.compareWithTarget(viewport);
        results[viewport] = comparison;
      }
      
      console.log('\n🎯 Overall Assessment:');
      const avgSimilarity = Object.values(results)
        .map(r => parseFloat(r.similarity))
        .reduce((a, b) => a + b, 0) / Object.keys(results).length;
      
      console.log(`Average similarity: ${avgSimilarity.toFixed(1)}%`);
      
      if (avgSimilarity > 95) {
        console.log('🎉 Excellent match! Design is very close to target.');
      } else if (avgSimilarity > 80) {
        console.log('👍 Good match! Minor adjustments needed.');
      } else if (avgSimilarity > 60) {
        console.log('⚠️  Moderate match. Significant adjustments needed.');
      } else {
        console.log('❌ Poor match. Major redesign required.');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Error during comparison:', error.message);
      return null;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const comparison = new VisualComparison();
  comparison.runComparison()
    .then(results => {
      if (results) {
        console.log('\n✅ Comparison complete!');
        console.log('📁 Screenshots saved to screenshots/ directory');
      }
    })
    .catch(console.error);
}

module.exports = VisualComparison;