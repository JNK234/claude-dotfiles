#!/usr/bin/env python3
"""
ABOUTME: Authentication debugging script to diagnose JWT token expiration issues
ABOUTME: Tests token validation and identifies authentication configuration problems
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import json

# Set up path for imports
backend_dir = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, backend_dir)
os.environ['PYTHONPATH'] = backend_dir

def check_token_configuration():
    """Check authentication configuration"""
    print("🔍 Checking Authentication Configuration...")
    
    from app.core.config import get_settings
    from app.core.security import get_auth_health
    
    settings = get_settings()
    
    print(f"✅ ACCESS_TOKEN_EXPIRE_MINUTES: {settings.access_token_expire_minutes}")
    print(f"✅ ACCESS_TOKEN_EXPIRE_MINUTES (legacy): {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
    print(f"✅ SUPABASE_URL configured: {bool(settings.supabase_url)}")
    print(f"✅ SUPABASE_JWT_SECRET configured: {bool(settings.supabase_jwt_secret)}")
    
    # Check auth health
    health = get_auth_health()
    print(f"✅ Auth Health: {health}")
    
    return True

def debug_token_validation():
    """Debug token validation process"""
    print("\n🔍 Testing Token Validation...")
    
    from app.core.security import verify_supabase_jwt, create_access_token
    from app.core.config import get_settings
    
    settings = get_settings()
    
    # Create a test token
    test_data = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "role": "authenticated",
        "aud": "authenticated"
    }
    
    token = create_access_token(test_data)
    print(f"✅ Created test token: {token[:50]}...")
    
    # Try to verify the token
    payload = verify_supabase_jwt(token)
    if payload:
        print(f"✅ Token verification succeeded")
        print(f"   User ID: {payload.get('sub')}")
        print(f"   Email: {payload.get('email')}")
        print(f"   Expires: {datetime.utcfromtimestamp(payload.get('exp', 0))}")
    else:
        print("❌ Token verification failed")
    
    return payload is not None

def check_frontend_token_handling():
    """Check how frontend might be handling tokens"""
    print("\n🔍 Checking Token Storage Recommendations...")
    
    print("Frontend should:")
    print("1. Store tokens in httpOnly cookies or secure localStorage")
    print("2. Include 'Authorization: Bearer <token>' header in API requests")
    print("3. Handle 401 responses by redirecting to login")
    print("4. Refresh tokens before expiration")
    
    return True

def suggest_fixes():
    """Suggest fixes for the token expiration issue"""
    print("\n💡 SUGGESTED FIXES:")
    print("=" * 50)
    
    print("1. **Frontend Token Refresh**:")
    print("   - Implement automatic token refresh before expiration")
    print("   - Check if frontend is using Supabase auth client properly")
    
    print("\n2. **Check Token Storage**:")
    print("   - Verify tokens are being stored securely in frontend")
    print("   - Ensure tokens aren't being corrupted during storage")
    
    print("\n3. **Authentication Flow**:")
    print("   - Verify Supabase session is being maintained properly")
    print("   - Check if multiple tabs are causing session conflicts")
    
    print("\n4. **Backend Configuration**:")
    print("   - Ensure JWT secret matches your Supabase project")
    print("   - Verify token expiration settings are consistent")
    
    print("\n5. **Debug Steps**:")
    print("   - Check browser dev tools for token in request headers")
    print("   - Look at network requests to see actual token being sent")
    print("   - Check if token format matches expected Supabase format")

def main():
    """Main debugging function"""
    print("🚨 AUTHENTICATION DEBUG TOOL")
    print("=" * 50)
    
    try:
        check_token_configuration()
        debug_token_validation()
        check_frontend_token_handling()
        suggest_fixes()
        
        print("\n🎯 NEXT STEPS:")
        print("1. Check browser dev tools for the actual token being sent")
        print("2. Verify frontend is using Supabase auth properly")
        print("3. Check if token refresh is implemented")
        print("4. Run this again after making frontend changes")
        
    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()