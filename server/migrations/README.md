# Gmail Multi-Account Migration Guide

## 🎯 Purpose
Migrate existing users from legacy single Gmail connection to new multi-account structure.

## ⚠️ IMPORTANT - Read Before Running

### What This Migration Does
1. ✅ Finds users with legacy Gmail tokens (`gmailAccessToken`, `gmailRefreshToken`)
2. ✅ Fetches their Gmail email address from Google API
3. ✅ Creates first entry in `gmailAccounts` array
4. ✅ Sets account as primary (`isPrimary: true`)
5. ✅ Backfills all user's emails with `gmailAccountId`
6. ✅ Preserves legacy fields (no data loss)

### Safety Features
- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Never deletes data
- **Skips migrated users**: Won't duplicate accounts
- **Detailed logging**: See exactly what happens
- **Error handling**: Continues on individual failures

---

## 🚀 How to Run

### 1. Backup Database (CRITICAL)
```bash
# MongoDB backup command
mongodump --uri="your_mongodb_uri" --out=./backup-$(date +%Y%m%d)
```

### 2. Test on Development First
```bash
# Make sure you're using dev database
cd server
node migrations/migrate-gmail-accounts.js
```

### 3. Review Output
Check the migration summary:
```
📊 MIGRATION SUMMARY
====================================
Total users:          10
✅ Migrated:          7
✓  Already migrated:  2
⊘  Skipped (no tokens): 1
❌ Errors:            0
====================================
```

### 4. Verify in Database
```javascript
// MongoDB shell
db.users.findOne({ email: "test@example.com" })

// Check for:
// - gmailAccounts array exists
// - activeGmailAccountId is set
// - isPrimary is true for first account
```

### 5. Verify Emails
```javascript
// Check emails have gmailAccountId
db.emails.findOne({ userId: ObjectId("...") })

// Should have:
// - gmailAccountId field
```

---

## 📊 Expected Outcomes

### User Document (Before)
```json
{
  "email": "user@example.com",
  "gmailAccessToken": "encrypted...",
  "gmailRefreshToken": "encrypted...",
  "isGmailConnected": true,
  "gmailAccounts": []
}
```

### User Document (After)
```json
{
  "email": "user@example.com",
  "gmailAccessToken": "encrypted...",  // Preserved
  "gmailRefreshToken": "encrypted...", // Preserved
  "isGmailConnected": true,
  "gmailAccounts": [{
    "email": "gmail@example.com",
    "accessToken": "encrypted...",
    "refreshToken": "encrypted...",
    "label": "Personal",
    "isPrimary": true,
    "status": "connected",
    "provider": "gmail",
    "connectedAt": "2026-01-11T..."
  }],
  "activeGmailAccountId": ObjectId("...")
}
```

---

## 🐛 Troubleshooting

### "Could not fetch Gmail email"
**Cause**: Token expired or invalid
**Solution**: User needs to reconnect Gmail (will auto-migrate on OAuth callback)

### "Error migrating user"
**Cause**: Various (network, API limits, etc.)
**Solution**: Check error message, user can reconnect manually

### Migration shows 0 migrated
**Possible reasons**:
1. All users already migrated ✅
2. No users have Gmail connected
3. All tokens are invalid

---

## 🔄 Re-running Migration

Safe to run multiple times:
- Already migrated users are skipped
- No duplicate accounts created
- Idempotent operations

---

## 📝 Post-Migration Checklist

- [ ] All expected users migrated
- [ ] `gmailAccounts` array populated
- [ ] `activeGmailAccountId` set
- [ ] Emails have `gmailAccountId`
- [ ] No errors in logs
- [ ] Test OAuth add-account flow
- [ ] Test email sync with account
- [ ] Test account switching

---

## 🚨 Rollback (If Needed)

Migration is non-destructive, but if needed:

```javascript
// MongoDB shell - remove gmailAccounts
db.users.updateMany(
  {},
  {
    $set: { gmailAccounts: [], activeGmailAccountId: null }
  }
);

// Remove gmailAccountId from emails
db.emails.updateMany(
  {},
  {
    $unset: { gmailAccountId: "" }
  }
);
```

**Note**: Only do this if absolutely necessary. Consult team first.

---

## ✅ Success Criteria

Migration is successful when:
1. All users with Gmail show in `gmailAccounts` array
2. Each user has `activeGmailAccountId` set
3. All emails have `gmailAccountId`
4. No errors in migration log
5. OAuth add-account flow works
6. Email sync works per-account

---

## 📞 Support

If migration fails or has unexpected results:
1. Check migration logs
2. Verify database backup exists
3. Review error messages
4. Test with single user first
5. Contact dev team if needed
