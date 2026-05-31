import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest } from '@/lib/auth-utils';
import { checkSMSDuplicate, linkSMSToCase } from '@/lib/sms-deduplication';
import { logMetric } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { farmerPhone, messageContent } = await request.json();

    if (!farmerPhone || !messageContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicates
    const duplicate = await checkSMSDuplicate(farmerPhone, messageContent);

    logMetric('sms_check_duplicate', duplicate.isDuplicate ? 1 : 0, 'count', {
      confidence: duplicate.confidence,
    });

    if (duplicate.isDuplicate && duplicate.existingCaseId) {
      // Link to existing case
      await linkSMSToCase(
        duplicate.existingCaseId,
        messageContent
      );

      return NextResponse.json({
        isDuplicate: true,
        existingCaseId: duplicate.existingCaseId,
        confidence: duplicate.confidence,
        action: 'linked_to_existing_case',
      });
    }

    return NextResponse.json({
      isDuplicate: false,
      confidence: duplicate.confidence,
      action: 'create_new_case',
    });
  } catch (error) {
    console.error('SMS duplicate check error:', error);
    return NextResponse.json(
      { error: 'Duplicate check failed' },
      { status: 500 }
    );
  }
}
