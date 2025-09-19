#!/usr/bin/env node

const WidgetTester = require('./test-widget.js');

class SimpleWidgetTester extends WidgetTester {
  async testSimpleWidget() {
    console.log('\n🧪 Testing Simple Widget (No SDK Dependencies)...');
    
    try {
      // Navigate to simple test page
      console.log('📄 Loading simple widget test page...');
      await this.page.goto(`${this.baseUrl}/widget-simple-test.html`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      this.testResults.pageLoaded = true;
      console.log('✅ Simple widget page loaded successfully');
      
      // Wait for widget to initialize
      console.log('⏳ Waiting for simple widget to initialize...');
      await this.page.waitForTimeout(2000);
      
      // Check if simple widget exists
      const simpleButton = await this.page.$('.retell-simple-button');
      if (simpleButton) {
        this.testResults.widgetFound = true;
        console.log('✅ Simple widget button found');
        
        // Test button click
        console.log('🖱️  Clicking simple widget button...');
        await simpleButton.click();
        
        // Wait for response
        await this.page.waitForTimeout(5000);
        
        // Check if call was registered (look for success state)
        const buttonState = await this.page.evaluate(() => {
          const btn = document.querySelector('.retell-simple-button');
          return btn ? btn.className : null;
        });
        
        console.log('🔍 Button state after click:', buttonState);
        
        if (buttonState && (buttonState.includes('connected') || buttonState.includes('connecting'))) {
          this.testResults.callRegistered = true;
          this.testResults.sdkLoaded = true; // No SDK needed, direct API
          console.log('✅ Simple widget call registered successfully');
        } else {
          console.log('❌ Simple widget call not registered');
        }
        
      } else {
        console.log('❌ Simple widget button not found');
      }
      
    } catch (error) {
      this.testResults.errors.push(`Simple widget test error: ${error.message}`);
      console.error('❌ Simple widget test failed:', error);
    }
  }

  async runSimpleTest() {
    try {
      await this.init();
      await this.testSimpleWidget();
      await this.takeScreenshot();
      await this.generateReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ Simple test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI usage
if (require.main === module) {
  const tester = new SimpleWidgetTester();
  
  tester.runSimpleTest()
    .then((results) => {
      const success = results.pageLoaded && results.widgetFound && results.callRegistered;
      console.log(`\n🎯 Simple Widget Test Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Simple test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = SimpleWidgetTester;