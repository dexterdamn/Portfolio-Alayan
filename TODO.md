# Task: Remove email notifications from contact.html (messages to admin.html via Firebase)

## Steps:

### 1. [x] Edit contact.html ✓
   - Remove EmailJS script/init ✓
   - Remove EMAILJS constants ✓
   - Remove emailjs.send() from sendMessage() ✓
   - Update bottom bar UI ✓

### 2. [x] Test ✓
   - Send message from contact.html ✓
   - Verify appears in admin.html (password: dexter2025) ✓
   - Confirm no email sent ✓

### 3. [x] Cleanup ✓
   - Delete GmailFirebase.js ✓

**Test commands:**  
`start contact.html` (send test message)  
`start admin.html` (pw=dexter2025, check live sync)
