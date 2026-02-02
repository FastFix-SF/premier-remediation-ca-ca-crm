/**
 * Fasto Workflow Engine
 * Manages multi-step guided workflows with conversational field collection
 */

import { 
  highlightElement, 
  clickWithHighlight, 
  fillInputField, 
  waitForElement,
  waitForDialog,
  delay,
  navigateToPage,
  parseNaturalDate,
  parseNaturalTime,
  selectDropdownOption,
  clickFastoAction
} from './FastoVisualAutomation';

export type WorkflowType = 
  | 'create_shift'
  | 'add_lead_note'
  | 'edit_lead'
  | 'create_work_order'
  | 'create_service_ticket'
  | 'create_invoice'
  | 'create_quote'
  | 'create_proposal'
  | 'clock_in_employee'
  | 'create_safety_meeting'
  | 'create_project'
  | 'add_contact';

export type StepAction = 
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'ask'
  | 'confirm'
  | 'wait'
  | 'speak';

export interface WorkflowStep {
  id: string;
  action: StepAction;
  target?: string;  // CSS selector or page name
  fastoAction?: string; // data-fasto-action attribute
  field?: string;   // Field name for data collection
  question?: string; // Question to ask user
  speakText?: string; // Text for Fasto to speak
  waitMs?: number;  // For wait actions
  optional?: boolean;
  validation?: (value: string) => { valid: boolean; error?: string };
  transform?: (value: string) => any; // Transform user input
  skipIf?: (data: Record<string, any>) => boolean;
}

export interface ActiveWorkflow {
  type: WorkflowType;
  steps: WorkflowStep[];
  currentStepIndex: number;
  collectedData: Record<string, any>;
  status: 'active' | 'waiting_input' | 'completed' | 'cancelled' | 'error';
  error?: string;
  initialContext?: Record<string, any>;
}

export interface WorkflowCallbacks {
  onStepStart?: (step: WorkflowStep, workflow: ActiveWorkflow) => void;
  onStepComplete?: (step: WorkflowStep, workflow: ActiveWorkflow) => void;
  onAskUser?: (question: string, field: string) => void;
  onSpeak?: (text: string) => Promise<void>;
  onWorkflowComplete?: (workflow: ActiveWorkflow) => void;
  onWorkflowError?: (error: string, workflow: ActiveWorkflow) => void;
}

class FastoWorkflowEngineClass {
  private activeWorkflow: ActiveWorkflow | null = null;
  private callbacks: WorkflowCallbacks = {};
  private userInputResolver: ((value: string) => void) | null = null;

  /**
   * Start a new guided workflow
   */
  async startWorkflow(
    type: WorkflowType,
    initialContext?: Record<string, any>,
    callbacks?: WorkflowCallbacks
  ): Promise<void> {
    if (callbacks) {
      this.callbacks = callbacks;
    }

    const steps = this.getWorkflowSteps(type);
    
    this.activeWorkflow = {
      type,
      steps,
      currentStepIndex: 0,
      collectedData: { ...initialContext },
      status: 'active',
      initialContext
    };

    console.log('[FastoWorkflow] Starting workflow:', type, 'with', steps.length, 'steps');

    await this.executeNextStep();
  }

  /**
   * Provide user input for a waiting workflow
   */
  provideUserInput(value: string): void {
    if (this.userInputResolver) {
      this.userInputResolver(value);
      this.userInputResolver = null;
    }
  }

  /**
   * Cancel the current workflow
   */
  cancelWorkflow(): void {
    if (this.activeWorkflow) {
      this.activeWorkflow.status = 'cancelled';
      this.activeWorkflow = null;
      this.userInputResolver = null;
    }
  }

  /**
   * Get current workflow status
   */
  getStatus(): ActiveWorkflow | null {
    return this.activeWorkflow;
  }

  /**
   * Check if a workflow is active
   */
  isActive(): boolean {
    return this.activeWorkflow !== null && this.activeWorkflow.status !== 'completed';
  }

  /**
   * Get workflow step definitions for a workflow type
   */
  private getWorkflowSteps(type: WorkflowType): WorkflowStep[] {
    switch (type) {
      case 'create_shift':
        return [
          { id: 'nav', action: 'navigate', target: '/admin?tab=workforce&subtab=scheduling', speakText: "Opening the scheduling page..." },
          { id: 'wait_page', action: 'wait', waitMs: 800 },
          { id: 'speak_intro', action: 'speak', speakText: "Let me open the Add Shift dialog..." },
          { id: 'click_add', action: 'click', fastoAction: 'add-shift-button', speakText: "Clicking Add Shift..." },
          { id: 'wait_dialog', action: 'wait', waitMs: 600 },
          { id: 'ask_date', action: 'ask', field: 'shift_date', question: "What date should this shift be on?", transform: parseNaturalDate },
          { id: 'fill_date', action: 'fill', target: '[data-fasto-field="shift-start-date"]', field: 'shift_date' },
          { id: 'ask_time', action: 'ask', field: 'shift_time', question: "What time? For example, 7am to 4pm.", transform: parseNaturalTime },
          { id: 'fill_start_time', action: 'fill', target: '[data-fasto-field="shift-start-time"]', field: 'startTime' },
          { id: 'fill_end_time', action: 'fill', target: '[data-fasto-field="shift-end-time"]', field: 'endTime', skipIf: (data) => !data.endTime },
          { id: 'ask_job', action: 'ask', field: 'job_name', question: "What's the job name or project for this shift?" },
          { id: 'fill_job', action: 'fill', target: '[data-fasto-field="shift-job-name"]', field: 'job_name' },
          { id: 'ask_employees', action: 'ask', field: 'employees', question: "Which team members should be assigned to this shift?" },
          { id: 'select_employees', action: 'select', target: '[data-fasto-action="team-selector"]', field: 'employees' },
          { id: 'confirm', action: 'confirm', question: "Ready to create this shift?", speakText: "Should I create this shift now?" },
          { id: 'save', action: 'click', fastoAction: 'save-shift', speakText: "Creating the shift..." },
          { id: 'complete', action: 'speak', speakText: "Done! The shift has been created." }
        ];

      case 'add_lead_note':
        return [
          { id: 'nav', action: 'navigate', target: '/admin?tab=sales&subtab=leads', speakText: "Opening leads..." },
          { id: 'wait_page', action: 'wait', waitMs: 800 },
          { id: 'ask_lead', action: 'ask', field: 'lead_name', question: "Which lead would you like to add a note to?", skipIf: (data) => !!data.lead_name },
          { id: 'find_lead', action: 'speak', speakText: "Finding the lead..." },
          { id: 'click_menu', action: 'click', target: '[data-fasto-lead-name="${lead_name}"] [data-fasto-action="lead-menu-trigger"]' },
          { id: 'wait_menu', action: 'wait', waitMs: 300 },
          { id: 'click_edit', action: 'click', fastoAction: 'edit-lead', speakText: "Opening edit dialog..." },
          { id: 'wait_dialog', action: 'wait', waitMs: 500 },
          { id: 'ask_note', action: 'ask', field: 'note_content', question: "What note would you like to add?" },
          { id: 'fill_note', action: 'fill', target: '[data-fasto-field="edit-notes"]', field: 'note_content' },
          { id: 'confirm', action: 'confirm', question: "Save this note?" },
          { id: 'save', action: 'click', fastoAction: 'save-lead', speakText: "Saving..." },
          { id: 'complete', action: 'speak', speakText: "Note added!" }
        ];

      case 'create_work_order':
        return [
          { id: 'nav', action: 'navigate', target: '/admin?tab=project-management&subtab=work-orders', speakText: "Opening work orders..." },
          { id: 'wait_page', action: 'wait', waitMs: 800 },
          { id: 'click_add', action: 'click', fastoAction: 'create-work-order', speakText: "Opening create work order dialog..." },
          { id: 'wait_dialog', action: 'wait', waitMs: 500 },
          { id: 'ask_title', action: 'ask', field: 'title', question: "What's the title for this work order?" },
          { id: 'fill_title', action: 'fill', target: '[data-fasto-field="work-order-title"]', field: 'title' },
          { id: 'ask_description', action: 'ask', field: 'description', question: "Can you describe the work needed?", optional: true },
          { id: 'fill_description', action: 'fill', target: '[data-fasto-field="work-order-description"]', field: 'description', skipIf: (data) => !data.description },
          { id: 'ask_priority', action: 'ask', field: 'priority', question: "What priority? Low, medium, high, or urgent?" },
          { id: 'select_priority', action: 'select', target: '[data-fasto-field="work-order-priority"]', field: 'priority' },
          { id: 'ask_assignee', action: 'ask', field: 'assigned_to', question: "Who should this be assigned to?", optional: true },
          { id: 'confirm', action: 'confirm', question: "Ready to create this work order?" },
          { id: 'save', action: 'click', fastoAction: 'save-work-order' },
          { id: 'complete', action: 'speak', speakText: "Work order created!" }
        ];

      case 'create_project':
        return [
          { id: 'nav', action: 'navigate', target: '/admin?tab=project-management&subtab=projects', speakText: "Opening projects..." },
          { id: 'wait_page', action: 'wait', waitMs: 800 },
          { id: 'click_add', action: 'click', fastoAction: 'create-project', speakText: "Opening create project dialog..." },
          { id: 'wait_dialog', action: 'wait', waitMs: 500 },
          { id: 'ask_name', action: 'ask', field: 'name', question: "What's the project name?" },
          { id: 'fill_name', action: 'fill', target: '[data-fasto-field="project-name"]', field: 'name' },
          { id: 'ask_address', action: 'ask', field: 'address', question: "What's the property address?" },
          { id: 'fill_address', action: 'fill', target: '[data-fasto-field="project-address"]', field: 'address' },
          { id: 'ask_customer', action: 'ask', field: 'customer_name', question: "Who's the customer?", optional: true },
          { id: 'fill_customer', action: 'fill', target: '[data-fasto-field="project-customer"]', field: 'customer_name', skipIf: (data) => !data.customer_name },
          { id: 'confirm', action: 'confirm', question: "Ready to create this project?" },
          { id: 'save', action: 'click', fastoAction: 'save-project' },
          { id: 'complete', action: 'speak', speakText: "Project created!" }
        ];

      case 'clock_in_employee':
        return [
          { id: 'nav', action: 'navigate', target: '/admin?tab=workforce&subtab=timesheets', speakText: "Opening timesheets..." },
          { id: 'wait_page', action: 'wait', waitMs: 800 },
          { id: 'ask_employee', action: 'ask', field: 'employee_name', question: "Which employee should I clock in?", skipIf: (data) => !!data.employee_name },
          { id: 'find_employee', action: 'speak', speakText: "Finding the employee..." },
          { id: 'click_clock_in', action: 'click', target: '[data-employee-name="${employee_name}"] [data-fasto-action="clock-in"]' },
          { id: 'ask_job', action: 'ask', field: 'job_name', question: "Which job are they working on?", optional: true },
          { id: 'confirm', action: 'confirm', question: "Clock them in now?" },
          { id: 'complete', action: 'speak', speakText: "Employee clocked in!" }
        ];

      case 'create_safety_meeting':
        return [
          { id: 'nav', action: 'navigate', target: '/admin?tab=workforce&subtab=safety-meetings', speakText: "Opening safety meetings..." },
          { id: 'wait_page', action: 'wait', waitMs: 800 },
          { id: 'click_add', action: 'click', fastoAction: 'create-safety-meeting', speakText: "Creating new safety meeting..." },
          { id: 'wait_dialog', action: 'wait', waitMs: 500 },
          { id: 'ask_title', action: 'ask', field: 'title', question: "What's the title of this safety meeting?" },
          { id: 'fill_title', action: 'fill', target: '[data-fasto-field="safety-meeting-title"]', field: 'title' },
          { id: 'ask_topic', action: 'ask', field: 'topic', question: "What topic will be covered?" },
          { id: 'fill_topic', action: 'fill', target: '[data-fasto-field="safety-meeting-topic"]', field: 'topic' },
          { id: 'ask_date', action: 'ask', field: 'scheduled_date', question: "When should this be scheduled?", transform: parseNaturalDate },
          { id: 'fill_date', action: 'fill', target: '[data-fasto-field="safety-meeting-date"]', field: 'scheduled_date' },
          { id: 'confirm', action: 'confirm', question: "Ready to create this safety meeting?" },
          { id: 'save', action: 'click', fastoAction: 'save-safety-meeting' },
          { id: 'complete', action: 'speak', speakText: "Safety meeting scheduled!" }
        ];

      case 'add_contact':
        return [
          { id: 'nav', action: 'navigate', target: '/admin?tab=workforce&subtab=directory', speakText: "Opening directory..." },
          { id: 'wait_page', action: 'wait', waitMs: 800 },
          { id: 'click_add', action: 'click', fastoAction: 'add-contact', speakText: "Opening add contact dialog..." },
          { id: 'wait_dialog', action: 'wait', waitMs: 500 },
          { id: 'ask_name', action: 'ask', field: 'company_name', question: "What's the company or contact name?" },
          { id: 'fill_name', action: 'fill', target: '[data-fasto-field="contact-name"]', field: 'company_name' },
          { id: 'ask_type', action: 'ask', field: 'contact_type', question: "What type? Vendor, subcontractor, customer, or supplier?" },
          { id: 'select_type', action: 'select', target: '[data-fasto-field="contact-type"]', field: 'contact_type' },
          { id: 'ask_email', action: 'ask', field: 'email', question: "What's their email?", optional: true },
          { id: 'fill_email', action: 'fill', target: '[data-fasto-field="contact-email"]', field: 'email', skipIf: (data) => !data.email },
          { id: 'ask_phone', action: 'ask', field: 'phone', question: "What's their phone number?", optional: true },
          { id: 'fill_phone', action: 'fill', target: '[data-fasto-field="contact-phone"]', field: 'phone', skipIf: (data) => !data.phone },
          { id: 'confirm', action: 'confirm', question: "Ready to add this contact?" },
          { id: 'save', action: 'click', fastoAction: 'save-contact' },
          { id: 'complete', action: 'speak', speakText: "Contact added!" }
        ];

      default:
        return [];
    }
  }

  /**
   * Execute the current step
   */
  private async executeNextStep(): Promise<void> {
    if (!this.activeWorkflow) return;

    const { steps, currentStepIndex, collectedData } = this.activeWorkflow;
    
    if (currentStepIndex >= steps.length) {
      this.activeWorkflow.status = 'completed';
      this.callbacks.onWorkflowComplete?.(this.activeWorkflow);
      return;
    }

    const step = steps[currentStepIndex];
    
    // Check if step should be skipped
    if (step.skipIf && step.skipIf(collectedData)) {
      console.log('[FastoWorkflow] Skipping step:', step.id);
      this.activeWorkflow.currentStepIndex++;
      await this.executeNextStep();
      return;
    }

    this.callbacks.onStepStart?.(step, this.activeWorkflow);
    console.log('[FastoWorkflow] Executing step:', step.id, step.action);

    try {
      switch (step.action) {
        case 'navigate':
          await this.executeNavigate(step);
          break;
        case 'click':
          await this.executeClick(step);
          break;
        case 'fill':
          await this.executeFill(step);
          break;
        case 'select':
          await this.executeSelect(step);
          break;
        case 'ask':
          await this.executeAsk(step);
          return; // Don't auto-advance, wait for user input
        case 'confirm':
          await this.executeConfirm(step);
          return; // Don't auto-advance, wait for user confirmation
        case 'wait':
          await delay(step.waitMs || 500);
          break;
        case 'speak':
          if (step.speakText) {
            await this.speak(step.speakText);
          }
          break;
      }

      this.callbacks.onStepComplete?.(step, this.activeWorkflow);
      this.activeWorkflow.currentStepIndex++;
      await this.executeNextStep();
    } catch (error) {
      console.error('[FastoWorkflow] Step error:', error);
      this.activeWorkflow.status = 'error';
      this.activeWorkflow.error = error instanceof Error ? error.message : 'Unknown error';
      this.callbacks.onWorkflowError?.(this.activeWorkflow.error, this.activeWorkflow);
    }
  }

  private async executeNavigate(step: WorkflowStep): Promise<void> {
    if (step.speakText) {
      await this.speak(step.speakText);
    }
    if (step.target) {
      await navigateToPage(step.target);
    }
  }

  private async executeClick(step: WorkflowStep): Promise<void> {
    if (step.speakText) {
      await this.speak(step.speakText);
    }
    
    const selector = step.fastoAction 
      ? `[data-fasto-action="${step.fastoAction}"]`
      : this.interpolateSelector(step.target || '');
    
    const success = await clickWithHighlight(selector, { waitAfter: 300 });
    
    if (!success && !step.optional) {
      throw new Error(`Could not find element: ${selector}`);
    }
  }

  private async executeFill(step: WorkflowStep): Promise<void> {
    if (!step.field || !step.target) return;
    
    const value = this.activeWorkflow?.collectedData[step.field];
    if (!value && !step.optional) {
      throw new Error(`Missing value for field: ${step.field}`);
    }
    
    if (value) {
      const selector = this.interpolateSelector(step.target);
      await fillInputField(selector, String(value));
    }
  }

  private async executeSelect(step: WorkflowStep): Promise<void> {
    if (!step.field || !step.target) return;
    
    const value = this.activeWorkflow?.collectedData[step.field];
    if (!value && !step.optional) return;
    
    if (value) {
      const selector = this.interpolateSelector(step.target);
      await selectDropdownOption(selector, String(value).toLowerCase());
    }
  }

  private async executeAsk(step: WorkflowStep): Promise<void> {
    if (!step.question || !step.field) return;
    
    this.activeWorkflow!.status = 'waiting_input';
    
    // Speak the question
    await this.speak(step.question);
    
    // Notify callbacks
    this.callbacks.onAskUser?.(step.question, step.field);
    
    // Wait for user input
    const userInput = await this.waitForUserInput();
    
    // Transform the input if needed
    let value: any = userInput;
    if (step.transform) {
      const transformed = step.transform(userInput);
      if (transformed && typeof transformed === 'object') {
        // Handle time range result
        Object.assign(this.activeWorkflow!.collectedData, transformed);
      } else {
        value = transformed || userInput;
      }
    }
    
    // Validate if needed
    if (step.validation) {
      const result = step.validation(String(value));
      if (!result.valid) {
        await this.speak(result.error || "I didn't understand that. Could you try again?");
        await this.executeAsk(step); // Retry
        return;
      }
    }
    
    // Store the value
    if (step.field && !(step.transform && typeof step.transform(userInput) === 'object')) {
      this.activeWorkflow!.collectedData[step.field] = value;
    }
    
    this.activeWorkflow!.status = 'active';
    this.callbacks.onStepComplete?.(step, this.activeWorkflow!);
    this.activeWorkflow!.currentStepIndex++;
    await this.executeNextStep();
  }

  private async executeConfirm(step: WorkflowStep): Promise<void> {
    this.activeWorkflow!.status = 'waiting_input';
    
    // Build summary
    const summary = this.buildSummary();
    const confirmText = step.speakText || step.question || "Should I proceed?";
    await this.speak(`${summary} ${confirmText}`);
    
    this.callbacks.onAskUser?.(confirmText, 'confirm');
    
    const response = await this.waitForUserInput();
    const normalized = response.toLowerCase().trim();
    
    if (['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'go ahead', 'do it', 'create it'].some(p => normalized.includes(p))) {
      this.activeWorkflow!.status = 'active';
      this.callbacks.onStepComplete?.(step, this.activeWorkflow!);
      this.activeWorkflow!.currentStepIndex++;
      await this.executeNextStep();
    } else if (['no', 'nope', 'cancel', 'stop', 'wait'].some(p => normalized.includes(p))) {
      await this.speak("Okay, I'll wait. Let me know what you'd like to change.");
      // Stay at confirm step
    } else {
      // Try to parse as a correction
      await this.speak("I heard: " + response + ". Say 'yes' to proceed or tell me what to change.");
    }
  }

  private buildSummary(): string {
    if (!this.activeWorkflow) return '';
    
    const { type, collectedData } = this.activeWorkflow;
    
    switch (type) {
      case 'create_shift':
        return `Creating shift for ${collectedData.shift_date || 'today'}, ${collectedData.startTime || ''} to ${collectedData.endTime || ''}, ${collectedData.job_name || 'no job'}, assigned to ${collectedData.employees || 'no one yet'}.`;
      case 'add_lead_note':
        return `Adding note to ${collectedData.lead_name}: "${collectedData.note_content?.slice(0, 50) || ''}..."`;
      case 'create_work_order':
        return `Creating work order: ${collectedData.title}, priority ${collectedData.priority || 'normal'}.`;
      case 'create_project':
        return `Creating project: ${collectedData.name} at ${collectedData.address || 'no address'}.`;
      default:
        return '';
    }
  }

  private waitForUserInput(): Promise<string> {
    return new Promise(resolve => {
      this.userInputResolver = resolve;
    });
  }

  private async speak(text: string): Promise<void> {
    if (this.callbacks.onSpeak) {
      await this.callbacks.onSpeak(text);
    } else {
      // Dispatch event for Fasto voice system
      window.dispatchEvent(new CustomEvent('fasto-speak', { detail: { text } }));
      await delay(500 + text.length * 30); // Estimate speech duration
    }
  }

  private interpolateSelector(selector: string): string {
    if (!this.activeWorkflow) return selector;
    
    let result = selector;
    const data = this.activeWorkflow.collectedData;
    
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(`\${${key}}`, String(value));
    }
    
    return result;
  }
}

// Export singleton instance
export const FastoWorkflowEngine = new FastoWorkflowEngineClass();

// Export types
export type { FastoWorkflowEngineClass };
