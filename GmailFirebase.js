const CONFIG = {
  projectId: 'database-portfolio-442f7',
  apiKey: 'AIzaSyB2eyFICdxcJMfqHb_p0n8kdNIh31qbNE0',
  adminEmail: 'dexteralayan279@gmail.com',
  allowedReplySenders: ['dexteralayan279@gmail.com'],
  adminName: 'Dexter Alayan',
  chatLabel: 'portfolio-chat',
  subjectPrefix: '[Portfolio Chat]',
  replyDelimiter: '--- Reply above this line ---',
  maxThreadsPerRun: 30,
  sentSearchWindow: '7d'
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (payload.event !== 'visitor_message') {
      return jsonResponse_({ ok: false, error: 'Unsupported event.' });
    }

    notifyAdmin_(payload);
    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function checkGmailReplies() {
  const label = getOrCreateLabel_();
  const inboxThreads = label.getThreads(0, CONFIG.maxThreadsPerRun);
  const sentThreads = GmailApp.search(
    `in:sent newer_than:${CONFIG.sentSearchWindow} subject:"${CONFIG.subjectPrefix}["`,
    0,
    CONFIG.maxThreadsPerRun
  );

  processReplyThreads_(inboxThreads);
  processReplyThreads_(sentThreads);
}

function notifyAdmin_(payload) {
  if (!payload.convId || !payload.text || !payload.visitorEmail) {
    throw new Error('Missing conversation payload fields.');
  }

  const visitorName = payload.visitorName || 'Visitor';
  const subject = `${CONFIG.subjectPrefix}[${payload.convId}] ${visitorName}`;
  const plainBody = [
    CONFIG.replyDelimiter,
    '',
    'Use Gmail Reply on this notification thread and write your message above the line.',
    `This notification was sent only to ${CONFIG.adminEmail}.`,
    'Do not compose a new email to the visitor address.',
    'If Gmail shows a visitor email anywhere in the thread, treat it as reference only.',
    'Only replies on this exact subject thread are synced back to the website chat.',
    '',
    `Conversation ID: ${payload.convId}`,
    `Visitor: ${visitorName}`,
    '',
    'Latest message:',
    payload.text
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <p style="font-weight:700;margin:0 0 12px;">${escapeHtml_(CONFIG.replyDelimiter)}</p>
      <p style="margin:0 0 8px;"><strong>Use Gmail Reply on this notification thread.</strong></p>
      <p style="margin:0 0 8px;color:#111827;">This notification was sent only to <strong>${escapeHtml_(CONFIG.adminEmail)}</strong>.</p>
      <p style="margin:0 0 12px;color:#b91c1c;">Do not compose a new email to the visitor address. If Gmail shows a visitor email anywhere in the thread, treat it as reference only. Only replies on this exact notification thread will sync back to the website chat.</p>
      <p style="margin:0 0 6px;"><strong>Conversation ID:</strong> ${escapeHtml_(payload.convId)}</p>
      <p style="margin:0 0 6px;"><strong>Visitor:</strong> ${escapeHtml_(visitorName)}</p>
      <p style="margin:0 0 6px;"><strong>Latest message:</strong></p>
      <blockquote style="margin:0;padding:12px 14px;border-left:4px solid #7c3aed;background:#f7f5ff;white-space:pre-wrap;">${escapeHtml_(payload.text)}</blockquote>
    </div>
  `;

  MailApp.sendEmail({
    to: CONFIG.adminEmail,
    subject,
    body: plainBody,
    htmlBody,
    name: 'Portfolio Chat',
    replyTo: CONFIG.adminEmail
  });

  Utilities.sleep(1500);
  labelThread_(subject);
}

function appendDexterReply_(convId, text, gmailMessageId) {
  const now = new Date().toISOString();
  const messageUrl = firestoreUrl_(`conversations/${encodeURIComponent(convId)}/messages`, true);
  const messagePayload = {
    fields: {
      sender: { stringValue: 'dexter' },
      text: { stringValue: text },
      source: { stringValue: 'gmail' },
      gmailMessageId: { stringValue: gmailMessageId },
      timestamp: { timestampValue: now }
    }
  };

  const messageRes = UrlFetchApp.fetch(messageUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(messagePayload),
    muteHttpExceptions: true
  });

  assertFirestoreOk_(messageRes, 'append reply');

  const conversationUrl = firestoreUrl_(`conversations/${encodeURIComponent(convId)}`);
  const conversationPayload = {
    fields: {
      lastMessage: { stringValue: `Dexter: ${truncate_(text, 160)}` },
      updatedAt: { timestampValue: now }
    }
  };

  const patchUrl = `${conversationUrl}&updateMask.fieldPaths=lastMessage&updateMask.fieldPaths=updatedAt`;
  const conversationRes = UrlFetchApp.fetch(patchUrl, {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify(conversationPayload),
    muteHttpExceptions: true
  });

  assertFirestoreOk_(conversationRes, 'update conversation');
}

function firestoreUrl_(documentPath, isCollection) {
  const base = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${documentPath}`;
  const separator = base.indexOf('?') === -1 ? '?' : '&';
  return `${base}${separator}key=${CONFIG.apiKey}`;
}

function parsePayload_(e) {
  const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  return JSON.parse(body);
}

function labelThread_(subject) {
  const label = getOrCreateLabel_();
  const threads = GmailApp.search(`subject:"${subject.replace(/"/g, '\\"')}" newer_than:2d`);
  if (threads.length) label.addToThreads(threads);
}

function processReplyThreads_(threads) {
  threads.forEach(thread => {
    const convId = extractConvId_(thread.getFirstMessageSubject());
    if (!convId) return;

    thread.getMessages().forEach(message => {
      const messageId = message.getId();
      if (isSynced_(messageId)) return;

      const sender = normalizeEmail_(message.getFrom());
      const body = extractReplyText_(message.getPlainBody());

      if (!body) return;
      if (!isAllowedReplySender_(sender)) return;

      appendDexterReply_(convId, body, messageId);
      markSynced_(messageId);
    });
  });
}

function getOrCreateLabel_() {
  return GmailApp.getUserLabelByName(CONFIG.chatLabel) || GmailApp.createLabel(CONFIG.chatLabel);
}

function extractConvId_(subject) {
  const match = subject && subject.match(/\[Portfolio Chat\]\[([^\]]+)\]/);
  return match ? match[1] : '';
}

function extractReplyText_(plainBody) {
  if (!plainBody) return '';

  let text = plainBody.replace(/\r\n/g, '\n');
  const delimiterIndex = text.indexOf(CONFIG.replyDelimiter);
  if (delimiterIndex >= 0) {
    text = text.slice(0, delimiterIndex);
  }

  text = text.replace(/\nOn .+ wrote:\n[\s\S]*$/i, '');
  text = text.replace(/\n>.*$/gm, '');
  text = text.trim();

  return text;
}

function normalizeEmail_(value) {
  const match = String(value || '').match(/<([^>]+)>/);
  return (match ? match[1] : value || '').trim().toLowerCase();
}

function isAllowedReplySender_(sender) {
  return CONFIG.allowedReplySenders
    .map(item => String(item).trim().toLowerCase())
    .includes(sender);
}

function isSynced_(messageId) {
  return PropertiesService.getScriptProperties().getProperty(`synced_${messageId}`) === '1';
}

function markSynced_(messageId) {
  PropertiesService.getScriptProperties().setProperty(`synced_${messageId}`, '1');
}

function truncate_(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function assertFirestoreOk_(response, action) {
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) return;
  throw new Error(`Firestore ${action} failed (${code}): ${response.getContentText()}`);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
