# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please email security@ecofeed.io instead of using the issue tracker.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and keep you informed of progress.

---

## Security Best Practices

### Backend Security

✅ **Implemented**
- CORS restricted to specific origins
- Input validation with Pydantic
- Rate limiting on all endpoints
- Secure error handling (no stack traces in production)
- Logging of suspicious activities
- Environment-based configuration
- Parameterized database queries (future)

⚠️ **Planned**
- JWT authentication
- Role-based access control (RBAC)
- API key management
- Request signing
- Audit logging

### Frontend Security

✅ **Implemented**
- Content Security Policy ready
- XSS prevention via React escaping
- CSRF token support ready
- Secure HTTP headers configured
- Environment variable isolation

⚠️ **Planned**
- OAuth 2.0 integration
- Session management
- Secure password storage
- 2FA support

### Infrastructure Security

✅ **Implemented**
- Docker image security scanning (Trivy)
- SSL/TLS enforcement
- Health checks for service availability
- Network isolation with Docker networks

⚠️ **Planned**
- Web Application Firewall (WAF)
- DDoS protection
- Intrusion detection
- Security monitoring

---

## Secure Deployment Checklist

- [ ] Generate strong JWT_SECRET (at least 32 characters)
- [ ] Use HTTPS only (no HTTP)
- [ ] Set ENVIRONMENT=production
- [ ] Restrict ALLOWED_ORIGINS to your domain only
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS certificate
- [ ] Setup regular backups
- [ ] Configure firewall rules
- [ ] Enable API rate limiting
- [ ] Setup monitoring and alerting
- [ ] Review logs regularly
- [ ] Keep dependencies updated
- [ ] Implement audit logging
- [ ] Setup incident response plan

---

## Dependency Security

### Backend
- Keep Python packages updated: `pip list --outdated`
- Use `pip-audit` to check for vulnerabilities
- Review `requirements.txt` regularly

### Frontend
- Keep npm packages updated: `npm outdated`
- Use `npm audit` to check for vulnerabilities
- Review `package.json` regularly

```bash
# Check for vulnerabilities
# Backend
pip-audit

# Frontend
npm audit
```

---

## API Security

### Authentication (Future)

```python
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel

class Settings(BaseModel):
    authjwt_secret_key: str = os.getenv("JWT_SECRET")

@app.post("/login")
async def login(credentials: LoginSchema, Authorize: AuthJWT = Depends()):
    # Verify credentials
    access_token = Authorize.create_access_token(subject=user_id)
    return {"access_token": access_token}

@app.get("/protected")
async def protected(Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    # Protected endpoint logic
```

### Authorization (Future)

```python
from fastapi import Security

def verify_admin(current_user = Security(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@app.delete("/listings/{id}")
async def delete_listing(id: str, admin = Security(verify_admin)):
    # Only admin can delete
    pass
```

---

## Data Protection

### Sensitive Data
- Never commit `.env` files with real values
- Use `.env.example` for templates
- Rotate API keys regularly
- Store secrets in a secrets manager (AWS Secrets Manager, HashiCorp Vault)

### Database
- Encrypt data at rest
- Use connection encryption (SSL/TLS)
- Implement row-level security
- Regular backups with encryption

### Data Retention
- Define retention policies
- Implement data deletion after retention period
- GDPR compliant data handling

---

## Incident Response

### If Compromised

1. **Immediate Actions**
   - Rotate all API keys
   - Reset all passwords
   - Review access logs
   - Take affected services offline if necessary

2. **Notification**
   - Notify all affected users
   - Publish security notice
   - Contact relevant authorities if required

3. **Recovery**
   - Deploy patches
   - Restore from clean backups
   - Run security audit
   - Resume services with monitoring

---

## Third-Party Security

### Google Gemini API
- Restrict API key to required APIs only
- Use IP whitelisting if available
- Monitor usage patterns
- Rotate key regularly

### Supabase
- Use service role key only on backend
- Use anon key on frontend with RLS enabled
- Monitor access logs
- Enable audit logging

---

## Regular Security Tasks

- [ ] Weekly: Review error logs for patterns
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review API access logs
- [ ] Quarterly: Security audit
- [ ] Quarterly: Penetration testing
- [ ] Yearly: Disaster recovery drill

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://owasp.org/www-community/attacks/xss/)
- [Docker Security](https://docs.docker.com/engine/security/)

---

## Contact

Security questions: security@ecofeed.io
General support: support@ecofeed.io

---

**Last Updated:** April 2026
