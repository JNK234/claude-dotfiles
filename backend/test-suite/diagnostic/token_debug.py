#!/usr/bin/env python3
"""
ABOUTME: Token expiration debugging script to analyze JWT token validation issues
ABOUTME: Helps identify mismatches between frontend tokens and backend validation
"""

import sys
import os
import json
import base64
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# Set up path for imports
backend_dir = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, backend_dir)
os.environ['PYTHONPATH'] = backend_dir

def decode_jwt_payload(token: str) -> Optional[Dict[str, Any]]:
    """Decode JWT payload without verification"""
    try:
        # Split the token
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Decode the payload (second part)
        payload = parts[1]
        
        # Add padding if needed
        missing_padding = len(payload) % 4
        if missing_padding:
            payload += '=' * (4 - missing_padding)
        
        # Decode base64
        decoded_bytes = base64.urlsafe_b64decode(payload)
        decoded_payload = json.loads(decoded_bytes)
        
        return decoded_payload
    except Exception as e:
        print(f"Error decoding token: {e}")
        return None

def analyze_token_expiration(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze token expiration details"""
    analysis = {}
    
    if 'exp' in payload:
        exp_timestamp = payload['exp']
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        current_time = datetime.now(timezone.utc)
        
        analysis['expires_at'] = exp_datetime.isoformat()
        analysis['current_time'] = current_time.isoformat()
        analysis['is_expired'] = current_time > exp_datetime
        analysis['time_until_expiry'] = str(exp_datetime - current_time)
        
        if analysis['is_expired']:
            analysis['expired_since'] = str(current_time - exp_datetime)
    
    if 'iat' in payload:
        iat_timestamp = payload['iat']
        iat_datetime = datetime.fromtimestamp(iat_timestamp, tz=timezone.utc)
        analysis['issued_at'] = iat_datetime.isoformat()
    
    return analysis

def check_backend_configuration():
    """Check backend JWT configuration"""
    print("🔍 Checking Backend Configuration...")
    
    from app.core.config import get_settings
    settings = get_settings()
    
    config = {
        'supabase_url': settings.supabase_url,
        'jwt_secret_configured': bool(settings.supabase_jwt_secret),
        'jwt_secret_length': len(settings.supabase_jwt_secret) if settings.supabase_jwt_secret else 0,
        'access_token_expire_minutes': settings.access_token_expire_minutes,
        'legacy_expire_minutes': settings.ACCESS_TOKEN_EXPIRE_MINUTES
    }
    
    print(f"✅ Supabase URL: {config['supabase_url']}")
    print(f"✅ JWT Secret configured: {config['jwt_secret_configured']}")
    print(f"✅ JWT Secret length: {config['jwt_secret_length']} chars")
    print(f"✅ Token expiry (new): {config['access_token_expire_minutes']} minutes")
    print(f"✅ Token expiry (legacy): {config['legacy_expire_minutes']} minutes")
    
    return config

def simulate_token_request():
    """Simulate what happens when frontend sends a request"""
    print("\n🔍 Simulating Token Request Flow...")
    
    # Create a sample token that mimics what Supabase would send
    from app.core.security import create_access_token
    from datetime import timedelta
    
    # Create test token with short expiry for testing
    test_payload = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "role": "authenticated",
        "aud": "authenticated"
    }
    
    # Create token with 1 hour expiry
    token = create_access_token(test_payload, timedelta(hours=1))
    print(f"✅ Created test token: {token[:50]}...")
    
    # Decode and analyze the token
    decoded = decode_jwt_payload(token)
    if decoded:
        print(f"✅ Token payload: {json.dumps(decoded, indent=2)}")
        
        analysis = analyze_token_expiration(decoded)
        print(f"✅ Expiration analysis: {json.dumps(analysis, indent=2)}")
    
    # Try to verify the token
    from app.core.security import verify_supabase_jwt
    result = verify_supabase_jwt(token)
    
    if result:
        print("✅ Token verification: SUCCESS")
    else:
        print("❌ Token verification: FAILED")
    
    return token, decoded

def analyze_supabase_token_format():
    """Analyze what a real Supabase token should look like"""
    print("\n🔍 Analyzing Supabase Token Format...")
    
    # Sample payload structure that Supabase typically uses
    sample_supabase_payload = {
        "aud": "authenticated",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 3600,  # 1 hour from now
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "iss": "https://your-project.supabase.co/auth/v1",
        "sub": "user-uuid-here",
        "email": "user@example.com",
        "phone": "",
        "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": {},
        "role": "authenticated",
        "aal": "aal1",
        "amr": [{"method": "password", "timestamp": int(datetime.now(timezone.utc).timestamp())}],
        "session_id": "session-uuid-here"
    }
    
    print("Expected Supabase token payload structure:")
    print(json.dumps(sample_supabase_payload, indent=2))
    
    return sample_supabase_payload

def check_frontend_backend_mismatch():
    """Check for potential frontend/backend configuration mismatches"""
    print("\n🔍 Checking Frontend/Backend Configuration Alignment...")
    
    # Read frontend .env if it exists
    frontend_env_path = Path(__file__).parent.parent.parent.parent / "frontend" / ".env"
    
    if frontend_env_path.exists():
        print(f"✅ Frontend .env found at: {frontend_env_path}")
        
        frontend_config = {}
        with open(frontend_env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    frontend_config[key] = value
        
        print("Frontend configuration:")
        for key, value in frontend_config.items():
            if 'KEY' in key:
                print(f"  {key}: {value[:20]}..." if value else f"  {key}: (empty)")
            else:
                print(f"  {key}: {value}")
    else:
        print("❌ Frontend .env not found")
        frontend_config = {}
    
    # Compare with backend
    from app.core.config import get_settings
    settings = get_settings()
    
    issues = []
    
    # Check URL match
    frontend_url = frontend_config.get('VITE_SUPABASE_URL', '').strip()
    backend_url = settings.supabase_url.strip()
    
    if frontend_url != backend_url:
        issues.append(f"URL mismatch: Frontend={frontend_url}, Backend={backend_url}")
    
    # Check anon key match
    frontend_key = frontend_config.get('VITE_SUPABASE_ANON_KEY', '').strip()
    backend_key = settings.supabase_anon_key.strip()
    
    if frontend_key != backend_key:
        issues.append(f"Anon key mismatch: Frontend={frontend_key[:20]}..., Backend={backend_key[:20]}...")
    
    if issues:
        print("\n❌ Configuration Issues Found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("\n✅ Frontend/Backend configuration appears to match")
    
    return issues

def generate_debug_recommendations():
    """Generate specific recommendations based on the analysis"""
    print("\n💡 DEBUG RECOMMENDATIONS:")
    print("=" * 50)
    
    print("1. **Check Browser Developer Tools**:")
    print("   - Open Network tab when the error occurs")
    print("   - Look at the /api/cases request")
    print("   - Check the Authorization header value")
    print("   - Copy the actual token being sent")
    
    print("\n2. **Test the actual token**:")
    print("   - Use the copied token with this command:")
    print("   python test-suite/diagnostic/token_debug.py --decode-token 'PASTE_TOKEN_HERE'")
    
    print("\n3. **Check Supabase Dashboard**:")
    print("   - Verify JWT secret matches your project")
    print("   - Check if you're using the right project")
    print("   - Ensure anon key is from the same project")
    
    print("\n4. **Session Management**:")
    print("   - Try logging out and logging back in")
    print("   - Clear browser localStorage and cookies")
    print("   - Check if multiple tabs are interfering")
    
    print("\n5. **Frontend Debug**:")
    print("   - Add console.log in ApiService to see tokens")
    print("   - Check if autoRefreshToken is working")
    print("   - Verify session persistence settings")

def main():
    """Main debugging function"""
    print("🚨 TOKEN EXPIRATION DEBUGGER")
    print("=" * 50)
    
    try:
        # Check if user provided a token to decode
        if len(sys.argv) > 2 and sys.argv[1] == '--decode-token':
            token = sys.argv[2]
            print(f"Decoding provided token: {token[:50]}...")
            
            decoded = decode_jwt_payload(token)
            if decoded:
                print("Token payload:")
                print(json.dumps(decoded, indent=2))
                
                analysis = analyze_token_expiration(decoded)
                print("\nExpiration analysis:")
                print(json.dumps(analysis, indent=2))
            else:
                print("❌ Failed to decode token")
            return
        
        # Run full analysis
        check_backend_configuration()
        simulate_token_request()
        analyze_supabase_token_format()
        issues = check_frontend_backend_mismatch()
        generate_debug_recommendations()
        
        print("\n🎯 NEXT STEPS:")
        if issues:
            print("1. Fix the configuration mismatches above")
            print("2. Restart both frontend and backend")
            print("3. Clear browser cache and try again")
        else:
            print("1. Use browser dev tools to capture the actual failing token")
            print("2. Run this script with --decode-token to analyze it")
            print("3. Check if the issue is with session refresh timing")
        
    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()