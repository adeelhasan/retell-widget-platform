#!/usr/bin/env node

/**
 * Continuous Widget Testing and Auto-Fix Loop
 * 
 * This script runs the widget tester in a loop, analyzes failures,
 * and can trigger fixes automatically.
 */

const WidgetTester = require('./test-widget.js');
const fs = require('fs');
const path = require('path');

class ContinuousTester {
  constructor() {
    this.maxAttempts = 5;
    this.delayBetweenTests = 10000; // 10 seconds
    this.fixes = [];
  }

  async runTestLoop() {
    console.log('🔄 Starting Continuous Widget Testing Loop...');
    console.log(`Max attempts: ${this.maxAttempts}`);
    console.log(`Delay between tests: ${this.delayBetweenTests}ms\n`);

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      console.log(`\n🧪 === TEST ATTEMPT ${attempt}/${this.maxAttempts} ===`);
      
      try {
        const tester = new WidgetTester();
        const results = await tester.runFullTest();
        
        // Check if test passed
        const success = results.pageLoaded && results.widgetFound && results.sdkLoaded;
        
        if (success) {
          console.log(`\n🎉 SUCCESS! Widget is working correctly after ${attempt} attempt(s)`);
          return true;
        }
        
        // Analyze failures and suggest fixes
        console.log(`\n🔍 Analyzing failures for attempt ${attempt}...`);
        await this.analyzeFalures(results, attempt);
        
        if (attempt < this.maxAttempts) {
          console.log(`\n⏳ Waiting ${this.delayBetweenTests/1000}s before next test...`);
          await this.sleep(this.delayBetweenTests);
        }
        
      } catch (error) {
        console.error(`❌ Test attempt ${attempt} crashed:`, error);
      }
    }
    
    console.log(`\n💥 All ${this.maxAttempts} attempts failed. Widget needs manual intervention.`);
    await this.generateFailureReport();
    return false;
  }

  async analyzeFalures(results, attempt) {
    const issues = [];
    
    if (!results.pageLoaded) {
      issues.push('Page failed to load - check server status');
    }
    
    if (!results.widgetFound) {
      issues.push('Widget not found - check embed code and widget.js');
    }
    
    if (!results.sdkLoaded) {
      issues.push('SDK failed to load - check SDK URLs and network');
      
      // Auto-suggest SDK URL fixes
      const sdkErrors = results.errors.filter(e => e.includes('SDK'));
      if (sdkErrors.length > 0) {
        console.log('\n🔧 Suggesting SDK URL fixes...');
        this.suggestSDKFixes();
      }
    }
    
    if (results.networkErrors.length > 0) {
      issues.push('Network errors detected - check connectivity and CORS');
    }
    
    console.log(`\n📋 Issues found in attempt ${attempt}:`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    
    // Save progress
    this.fixes.push({
      attempt,
      issues,
      errors: results.errors,
      networkErrors: results.networkErrors,
      timestamp: new Date().toISOString()
    });
  }

  suggestSDKFixes() {
    const suggestions = [
      'Try using a different SDK version: @2.0.6 instead of @2.0.7',
      'Switch to jsdelivr CDN: https://cdn.jsdelivr.net/npm/retell-client-js-sdk',
      'Use the ES module version: index.modern.mjs instead of index.umd.js',
      'Add crossorigin="anonymous" attribute to script tag',
      'Check if SDK package exists on NPM registry'
    ];
    
    console.log('💡 SDK Fix Suggestions:');
    suggestions.forEach((suggestion, i) => {
      console.log(`  ${i + 1}. ${suggestion}`);
    });
  }

  async generateFailureReport() {
    const report = {
      summary: 'Continuous testing failed after multiple attempts',
      totalAttempts: this.maxAttempts,
      fixes: this.fixes,
      recommendations: [
        'Check server logs for errors',
        'Verify all dependencies are installed',
        'Test widget URLs manually in browser',
        'Check network connectivity and firewall settings',
        'Review recent code changes for regressions'
      ],
      generatedAt: new Date().toISOString()
    };
    
    const reportPath = path.join(__dirname, '..', 'continuous-test-failure.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📁 Failure report saved to: ${reportPath}`);
    console.log('\n🚨 Manual intervention required. Check the report for details.');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI usage
if (require.main === module) {
  const tester = new ContinuousTester();
  
  tester.runTestLoop()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Continuous testing crashed:', error);
      process.exit(1);
    });
}

module.exports = ContinuousTester;