import ApiService from './ApiService';
import { User } from './AuthService';

export interface Case {
  id: string;
  user_id: string;
  case_text: string;
  current_stage: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseListResponse {
  cases: Case[];
  total: number;
}

// Interface for Message (from api/app/schemas/case.py Message)
export interface Message {
  id: string;
  case_id: string;
  role: 'user' | 'assistant'; // Assuming these are the only roles based on context
  content: string;
  created_at: string;
}

// Interface for StageResult (from api/app/schemas/case.py StageResult)
export interface StageResult {
  id: string;
  case_id: string;
  stage_name: string;
  result: Record<string, any>; // Represents the JSON result field
  is_approved: boolean;
  created_at: string;
  updated_at?: string;
}

// Interface for the combined CaseDetails response
export interface CaseDetails extends Case { // Extends the existing Case interface
  messages: Message[];
  stage_results: StageResult[];
}


export interface CreateCaseRequest {
  case_text: string;
}

class CaseService extends ApiService {
  async getCases(skip = 0, limit = 100): Promise<CaseListResponse> {
    return this.get<CaseListResponse>('/cases', { params: { skip, limit } });
  }

  async getCase(caseId: string): Promise<Case> {
    return this.get<Case>(`/cases/${caseId}`);
  }

  async createCase(caseData: CreateCaseRequest): Promise<Case> {
    return this.post<Case>('/cases', caseData);
  }

  async deleteCase(caseId: string): Promise<void> {
    return this.delete<void>(`/cases/${caseId}`);
  }

  async getCaseDetails(caseId: string): Promise<CaseDetails> {
    // Calls the new backend endpoint
    return this.get<CaseDetails>(`/cases/${caseId}/details`);
  }

  // Helper method to convert API case to UI case format
  formatCaseForUI(apiCase: Case): {
    id: string;
    patientName: string;
    date: string;
    summary: string;
    status: 'completed' | 'in-progress' | 'new';
  } {
    // Extract patient name from case text (first few words)
    const patientName = apiCase.case_text.split(' ').slice(0, 3).join(' ') + '...';
    
    // Format the date
    const date = new Date(apiCase.created_at).toLocaleDateString();
    
    // Create summary from case text (first 100 chars)
    const summary = apiCase.case_text.length > 100 
      ? apiCase.case_text.substring(0, 100) + '...' 
      : apiCase.case_text;
    
    // Determine status
    let status: 'completed' | 'in-progress' | 'new';
    if (apiCase.is_complete) {
      status = 'completed';
    } else if (apiCase.current_stage === 'initial') {
      status = 'new';
    } else {
      status = 'in-progress';
    }
    
    return {
      id: apiCase.id,
      patientName,
      date,
      summary,
      status
    };
  }
}

export default new CaseService();
