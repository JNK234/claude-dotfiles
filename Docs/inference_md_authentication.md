# InferenceMD Authentication System Documentation

## Table of Contents
- [InferenceMD Authentication System Documentation](#inferencemd-authentication-system-documentation)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Backend Implementation](#backend-implementation)
    - [User Model](#user-model)
    - [Authentication Endpoints](#authentication-endpoints)
    - [JWT Token Generation and Validation](#jwt-token-generation-and-validation)
    - [Protected Routes](#protected-routes)
  - [Frontend Implementation](#frontend-implementation)
    - [Authentication Service](#authentication-service)
    - [API Service](#api-service)
    - [Authentication Context](#authentication-context)
    - [Login Component](#login-component)
  - [Authentication Flow](#authentication-flow)
  - [Expanding the Authentication System](#expanding-the-authentication-system)
  - [Security Considerations](#security-considerations)
  - [Testing](#testing)
  - [Troubleshooting Common Issues](#troubleshooting-common-issues)
    - [422 Unprocessable Entity Error](#422-unprocessable-entity-error)

---

## Overview

The InferenceMD authentication system employs JWT (JSON Web Token) for authentication. The backend is developed with FastAPI, and the frontend uses React, enabling secure login, protected route access, and persistent authentication state.

---

## Backend Implementation

### User Model
Defined in `api/app/models/user.py`:

```python
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="doctor")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Authentication Endpoints
Defined in `api/app/routers/auth.py`:

```python
@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Login logic

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    # Current user information
```

### JWT Token Generation and Validation
Defined in `api/app/core/security.py`:

```python
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    # Generate token

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    # Validate token and retrieve user
```

### Protected Routes

```python
@router.get("/protected-route")
def protected_route(current_user: User = Depends(get_current_user)):
    # Protected route logic
```

---

## Frontend Implementation

### Authentication Service
In `InferenceMD-UI/src/services/AuthService.ts`:

```typescript
class AuthService extends ApiService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Login logic
  }

  async getCurrentUser(): Promise<User> {
    // Retrieve user data
  }

  logout(): void {
    // Logout logic
  }

  isAuthenticated(): boolean {
    // Check authentication status
  }
}
```

### API Service
In `InferenceMD-UI/src/services/ApiService.ts`:

```typescript
class ApiService {
  protected api: AxiosInstance;

  constructor() {
    // Axios setup
  }

  // HTTP methods (get, post, put, delete)
}
```

### Authentication Context
In `InferenceMD-UI/src/contexts/AuthContext.tsx`:

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Manage auth state
}

export const useAuth = () => useContext(AuthContext);
```

### Login Component
In `InferenceMD-UI/src/pages/Login.tsx`:

```typescript
const Login: React.FC = () => {
  // Login form logic
}
```

---

## Authentication Flow

1. User submits credentials.
2. Frontend sends credentials to backend.
3. Backend verifies credentials, returning JWT.
4. Frontend stores JWT, updating state.
5. User redirected to the app.
6. Frontend includes JWT in headers for subsequent requests.
7. Backend verifies JWT for protected routes.

---

## Expanding the Authentication System

- **User Registration**: Backend endpoints, frontend components.
- **Password Reset**: Implement backend/frontend logic.
- **Role-Based Access Control (RBAC)**: Add roles, protect routes.
- **OAuth**: Add third-party OAuth support.
- **Multi-Factor Authentication (MFA)**: Implement MFA processes.

---

## Security Considerations

- HTTPS
- Rate limiting
- Secure hashing (bcrypt)
- Token expiration/refresh tokens
- Input validation
- HTTP-only cookies
- CORS policies

---

## Testing

- **Backend**: Unit/integration tests, end-to-end authentication.
- **Frontend**: Unit/integration tests, E2E login flows.

**Backend Test Example**:

```python
def test_login_success(client, test_user):
    response = client.post("/api/auth/login", data={
        "username": test_user["email"],
        "password": test_user["password"],
    })
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()
```

**Frontend Test Example**:

```typescript
test('login form submits correctly', async () => {
  render(<Login />);
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  fireEvent.click(screen.getByText(/log in/i));
  await waitFor(() => expect(mockLoginFunction).toHaveBeenCalledWith('test@example.com', 'password123'));
});
```

---

## Troubleshooting Common Issues

### 422 Unprocessable Entity Error
- Ensure `OAuth2PasswordRequestForm` is used.
- Frontend sends `application/x-www-form-urlencoded` data using `URLSearchParams`.

