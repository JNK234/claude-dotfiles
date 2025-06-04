# 🚀 Supabase Migration Guide

This guide walks you through migrating MedhastraAI from a hybrid local PostgreSQL + Supabase auth setup to a **full Supabase integration**.

## 📋 Overview

### What Changed
- ✅ **Before**: Local PostgreSQL + Supabase Auth + Complex user sync
- ✅ **After**: Supabase PostgreSQL + Supabase Auth + Direct integration
- ✅ **Benefits**: Simpler architecture, RLS security, no user sync complexity

## 🔧 Step-by-Step Migration

### **Step 1: Set Up Supabase Database**

1. **Run the Schema Migration**
   ```sql
   -- In Supabase SQL Editor, run:
   -- Copy contents from backend/supabase_schema_migration.sql
   ```

2. **Set Up RLS Policies**
   ```sql
   -- In Supabase SQL Editor, run:
   -- Copy contents from backend/supabase_rls_policies.sql
   ```

3. **Verify Tables**
   ```sql
   -- Check all tables were created
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### **Step 2: Update Environment Variables**

Create/update your `.env` file with Supabase configuration:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database Connection (from Supabase Dashboard > Settings > Database)
SUPABASE_DATABASE_URL=postgresql://postgres:password@host:5432/postgres
SUPABASE_DB_HOST=your-db-host
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password
```

### **Step 3: Install Dependencies**

```bash
cd backend
pip install supabase
```

### **Step 4: Test the Setup**

1. **Start the backend**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Check health endpoint**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Test authentication** (with a valid Supabase JWT token)
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:8000/api/cases
   ```

## 🔄 Data Migration (Optional)

If you have existing data in local PostgreSQL:

### **Option 1: Export/Import Data**

1. **Export from local PostgreSQL**
   ```bash
   pg_dump your_local_db > local_data.sql
   ```

2. **Clean and adapt the SQL**
   - Remove incompatible constraints
   - Ensure UUIDs match Supabase auth.users IDs
   - Adapt schema differences

3. **Import to Supabase**
   ```bash
   psql "your-supabase-connection-string" < cleaned_data.sql
   ```

### **Option 2: Programmatic Migration**

Create a migration script:

```python
# migration_script.py
import asyncio
from app.core.database import get_db
from app.core.supabase import supabase_service_instance

async def migrate_cases():
    # Get data from local DB
    # Insert into Supabase using supabase_service_instance
    pass

if __name__ == "__main__":
    asyncio.run(migrate_cases())
```

## 🧪 Testing

### **Unit Tests**
```bash
cd backend
python -m pytest tests/ -v
```

### **Manual Testing Checklist**

- [ ] User can sign up via Supabase Auth
- [ ] JWT tokens are properly validated
- [ ] Cases are created and retrieved
- [ ] Messages work correctly
- [ ] RLS policies enforce user isolation
- [ ] File uploads work (if applicable)

## 🛠️ Troubleshooting

### **Common Issues**

1. **403 Forbidden Errors**
   - Check RLS policies are correctly applied
   - Verify JWT token contains correct `sub` field
   - Ensure service role is being used for backend operations

2. **Database Connection Errors**
   - Verify database credentials in `.env`
   - Check if Supabase instance is running
   - Ensure connection pooling URL is used if available

3. **JWT Token Validation Errors**
   - Verify `SUPABASE_JWT_SECRET` matches your project
   - Check token hasn't expired
   - Ensure token audience is "authenticated"

4. **Profile Not Found Errors**
   - Check if user profile was auto-created on signup
   - Verify the trigger function is working
   - Manually create profile if needed

### **Debug Commands**

```bash
# Check database connection
python -c "from app.core.database import check_db_connection; print(check_db_connection())"

# Check Supabase connection  
python -c "from app.core.supabase import supabase_service_instance; import asyncio; print(asyncio.run(supabase_service_instance.health_check()))"

# Test JWT verification
python -c "from app.core.security import verify_supabase_jwt; print(verify_supabase_jwt('YOUR_TOKEN'))"
```

## 🔍 Verification Steps

### **1. Database Schema**
```sql
-- Verify all tables exist
\dt public.*

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### **2. Authentication Flow**
1. User signs up → Profile auto-created
2. User gets JWT token → Token validated
3. User makes API request → RLS allows access to own data

### **3. API Endpoints**
Test all endpoints with proper authentication:
- `GET /api/cases` - List user's cases
- `POST /api/cases` - Create new case
- `GET /api/cases/{id}/messages` - Get case messages
- `POST /api/cases/{id}/messages` - Send message

## 📚 Architecture Overview

### **New Architecture**
```
Frontend (React/Next.js)
    ↓ (Supabase Auth)
Supabase Auth Service
    ↓ (JWT Token)
FastAPI Backend
    ↓ (Service Role / RLS)
Supabase PostgreSQL
```

### **Key Components**
- **`app/core/supabase.py`** - Direct Supabase operations
- **`app/core/security.py`** - JWT validation and user auth
- **`app/core/database.py`** - SQLAlchemy with Supabase PostgreSQL
- **RLS Policies** - Database-level security

## 🎯 Next Steps

1. **Remove Legacy Code** (after successful migration)
   - Old local PostgreSQL configurations
   - Complex user synchronization logic
   - Unused authentication functions

2. **Optimize Performance**
   - Add database indexes for common queries
   - Implement caching where appropriate
   - Monitor RLS policy performance

3. **Enhance Security**
   - Regular security audits of RLS policies
   - Implement rate limiting
   - Add request logging and monitoring

## 🆘 Support

If you encounter issues during migration:

1. **Check logs** - Enable debug mode and check application logs
2. **Verify configuration** - Double-check all environment variables
3. **Test components individually** - Use the debug commands above
4. **Database inspection** - Use Supabase dashboard to inspect data

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [FastAPI with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-fastapi)
- [JWT Verification Guide](https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr) 