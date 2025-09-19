#!/usr/bin/env node

/**
 * Automated Widget Testing and Debugging Script
 * 
 * This script:
 * 1. Opens the widget test page in a headless browser
 * 2. Monitors console logs and errors in real-time
 * 3. Tests widget functionality automatically
 * 4. Reports issues and suggests fixes
 * 5. Can be run in a loop for continuous testing
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class WidgetTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      pageLoaded: false,
      widgetFound: false,
      sdkLoaded: false,
      buttonClickable: false,
      microphonePermissions: false,
      callRegistered: false,
      errors: [],
      consoleMessages: [],
      networkErrors: []
    };
    this.baseUrl = 'http://localhost:3000';
  }

  async init() {
    console.log('🚀 Initializing Widget Tester...');
    
    try {
      this.browser = await chromium.launch({ 
        headless: false, // Set to true for headless mode
        args: [
          '--use-fake-ui-for-media-stream', // Auto-grant microphone permissions
          '--use-fake-device-for-media-stream',
          '--allow-running-insecure-content',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // Grant microphone permissions
      await this.page.context().grantPermissions(['microphone']);
      
      // Set up console monitoring
      this.page.on('console', (msg) => {
        const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
        this.testResults.consoleMessages.push(message);
        console.log(`📝 Console: ${message}`);
        
        // Check for specific SDK loading messages
        if (msg.text().includes('Retell SDK loaded successfully')) {
          this.testResults.sdkLoaded = true;
          console.log('✅ SDK Loading: SUCCESS');
        }
        
        if (msg.text().includes('Failed to load Retell SDK')) {
          this.testResults.errors.push('SDK failed to load');
          console.log('❌ SDK Loading: FAILED');
        }
      });
      
      // Set up error monitoring
      this.page.on('pageerror', (error) => {
        const errorMsg = `Page Error: ${error.message}`;
        this.testResults.errors.push(errorMsg);
        console.log(`❌ ${errorMsg}`);
      });
      
      // Monitor network failures
      this.page.on('response', (response) => {
        if (response.status() >= 400) {
          const errorMsg = `Network Error: ${response.status()} ${response.url()}`;
          this.testResults.networkErrors.push(errorMsg);
          console.log(`🌐 ${errorMsg}`);
        }
      });
      
      console.log('✅ Browser initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  async testWidgetPage() {
    console.log('\n🧪 Testing Widget Page...');
    
    try {
      // Navigate to test page
      console.log('📄 Loading widget test page...');
      await this.page.goto(`${this.baseUrl}/widget-test.html`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      this.testResults.pageLoaded = true;
      console.log('✅ Page loaded successfully');
      
      // Wait for widget to initialize
      console.log('⏳ Waiting for widget to initialize...');
      await this.page.waitForTimeout(3000);
      
      // Check if widget exists
      const widgetButton = await this.page.$('.retell-button');
      if (widgetButton) {
        this.testResults.widgetFound = true;
        console.log('✅ Widget button found');
        
        // Check if button is clickable
        const isClickable = await widgetButton.isEnabled();
        if (isClickable) {
          this.testResults.buttonClickable = true;
          console.log('✅ Widget button is clickable');
        } else {
          console.log('❌ Widget button is not clickable');
        }
      } else {
        console.log('❌ Widget button not found');
      }
      
      // Wait a bit more for SDK to load
      await this.page.waitForTimeout(5000);
      
      // Check if RetellWebClient is available
      const sdkAvailable = await this.page.evaluate(() => {
        return typeof window.RetellWebClient !== 'undefined';
      });
      
      if (sdkAvailable) {
        this.testResults.sdkLoaded = true;
        console.log('✅ Retell SDK is available in window');
      } else {
        console.log('❌ Retell SDK not found in window');
      }
      
    } catch (error) {
      this.testResults.errors.push(`Page test error: ${error.message}`);
      console.error('❌ Page test failed:', error);
    }
  }

  async testWidgetClick() {
    console.log('\n🖱️  Testing Widget Click...');
    
    try {
      const widgetButton = await this.page.$('.retell-button');
      if (!widgetButton) {
        console.log('❌ Cannot test click - widget button not found');
        return;
      }
      
      console.log('🖱️  Clicking widget button...');
      await widgetButton.click();
      
      // Wait for any response
      await this.page.waitForTimeout(3000);
      
      // Check for call registration
      const hasCallStarted = await this.page.evaluate(() => {
        return document.querySelector('.retell-button').textContent.includes('End Call') ||
               document.querySelector('.retell-button').textContent.includes('Stop');
      });
      
      if (hasCallStarted) {
        this.testResults.callRegistered = true;
        console.log('✅ Call appears to have started');
      } else {
        console.log('❌ Call did not start');
      }
      
    } catch (error) {
      this.testResults.errors.push(`Click test error: ${error.message}`);
      console.error('❌ Click test failed:', error);
    }
  }

  async generateReport() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const results = this.testResults;
    console.log(`Page Loaded: ${results.pageLoaded ? '✅' : '❌'}`);
    console.log(`Widget Found: ${results.widgetFound ? '✅' : '❌'}`);
    console.log(`SDK Loaded: ${results.sdkLoaded ? '✅' : '❌'}`);
    console.log(`Button Clickable: ${results.buttonClickable ? '✅' : '❌'}`);
    console.log(`Call Registered: ${results.callRegistered ? '✅' : '❌'}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors Found:');
      results.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    if (results.networkErrors.length > 0) {
      console.log('\n🌐 Network Errors:');
      results.networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    // Generate suggestions
    console.log('\n💡 Suggestions:');
    if (!results.sdkLoaded) {
      console.log('  - Check SDK URLs in widget.js');
      console.log('  - Verify network connectivity');
      console.log('  - Check browser console for CORS errors');
    }
    
    if (!results.widgetFound) {
      console.log('  - Check if widget.js is loading properly');
      console.log('  - Verify embed code on test page');
    }
    
    if (!results.callRegistered && results.widgetFound) {
      console.log('  - Check /api/v1/register-call endpoint');
      console.log('  - Verify widget configuration');
      console.log('  - Check server logs for errors');
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
  }

  async takeScreenshot() {
    const screenshotPath = path.join(__dirname, '..', 'widget-screenshot.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    return screenshotPath;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async runFullTest() {
    try {
      await this.init();
      await this.testWidgetPage();
      await this.testWidgetClick();
      await this.takeScreenshot();
      await this.generateReport();
      
      // Return results for programmatic use
      return this.testResults;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI usage
if (require.main === module) {
  const tester = new WidgetTester();
  
  tester.runFullTest()
    .then((results) => {
      const success = results.pageLoaded && results.widgetFound && results.sdkLoaded;
      console.log(`\n🎯 Overall Test Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = WidgetTester;