# Security Incident Response Plan

**Date**: May 7, 2026  
**Version**: 1.0  
**Status**: Approved  
**Last Review**: May 7, 2026

## Executive Summary

This document outlines the procedures for detecting, responding to, and recovering from security incidents affecting the Lingkod-Ani platform.

---

## Incident Severity Levels

### CRITICAL (Severity 1)
**Response Time**: Immediate (within 15 minutes)

Examples:
- Active data breach in progress
- Unauthorized admin access
- Production system downtime due to attack
- Customer PII compromise
- API key/credential leak

**Actions**:
1. Page on-call security team immediately
2. Activate incident response team
3. Isolate affected systems
4. Begin forensic analysis
5. Notify stakeholders within 1 hour

### HIGH (Severity 2)
**Response Time**: Within 1 hour

Examples:
- SQL injection vulnerability discovered
- Unauthorized access attempt detected
- Malware detected in codebase
- Authentication bypass found
- DDoS attack sustained

**Actions**:
1. Page incident response team
2. Assess impact scope
3. Deploy mitigation
4. Begin root cause analysis
5. Notify leadership

### MEDIUM (Severity 3)
**Response Time**: Within 4 hours

Examples:
- Information disclosure vulnerability
- Weak password policies
- Missing security headers
- Non-critical dependency vulnerability
- Suspicious user activity

**Actions**:
1. Create incident ticket
2. Assign to security team
3. Develop mitigation plan
4. Document issue
5. Schedule remediation

### LOW (Severity 4)
**Response Time**: Within 1 week

Examples:
- Outdated documentation
- Minor code quality issues
- Non-critical lint warnings
- Typos in error messages

**Actions**:
1. Document in backlog
2. Schedule for next sprint
3. Implement if low effort

---

## Incident Response Team

| Role | Responsibility | Contact |
|------|-----------------|---------|
| **Incident Commander** | Coordination, decisions | On-call security lead |
| **Technical Lead** | System diagnosis, remediation | DevOps/Platform lead |
| **Security Engineer** | Analysis, forensics | Security team member |
| **Communications Lead** | Internal/external messaging | Product/Communications |
| **Legal Advisor** | Compliance, notifications | Legal counsel |

---

## Response Procedures

### Phase 1: Detection & Initial Response

#### 1.1 Detection Sources
- Automated monitoring alerts
- Manual security scanning
- User reports
- Third-party security researchers
- Public vulnerability announcements

#### 1.2 Incident Creation
```bash
# Create incident ticket (GitHub Issues or Jira)
Title: [SECURITY INCIDENT] <Brief Description>
Labels: security, incident, severity-<1-4>
Assignee: Incident Commander
```

#### 1.3 Initial Assessment
```
Team Assessment (30 minutes):
- What was affected? (system/service/data)
- Who can access the affected area? (users/systems)
- How did it happen? (vulnerability/misconfiguration)
- Is it still ongoing? (Yes/No)
- What's the impact? (data loss/service unavailable/exposure)
```

---

### Phase 2: Containment

#### 2.1 Containment Actions (By Severity)

**CRITICAL**:
```bash
# Immediate actions (first 15 min)
1. Revoke affected API keys/credentials
2. Disable affected user accounts
3. Block suspicious IP addresses with WAF
4. Rotate database passwords
5. Enable detailed logging for forensics
6. Snapshot affected systems for analysis

# Communication
- Email executive team
- Post status page update
- Notify customers if required by law
```

**HIGH**:
```bash
# Within 1 hour
1. Deploy fix/patch if available
2. Enable detailed logging
3. Review recent access logs
4. Assess impact scope
5. Prepare communication
```

**MEDIUM**:
```bash
# Within 4 hours
1. Plan remediation
2. Create fix/patch
3. Document findings
4. Schedule deployment
```

#### 2.2 System Isolation

```typescript
// Example: Disable compromised user account
export async function disableUserAccount(uid: string) {
  // Disable Firebase auth user
  await admin.auth().updateUser(uid, {
    disabled: true,
  });

  // Revoke all sessions
  await admin.auth().revokeRefreshTokens(uid);

  // Mark as disabled in Firestore
  await admin.firestore().collection('users').doc(uid).update({
    isActive: false,
    disabledAt: new Date(),
    disabledReason: 'Security incident response',
  });

  // Log action
  logSecurityEvent('USER_DISABLED', { uid, reason: 'incident_response' });
}
```

---

### Phase 3: Investigation & Analysis

#### 3.1 Forensic Analysis

```bash
# 1. Collect logs
firebase functions:log
gsutil cp gs://your-bucket/logs logs-backup/

# 2. Analyze access patterns
# - Check Firestore audit logs for unauthorized access
# - Review API gateway logs for anomalies
# - Analyze authentication logs for failed attempts

# 3. Identify root cause
# - Vulnerability type?
# - Configuration error?
# - Credential compromise?
# - Social engineering?

# 4. Determine compromise scope
# - Which systems affected?
# - Which users impacted?
# - How much data exposed?
# - How long was access active?
```

#### 3.2 Timeline Reconstruction

```
Incident Timeline:
- 2026-05-07 14:23 UTC: Unauthorized login attempt detected
- 2026-05-07 14:25 UTC: Account compromised confirmed
- 2026-05-07 14:26 UTC: User disabled, sessions revoked
- 2026-05-07 14:30 UTC: Password reset initiated
- 2026-05-07 14:45 UTC: Root cause identified: weak password
- 2026-05-07 15:00 UTC: Security team briefed
- 2026-05-07 16:00 UTC: Password policy updated
```

---

### Phase 4: Remediation & Recovery

#### 4.1 Fix Implementation

```bash
# 1. Develop patch
# - Code review
# - Test in staging
# - Security review

# 2. Deploy patch
# - Production deployment
# - Health checks
# - Monitoring

# 3. Verify fix
# - Test vulnerability is resolved
# - Check for side effects
# - Monitor for regressions

Example: Patch for SQL injection
- Update query builder to use parameterized queries
- Add input validation
- Review all similar code patterns
```

#### 4.2 System Hardening

```typescript
// Example: Implement rate limiting on auth endpoints
import { RateLimiterMemory } from 'rate-limiter-flexible';

const loginLimiter = new RateLimiterMemory({
  points: 5,           // 5 attempts
  duration: 15 * 60,   // per 15 minutes
});

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  try {
    await loginLimiter.consume(ip);
  } catch {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 }
    );
  }

  // Process login
}
```

#### 4.3 Credential Rotation

```bash
# Rotate all affected credentials
# 1. Service account keys
gcloud iam service-accounts keys create new-key.json \
  --iam-account=sa@project.iam.gserviceaccount.com
gcloud iam service-accounts keys delete OLD_KEY_ID \
  --iam-account=sa@project.iam.gserviceaccount.com

# 2. API keys
# - Generate new keys in Firebase Console
# - Update environment variables
# - Delete old keys

# 3. Database passwords
# Update Firebase Admin credentials
```

---

### Phase 5: Communication

#### 5.1 Internal Communication

```
Timeline:
- T+15 min: Executive briefing (CRITICAL only)
- T+30 min: Team standup
- T+1 hour: Detailed incident report shared
- T+4 hours: Daily updates (until resolved)
- T+72 hours: Post-mortem scheduled
```

**Email Template**:
```
Subject: [SECURITY] Incident Response Initiated

The security team has detected and activated response procedures 
for a potential security issue. 

Severity: HIGH
Status: CONTAINMENT
ETA: 2 hours

More updates to follow hourly.

Incident Commander: <name>
```

#### 5.2 External Communication (If Required)

**Customer Notification** (for data breaches):
```
Subject: Important Security Notice for Lingkod-Ani Account

Dear User,

On [DATE], we detected unauthorized access to some user accounts.
We have immediately secured the affected systems.

What happened:
- Attackers gained access to [X] accounts
- Personal information exposed: [LIST]

What we did:
- Disabled affected accounts
- Revoked all sessions
- Reset passwords
- Investigated root cause

What you should do:
- Change your password
- Enable two-factor authentication
- Monitor account for suspicious activity

We deeply apologize for this incident.

Lingkod-Ani Security Team
```

#### 5.3 Status Page Updates

```
Update frequency:
- CRITICAL: Every 15 minutes
- HIGH: Every hour
- MEDIUM: Every 4 hours

Status: Investigating | Monitoring | Resolving | Monitoring | Resolved
```

---

### Phase 6: Post-Incident Review

#### 6.1 Post-Mortem Meeting (Within 1 week)

```
Agenda:
1. Timeline review (what happened, when)
2. Root cause analysis (why it happened)
3. Impact assessment (what was affected)
4. Response evaluation (what we did right/wrong)
5. Action items (how to prevent recurrence)
6. Documentation (update runbooks)
```

#### 6.2 Post-Mortem Report

```markdown
# Incident Post-Mortem

**Date**: May 7, 2026
**Incident**: Unauthorized User Account Access
**Severity**: HIGH
**Duration**: 45 minutes
**Systems Affected**: User authentication

## Timeline
[Detailed timeline]

## Root Cause
Weak password policy allowed brute-force attack

## Impact
- 1 user account compromised
- No data exfiltration
- 30 minutes of suspicious activity

## What Went Well
✅ Automated detection worked
✅ Fast response (15 min)
✅ Affected account isolated quickly

## What Could Be Better
❌ No rate limiting on login
❌ No 2FA enforcement
❌ Slow forensic data collection

## Action Items
1. Implement login rate limiting (CRITICAL)
2. Enforce 2FA for staff (HIGH)
3. Improve forensic tooling (MEDIUM)
4. Update password policy (MEDIUM)
```

---

## Security Resources & Tools

### Monitoring & Alerting
- Google Cloud Logging
- Cloud Audit Logs
- Vercel Analytics
- Custom monitoring (Performance Monitor)

### Forensic Tools
```bash
# Log analysis
gsutil ls -r gs://your-bucket/logs

# Firebase forensics
firebase functions:log

# System snapshot
tar czf system-backup-$(date +%s).tar.gz /var/app
```

### Communication Channels
- **Internal**: Slack #security-incidents
- **External**: security@lingkod-ani.com
- **Status**: https://status.lingkod-ani.com

---

## Compliance & Legal

### Notification Requirements
- **RA 10173 (PH Data Privacy Act)**: Notify NPC within 72 hours of breach
- **GDPR (if EU users)**: Notify supervisory authority
- **Industry Standards**: Follow NIST Cybersecurity Framework

### Documentation Requirements
- Keep detailed incident logs for 3 years
- Document all forensic findings
- Archive communication records
- Maintain incident database

---

## Prevention & Hardening

### Security Practices
```bash
# Regular security scanning
npm audit
npm run typecheck
npm run lint

# Dependency monitoring
# - Snyk integration
# - GitHub Dependabot
# - Automated PRs for updates

# Code review
# - All changes require review
# - Security checklist
# - Threat modeling for new features
```

### Training
- Annual security awareness training
- Incident response drills (quarterly)
- Secure coding workshops (bi-annual)
- Third-party security audits (annual)

---

## Incident Response Contacts

**On-Call Security Lead**: [Contact Info]  
**Incident Hotline**: [Phone]  
**Emergency Email**: security@lingkod-ani.com  
**Legal Counsel**: [Contact Info]

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-07 | Security Team | Initial version |
| 1.1 | TBD | | Updates based on incidents |

---

**Next Review**: May 7, 2027  
**Approval**: Security Leadership  
**Last Reviewed**: May 7, 2026
