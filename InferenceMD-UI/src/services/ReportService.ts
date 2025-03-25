import ApiService from './ApiService';

export interface Report {
  id: string;
  case_id: string;
  file_path: string;
  created_at: string;
}

class ReportService extends ApiService {
  async generateReport(caseId: string): Promise<Report> {
    return this.post<Report>(`/cases/${caseId}/reports`);
  }

  async getReport(caseId: string, reportId: string): Promise<Blob> {
    const response = await this.api.get<Blob>(
      `/cases/${caseId}/reports/${reportId}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  async downloadReport(caseId: string, reportId: string, fileName?: string): Promise<void> {
    const blob = await this.getReport(caseId, reportId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `report_${caseId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export default new ReportService();