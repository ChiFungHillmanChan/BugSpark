# Phase 4: Enterprise

Enterprise-grade features for larger customers. These are required for companies with compliance requirements, security policies, or scale needs.

## Tasks

| # | Task | Priority | Complexity |
|---|------|----------|-----------|
| 4.1 | [SSO (SAML / OIDC)](./4.1-sso.md) | HIGH | High |
| 4.2 | [Audit log](./4.2-audit-log.md) | HIGH | Medium |
| 4.3 | [Mobile SDK](./4.3-mobile-sdk.md) | MEDIUM | Very High |
| 4.4 | [White-label / reseller](./4.4-white-label.md) | LOW | Medium |
| 4.5 | [On-premise deployment](./4.5-on-premise.md) | LOW | High |

## Dependencies

```
4.1 SSO (independent)
4.2 Audit Log (independent, but should be implemented alongside SSO)
4.3 Mobile SDK (independent, very large scope)
4.4 White-label ──depends on──> custom branding (Phase 2/3)
4.5 On-premise ──depends on──> Docker setup refinement
```

## Revenue Impact

Enterprise features unlock custom pricing deals. A single Enterprise customer at HK$5,000-10,000/month can equal 30-60 Starter customers. These features are table stakes for Enterprise sales conversations.
