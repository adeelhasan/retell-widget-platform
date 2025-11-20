import { NextResponse } from 'next/server';

export async function GET() {
  const widgetScript = `
(function() {
  'use strict';
  
  // Prevent multiple loads
  if (window.RetellWidgetLoader) {
    return;
  }
  
  window.RetellWidgetLoader = {
    loaded: false,
    widgets: []
  };
  
  // Widget styling
  const WIDGET_STYLES = \`
    .retell-embed-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: inline-block;
      position: relative;
    }
    
    .retell-embed-button {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      min-width: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .retell-embed-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    }
    
    .retell-embed-button.connecting {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      cursor: wait;
    }
    
    .retell-embed-button.connected {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      animation: retell-pulse 2s infinite;
    }
    
    .retell-embed-button.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    
    .retell-outbound-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 300px;
    }
    
    .retell-phone-input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .retell-agent-persona {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      text-align: center;
      font-style: italic;
    }
    
    .retell-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: retell-spin 1s linear infinite;
    }
    
    @keyframes retell-spin {
      to { transform: rotate(360deg); }
    }
    
    @keyframes retell-pulse {
      0%, 100% { 
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        transform: translateY(-1px);
      }
      50% { 
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
        transform: translateY(-2px);
      }
    }
    
    @keyframes retell-ring {
      0%, 100% {
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        transform: translateY(-1px) scale(1);
      }
      50% {
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6);
        transform: translateY(-2px) scale(1.02);
      }
    }

    /* Access Code Modal Styles */
    .retell-access-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: retell-fade-in 0.2s ease;
    }

    .retell-access-modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: retell-slide-up 0.3s ease;
    }

    .retell-access-modal h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .retell-access-modal p {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #6b7280;
    }

    .retell-access-modal input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 16px;
      box-sizing: border-box;
    }

    .retell-access-modal input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .retell-access-modal-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .retell-access-modal button {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .retell-access-modal button.cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .retell-access-modal button.cancel:hover {
      background: #e5e7eb;
    }

    .retell-access-modal button.submit {
      background: #3b82f6;
      color: white;
    }

    .retell-access-modal button.submit:hover {
      background: #2563eb;
    }

    .retell-access-error {
      color: #ef4444;
      font-size: 13px;
      margin-top: -12px;
      margin-bottom: 12px;
    }

    @keyframes retell-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes retell-slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Contact Form Modal Styles */
    .retell-contact-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: retell-fade-in 0.2s ease;
    }

    .retell-contact-modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: retell-slide-up 0.3s ease;
    }

    .retell-contact-modal h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .retell-contact-modal p {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #6b7280;
    }

    .retell-contact-form-field {
      margin-bottom: 16px;
    }

    .retell-contact-form-field label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .retell-contact-modal input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .retell-contact-modal input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .retell-contact-error {
      color: #ef4444;
      font-size: 13px;
      margin-top: 4px;
      display: none;
    }

    .retell-contact-error.visible {
      display: block;
    }

    .retell-contact-modal-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .retell-contact-modal button {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .retell-contact-modal button.cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .retell-contact-modal button.cancel:hover {
      background: #e5e7eb;
    }

    .retell-contact-modal button.submit {
      background: #3b82f6;
      color: white;
    }

    .retell-contact-modal button.submit:hover {
      background: #2563eb;
    }

    .retell-contact-modal button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  \`;

  function injectStyles() {
    if (!document.getElementById('retell-embed-styles')) {
      const style = document.createElement('style');
      style.id = 'retell-embed-styles';
      style.textContent = WIDGET_STYLES;
      document.head.appendChild(style);
    }
  }
  
  class RetellSimpleWidget {
    constructor(element, config) {
      this.element = element;
      this.config = config;
      this.widgetId = config.widgetId;
      this.buttonText = config.buttonText || 'Loading...';
      this.baseUrl = config.baseUrl || window.location.origin;
      this.isConnected = false;
      this.callState = 'idle';
      this.widgetConfig = null;
      
      this.init();
    }
    
    async init() {
      await this.loadWidgetConfig();
      this.createWidget();
    }
    
    async loadWidgetConfig() {
      try {
        const response = await fetch(\`\${this.baseUrl}/api/v1/widget-config?widget_id=\${this.widgetId}\`, {
          headers: {
            'Origin': window.location.origin
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to load widget config:', response.status, errorData);

          // Set error state instead of falling back
          this.widgetConfig = {
            widget_type: 'error',
            error_message: errorData.error || \`Failed to load widget (status: \${response.status})\`,
            error_status: response.status
          };
          return;
        }

        this.widgetConfig = await response.json();
        console.log('🔧 Widget config loaded:', this.widgetConfig);
        this.buttonText = this.config.buttonText || this.widgetConfig.button_text || this.getDefaultButtonText();

      } catch (error) {
        console.error('Failed to load widget config:', error);
        this.widgetConfig = {
          widget_type: 'error',
          error_message: 'Unable to load widget configuration. Please check your network connection.',
          error_details: error.message
        };
      }
    }

    promptForAccessCode() {
      return new Promise((resolve, reject) => {
        // Check sessionStorage first
        const sessionKey = \`retell_access_code_\${this.widgetId}\`;
        const storedCode = sessionStorage.getItem(sessionKey);
        if (storedCode) {
          resolve(storedCode);
          return;
        }

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'retell-access-modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'retell-access-modal';

        modal.innerHTML = \`
          <h3>Access Code Required</h3>
          <p>Please enter the access code to use this widget.</p>
          <input
            type="text"
            id="retell-access-code-input"
            placeholder="Enter access code"
            autocomplete="off"
          />
          <div class="retell-access-error" id="retell-access-error" style="display: none;"></div>
          <div class="retell-access-modal-buttons">
            <button class="cancel">Cancel</button>
            <button class="submit">Continue</button>
          </div>
        \`;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const input = modal.querySelector('#retell-access-code-input');
        const errorDiv = modal.querySelector('#retell-access-error');
        const cancelBtn = modal.querySelector('.cancel');
        const submitBtn = modal.querySelector('.submit');

        // Focus input
        setTimeout(() => input.focus(), 100);

        // Handle cancel
        const cleanup = () => {
          document.body.removeChild(overlay);
        };

        cancelBtn.addEventListener('click', () => {
          cleanup();
          reject(new Error('Access code entry cancelled'));
        });

        // Handle submit
        const submitCode = () => {
          const code = input.value.trim();
          if (!code) {
            errorDiv.textContent = 'Please enter an access code';
            errorDiv.style.display = 'block';
            return;
          }

          // Store in sessionStorage
          sessionStorage.setItem(sessionKey, code);
          cleanup();
          resolve(code);
        };

        submitBtn.addEventListener('click', submitCode);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            submitCode();
          }
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            cleanup();
            reject(new Error('Access code entry cancelled'));
          }
        });
      });
    }

    promptForContactInfo() {
      return new Promise((resolve, reject) => {
        // Check sessionStorage first
        const sessionKey = \`retell_contact_info_\${this.widgetId}\`;
        const storedInfo = sessionStorage.getItem(sessionKey);
        if (storedInfo) {
          try {
            resolve(JSON.parse(storedInfo));
            return;
          } catch (e) {
            // Invalid stored data, continue to prompt
          }
        }

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'retell-contact-modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'retell-contact-modal';

        modal.innerHTML = \`
          <h3>Contact Information</h3>
          <p>Please provide your information to get started</p>

          <div class="retell-contact-form-field">
            <label for="retell-contact-name">Name *</label>
            <input
              type="text"
              id="retell-contact-name"
              placeholder="John Doe"
              autocomplete="name"
              required
            />
            <div class="retell-contact-error" id="retell-name-error"></div>
          </div>

          <div class="retell-contact-form-field">
            <label for="retell-contact-company">Company *</label>
            <input
              type="text"
              id="retell-contact-company"
              placeholder="Acme Corporation"
              autocomplete="organization"
              required
            />
            <div class="retell-contact-error" id="retell-company-error"></div>
          </div>

          <div class="retell-contact-form-field">
            <label for="retell-contact-email">Email *</label>
            <input
              type="email"
              id="retell-contact-email"
              placeholder="john@example.com"
              autocomplete="email"
              required
            />
            <div class="retell-contact-error" id="retell-email-error"></div>
          </div>

          <div class="retell-contact-modal-buttons">
            <button class="cancel" type="button">Cancel</button>
            <button class="submit" type="button">Continue</button>
          </div>
        \`;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const nameInput = modal.querySelector('#retell-contact-name');
        const companyInput = modal.querySelector('#retell-contact-company');
        const emailInput = modal.querySelector('#retell-contact-email');
        const nameError = modal.querySelector('#retell-name-error');
        const companyError = modal.querySelector('#retell-company-error');
        const emailError = modal.querySelector('#retell-email-error');
        const cancelBtn = modal.querySelector('.cancel');
        const submitBtn = modal.querySelector('.submit');

        // Focus first input
        setTimeout(() => nameInput.focus(), 100);

        // Handle cancel
        const cleanup = () => {
          document.body.removeChild(overlay);
        };

        cancelBtn.addEventListener('click', () => {
          cleanup();
          reject(new Error('Contact form cancelled'));
        });

        // Validation helpers
        const clearErrors = () => {
          nameError.classList.remove('visible');
          companyError.classList.remove('visible');
          emailError.classList.remove('visible');
        };

        const validateEmail = (email) => {
          return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$/.test(email);
        };

        const validateForm = () => {
          clearErrors();
          let isValid = true;

          const name = nameInput.value.trim();
          const company = companyInput.value.trim();
          const email = emailInput.value.trim();

          if (!name) {
            nameError.textContent = 'Name is required';
            nameError.classList.add('visible');
            isValid = false;
          }

          if (!company) {
            companyError.textContent = 'Company is required';
            companyError.classList.add('visible');
            isValid = false;
          }

          if (!email) {
            emailError.textContent = 'Email is required';
            emailError.classList.add('visible');
            isValid = false;
          } else if (!validateEmail(email)) {
            emailError.textContent = 'Please enter a valid email';
            emailError.classList.add('visible');
            isValid = false;
          }

          return isValid ? { name, company, email } : null;
        };

        // Handle submit
        const submitForm = async () => {
          const contactInfo = validateForm();
          if (!contactInfo) {
            return;
          }

          // Disable button while submitting
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting...';

          try {
            // Submit to backend API
            const response = await fetch(\`\${this.baseUrl}/api/widgets/\${this.widgetId}/contact-form\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Origin': window.location.origin
              },
              body: JSON.stringify(contactInfo)
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Failed to submit form' }));
              throw new Error(errorData.error || 'Failed to submit contact form');
            }

            // Store in sessionStorage
            sessionStorage.setItem(sessionKey, JSON.stringify(contactInfo));

            cleanup();
            resolve(contactInfo);
          } catch (error) {
            console.error('Contact form submission error:', error);
            emailError.textContent = error.message || 'Failed to submit. Please try again.';
            emailError.classList.add('visible');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Continue';
          }
        };

        submitBtn.addEventListener('click', submitForm);

        // Handle Enter key on any input
        [nameInput, companyInput, emailInput].forEach(input => {
          input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitForm();
            }
          });
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            cleanup();
            reject(new Error('Contact form cancelled'));
          }
        });
      });
    }

    getDefaultButtonText() {
      if (!this.widgetConfig) return 'Start Voice Call';
      
      switch (this.widgetConfig.widget_type) {
        case 'inbound_web':
          return 'Start Voice Demo';
        case 'inbound_phone':
          return 'Call Now';
        case 'outbound_phone':
          return 'Call Me Now';
        case 'outbound_web':
          return 'Answer Call';
        default:
          return 'Start Voice Call';
      }
    }
    
    createWidget() {
      const container = document.createElement('div');
      container.className = 'retell-embed-widget';
      
      if (!this.widgetConfig) {
        container.innerHTML = '<div style="color: red;">Failed to load widget</div>';
        this.element.appendChild(container);
        return;
      }
      
      console.log('🎯 Creating widget with type:', this.widgetConfig.widget_type);
      
      switch (this.widgetConfig.widget_type) {
        case 'inbound_web':
          console.log('📱 Creating inbound web widget');
          this.createInboundWebWidget(container);
          break;
        case 'inbound_phone':
          console.log('📞 Creating inbound phone widget');
          this.createInboundPhoneWidget(container);
          break;
        case 'outbound_phone':
          console.log('📲 Creating outbound phone widget');
          this.createOutboundPhoneWidget(container);
          break;
        case 'outbound_web':
          console.log('🔔 Creating outbound web widget');
          this.createOutboundWebWidget(container);
          break;
        case 'error':
          console.error('❌ Error loading widget:', this.widgetConfig.error_message);
          this.createErrorWidget(container);
          break;
        default:
          console.error('⚠️ Unknown widget type:', this.widgetConfig.widget_type);
          this.widgetConfig.error_message = \`Unknown widget type: \${this.widgetConfig.widget_type}\`;
          this.createErrorWidget(container);
      }
      
      this.element.appendChild(container);
      this.container = container;
    }
    
    createInboundWebWidget(container) {
      const button = document.createElement('button');
      button.className = 'retell-embed-button';
      button.innerHTML = \`
        <span class="retell-icon">🎤</span>
        <span class="retell-text">\${this.buttonText}</span>
      \`;
      
      button.addEventListener('click', () => this.handleInboundWebClick());
      
      container.appendChild(button);
      this.button = button;
    }
    
    createInboundPhoneWidget(container) {
      // Create wrapper for phone widget
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 12px;';

      const button = document.createElement('button');
      button.className = 'retell-embed-button';
      button.innerHTML = \`
        <span class="retell-icon">📞</span>
        <span class="retell-text">Loading phone number...</span>
      \`;

      button.addEventListener('click', () => this.handleInboundPhoneClick());

      // Create caption text element (shows button_text if provided)
      const caption = document.createElement('div');
      caption.className = 'retell-phone-caption';
      caption.style.cssText = 'font-size: 14px; color: #64748b; text-align: center;';
      if (this.buttonText && this.buttonText !== 'Loading...') {
        caption.textContent = this.buttonText;
      }

      // Create phone number display with copy button
      const phoneDisplay = document.createElement('div');
      phoneDisplay.className = 'retell-phone-display';
      phoneDisplay.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569;';
      phoneDisplay.style.display = 'none'; // Hidden until phone number loads

      wrapper.appendChild(button);
      if (caption.textContent) {
        wrapper.appendChild(caption);
      }
      wrapper.appendChild(phoneDisplay);
      container.appendChild(wrapper);

      this.button = button;
      this.phoneDisplay = phoneDisplay;
      this.caption = caption;

      // Load phone number
      this.loadPhoneNumber();
    }
    
    createOutboundPhoneWidget(container) {
      // Create phone input form
      const form = document.createElement('form');
      form.className = 'retell-outbound-form';
      
      const phoneInput = document.createElement('input');
      phoneInput.type = 'tel';
      phoneInput.placeholder = 'Enter your phone number';
      phoneInput.className = 'retell-phone-input';
      phoneInput.required = true;
      
      const button = document.createElement('button');
      button.type = 'submit';
      button.className = 'retell-embed-button';
      button.innerHTML = \`
        <span class="retell-icon">📱</span>
        <span class="retell-text">\${this.buttonText}</span>
      \`;
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleOutboundPhoneSubmit(phoneInput.value);
      });
      
      form.appendChild(phoneInput);
      form.appendChild(button);
      container.appendChild(form);
      
      this.button = button;
      this.phoneInput = phoneInput;
    }
    
    createOutboundWebWidget(container) {
      const button = document.createElement('button');
      button.className = 'retell-embed-button';
      button.innerHTML = \`
        <span class="retell-icon">🔔</span>
        <span class="retell-text">\${this.buttonText}</span>
      \`;
      
      button.addEventListener('click', () => this.handleOutboundWebClick());
      
      container.appendChild(button);
      this.button = button;

      // Add ringing animation
      button.style.animation = 'retell-ring 2s infinite';
    }

    createErrorWidget(container) {
      const errorContainer = document.createElement('div');
      errorContainer.style.cssText = \`
        background: #fee;
        border: 2px solid #fcc;
        border-radius: 8px;
        padding: 16px;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      \`;

      const errorIcon = document.createElement('div');
      errorIcon.textContent = '⚠️';
      errorIcon.style.cssText = 'font-size: 32px; text-align: center; margin-bottom: 8px;';

      const errorTitle = document.createElement('div');
      errorTitle.textContent = 'Widget Error';
      errorTitle.style.cssText = \`
        font-size: 16px;
        font-weight: 600;
        color: #c00;
        text-align: center;
        margin-bottom: 8px;
      \`;

      const errorMessage = document.createElement('div');
      errorMessage.textContent = this.widgetConfig.error_message || 'Failed to load widget';
      errorMessage.style.cssText = \`
        font-size: 14px;
        color: #666;
        text-align: center;
        line-height: 1.4;
      \`;

      errorContainer.appendChild(errorIcon);
      errorContainer.appendChild(errorTitle);
      errorContainer.appendChild(errorMessage);

      // Add details for debugging if available
      if (this.widgetConfig.error_status === 403) {
        const hint = document.createElement('div');
        hint.textContent = 'This domain is not authorized to use this widget.';
        hint.style.cssText = \`
          font-size: 12px;
          color: #999;
          text-align: center;
          margin-top: 8px;
          font-style: italic;
        \`;
        errorContainer.appendChild(hint);
      }

      container.appendChild(errorContainer);
    }

    async handleInboundWebClick() {
      if (this.isConnected) {
        await this.endCall();
      } else {
        await this.startInboundWebCall();
      }
    }
    
    async handleInboundPhoneClick() {
      // Open phone dialer
      const phoneUrl = await this.getPhoneUrl();
      if (phoneUrl) {
        window.open(phoneUrl, '_self');
      }
    }
    
    async handleOutboundPhoneSubmit(phoneNumber) {
      if (!phoneNumber || phoneNumber.length < 10) {
        this.showError('Please enter a valid phone number');
        return;
      }
      
      await this.initiateOutboundCall(phoneNumber);
    }
    
    async handleOutboundWebClick() {
      if (this.isConnected) {
        await this.endCall();
      } else {
        await this.startOutboundWebCall();
      }
    }
    
    async startInboundWebCall() {
      try {
        // Check if contact form is required
        if (this.widgetConfig?.contact_form_enabled) {
          try {
            await this.promptForContactInfo();
            console.log('✅ Contact form submitted successfully');
          } catch (error) {
            console.log('Contact form cancelled');
            this.setState('idle');
            return;
          }
        }

        // Check if access code is required
        let accessCode = null;
        if (this.widgetConfig?.require_access_code) {
          try {
            accessCode = await this.promptForAccessCode();
          } catch (error) {
            console.log('Access code prompt cancelled');
            this.setState('idle');
            return;
          }
        }

        this.setState('connecting');

        // Check HTTPS requirement for microphone access
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          throw new Error('Voice calls require HTTPS. Please use https:// instead of http://');
        }
        
        // Check browser compatibility
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support microphone access. Please use a modern browser.');
        }
        
        // Request microphone permission
        console.log('🎤 Requesting microphone permission...');
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 24000
            } 
          });
          console.log('✅ Microphone permission granted');
          stream.getTracks().forEach(track => track.stop());
        } catch (micError) {
          console.error('❌ Microphone permission failed:', micError);
          throw new Error(\`Microphone access failed: \${micError.message}\`);
        }
        
        console.log('📞 Registering inbound web call...');
        const response = await fetch(\`\${this.baseUrl}/api/v1/register-call\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            widget_id: this.widgetId,
            metadata: this.getMetadata(),
            ...(accessCode && { access_code: accessCode })
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Clear cached access code on 403 (access denied) to allow retry
          if (response.status === 403) {
            const sessionKey = \`retell_access_code_\${this.widgetId}\`;
            sessionStorage.removeItem(sessionKey);
            console.log('🔑 Cleared cached access code due to access denied error');
          }

          throw new Error(errorData.error || \`HTTP \${response.status}: \${response.statusText}\`);
        }

        const callData = await response.json();
        console.log('✅ Call registered:', callData.call_id);
        
        // Create inline iframe for voice widget
        this.createVoiceModal(callData.access_token);
        
        this.setState('connected');
        this.isConnected = true;
        
      } catch (error) {
        console.error('❌ Inbound web call failed:', error);
        this.handleCallError(error);
      }
    }
    
    async startOutboundWebCall() {
      try {
        // Check if access code is required
        let accessCode = null;
        if (this.widgetConfig?.require_access_code) {
          try {
            accessCode = await this.promptForAccessCode();
          } catch (error) {
            console.log('Access code prompt cancelled');
            this.setState('idle');
            return;
          }
        }

        this.setState('connecting');

        // Check HTTPS requirement for microphone access
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          throw new Error('Voice calls require HTTPS. Please use https:// instead of http://');
        }
        
        // Check browser compatibility
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support microphone access. Please use a modern browser.');
        }
        
        // Request microphone permission
        console.log('🎤 Requesting microphone permission...');
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 24000
            } 
          });
          console.log('✅ Microphone permission granted');
          stream.getTracks().forEach(track => track.stop());
        } catch (micError) {
          console.error('❌ Microphone permission failed:', micError);
          throw new Error(\`Microphone access failed: \${micError.message}\`);
        }
        
        console.log('📞 Registering outbound web call...');
        const response = await fetch(\`\${this.baseUrl}/api/v1/register-call\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            widget_id: this.widgetId,
            metadata: {
              ...this.getMetadata(),
              call_type: 'outbound_web'
            },
            ...(accessCode && { access_code: accessCode })
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Clear cached access code on 403 (access denied) to allow retry
          if (response.status === 403) {
            const sessionKey = \`retell_access_code_\${this.widgetId}\`;
            sessionStorage.removeItem(sessionKey);
            console.log('🔑 Cleared cached access code due to access denied error');
          }

          throw new Error(errorData.error || \`HTTP \${response.status}: \${response.statusText}\`);
        }

        const callData = await response.json();
        console.log('✅ Outbound web call registered:', callData.call_id);
        
        // Create voice modal with outbound context
        this.createOutboundVoiceModal(callData.access_token);
        
        this.setState('connected');
        this.isConnected = true;
        
      } catch (error) {
        console.error('❌ Outbound web call failed:', error);
        this.handleCallError(error);
      }
    }
    
    async loadPhoneNumber() {
      try {
        const response = await fetch(\`\${this.baseUrl}/api/v1/phone-lookup?widget_id=\${this.widgetId}\`, {
          headers: {
            'Origin': window.location.origin
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.phoneNumber = data.phone_number;

          // Format phone number for display
          const formattedNumber = this.formatPhoneNumber(data.phone_number);

          // Update button text with phone number
          const textEl = this.button.querySelector('.retell-text');
          if (textEl) {
            textEl.textContent = formattedNumber;
          }

          // Update phone display below button with copy icon
          if (this.phoneDisplay) {
            this.phoneDisplay.innerHTML = \`
              <span style="font-weight: 500;">\${formattedNumber}</span>
              <button
                class="retell-copy-phone"
                style="background: none; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b;"
                title="Copy phone number"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
            \`;
            this.phoneDisplay.style.display = 'flex';

            // Add copy functionality
            const copyBtn = this.phoneDisplay.querySelector('.retell-copy-phone');
            if (copyBtn) {
              copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(data.phone_number).then(() => {
                  copyBtn.textContent = '✓ Copied';
                  setTimeout(() => {
                    copyBtn.innerHTML = \`
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    \`;
                  }, 2000);
                });
              });
            }
          }
        } else {
          const textEl = this.button.querySelector('.retell-text');
          if (textEl) {
            textEl.textContent = 'Phone number not available';
          }
        }
      } catch (error) {
        console.error('Failed to load phone number:', error);
        const textEl = this.button.querySelector('.retell-text');
        if (textEl) {
          textEl.textContent = 'Error loading phone number';
        }
      }
    }

    formatPhoneNumber(phoneNumber) {
      // Format +19088246997 to (908) 824-6997
      const cleaned = phoneNumber.replace(/\D/g, '');

      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        // US number with country code
        const areaCode = cleaned.substring(1, 4);
        const prefix = cleaned.substring(4, 7);
        const lineNumber = cleaned.substring(7, 11);
        return \`(\${areaCode}) \${prefix}-\${lineNumber}\`;
      } else if (cleaned.length === 10) {
        // US number without country code
        const areaCode = cleaned.substring(0, 3);
        const prefix = cleaned.substring(3, 6);
        const lineNumber = cleaned.substring(6, 10);
        return \`(\${areaCode}) \${prefix}-\${lineNumber}\`;
      }

      // Return as-is for international numbers
      return phoneNumber;
    }
    
    async getPhoneUrl() {
      if (this.phoneNumber) {
        return \`tel:\${this.phoneNumber}\`;
      }
      return 'tel:+1-555-RETELL';
    }
    
    async initiateOutboundCall(phoneNumber) {
      try {
        // Check if access code is required
        let accessCode = null;
        if (this.widgetConfig?.require_access_code) {
          try {
            accessCode = await this.promptForAccessCode();
          } catch (error) {
            console.log('Access code prompt cancelled');
            this.setState('idle');
            return;
          }
        }

        this.setState('connecting');

        const response = await fetch(\`\${this.baseUrl}/api/v1/outbound-call\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            widget_id: this.widgetId,
            phone_number: phoneNumber,
            metadata: this.getMetadata(),
            ...(accessCode && { access_code: accessCode })
          })
        });

        const result = await response.json();

        if (response.ok) {
          this.setState('success');
          console.log('✅ Outbound call success:', result.message || 'Call initiated! You should receive a call shortly.');
          // Reset to idle after success message displays
          setTimeout(() => this.setState('idle'), 4000);
        } else {
          // Clear cached access code on 403 (access denied) to allow retry
          if (response.status === 403) {
            const sessionKey = \`retell_access_code_\${this.widgetId}\`;
            sessionStorage.removeItem(sessionKey);
            console.log('🔑 Cleared cached access code due to access denied error');
          }

          throw new Error(result.error || 'Failed to initiate call');
        }
        
      } catch (error) {
        console.error('Outbound call failed:', error);
        this.showError(error.message || 'Failed to initiate call. Please try again.');
        this.setState('error');
        setTimeout(() => this.setState('idle'), 5000);
      }
    }
    
    handleCallError(error) {
      // Show user-friendly error message
      let errorMessage = 'Failed to start voice call. Please try again.';
      
      if (error.message.includes('HTTPS')) {
        errorMessage = 'Voice calls require HTTPS. Please visit this page using https:// instead of http://';
      } else if (error.message.includes('browser')) {
        errorMessage = 'Your browser does not support voice calls. Please use Chrome, Firefox, or Safari.';
      } else if (error.message.includes('microphone') || error.message.includes('Microphone access failed')) {
        // Detect iOS for specific instructions
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIOS) {
          errorMessage = 'Microphone blocked. On iOS: Settings > Safari > Camera & Microphone > Allow for this site';
        } else {
          errorMessage = 'Microphone permission required. Please allow microphone access and try again.';
        }
      } else if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
        errorMessage = 'Microphone permission denied. Please refresh and allow microphone access.';
      } else if (error.message.includes('Domain not authorized')) {
        errorMessage = 'This domain is not authorized for voice calls. Please contact the site administrator.';
      }
      
      this.showError(errorMessage);
      this.setState('error');
      setTimeout(() => this.setState('idle'), 5000);
    }
    
    showError(message) {
      if (this.button) {
        const originalHTML = this.button.innerHTML;
        this.button.innerHTML = \`<span style="font-size: 12px;">\${message}</span>\`;
        this.button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        setTimeout(() => {
          this.button.innerHTML = originalHTML;
          this.button.style.background = '';
        }, 4000);
      }
    }
    
    showSuccess(message) {
      if (this.button) {
        const originalHTML = this.button.innerHTML;
        this.button.innerHTML = \`<span style="font-size: 12px;">\${message}</span>\`;
        this.button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        
        setTimeout(() => {
          this.button.innerHTML = originalHTML;
          this.button.style.background = '';
        }, 4000);
      }
    }
    
    createVoiceModal(accessToken) {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      \`;
      
      const modal = document.createElement('div');
      modal.style.cssText = \`
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 80%;
        position: relative;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      \`;
      
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = \`
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      \`;
      
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        this.endCall();
      });
      
      const iframe = document.createElement('iframe');
      const voiceUrl = \`\${this.baseUrl}/voice-call?token=\${encodeURIComponent(accessToken)}\`;
      iframe.src = voiceUrl;
      iframe.style.cssText = \`
        width: 100%;
        height: 300px;
        border: none;
        border-radius: 8px;
      \`;
      iframe.allow = 'microphone';
      
      const title = document.createElement('h3');
      title.textContent = 'Voice Call';
      title.style.cssText = \`
        margin: 0 0 15px 0;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      \`;
      
      modal.appendChild(closeBtn);
      modal.appendChild(title);
      modal.appendChild(iframe);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      this.voiceModal = overlay;
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          this.endCall();
        }
      });
    }
    
    createOutboundVoiceModal(accessToken) {
      // Similar to createVoiceModal but with outbound context
      const overlay = document.createElement('div');
      overlay.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      \`;
      
      const modal = document.createElement('div');
      modal.style.cssText = \`
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 80%;
        position: relative;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      \`;
      
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = \`
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      \`;
      
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        this.endCall();
      });
      
      const iframe = document.createElement('iframe');
      const voiceUrl = \`\${this.baseUrl}/voice-call?token=\${encodeURIComponent(accessToken)}\`;
      iframe.src = voiceUrl;
      iframe.style.cssText = \`
        width: 100%;
        height: 300px;
        border: none;
        border-radius: 8px;
      \`;
      iframe.allow = 'microphone';
      
      const title = document.createElement('h3');
      title.textContent = 'Incoming Voice Call';
      title.style.cssText = \`
        margin: 0 0 15px 0;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      \`;
      
      modal.appendChild(closeBtn);
      modal.appendChild(title);
      modal.appendChild(iframe);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      this.voiceModal = overlay;
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          this.endCall();
        }
      });
    }

    async endCall() {
      if (this.voiceModal && this.voiceModal.parentNode) {
        document.body.removeChild(this.voiceModal);
        this.voiceModal = null;
      }
      
      this.setState('idle');
      this.isConnected = false;
      console.log('📞 Call ended');
    }
    
    setState(state) {
      this.callState = state;
      
      if (!this.button) return;
      
      this.button.className = \`retell-embed-button \${state}\`;
      
      const iconEl = this.button.querySelector('.retell-icon');
      const textEl = this.button.querySelector('.retell-text');
      
      if (!iconEl || !textEl) return;
      
      switch (state) {
        case 'connecting':
          iconEl.innerHTML = '<div class="retell-spinner"></div>';
          textEl.textContent = 'Connecting...';
          break;
        case 'connected':
          iconEl.textContent = '📞';
          textEl.textContent = 'End Call';
          break;
        case 'error':
          iconEl.textContent = '❌';
          textEl.textContent = 'Call Failed';
          break;
        case 'success':
          iconEl.textContent = '✅';
          textEl.textContent = 'Call Initiated!';
          break;
        default:
          if (this.widgetConfig) {
            switch (this.widgetConfig.widget_type) {
              case 'inbound_phone':
                iconEl.textContent = '📞';
                break;
              case 'outbound_phone':
                iconEl.textContent = '📱';
                break;
              case 'outbound_web':
                iconEl.textContent = '🔔';
                break;
              default:
                iconEl.textContent = '🎤';
            }
          } else {
            iconEl.textContent = '🎤';
          }
          textEl.textContent = this.buttonText;
      }
    }
    
    getMetadata() {
      // Start with system metadata
      const metadata = {
        page_url: window.location.href,
        page_title: document.title,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        widget_version: '4.0.0-multi-type'
      };

      // Find the metadata form for this specific widget
      const metadataForm = document.querySelector(\`form.retell-metadata[data-widget-id="\${this.widgetId}"]\`);

      if (metadataForm) {
        console.log('📝 Found metadata form for widget:', this.widgetId);

        // Collect all hidden inputs from this widget's form
        const hiddenInputs = metadataForm.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => {
          if (input.name && input.value) {
            console.log(\`  📝 Metadata: \${input.name} = \${input.value}\`);
            metadata[input.name] = input.value;
          }
        });
      } else {
        console.log('ℹ️ No metadata form found for widget:', this.widgetId);
      }

      console.log('📊 Final metadata for widget', this.widgetId + ':', metadata);
      return metadata;
    }
  }
  
  function initializeWidgets() {
    console.log('🚀 Initializing Retell widgets...');
    injectStyles();
    
    // Find all script tags with data-widget-id
    const scripts = document.querySelectorAll('script[data-widget-id]');
    console.log('📝 Found widget scripts:', scripts.length);
    
    scripts.forEach(script => {
      const widgetId = script.getAttribute('data-widget-id');
      const buttonText = script.getAttribute('data-button-text');
      const customClass = script.getAttribute('data-class');
      
      console.log('🔧 Processing widget:', { widgetId, buttonText });
      
      if (widgetId && !script.dataset.initialized) {
        script.dataset.initialized = 'true';
        
        // Get baseUrl from script src attribute
        const scriptSrc = script.getAttribute('src');
        let baseUrl = window.location.origin;
        
        if (scriptSrc) {
          try {
            // If it's a complete URL, extract the origin
            baseUrl = new URL(scriptSrc).origin;
          } catch (e) {
            // If it's a relative URL, use current origin
            baseUrl = window.location.origin;
          }
        }
        
        const container = document.createElement('div');
        if (customClass) {
          container.className = customClass;
        }
        
        script.parentNode.insertBefore(container, script.nextSibling);
        
        const widget = new RetellSimpleWidget(container, {
          widgetId,
          buttonText,
          baseUrl
        });
        
        window.RetellWidgetLoader.widgets.push(widget);
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
  } else {
    initializeWidgets();
  }
  
})();
`;

  return new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
    },
  });
}