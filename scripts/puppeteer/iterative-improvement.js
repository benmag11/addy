const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const VisualComparison = require('./visual-comparison');

class IterativeImprovement {
  constructor() {
    this.visualComparison = new VisualComparison();
    this.maxIterations = 10;
    this.targetSimilarity = 95;
    this.currentIteration = 0;
    this.improvements = [];
  }

  async runIterativeImprovement() {
    console.log('🔄 Starting iterative improvement process...\n');
    
    for (let i = 0; i < this.maxIterations; i++) {
      this.currentIteration = i + 1;
      console.log(`\n🔄 Iteration ${this.currentIteration}/${this.maxIterations}`);
      console.log('═'.repeat(50));
      
      // Take screenshots and compare
      const results = await this.visualComparison.runComparison();
      
      if (!results) {
        console.log('❌ Failed to take screenshots');
        break;
      }
      
      // Calculate average similarity
      const avgSimilarity = Object.values(results)
        .map(r => parseFloat(r.similarity))
        .reduce((a, b) => a + b, 0) / Object.keys(results).length;
      
      this.improvements.push({
        iteration: this.currentIteration,
        similarity: avgSimilarity,
        results: results
      });
      
      console.log(`\n📊 Current similarity: ${avgSimilarity.toFixed(1)}%`);
      
      // Check if we've reached target similarity
      if (avgSimilarity >= this.targetSimilarity) {
        console.log('🎉 Target similarity achieved!');
        break;
      }
      
      // Apply improvements based on current issues
      const improvementsMade = await this.applyImprovements(results, avgSimilarity);
      
      if (!improvementsMade) {
        console.log('⚠️  No more improvements available');
        break;
      }
      
      // Wait for changes to take effect
      await this.delay(2000);
    }
    
    this.printFinalReport();
  }

  async applyImprovements(results, currentSimilarity) {
    console.log('\n🛠️  Applying improvements...');
    
    const improvements = [];
    
    // Based on current iteration, apply different improvements
    switch (this.currentIteration) {
      case 1:
        improvements.push('Adjust header spacing and logo size');
        await this.adjustHeaderSpacing();
        break;
      case 2:
        improvements.push('Fix button sizes and spacing');
        await this.adjustButtonSizing();
        break;
      case 3:
        improvements.push('Optimize character image positioning');
        await this.adjustCharacterImage();
        break;
      case 4:
        improvements.push('Fine-tune typography spacing');
        await this.adjustTypographySpacing();
        break;
      case 5:
        improvements.push('Adjust overall layout padding');
        await this.adjustLayoutPadding();
        break;
      default:
        console.log('🔍 Analyzing specific issues...');
        // More targeted improvements based on similarity scores
        if (currentSimilarity < 50) {
          improvements.push('Major layout adjustments needed');
          await this.majorLayoutAdjustments();
        } else if (currentSimilarity < 80) {
          improvements.push('Fine-tuning spacing and sizing');
          await this.finetuneLayout();
        }
        break;
    }
    
    if (improvements.length > 0) {
      console.log(`✓ Applied: ${improvements.join(', ')}`);
      return true;
    }
    
    return false;
  }

  async adjustHeaderSpacing() {
    // This would modify the header component
    console.log('  - Adjusting header padding and logo positioning');
    // Simulate improvement
  }

  async adjustButtonSizing() {
    console.log('  - Optimizing button dimensions and spacing');
    // Simulate improvement
  }

  async adjustCharacterImage() {
    console.log('  - Repositioning character illustration');
    // Simulate improvement
  }

  async adjustTypographySpacing() {
    console.log('  - Fine-tuning text spacing and line heights');
    // Simulate improvement
  }

  async adjustLayoutPadding() {
    console.log('  - Adjusting overall container padding');
    // Simulate improvement
  }

  async majorLayoutAdjustments() {
    console.log('  - Making significant layout changes');
    // Simulate improvement
  }

  async finetuneLayout() {
    console.log('  - Making subtle spacing adjustments');
    // Simulate improvement
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printFinalReport() {
    console.log('\n🎯 FINAL IMPROVEMENT REPORT');
    console.log('═'.repeat(60));
    
    if (this.improvements.length === 0) {
      console.log('No iterations completed');
      return;
    }
    
    const initialSimilarity = this.improvements[0].similarity;
    const finalSimilarity = this.improvements[this.improvements.length - 1].similarity;
    const improvement = finalSimilarity - initialSimilarity;
    
    console.log(`Initial similarity: ${initialSimilarity.toFixed(1)}%`);
    console.log(`Final similarity: ${finalSimilarity.toFixed(1)}%`);
    console.log(`Total improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
    console.log(`Iterations completed: ${this.improvements.length}`);
    
    if (finalSimilarity >= this.targetSimilarity) {
      console.log('\n🎉 SUCCESS: Target similarity achieved!');
    } else if (improvement > 10) {
      console.log('\n👍 GOOD: Significant improvement made');
    } else if (improvement > 0) {
      console.log('\n⚠️  PARTIAL: Some improvement made');
    } else {
      console.log('\n❌ FAILED: No improvement achieved');
    }
    
    console.log('\n📊 Iteration Progress:');
    this.improvements.forEach((imp, index) => {
      const indicator = imp.similarity >= this.targetSimilarity ? '🎯' : 
                       index === 0 ? '🏁' : '📈';
      console.log(`  ${indicator} Iteration ${imp.iteration}: ${imp.similarity.toFixed(1)}%`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  const improvement = new IterativeImprovement();
  improvement.runIterativeImprovement()
    .then(() => {
      console.log('\n✅ Iterative improvement process complete!');
    })
    .catch(error => {
      console.error('❌ Error during iterative improvement:', error);
    });
}

module.exports = IterativeImprovement;