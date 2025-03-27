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
    try {
      const response = await this.api.get(
        `/cases/${caseId}/reports/${reportId}`,
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      
      // Verify we got a PDF
      if (response.data.type !== 'application/pdf') {
        throw new Error('Invalid response type: expected PDF');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  async downloadReport(caseId: string, reportId: string, fileName?: string): Promise<void> {
    try {
      const blob = await this.getReport(caseId, reportId);
      
      // Create object URL
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName || `report_${caseId}_${new Date().toISOString()}.pdf`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }
}

export default new ReportService();
