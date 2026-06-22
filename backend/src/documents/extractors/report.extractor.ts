import { Injectable } from '@nestjs/common';
import { BaseExtractor } from './base.extractor';

@Injectable()
export class ReportExtractor extends BaseExtractor {
  extract(data: Record<string, unknown>): Record<string, unknown> {
    const reportingPeriod = this.safeObject(data.reportingPeriod);
    const keyFindings = this.safeArray<string>(data.keyFindings);
    const keyMetrics = this.safeArray<Record<string, unknown>>(data.keyMetrics);
    const recommendations = this.safeArray<string>(data.recommendations);
    const sections = this.safeArray<Record<string, unknown>>(data.sections);

    return {
      reportTitle: this.safeString(data.reportTitle),
      reportType: this.safeString(data.reportType),
      author: this.safeString(data.author),
      organisation: this.safeString(data.organisation),
      reportDate: this.safeString(data.reportDate),
      reportingPeriod: reportingPeriod
        ? {
            from: this.safeString(reportingPeriod.from),
            to: this.safeString(reportingPeriod.to),
          }
        : null,
      executiveSummary: this.safeString(data.executiveSummary),
      keyFindings: keyFindings.map((f) => this.safeString(f)).filter(Boolean),
      keyMetrics: keyMetrics.map((m) => ({
        name: this.safeString(m.name),
        value: this.safeString(m.value),
        unit: this.safeString(m.unit),
        trend: this.safeString(m.trend),
      })),
      recommendations: recommendations
        .map((r) => this.safeString(r))
        .filter(Boolean),
      sections: sections.map((s) => ({
        title: this.safeString(s.title),
        summary: this.safeString(s.summary),
      })),
      conclusions: this.safeString(data.conclusions),
      confidence: this.safeNumber(data.confidence),
    };
  }
}
