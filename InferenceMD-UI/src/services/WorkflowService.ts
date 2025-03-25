import ApiService from './ApiService';

export interface StageResult {
  stage_name: string;
  result: any; // This will vary based on stage
  is_approved: boolean;
  next_stage: string;
}

export interface StageApprovalResult {
  stage_name: string;
  result: {
    stage_name: string;
    is_approved: boolean;
    next_stage: string;
    message: string;
  };
  is_approved: boolean;
  next_stage: string;
}

class WorkflowService extends ApiService {
  async startWorkflow(caseId: string): Promise<StageResult> {
    return this.post<StageResult>(`/cases/${caseId}/workflow/start`);
  }

  async processStage(caseId: string, stageName: string, inputText?: string): Promise<StageResult> {
    return this.post<StageResult>(
      `/cases/${caseId}/workflow/stages/${stageName}/process`,
      inputText ? { input_text: inputText } : {}
    );
  }

  async approveStage(caseId: string, stageName: string): Promise<StageApprovalResult> {
    return this.post<StageApprovalResult>(`/cases/${caseId}/workflow/stages/${stageName}/approve`);
  }

  // Helper method to map backend stages to frontend stages
  // This maps the backend stages to 3 consolidated frontend stages
  mapStageToUI(backendStage: string): {
    id: string; 
    name: string; 
    category: 'analysis' | 'diagnosis' | 'treatment'
  } {
    const stageMap: Record<string, { name: string, category: 'analysis' | 'diagnosis' | 'treatment' }> = {
      // Consolidated stages
      'patient_case_analysis': { name: 'Patient Case Analysis', category: 'analysis' },
      'diagnosis': { name: 'Diagnosis', category: 'diagnosis' },
      'treatment_planning': { name: 'Treatment Planning', category: 'treatment' },
      
      // Backend stages mapped to consolidated stages
      'initial': { name: 'Patient Case Analysis', category: 'analysis' },
      'extraction': { name: 'Patient Case Analysis', category: 'analysis' },
      'causal_analysis': { name: 'Patient Case Analysis', category: 'analysis' },
      'validation': { name: 'Patient Case Analysis', category: 'analysis' },
      'counterfactual': { name: 'Diagnosis', category: 'diagnosis' },
      'patient_specific': { name: 'Treatment Planning', category: 'treatment' },
      'final_plan': { name: 'Treatment Planning', category: 'treatment' }
    };

    return {
      id: backendStage,
      name: stageMap[backendStage]?.name || backendStage,
      category: stageMap[backendStage]?.category || 'info'
    };
  }

  // Get stages in order (consolidated stages only)
  getStagesInOrder(): string[] {
    return [
      'patient_case_analysis',
      'diagnosis',
      'treatment_planning'
    ];
  }
}

export default new WorkflowService();
