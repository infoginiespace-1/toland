import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * WhatsApp Anti-Ban & Auto-Reply Engine Logic for TOLAND Bridge
 */

// Spintax variable selector
export function resolveSpintax(text) {
  const spintaxRegex = /\{([^{}]+)\}/g;
  return text.replace(spintaxRegex, (_, choices) => {
    const options = choices.split('|');
    const picked = options[Math.floor(Math.random() * options.length)];
    return picked.trim();
  });
}

// Quiet hours checker (IST overnight support)
export function isQuietHours(timeString, startStr = '22:00', endStr = '08:00') {
  const [currentH, currentM] = timeString.split(':').map(Number);
  const currentVal = currentH * 60 + currentM;

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const startVal = startH * 60 + (startM || 0);
  const endVal = endH * 60 + (endM || 0);

  if (startVal > endVal) {
    // Overnight span (e.g. 22:00 PM to 08:00 AM)
    return currentVal >= startVal || currentVal < endVal;
  }
  return currentVal >= startVal && currentVal < endVal;
}

// Typing delay jitter calculation (in milliseconds)
export function calculateJitterDelay(minSeconds = 4, maxSeconds = 12) {
  const jitterMs = Math.floor(Math.random() * ((maxSeconds - minSeconds) * 1000 + 1)) + minSeconds * 1000;
  return jitterMs;
}

// SIM Warmup graduated rate-limit schedule
export function getWarmupDailyLimit(day) {
  switch (day) {
    case 1:
      return 50;
    case 2:
      return 100;
    case 3:
      return 200;
    case 4:
      return 350;
    default:
      return 500;
  }
}

// Keyword matching engine for inbound WhatsApp messages
export function matchAutoReplyRule(incomingText, rules) {
  const normalized = incomingText.trim().toLowerCase();

  for (const rule of rules) {
    if (!rule.is_active) continue;

    const pattern = rule.keyword.trim().toLowerCase();
    let matches = false;

    if (rule.match_type === 'exact') {
      matches = normalized === pattern;
    } else if (rule.match_type === 'contains') {
      matches = normalized.includes(pattern);
    } else if (rule.match_type === 'regex') {
      try {
        const regex = new RegExp(rule.keyword, 'i');
        matches = regex.test(incomingText);
      } catch {
        matches = false;
      }
    }

    if (matches) {
      return rule;
    }
  }

  return null;
}

// Opt-out detection for compliance
export function isOptOutMessage(incomingText) {
  const optOutTriggers = ['stop', 'unsubscribe', 'बंद', 'rokna', 'cancel', 'बंद करो'];
  const cleaned = incomingText.trim().toLowerCase();
  return optOutTriggers.some((trigger) => cleaned === trigger || cleaned.includes(trigger));
}

describe('WhatsApp Anti-Ban & Dispatch Engine Suite', () => {
  test('Typing jitter delay stays strictly within 4s to 12s bounds', () => {
    for (let i = 0; i < 50; i++) {
      const delay = calculateJitterDelay(4, 12);
      assert.ok(delay >= 4000, `Delay ${delay}ms is less than 4000ms`);
      assert.ok(delay <= 12000, `Delay ${delay}ms exceeds 12000ms`);
    }
  });

  test('Quiet hours correctly blocks overnight dispatch (22:00 - 08:00 IST)', () => {
    // 23:45 at night -> quiet hours
    assert.equal(isQuietHours('23:45', '22:00', '08:00'), true);
    // 03:15 morning -> quiet hours
    assert.equal(isQuietHours('03:15', '22:00', '08:00'), true);
    // 08:00 exact boundary -> active
    assert.equal(isQuietHours('08:00', '22:00', '08:00'), false);
    // 14:30 afternoon -> active
    assert.equal(isQuietHours('14:30', '22:00', '08:00'), false);
    // 21:59 evening -> active
    assert.equal(isQuietHours('21:59', '22:00', '08:00'), false);
    // 22:00 exact -> quiet hours
    assert.equal(isQuietHours('22:00', '22:00', '08:00'), true);
  });

  test('SIM Warmup schedule scales daily quotas safely', () => {
    assert.equal(getWarmupDailyLimit(1), 50);
    assert.equal(getWarmupDailyLimit(2), 100);
    assert.equal(getWarmupDailyLimit(3), 200);
    assert.equal(getWarmupDailyLimit(4), 350);
    assert.equal(getWarmupDailyLimit(5), 500);
    assert.equal(getWarmupDailyLimit(14), 500);
  });

  test('Spintax resolution rotates greeting variations and strips brackets', () => {
    const template = '{Namaste|Hello|Pranam} {Bhai|Sir}, your TOLAND order is confirmed!';
    const resolved = resolveSpintax(template);

    assert.ok(
      resolved.startsWith('Namaste') || resolved.startsWith('Hello') || resolved.startsWith('Pranam'),
      `Unexpected start: ${resolved}`
    );
    assert.ok(!resolved.includes('{') && !resolved.includes('}'));
    assert.ok(resolved.includes('your TOLAND order is confirmed!'));
  });

  test('Auto-reply bot correctly triggers on CATALOG, PRICE, and Hindi keywords', () => {
    const rules = [
      { id: '1', keyword: 'CATALOG', match_type: 'exact', is_active: true, reply: 'Here is our catalog: ...' },
      { id: '2', keyword: 'price', match_type: 'contains', is_active: true, reply: 'Our jeans start at ₹899.' },
      { id: '3', keyword: 'बंद', match_type: 'contains', is_active: true, reply: 'Aapko unsubscribe kar diya gaya hai.' },
      { id: '4', keyword: 'DISCOUNT', match_type: 'exact', is_active: false, reply: 'Use code TOLAND10' },
    ];

    // Exact match
    const catalogMatch = matchAutoReplyRule('catalog', rules);
    assert.ok(catalogMatch);
    assert.equal(catalogMatch.id, '1');

    // Contains match
    const priceMatch = matchAutoReplyRule('What is the wholesale price list?', rules);
    assert.ok(priceMatch);
    assert.equal(priceMatch.id, '2');

    // Hindi unsubscribe match
    const hindiMatch = matchAutoReplyRule('Mujhe message bhejna बंद karo', rules);
    assert.ok(hindiMatch);
    assert.equal(hindiMatch.id, '3');

    // Inactive rule should not match
    const discountMatch = matchAutoReplyRule('DISCOUNT', rules);
    assert.equal(discountMatch, null);
  });

  test('Detects opt-out requests accurately across English and Hindi', () => {
    assert.equal(isOptOutMessage('STOP'), true);
    assert.equal(isOptOutMessage('stop please'), true);
    assert.equal(isOptOutMessage('UNSUBSCRIBE'), true);
    assert.equal(isOptOutMessage('Please बंद karo'), true);
    assert.equal(isOptOutMessage('Interested in 50 pieces'), false);
  });
});
