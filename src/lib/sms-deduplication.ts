import { FieldValue } from 'firebase-admin/firestore';

import { db } from './firebase-admin';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingCaseId?: string;
  confidence: number; // 0-100
}

/**
 * Check for duplicate SMS messages from same farmer within time window
 * Prevents spam and duplicate case creation
 */
export async function checkSMSDuplicate(
  farmerPhone: string,
  messageContent: string,
  windowSeconds: number = 300 // 5 minutes
): Promise<DuplicateCheckResult> {
  try {
    const cutoffTime = new Date(Date.now() - windowSeconds * 1000);

    const recentMessages = await db
      .collection('sms-cases')
      .where('farmerPhone', '==', farmerPhone)
      .where('createdAt', '>', cutoffTime)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (recentMessages.empty) {
      return { isDuplicate: false, confidence: 0 };
    }

    // Check for exact or similar messages
    for (const doc of recentMessages.docs) {
      const caseData = doc.data();
      const similarity = calculateSimilarity(
        messageContent,
        caseData.messageContent
      );

      if (similarity > 0.85) {
        // >85% similar
        return {
          isDuplicate: true,
          existingCaseId: doc.id,
          confidence: Math.round(similarity * 100),
        };
      }
    }

    return { isDuplicate: false, confidence: 0 };
  } catch (error) {
    console.error('SMS duplicate check error:', error);
    return { isDuplicate: false, confidence: 0 };
  }
}

/**
 * Simple similarity calculation (Levenshtein distance)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Link new SMS to existing case if duplicate detected
 */
export async function linkSMSToCase(
  caseId: string,
  messageContent: string
) {
  try {
    const caseRef = db.collection('sms-cases').doc(caseId);

    await caseRef.update({
      messages: FieldValue.arrayUnion({
        content: messageContent,
        timestamp: new Date(),
        type: 'sms',
        source: 'duplicate-linked',
      }),
      lastMessageAt: new Date(),
      messageCount: FieldValue.increment(1),
    });

    console.log(`SMS linked to case ${caseId}`);
  } catch (error) {
    console.error('Error linking SMS to case:', error);
    throw error;
  }
}
