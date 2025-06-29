const VisualComparison = require('./visual-comparison');
const fs = require('fs');
const path = require('path');

class AutoImprove {
  constructor() {
    this.visualComparison = new VisualComparison();
    this.iterations = 0;
    this.maxIterations = 5;
  }

  async runAutoImprovement() {
    console.log('🚀 Starting automated improvement process...\n');
    
    for (let i = 0; i < this.maxIterations; i++) {
      this.iterations = i + 1;
      console.log(`\n🔄 Iteration ${this.iterations}/${this.maxIterations}`);
      console.log('═'.repeat(50));
      
      // Take screenshots
      const results = await this.visualComparison.runComparison();
      
      if (!results) {
        console.log('❌ Failed to take screenshots');
        break;
      }
      
      // Wait a moment for any changes to take effect
      await this.delay(1000);
      
      console.log(`✓ Iteration ${this.iterations} complete`);
    }
    
    console.log('\n🎯 Auto-improvement process complete!');
    console.log('📁 Check screenshots/ directory for latest captures');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Add script to package.json
if (require.main === module) {
  const autoImprove = new AutoImprove();
  autoImprove.runAutoImprovement()
    .then(() => {
      console.log('✅ Process finished successfully');
    })
    .catch(error => {
      console.error('❌ Error:', error);
    });
}

module.exports = AutoImprove;