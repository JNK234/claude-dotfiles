#!/usr/bin/env python3
"""
Supabase Configuration Audit Script

This script performs a comprehensive audit of the current Supabase configuration
state without requiring external database connections.

Usage:
    python config_audit.py

Output:
    - Configuration validation report
    - Missing environment variables
    - Configuration recommendations
"""

import os
import sys
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import json

# Add app directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    backend_dir = os.path.join(os.path.dirname(__file__), '..', '..')
    env_path = os.path.join(backend_dir, '.env')
    load_dotenv(env_path)
    print(f"✅ Loaded .env from: {env_path}")
except ImportError:
    print("⚠️ python-dotenv not available, relying on system environment")
except Exception as e:
    print(f"⚠️ Could not load .env file: {e}")


@dataclass
class ConfigCheck:
    """Configuration check result"""
    name: str
    status: str  # 'pass', 'fail', 'warning'
    value: Optional[str]
    message: str
    recommendation: Optional[str] = None


@dataclass
class AuditReport:
    """Complete audit report"""
    timestamp: str
    environment_checks: List[ConfigCheck]
    configuration_checks: List[ConfigCheck]
    supabase_checks: List[ConfigCheck]
    summary: Dict[str, Any]


class SupabaseConfigAuditor:
    """Audits Supabase configuration without external connections"""
    
    def __init__(self):
        self.report = AuditReport(
            timestamp=datetime.now().isoformat(),
            environment_checks=[],
            configuration_checks=[],
            supabase_checks=[],
            summary={}
        )
    
    def audit_environment_variables(self) -> List[ConfigCheck]:
        """Audit all Supabase-related environment variables"""
        checks = []
        
        # Required Supabase variables
        required_vars = {
            'SUPABASE_URL': 'Supabase project URL',
            'SUPABASE_ANON_KEY': 'Supabase anonymous key',
            'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
            'SUPABASE_JWT_SECRET': 'Supabase JWT secret'
        }
        
        for var_name, description in required_vars.items():
            value = os.getenv(var_name)
            if value:
                # Mask sensitive values
                masked_value = f"{value[:8]}..." if len(value) > 8 else "***"
                checks.append(ConfigCheck(
                    name=var_name,
                    status='pass',
                    value=masked_value,
                    message=f"{description} is set"
                ))
            else:
                checks.append(ConfigCheck(
                    name=var_name,
                    status='fail',
                    value=None,
                    message=f"{description} is missing",
                    recommendation=f"Set {var_name} in your .env file"
                ))
        
        # Optional database variables
        optional_vars = {
            'SUPABASE_DATABASE_URL': 'Direct database connection URL',
            'SUPABASE_DB_HOST': 'Database host',
            'SUPABASE_DB_PORT': 'Database port',
            'SUPABASE_DB_NAME': 'Database name',
            'SUPABASE_DB_USER': 'Database user',
            'SUPABASE_DB_PASSWORD': 'Database password'
        }
        
        for var_name, description in optional_vars.items():
            value = os.getenv(var_name)
            if value:
                masked_value = f"{value[:8]}..." if len(value) > 8 else "***"
                checks.append(ConfigCheck(
                    name=var_name,
                    status='pass',
                    value=masked_value,
                    message=f"{description} is set"
                ))
            else:
                checks.append(ConfigCheck(
                    name=var_name,
                    status='warning',
                    value=None,
                    message=f"{description} is not set (optional)",
                    recommendation=f"Consider setting {var_name} for direct database access"
                ))
        
        return checks
    
    def audit_configuration_loading(self) -> List[ConfigCheck]:
        """Test configuration loading without importing problematic modules"""
        checks = []
        
        try:
            # Test basic environment loading
            checks.append(ConfigCheck(
                name="Environment Loading",
                status='pass',
                value="Success",
                message="Environment variables can be loaded"
            ))
        except Exception as e:
            checks.append(ConfigCheck(
                name="Environment Loading",
                status='fail',
                value=None,
                message=f"Failed to load environment: {e}",
                recommendation="Check .env file format and location"
            ))
        
        try:
            # Test if we can import settings without Supabase initialization
            from app.core.config import Settings
            
            # Create settings instance without initialization
            settings = Settings()
            
            checks.append(ConfigCheck(
                name="Settings Class",
                status='pass',
                value="Success",
                message="Settings class can be instantiated"
            ))
            
            # Check required Supabase fields
            required_fields = ['supabase_url', 'supabase_anon_key', 'supabase_service_role_key', 'supabase_jwt_secret']
            for field in required_fields:
                if hasattr(settings, field):
                    value = getattr(settings, field)
                    if value and value != "":
                        checks.append(ConfigCheck(
                            name=f"Settings.{field}",
                            status='pass',
                            value="Set",
                            message=f"Configuration field {field} is available"
                        ))
                    else:
                        checks.append(ConfigCheck(
                            name=f"Settings.{field}",
                            status='fail',
                            value=None,
                            message=f"Configuration field {field} is empty or missing",
                            recommendation=f"Ensure {field.upper()} environment variable is set"
                        ))
                else:
                    checks.append(ConfigCheck(
                        name=f"Settings.{field}",
                        status='fail',
                        value=None,
                        message=f"Configuration field {field} not found in Settings",
                        recommendation="Check Settings class definition"
                    ))
            
        except ImportError as e:
            checks.append(ConfigCheck(
                name="Settings Import",
                status='fail',
                value=None,
                message=f"Cannot import Settings: {e}",
                recommendation="Check backend path and dependencies"
            ))
        except Exception as e:
            checks.append(ConfigCheck(
                name="Settings Creation",
                status='fail',
                value=None,
                message=f"Cannot create Settings instance: {e}",
                recommendation="Check environment variables and Settings validation"
            ))
        
        return checks
    
    def audit_supabase_configuration(self) -> List[ConfigCheck]:
        """Audit Supabase-specific configuration without connection"""
        checks = []
        
        try:
            # Test URL format
            supabase_url = os.getenv('SUPABASE_URL')
            if supabase_url:
                if supabase_url.startswith('https://') and '.supabase.co' in supabase_url:
                    checks.append(ConfigCheck(
                        name="Supabase URL Format",
                        status='pass',
                        value="Valid",
                        message="Supabase URL has correct format"
                    ))
                else:
                    checks.append(ConfigCheck(
                        name="Supabase URL Format",
                        status='warning',
                        value=supabase_url[:20] + "...",
                        message="Supabase URL format may be incorrect",
                        recommendation="Ensure URL follows format: https://your-project.supabase.co"
                    ))
            
            # Test key lengths (basic validation)
            anon_key = os.getenv('SUPABASE_ANON_KEY')
            if anon_key:
                if len(anon_key) > 100:  # Supabase keys are typically long
                    checks.append(ConfigCheck(
                        name="Anon Key Length",
                        status='pass',
                        value=f"{len(anon_key)} chars",
                        message="Anonymous key length appears valid"
                    ))
                else:
                    checks.append(ConfigCheck(
                        name="Anon Key Length",
                        status='warning',
                        value=f"{len(anon_key)} chars",
                        message="Anonymous key may be too short",
                        recommendation="Verify key is copied correctly from Supabase dashboard"
                    ))
            
            service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            if service_key:
                if len(service_key) > 100:
                    checks.append(ConfigCheck(
                        name="Service Key Length",
                        status='pass',
                        value=f"{len(service_key)} chars",
                        message="Service role key length appears valid"
                    ))
                else:
                    checks.append(ConfigCheck(
                        name="Service Key Length",
                        status='warning',
                        value=f"{len(service_key)} chars",
                        message="Service role key may be too short",
                        recommendation="Verify key is copied correctly from Supabase dashboard"
                    ))
            
        except Exception as e:
            checks.append(ConfigCheck(
                name="Supabase Configuration",
                status='fail',
                value=None,
                message=f"Error validating Supabase configuration: {e}",
                recommendation="Check environment variables and their format"
            ))
        
        return checks
    
    def test_import_isolation(self) -> List[ConfigCheck]:
        """Test if we can import modules without triggering Supabase connection"""
        checks = []
        
        # Test individual module imports
        import_tests = [
            ('app.core.config', 'Configuration module'),
            ('app.utils.sse', 'SSE utilities'),
        ]
        
        for module_name, description in import_tests:
            try:
                __import__(module_name)
                checks.append(ConfigCheck(
                    name=f"Import {module_name}",
                    status='pass',
                    value="Success",
                    message=f"{description} can be imported"
                ))
            except Exception as e:
                checks.append(ConfigCheck(
                    name=f"Import {module_name}",
                    status='fail',
                    value=None,
                    message=f"Cannot import {description}: {e}",
                    recommendation="Check module dependencies and Supabase initialization"
                ))
        
        # Test problematic import (Supabase module)
        try:
            import app.core.supabase
            checks.append(ConfigCheck(
                name="Import app.core.supabase",
                status='warning',
                value="Success",
                message="Supabase module imported (may have triggered connection)",
                recommendation="Consider lazy initialization to avoid connection on import"
            ))
        except Exception as e:
            checks.append(ConfigCheck(
                name="Import app.core.supabase",
                status='fail',
                value=None,
                message=f"Cannot import Supabase module: {e}",
                recommendation="This is the main issue blocking tests - needs configuration fix"
            ))
        
        return checks
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate summary of audit results"""
        all_checks = (
            self.report.environment_checks + 
            self.report.configuration_checks + 
            self.report.supabase_checks
        )
        
        summary = {
            'total_checks': len(all_checks),
            'passed': len([c for c in all_checks if c.status == 'pass']),
            'failed': len([c for c in all_checks if c.status == 'fail']),
            'warnings': len([c for c in all_checks if c.status == 'warning']),
            'critical_issues': [],
            'recommendations': []
        }
        
        # Identify critical issues
        critical_issues = [c for c in all_checks if c.status == 'fail']
        summary['critical_issues'] = [
            f"{c.name}: {c.message}" for c in critical_issues
        ]
        
        # Collect recommendations
        recommendations = [c.recommendation for c in all_checks if c.recommendation]
        summary['recommendations'] = list(set(recommendations))  # Remove duplicates
        
        # Overall status
        if summary['failed'] == 0:
            summary['overall_status'] = 'HEALTHY'
        elif summary['failed'] < 3:
            summary['overall_status'] = 'NEEDS_ATTENTION'
        else:
            summary['overall_status'] = 'CRITICAL'
        
        return summary
    
    def run_audit(self) -> AuditReport:
        """Run complete configuration audit"""
        print("🔍 Starting Supabase Configuration Audit...")
        
        print("  ✓ Checking environment variables...")
        self.report.environment_checks = self.audit_environment_variables()
        
        print("  ✓ Testing configuration loading...")
        self.report.configuration_checks = self.audit_configuration_loading()
        
        print("  ✓ Validating Supabase configuration...")
        self.report.supabase_checks = self.audit_supabase_configuration()
        
        print("  ✓ Testing import isolation...")
        import_checks = self.test_import_isolation()
        self.report.configuration_checks.extend(import_checks)
        
        print("  ✓ Generating summary...")
        self.report.summary = self.generate_summary()
        
        return self.report
    
    def print_report(self, report: AuditReport):
        """Print formatted audit report"""
        print("\n" + "="*80)
        print("🏥 SUPABASE CONFIGURATION AUDIT REPORT")
        print("="*80)
        print(f"Timestamp: {report.timestamp}")
        print(f"Overall Status: {report.summary['overall_status']}")
        print(f"Total Checks: {report.summary['total_checks']} | "
              f"Passed: {report.summary['passed']} | "
              f"Failed: {report.summary['failed']} | "
              f"Warnings: {report.summary['warnings']}")
        
        # Environment Variables
        print("\n📋 ENVIRONMENT VARIABLES")
        print("-" * 40)
        for check in report.environment_checks:
            status_icon = {"pass": "✅", "fail": "❌", "warning": "⚠️"}[check.status]
            print(f"{status_icon} {check.name}: {check.message}")
            if check.value:
                print(f"   Value: {check.value}")
            if check.recommendation:
                print(f"   💡 {check.recommendation}")
        
        # Configuration Loading
        print("\n⚙️ CONFIGURATION LOADING")
        print("-" * 40)
        for check in report.configuration_checks:
            status_icon = {"pass": "✅", "fail": "❌", "warning": "⚠️"}[check.status]
            print(f"{status_icon} {check.name}: {check.message}")
            if check.recommendation:
                print(f"   💡 {check.recommendation}")
        
        # Supabase Configuration
        print("\n🔗 SUPABASE CONFIGURATION")
        print("-" * 40)
        for check in report.supabase_checks:
            status_icon = {"pass": "✅", "fail": "❌", "warning": "⚠️"}[check.status]
            print(f"{status_icon} {check.name}: {check.message}")
            if check.recommendation:
                print(f"   💡 {check.recommendation}")
        
        # Critical Issues
        if report.summary['critical_issues']:
            print("\n🚨 CRITICAL ISSUES TO FIX")
            print("-" * 40)
            for issue in report.summary['critical_issues']:
                print(f"❌ {issue}")
        
        # Recommendations
        if report.summary['recommendations']:
            print("\n💡 RECOMMENDATIONS")
            print("-" * 40)
            for i, rec in enumerate(report.summary['recommendations'], 1):
                print(f"{i}. {rec}")
        
        # Next Steps
        print("\n🎯 NEXT STEPS")
        print("-" * 40)
        if report.summary['overall_status'] == 'CRITICAL':
            print("1. Fix critical configuration issues above")
            print("2. Create .env file with required Supabase variables")
            print("3. Re-run audit to verify fixes")
        elif report.summary['overall_status'] == 'NEEDS_ATTENTION':
            print("1. Address failed checks and warnings")
            print("2. Proceed with Step 2: Isolated Configuration Testing")
        else:
            print("1. Configuration looks good!")
            print("2. Proceed with Step 2: Isolated Configuration Testing")
        
        print("\n" + "="*80)
    
    def save_report(self, report: AuditReport, filename: str = "supabase_audit_report.json"):
        """Save report to JSON file"""
        report_dir = os.path.join(os.path.dirname(__file__), '..', 'reports')
        os.makedirs(report_dir, exist_ok=True)
        
        filepath = os.path.join(report_dir, filename)
        
        # Convert report to dict for JSON serialization
        report_dict = {
            'timestamp': report.timestamp,
            'environment_checks': [
                {
                    'name': c.name,
                    'status': c.status,
                    'value': c.value,
                    'message': c.message,
                    'recommendation': c.recommendation
                } for c in report.environment_checks
            ],
            'configuration_checks': [
                {
                    'name': c.name,
                    'status': c.status,
                    'value': c.value,
                    'message': c.message,
                    'recommendation': c.recommendation
                } for c in report.configuration_checks
            ],
            'supabase_checks': [
                {
                    'name': c.name,
                    'status': c.status,
                    'value': c.value,
                    'message': c.message,
                    'recommendation': c.recommendation
                } for c in report.supabase_checks
            ],
            'summary': report.summary
        }
        
        with open(filepath, 'w') as f:
            json.dump(report_dict, f, indent=2)
        
        print(f"\n📄 Report saved to: {filepath}")


def main():
    """Main execution function"""
    auditor = SupabaseConfigAuditor()
    
    try:
        report = auditor.run_audit()
        auditor.print_report(report)
        auditor.save_report(report)
        
        # Return appropriate exit code
        if report.summary['overall_status'] == 'CRITICAL':
            sys.exit(1)
        elif report.summary['overall_status'] == 'NEEDS_ATTENTION':
            sys.exit(2)
        else:
            sys.exit(0)
            
    except Exception as e:
        print(f"❌ Audit failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()