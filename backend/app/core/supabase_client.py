"""
Supabase client configuration for database operations
"""
from supabase import create_client, Client

from app.core.config import settings

# Initialize Supabase client
def get_supabase_client() -> Client:
    """
    Returns a configured Supabase client using service role key
    
    Returns:
        Client: Supabase client
    
    Raises:
        ValueError: If Supabase URL or service key is missing
    """
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_KEY
    
    if not url or not key:
        raise ValueError("Supabase URL or service key is missing")
    
    return create_client(url, key)

# Create a singleton instance
supabase = get_supabase_client() 