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